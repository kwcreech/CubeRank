package com.cuberank.backend.service;

import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.domain.Review;
import com.cuberank.backend.domain.ReviewMetrics;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.repository.CubeRepository;
import com.cuberank.backend.repository.ReviewRepository;
import com.cuberank.backend.security.AuthenticatedUser;
import com.cuberank.backend.web.BadRequestException;
import com.cuberank.backend.web.ConflictException;
import com.cuberank.backend.web.NotFoundException;
import com.cuberank.backend.web.dto.CreateReviewRequest;
import com.cuberank.backend.web.dto.MetricsDto;
import com.cuberank.backend.web.dto.MetricsRequest;
import com.cuberank.backend.web.dto.PageResponse;
import com.cuberank.backend.web.dto.ReviewResponse;
import com.cuberank.backend.web.dto.UpdateReviewRequest;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private static final Pattern YOUTUBE_URL = Pattern.compile(
            "^(https?://)?(www\\.)?(youtube\\.com/(watch\\?v=|shorts/|embed/)|youtu\\.be/)[\\w\\-?&=.%]+$",
            Pattern.CASE_INSENSITIVE);

    private final ReviewRepository reviewRepository;
    private final CubeRepository cubeRepository;
    private final UserProvisioningService userProvisioningService;

    public ReviewService(
            ReviewRepository reviewRepository,
            CubeRepository cubeRepository,
            UserProvisioningService userProvisioningService) {
        this.reviewRepository = reviewRepository;
        this.cubeRepository = cubeRepository;
        this.userProvisioningService = userProvisioningService;
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> listByCube(long cubeId, int page, int size) {
        ensureCubeExists(cubeId);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Page<Review> reviews =
                reviewRepository.findByCube_IdOrderByCreatedAtDesc(cubeId, PageRequest.of(safePage, safeSize));
        return PageResponse.from(reviews.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public ReviewResponse getById(long reviewId) {
        return toResponse(requireReview(reviewId));
    }

    @Transactional(readOnly = true)
    public ReviewResponse getMineForCube(AuthenticatedUser principal, long cubeId) {
        ensureCubeExists(cubeId);
        User user = userProvisioningService.ensureUser(principal);
        Review review = reviewRepository
                .findByUser_IdAndCube_Id(user.getId(), cubeId)
                .orElseThrow(() -> new NotFoundException("No review by you for cube " + cubeId));
        return toResponse(review);
    }

    @Transactional
    public ReviewResponse create(AuthenticatedUser principal, CreateReviewRequest request) {
        User user = userProvisioningService.ensureUser(principal);
        Cube cube = requireLiveCube(request.cubeId());

        if (reviewRepository.existsByUser_IdAndCube_Id(user.getId(), cube.getId())) {
            throw new ConflictException("You have already reviewed this cube");
        }

        Review review = Review.builder()
                .user(user)
                .cube(cube)
                .writtenContent(request.writtenContent().trim())
                .youtubeUrl(normalizeYoutubeUrl(request.youtubeUrl()))
                .build();
        review.setMetrics(fromRequest(request.metrics()));

        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public ReviewResponse update(AuthenticatedUser principal, long reviewId, UpdateReviewRequest request) {
        User user = userProvisioningService.ensureUser(principal);
        Review review = requireReview(reviewId);
        requireOwner(review, user);

        review.setWrittenContent(request.writtenContent().trim());
        review.setYoutubeUrl(normalizeYoutubeUrl(request.youtubeUrl()));

        ReviewMetrics metrics = review.getMetrics();
        if (metrics == null) {
            review.setMetrics(fromRequest(request.metrics()));
        } else {
            applyMetrics(metrics, request.metrics());
        }

        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public void delete(AuthenticatedUser principal, long reviewId) {
        User user = userProvisioningService.ensureUser(principal);
        Review review = requireReview(reviewId);
        requireOwner(review, user);
        reviewRepository.delete(review);
    }

    private Review requireReview(long reviewId) {
        return reviewRepository
                .findWithDetailsById(reviewId)
                .orElseThrow(() -> new NotFoundException("Review not found: " + reviewId));
    }

    private Cube requireLiveCube(long cubeId) {
        Cube cube = cubeRepository
                .findById(cubeId)
                .orElseThrow(() -> new NotFoundException("Cube not found: " + cubeId));
        if (cube.getStatus() != CubeStatus.LIVE) {
            throw new BadRequestException("Only LIVE cubes can be reviewed");
        }
        return cube;
    }

    private void ensureCubeExists(long cubeId) {
        if (!cubeRepository.existsById(cubeId)) {
            throw new NotFoundException("Cube not found: " + cubeId);
        }
    }

    private static void requireOwner(Review review, User user) {
        if (!review.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only modify your own reviews");
        }
    }

    private static ReviewMetrics fromRequest(MetricsRequest request) {
        return ReviewMetrics.builder()
                .speed(request.speed())
                .stability(request.stability())
                .turning(request.turning())
                .customizability(request.customizability())
                .value(request.value())
                .build();
    }

    private static void applyMetrics(ReviewMetrics metrics, MetricsRequest request) {
        metrics.setSpeed(request.speed());
        metrics.setStability(request.stability());
        metrics.setTurning(request.turning());
        metrics.setCustomizability(request.customizability());
        metrics.setValue(request.value());
    }

    private static String normalizeYoutubeUrl(String youtubeUrl) {
        if (youtubeUrl == null || youtubeUrl.isBlank()) {
            return null;
        }
        String trimmed = youtubeUrl.trim();
        if (!YOUTUBE_URL.matcher(trimmed).matches()) {
            throw new BadRequestException("youtubeUrl must be a valid YouTube watch/shorts/embed or youtu.be link");
        }
        if (!trimmed.toLowerCase(Locale.ROOT).startsWith("http")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    private ReviewResponse toResponse(Review review) {
        ReviewMetrics metrics = review.getMetrics();
        return new ReviewResponse(
                review.getId(),
                review.getCube().getId(),
                review.getCube().getName(),
                review.getCube().getType(),
                review.getUser().getId(),
                review.getUser().getUsername(),
                review.getUser().getAvatarUrl(),
                review.getWrittenContent(),
                review.getYoutubeUrl(),
                metrics == null
                        ? null
                        : new MetricsDto(
                                metrics.getSpeed(),
                                metrics.getStability(),
                                metrics.getTurning(),
                                metrics.getCustomizability(),
                                metrics.getValue()),
                review.getCreatedAt(),
                review.getUpdatedAt());
    }
}

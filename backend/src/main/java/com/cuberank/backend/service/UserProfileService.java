package com.cuberank.backend.service;

import com.cuberank.backend.domain.Review;
import com.cuberank.backend.domain.ReviewMetrics;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.repository.ReviewRepository;
import com.cuberank.backend.repository.UserRepository;
import com.cuberank.backend.security.AuthenticatedUser;
import com.cuberank.backend.web.BadRequestException;
import com.cuberank.backend.web.ConflictException;
import com.cuberank.backend.web.NotFoundException;
import com.cuberank.backend.web.dto.MeResponse;
import com.cuberank.backend.web.dto.MetricsDto;
import com.cuberank.backend.web.dto.PageResponse;
import com.cuberank.backend.web.dto.ProfileReviewItem;
import com.cuberank.backend.web.dto.PublicProfileResponse;
import com.cuberank.backend.web.dto.TopCubeItem;
import com.cuberank.backend.web.dto.UpdateMeRequest;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {

    private static final int TOP_CUBES_PER_TYPE = 3;

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final UserProvisioningService userProvisioningService;

    public UserProfileService(
            UserRepository userRepository,
            ReviewRepository reviewRepository,
            UserProvisioningService userProvisioningService) {
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.userProvisioningService = userProvisioningService;
    }

    @Transactional
    public MeResponse getMe(AuthenticatedUser principal) {
        User user = userProvisioningService.ensureUser(principal);
        return toMeResponse(user);
    }

    @Transactional
    public MeResponse updateMe(AuthenticatedUser principal, UpdateMeRequest request) {
        User user = userProvisioningService.ensureUser(principal);

        if (request.username() != null) {
            String username = request.username().trim();
            if (username.length() < 3) {
                throw new BadRequestException("username must be at least 3 characters");
            }
            boolean taken = userRepository.existsByUsernameIgnoreCase(username)
                    && !user.getUsername().equalsIgnoreCase(username);
            if (taken) {
                throw new ConflictException("username is already taken");
            }
            user.setUsername(username);
        }

        if (request.avatarUrl() != null) {
            String avatar = request.avatarUrl().trim();
            user.setAvatarUrl(avatar.isEmpty() ? null : avatar);
        }

        return toMeResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(String username, int page, int size) {
        User user = userRepository
                .findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new NotFoundException("User not found: " + username));

        long reviewCount = reviewRepository.countByUser_Id(user.getId());
        long rank = reviewRepository.rankForReviewCount(reviewCount);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Page<Review> reviewPage =
                reviewRepository.findByUser_IdOrderByCreatedAtDesc(user.getId(), PageRequest.of(safePage, safeSize));

        Page<ProfileReviewItem> mapped = reviewPage.map(this::toProfileReviewItem);
        Map<String, List<TopCubeItem>> topCubesByType = buildTopCubesByType(user.getId());

        return new PublicProfileResponse(
                user.getUsername(),
                user.getAvatarUrl(),
                reviewCount,
                rank,
                PageResponse.from(mapped),
                topCubesByType);
    }

    private MeResponse toMeResponse(User user) {
        long reviewCount = reviewRepository.countByUser_Id(user.getId());
        long rank = reviewRepository.rankForReviewCount(reviewCount);
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getCreatedAt(),
                reviewCount,
                rank);
    }

    private ProfileReviewItem toProfileReviewItem(Review review) {
        // Lazy associations: ensure metrics/cube are loaded for list mapping.
        ReviewMetrics metrics = review.getMetrics();
        return new ProfileReviewItem(
                review.getId(),
                review.getCube().getId(),
                review.getCube().getName(),
                review.getCube().getType(),
                review.getCube().getBrand(),
                review.getWrittenContent(),
                review.getYoutubeUrl(),
                metrics == null ? null : toMetricsDto(metrics),
                review.getCreatedAt());
    }

    private Map<String, List<TopCubeItem>> buildTopCubesByType(java.util.UUID userId) {
        List<Review> reviews = reviewRepository.findAllWithCubeAndMetricsByUserId(userId);
        return reviews.stream()
                .filter(r -> r.getMetrics() != null)
                .collect(Collectors.groupingBy(r -> r.getCube().getType(), LinkedHashMap::new, Collectors.toList()))
                .entrySet()
                .stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .sorted(Comparator.comparingDouble(this::personalAverage).reversed())
                                .limit(TOP_CUBES_PER_TYPE)
                                .map(this::toTopCubeItem)
                                .toList(),
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    private TopCubeItem toTopCubeItem(Review review) {
        ReviewMetrics metrics = review.getMetrics();
        return new TopCubeItem(
                review.getCube().getId(),
                review.getCube().getName(),
                review.getCube().getBrand(),
                review.getCube().getType(),
                personalAverage(review),
                toMetricsDto(metrics));
    }

    private double personalAverage(Review review) {
        ReviewMetrics m = review.getMetrics();
        return (m.getSpeed() + m.getStability() + m.getTurning() + m.getCustomizability() + m.getValue()) / 5.0;
    }

    private static MetricsDto toMetricsDto(ReviewMetrics metrics) {
        return new MetricsDto(
                metrics.getSpeed(),
                metrics.getStability(),
                metrics.getTurning(),
                metrics.getCustomizability(),
                metrics.getValue());
    }
}

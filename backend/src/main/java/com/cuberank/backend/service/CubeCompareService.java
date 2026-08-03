package com.cuberank.backend.service;

import com.cuberank.backend.domain.Review;
import com.cuberank.backend.repository.ReviewRepository;
import com.cuberank.backend.web.BadRequestException;
import com.cuberank.backend.web.dto.CubeCompareResponse;
import com.cuberank.backend.web.dto.CubeCompareSide;
import com.cuberank.backend.web.dto.CubeDetailDto;
import com.cuberank.backend.web.dto.ReviewResponse;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CubeCompareService {

    private static final PageRequest ONE = PageRequest.of(0, 1);

    private final CubeCatalogService cubeCatalogService;
    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;

    public CubeCompareService(
            CubeCatalogService cubeCatalogService,
            ReviewRepository reviewRepository,
            ReviewService reviewService) {
        this.cubeCatalogService = cubeCatalogService;
        this.reviewRepository = reviewRepository;
        this.reviewService = reviewService;
    }

    @Transactional(readOnly = true)
    public CubeCompareResponse compare(long leftId, long rightId) {
        if (leftId == rightId) {
            throw new BadRequestException("leftId and rightId must be different cubes");
        }

        CubeDetailDto leftCube = cubeCatalogService.getLiveCube(leftId);
        CubeDetailDto rightCube = cubeCatalogService.getLiveCube(rightId);

        if (!leftCube.type().equals(rightCube.type())) {
            throw new BadRequestException(
                    "Cubes must be the same type to compare (left="
                            + leftCube.type()
                            + ", right="
                            + rightCube.type()
                            + ")");
        }

        return new CubeCompareResponse(toSide(leftCube), toSide(rightCube));
    }

    private CubeCompareSide toSide(CubeDetailDto cube) {
        if (cube.reviewCount() <= 0) {
            return new CubeCompareSide(cube, null, null);
        }

        ReviewResponse best = firstOrNull(reviewRepository.findByCubeIdOrderByMetricMeanDesc(cube.id(), ONE));
        ReviewResponse worst = firstOrNull(reviewRepository.findByCubeIdOrderByMetricMeanAsc(cube.id(), ONE));
        return new CubeCompareSide(cube, best, worst);
    }

    private ReviewResponse firstOrNull(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty()) {
            return null;
        }
        return reviewService.toResponse(reviews.getFirst());
    }
}

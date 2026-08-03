package com.cuberank.backend.web.dto;

public record CubeCompareSide(
        CubeDetailDto cube,
        ReviewResponse bestReview,
        ReviewResponse worstReview) {
}

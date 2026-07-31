package com.cuberank.backend.web.dto;

import com.cuberank.backend.domain.CubeStatus;

public record CubeSummaryDto(
        long id,
        String name,
        String brand,
        String type,
        CubeStatus status,
        String imageUrl,
        String productUrl,
        Long reviewCount,
        AggregateMetricsDto metrics) {
}

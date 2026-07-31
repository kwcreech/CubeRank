package com.cuberank.backend.web.dto;

import com.cuberank.backend.domain.CubeStatus;
import java.time.Instant;

public record CubeDetailDto(
        long id,
        String name,
        String brand,
        String type,
        CubeStatus status,
        String imageUrl,
        String productUrl,
        String sourceStore,
        Long shopifyProductId,
        Instant createdAt,
        Instant updatedAt,
        long reviewCount,
        AggregateMetricsDto metrics) {
}

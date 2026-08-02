package com.cuberank.backend.web.dto;

import java.math.BigDecimal;

public record CubeLeaderboardEntry(
        int rank,
        long cubeId,
        String name,
        String brand,
        String type,
        String imageUrl,
        long reviewCount,
        BigDecimal rawAverage,
        double bayesianScore,
        AggregateMetricsDto metrics) {
}

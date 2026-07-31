package com.cuberank.backend.web.dto;

public record TopCubeItem(
        long cubeId,
        String cubeName,
        String cubeBrand,
        String cubeType,
        double personalAverage,
        MetricsDto metrics) {
}

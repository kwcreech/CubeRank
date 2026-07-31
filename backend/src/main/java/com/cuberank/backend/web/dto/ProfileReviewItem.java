package com.cuberank.backend.web.dto;

import java.time.Instant;

public record ProfileReviewItem(
        long reviewId,
        long cubeId,
        String cubeName,
        String cubeType,
        String cubeBrand,
        String writtenContent,
        String youtubeUrl,
        MetricsDto metrics,
        Instant createdAt) {
}

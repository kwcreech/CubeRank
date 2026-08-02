package com.cuberank.backend.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        long id,
        long cubeId,
        String cubeName,
        String cubeType,
        UUID userId,
        String username,
        String avatarUrl,
        String writtenContent,
        String youtubeUrl,
        MetricsDto metrics,
        Instant createdAt,
        Instant updatedAt) {
}

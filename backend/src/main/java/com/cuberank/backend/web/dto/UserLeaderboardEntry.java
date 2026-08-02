package com.cuberank.backend.web.dto;

import java.util.UUID;

public record UserLeaderboardEntry(
        int rank,
        UUID userId,
        String username,
        String avatarUrl,
        long reviewCount) {
}

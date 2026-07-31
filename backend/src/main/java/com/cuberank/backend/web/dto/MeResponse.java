package com.cuberank.backend.web.dto;

import com.cuberank.backend.domain.Role;
import java.time.Instant;
import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        Role role,
        Instant createdAt,
        long reviewCount,
        long rank) {
}

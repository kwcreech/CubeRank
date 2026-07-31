package com.cuberank.backend.security;

import com.cuberank.backend.domain.Role;
import java.util.UUID;

/**
 * Lightweight principal built from a validated Supabase access token
 * (plus the local {@code users.role} when a profile row already exists).
 */
public record AuthenticatedUser(UUID id, String email, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}

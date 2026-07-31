package com.cuberank.backend.security;

import java.util.Optional;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<AuthenticatedUser> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuth
                && authentication.getPrincipal() instanceof Jwt jwt) {
            RoleAuthority role = RoleAuthority.fromAuthorities(authentication.getAuthorities());
            String email = jwt.getClaimAsString("email");
            return Optional.of(new AuthenticatedUser(UUID.fromString(jwt.getSubject()), email, role.toRole()));
        }
        return Optional.empty();
    }

    public static AuthenticatedUser requireCurrentUser() {
        return currentUser()
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Authentication required"));
    }

    public static UUID requireCurrentUserId() {
        return requireCurrentUser().id();
    }

    public static void requireAdmin() {
        AuthenticatedUser user = requireCurrentUser();
        if (!user.isAdmin()) {
            throw new AccessDeniedException("Admin role required");
        }
    }
}

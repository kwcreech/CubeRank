package com.cuberank.backend.service;

import com.cuberank.backend.domain.Role;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.repository.UserRepository;
import com.cuberank.backend.security.AuthenticatedUser;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Just-in-time creation of a local {@code users} row the first time a
 * Supabase-authenticated caller hits the API.
 */
@Service
public class UserProvisioningService {

    private final UserRepository userRepository;

    public UserProvisioningService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User ensureUser(AuthenticatedUser principal) {
        return userRepository.findById(principal.id()).orElseGet(() -> createFromPrincipal(principal));
    }

    @Transactional
    public User ensureUser(UUID id, String email) {
        return userRepository.findById(id).orElseGet(() -> createFromPrincipal(
                new AuthenticatedUser(id, email, Role.USER)));
    }

    private User createFromPrincipal(AuthenticatedUser principal) {
        String email = principal.email() != null ? principal.email().trim().toLowerCase(Locale.ROOT) : null;
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("Supabase JWT is missing an email claim");
        }

        User user = User.builder()
                .id(principal.id())
                .email(email)
                .username(allocateUsername(email))
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    private String allocateUsername(String email) {
        String localPart = email.split("@", 2)[0];
        String base = localPart.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase(Locale.ROOT);
        if (base.length() < 3) {
            base = ("user" + base).replaceAll("[^a-zA-Z0-9_]", "");
        }
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }

        String candidate = base;
        int suffix = 0;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            suffix++;
            String suffixText = String.valueOf(suffix);
            int maxBase = Math.max(3, 50 - suffixText.length());
            String trimmed = base.length() > maxBase ? base.substring(0, maxBase) : base;
            candidate = trimmed + suffixText;
        }
        return candidate;
    }
}

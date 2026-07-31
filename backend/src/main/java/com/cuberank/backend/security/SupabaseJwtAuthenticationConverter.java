package com.cuberank.backend.security;

import com.cuberank.backend.domain.Role;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.repository.UserRepository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Maps a validated Supabase JWT to Spring authorities.
 * {@code ROLE_ADMIN} is granted only when a local {@code users} row exists with
 * {@code role = ADMIN}; otherwise the caller is treated as {@code ROLE_USER}.
 * Profile upsert (creating the {@code users} row) happens in a later step.
 */
@Component
public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;

    public SupabaseJwtAuthenticationConverter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Role role = resolveRole(jwt);
        Collection<GrantedAuthority> authorities = List.of(RoleAuthority.fromRole(role).toGrantedAuthority());
        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }

    private Role resolveRole(Jwt jwt) {
        try {
            UUID userId = UUID.fromString(jwt.getSubject());
            return userRepository.findById(userId).map(User::getRole).orElse(Role.USER);
        } catch (IllegalArgumentException ex) {
            return Role.USER;
        }
    }
}

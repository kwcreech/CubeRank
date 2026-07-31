package com.cuberank.backend.security;

import com.cuberank.backend.domain.Role;
import java.util.Collection;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

enum RoleAuthority {
    USER,
    ADMIN;

    static final String ROLE_PREFIX = "ROLE_";

    SimpleGrantedAuthority toGrantedAuthority() {
        return new SimpleGrantedAuthority(ROLE_PREFIX + name());
    }

    Role toRole() {
        return Role.valueOf(name());
    }

    static RoleAuthority fromRole(Role role) {
        return RoleAuthority.valueOf(role.name());
    }

    static RoleAuthority fromAuthorities(Collection<? extends GrantedAuthority> authorities) {
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(ROLE_PREFIX))
                .map(a -> a.substring(ROLE_PREFIX.length()))
                .filter(name -> name.equals(ADMIN.name()))
                .findFirst()
                .map(ignored -> ADMIN)
                .orElse(USER);
    }
}

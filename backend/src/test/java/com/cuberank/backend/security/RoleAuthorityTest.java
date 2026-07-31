package com.cuberank.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.cuberank.backend.domain.Role;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class RoleAuthorityTest {

    @Test
    void fromAuthoritiesPrefersAdmin() {
        var authorities = List.of(
                new SimpleGrantedAuthority("ROLE_USER"),
                new SimpleGrantedAuthority("ROLE_ADMIN"));
        assertEquals(RoleAuthority.ADMIN, RoleAuthority.fromAuthorities(authorities));
        assertEquals(Role.ADMIN, RoleAuthority.fromAuthorities(authorities).toRole());
    }

    @Test
    void fromAuthoritiesDefaultsToUser() {
        var authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));
        assertEquals(RoleAuthority.USER, RoleAuthority.fromAuthorities(authorities));
    }
}

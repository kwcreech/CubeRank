package com.cuberank.backend.web.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(min = 3, max = 50)
        @Pattern(
                regexp = "^[a-zA-Z0-9_]+$",
                message = "username may only contain letters, numbers, and underscores")
        String username,

        @Size(max = 2048)
        String avatarUrl) {
}

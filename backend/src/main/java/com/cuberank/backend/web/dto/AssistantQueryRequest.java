package com.cuberank.backend.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssistantQueryRequest(
        @NotBlank @Size(min = 1, max = 500) String prompt) {
}

package com.cuberank.backend.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull Long cubeId,
        @NotBlank @Size(min = 1, max = 10000) String writtenContent,
        @Size(max = 500) String youtubeUrl,
        @NotNull @Valid MetricsRequest metrics) {
}

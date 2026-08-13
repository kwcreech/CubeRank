package com.cuberank.backend.web.dto;

import com.cuberank.backend.domain.ReviewLimits;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateReviewRequest(
        @NotBlank @Size(min = 1, max = ReviewLimits.WRITTEN_CONTENT_MAX) String writtenContent,
        @Size(max = ReviewLimits.YOUTUBE_URL_MAX) String youtubeUrl,
        @NotNull @Valid MetricsRequest metrics) {
}

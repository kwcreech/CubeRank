package com.cuberank.backend.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record MetricsRequest(
        @NotNull @Min(1) @Max(10) Short speed,
        @NotNull @Min(1) @Max(10) Short stability,
        @NotNull @Min(1) @Max(10) Short turning,
        @NotNull @Min(1) @Max(10) Short customizability,
        @NotNull @Min(1) @Max(10) Short value) {
}

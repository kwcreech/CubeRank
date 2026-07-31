package com.cuberank.backend.web.dto;

import java.math.BigDecimal;

/** Averaged community metrics for a cube (radar chart / catalog badges). */
public record AggregateMetricsDto(
        BigDecimal speed,
        BigDecimal stability,
        BigDecimal turning,
        BigDecimal customizability,
        BigDecimal value,
        BigDecimal overall) {
}

package com.cuberank.backend.web.dto;

public record MetricsDto(
        short speed,
        short stability,
        short turning,
        short customizability,
        short value) {
}

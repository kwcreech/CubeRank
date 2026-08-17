package com.cuberank.backend.web.dto;

public record MetricsDto(
        short controllability,
        short stability,
        short turning,
        short customizability,
        short value) {
}

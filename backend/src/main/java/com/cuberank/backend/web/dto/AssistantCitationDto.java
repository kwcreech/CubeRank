package com.cuberank.backend.web.dto;

public record AssistantCitationDto(
        long reviewId,
        long cubeId,
        String cubeName,
        String excerpt) {
}

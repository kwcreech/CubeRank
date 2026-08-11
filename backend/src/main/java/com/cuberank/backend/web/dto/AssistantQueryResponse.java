package com.cuberank.backend.web.dto;

import java.util.List;

public record AssistantQueryResponse(
        String answer,
        List<AssistantCitationDto> citations,
        int remainingQuota,
        Integer retryAfterSeconds) {
}

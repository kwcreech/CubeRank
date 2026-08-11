package com.cuberank.backend.web.dto;

import java.util.List;

public record EmbeddingBackfillResult(
        int attempted,
        int embedded,
        int failed,
        List<String> warnings) {
}

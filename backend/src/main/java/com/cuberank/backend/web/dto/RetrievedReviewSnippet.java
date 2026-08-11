package com.cuberank.backend.web.dto;

public record RetrievedReviewSnippet(
        long reviewId,
        long cubeId,
        String cubeName,
        String excerpt) {
}

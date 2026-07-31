package com.cuberank.backend.web.dto;

import java.util.List;
import java.util.Map;

public record PublicProfileResponse(
        String username,
        String avatarUrl,
        long reviewCount,
        long rank,
        PageResponse<ProfileReviewItem> reviews,
        Map<String, List<TopCubeItem>> topCubesByType) {
}

package com.cuberank.backend.web.dto;

import java.util.List;

public record CatalogIngestResult(
        int collectionsProcessed,
        int pagesFetched,
        int productsSeen,
        int created,
        int updated,
        int skippedBlocked,
        int skippedDuplicates,
        List<String> warnings) {
}

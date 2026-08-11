package com.cuberank.backend.web;

import com.cuberank.backend.service.EmbeddingService;
import com.cuberank.backend.web.dto.EmbeddingBackfillResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-triggered embedding backfill for reviews missing vector rows.
 */
@RestController
@RequestMapping("/api/admin/embeddings")
public class AdminEmbeddingController {

    private final EmbeddingService embeddingService;

    public AdminEmbeddingController(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @PostMapping("/backfill")
    public EmbeddingBackfillResult backfill() {
        return embeddingService.backfillMissing();
    }
}

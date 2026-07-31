package com.cuberank.backend.web;

import com.cuberank.backend.service.CatalogIngestService;
import com.cuberank.backend.web.dto.CatalogIngestResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Triggered by GitHub Actions (and manual curls) via {@code X-Ingest-Secret}.
 */
@RestController
@RequestMapping("/api/internal/catalog")
public class InternalCatalogController {

    private final CatalogIngestService catalogIngestService;

    public InternalCatalogController(CatalogIngestService catalogIngestService) {
        this.catalogIngestService = catalogIngestService;
    }

    @PostMapping("/ingest")
    public CatalogIngestResult ingest() {
        return catalogIngestService.ingestAll();
    }
}

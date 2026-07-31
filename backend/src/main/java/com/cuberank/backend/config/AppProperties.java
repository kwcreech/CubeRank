package com.cuberank.backend.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds the {@code app.*} configuration tree declared in application.yml.
 * See backend/.env.example for the environment variables that feed these values.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        Cors cors,
        Supabase supabase,
        Ingest ingest,
        Leaderboard leaderboard,
        OpenAi openai) {

    public record Cors(String allowedOrigins) {
    }

    public record Supabase(String issuerUri) {
    }

    public record Ingest(
            String sharedSecret,
            String baseUrl,
            int pageSize,
            long requestDelayMs,
            List<String> blockedKeywords,
            List<CollectionSource> collections) {
    }

    /**
     * One TheCubicle Shopify collection to scrape.
     *
     * @param handle      collection handle in the URL path
     * @param type        CubeRank {@code cubes.type} value assigned to products from this collection
     * @param extraQuery  optional raw query string (without leading {@code ?}), e.g. filter params for FTO
     */
    public record CollectionSource(String handle, String type, String extraQuery) {
    }

    public record Leaderboard(int bayesianPriorStrength) {
    }

    public record OpenAi(String apiKey, String embeddingModel, String chatModel, String baseUrl) {
    }
}

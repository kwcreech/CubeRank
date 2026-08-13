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
        OpenAi openai,
        Assistant assistant) {

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
     * @param handle                   collection handle in the URL path
     * @param type                     CubeRank {@code cubes.type} value assigned to products from this collection
     * @param extraQuery               optional raw query string (without leading {@code ?})
     * @param requiredTags             when non-empty, product must include every listed Shopify tag before upsert
     * @param excludedTitleSubstrings  when non-empty, discard products whose title or handle contains any
     *                                 listed substring (case-insensitive), e.g. non-WCA Clock shape mods
     */
    public record CollectionSource(
            String handle,
            String type,
            String extraQuery,
            List<String> requiredTags,
            List<String> excludedTitleSubstrings) {
    }

    public record Leaderboard(int bayesianPriorStrength) {
    }

    public record OpenAi(String apiKey, String embeddingModel, String chatModel, String baseUrl) {
    }

    /**
     * RAG assistant limits and filters. Pattern lists are case-insensitive substring matches.
     */
    public record Assistant(
            int maxPromptChars,
            int rateLimitPerHour,
            int ipRateLimitPerHour,
            int retrievalK,
            double retrievalMaxDistance,
            long backfillDelayMs,
            int maxCompletionTokens,
            int maxConcurrentOpenai,
            int openaiBulkheadWaitSeconds,
            List<String> inputBlockedPatterns,
            List<String> outputBlockedWords) {
    }
}

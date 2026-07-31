package com.cuberank.backend.config;

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

    public record Ingest(String sharedSecret, String thecubicleProductsUrl, String blockedKeywords) {
    }

    public record Leaderboard(int bayesianPriorStrength) {
    }

    public record OpenAi(String apiKey, String embeddingModel, String chatModel, String baseUrl) {
    }
}

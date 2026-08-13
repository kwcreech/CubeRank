package com.cuberank.backend.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/** Request/response shapes for OpenAI embeddings + chat completions. */
public final class OpenAiDtos {

    private OpenAiDtos() {
    }

    public record EmbeddingRequest(String model, String input) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EmbeddingResponse(List<EmbeddingData> data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EmbeddingData(float[] embedding, int index) {
    }

    public record ChatRequest(
            String model,
            List<ChatMessage> messages,
            double temperature,
            @JsonProperty("max_tokens") Integer maxTokens) {
    }

    public record ChatMessage(String role, String content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChatResponse(List<ChatChoice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChatChoice(ChatMessage message, @JsonProperty("finish_reason") String finishReason) {
    }
}

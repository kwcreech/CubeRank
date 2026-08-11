package com.cuberank.backend.openai;

import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.openai.OpenAiDtos.ChatMessage;
import com.cuberank.backend.openai.OpenAiDtos.ChatRequest;
import com.cuberank.backend.openai.OpenAiDtos.ChatResponse;
import com.cuberank.backend.openai.OpenAiDtos.EmbeddingRequest;
import com.cuberank.backend.openai.OpenAiDtos.EmbeddingResponse;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class OpenAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);

    private final AppProperties.OpenAi openAi;
    private final String baseUrl;
    private final RestClient restClient;

    public OpenAiClient(AppProperties appProperties, RestClient.Builder restClientBuilder) {
        this.openAi = appProperties.openai();
        String configured = openAi.baseUrl();
        if (configured == null || configured.isBlank()) {
            configured = "https://api.openai.com/v1";
        }
        if (configured.endsWith("/")) {
            configured = configured.substring(0, configured.length() - 1);
        }
        this.baseUrl = configured;
        // Do not call baseUrl() on the shared builder — CatalogIngestService uses the same bean.
        this.restClient = restClientBuilder.build();
    }

    public float[] embed(String text) {
        requireApiKey();
        try {
            EmbeddingResponse response = restClient.post()
                    .uri(baseUrl + "/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + openAi.apiKey())
                    .body(new EmbeddingRequest(openAi.embeddingModel(), text))
                    .retrieve()
                    .body(EmbeddingResponse.class);

            if (response == null || response.data() == null || response.data().isEmpty()
                    || response.data().getFirst().embedding() == null) {
                throw new OpenAiException("OpenAI embeddings returned an empty response");
            }
            return response.data().getFirst().embedding();
        } catch (RestClientResponseException ex) {
            log.warn("OpenAI embeddings failed: status={} body={}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new OpenAiException("OpenAI embeddings request failed", ex);
        } catch (OpenAiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new OpenAiException("OpenAI embeddings request failed", ex);
        }
    }

    public String chat(String systemPrompt, String userPrompt) {
        requireApiKey();
        try {
            ChatResponse response = restClient.post()
                    .uri(baseUrl + "/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + openAi.apiKey())
                    .body(new ChatRequest(
                            openAi.chatModel(),
                            List.of(
                                    new ChatMessage("system", systemPrompt),
                                    new ChatMessage("user", userPrompt)),
                            0.3))
                    .retrieve()
                    .body(ChatResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()
                    || response.choices().getFirst().message() == null
                    || !StringUtils.hasText(response.choices().getFirst().message().content())) {
                throw new OpenAiException("OpenAI chat returned an empty response");
            }
            return response.choices().getFirst().message().content().trim();
        } catch (RestClientResponseException ex) {
            log.warn("OpenAI chat failed: status={} body={}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new OpenAiException("OpenAI chat request failed", ex);
        } catch (OpenAiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new OpenAiException("OpenAI chat request failed", ex);
        }
    }

    public boolean isConfigured() {
        return StringUtils.hasText(openAi.apiKey());
    }

    private void requireApiKey() {
        if (!isConfigured()) {
            throw new OpenAiException("OpenAI API key is not configured");
        }
    }
}

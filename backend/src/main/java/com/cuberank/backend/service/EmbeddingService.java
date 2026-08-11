package com.cuberank.backend.service;

import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.domain.Review;
import com.cuberank.backend.openai.OpenAiClient;
import com.cuberank.backend.openai.OpenAiException;
import com.cuberank.backend.repository.EmbeddingRepository;
import com.cuberank.backend.repository.ReviewRepository;
import com.cuberank.backend.web.dto.EmbeddingBackfillResult;
import com.cuberank.backend.web.dto.RetrievedReviewSnippet;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    private static final int BACKFILL_BATCH = 25;

    private final OpenAiClient openAiClient;
    private final ReviewRepository reviewRepository;
    private final EmbeddingRepository embeddingRepository;
    private final EmbeddingWriter embeddingWriter;
    private final AppProperties.Assistant assistant;

    public EmbeddingService(
            OpenAiClient openAiClient,
            ReviewRepository reviewRepository,
            EmbeddingRepository embeddingRepository,
            EmbeddingWriter embeddingWriter,
            AppProperties appProperties) {
        this.openAiClient = openAiClient;
        this.reviewRepository = reviewRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingWriter = embeddingWriter;
        this.assistant = appProperties.assistant();
    }

    /**
     * Embeds review text and upserts the vector row. Failures are logged and swallowed
     * so review writes stay successful when OpenAI is unavailable.
     */
    public void embedReviewFailSoft(long reviewId) {
        try {
            embedReview(reviewId);
        } catch (Exception ex) {
            log.warn("Failed to embed review {}: {}", reviewId, ex.getMessage());
        }
    }

    public void embedReview(long reviewId) {
        Review loaded = reviewRepository
                .findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        String content = loaded.getWrittenContent();
        if (!StringUtils.hasText(content)) {
            return;
        }

        float[] vector = openAiClient.embed(content.trim());
        embeddingWriter.upsertEmbedding(reviewId, vector);
    }

    @Transactional(readOnly = true)
    public List<RetrievedReviewSnippet> findSimilar(float[] queryVector, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<Object[]> rows = embeddingRepository.findSimilarLiveReviews(toVectorLiteral(queryVector), safeLimit);
        List<RetrievedReviewSnippet> snippets = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            long reviewId = ((Number) row[0]).longValue();
            long cubeId = ((Number) row[1]).longValue();
            String cubeName = (String) row[2];
            String written = (String) row[3];
            snippets.add(new RetrievedReviewSnippet(
                    reviewId,
                    cubeId,
                    cubeName,
                    excerpt(written, 280)));
        }
        return snippets;
    }

    /**
     * Embeds reviews that do not yet have a vector row. Processes up to one batch per call.
     */
    public EmbeddingBackfillResult backfillMissing() {
        if (!openAiClient.isConfigured()) {
            return new EmbeddingBackfillResult(0, 0, 0, List.of("OpenAI API key is not configured"));
        }

        List<Review> missing = reviewRepository.findWithoutEmbedding(PageRequest.of(0, BACKFILL_BATCH));
        int attempted = 0;
        int embedded = 0;
        int failed = 0;
        List<String> warnings = new ArrayList<>();

        for (Review review : missing) {
            attempted++;
            try {
                embedReview(review.getId());
                embedded++;
                sleepQuietly(assistant.backfillDelayMs());
            } catch (OpenAiException ex) {
                failed++;
                warnings.add("Review " + review.getId() + ": " + ex.getMessage());
                log.warn("Backfill embed failed for review {}", review.getId(), ex);
            } catch (Exception ex) {
                failed++;
                warnings.add("Review " + review.getId() + ": " + ex.getMessage());
                log.warn("Backfill embed failed for review {}", review.getId(), ex);
            }
        }

        return new EmbeddingBackfillResult(attempted, embedded, failed, warnings);
    }

    static String toVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 8);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(String.format(Locale.ROOT, "%.8f", vector[i]));
        }
        sb.append(']');
        return sb.toString();
    }

    private static String excerpt(String text, int maxChars) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim().replaceAll("\\s+", " ");
        if (trimmed.length() <= maxChars) {
            return trimmed;
        }
        return trimmed.substring(0, maxChars - 1) + "…";
    }

    private static void sleepQuietly(long delayMs) {
        if (delayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}

package com.cuberank.backend.service;

import com.cuberank.backend.domain.Embedding;
import com.cuberank.backend.domain.Review;
import com.cuberank.backend.repository.EmbeddingRepository;
import com.cuberank.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Separate bean so {@code @Transactional} applies via Spring proxy.
 * Uses REQUIRES_NEW so persist always gets a fresh JPA transaction.
 */
@Service
public class EmbeddingWriter {

    private final ReviewRepository reviewRepository;
    private final EmbeddingRepository embeddingRepository;

    public EmbeddingWriter(ReviewRepository reviewRepository, EmbeddingRepository embeddingRepository) {
        this.reviewRepository = reviewRepository;
        this.embeddingRepository = embeddingRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void upsertEmbedding(long reviewId, float[] vector) {
        Review review = reviewRepository
                .findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        Embedding embedding = embeddingRepository.findById(reviewId).orElse(null);
        if (embedding == null) {
            embedding = new Embedding();
            embedding.setReview(review);
            review.setEmbedding(embedding);
        }
        embedding.setEmbedding(vector);
        embeddingRepository.save(embedding);
        embeddingRepository.flush();
    }
}

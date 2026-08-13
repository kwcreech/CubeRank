package com.cuberank.backend.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = @UniqueConstraint(name = "uq_reviews_user_cube", columnNames = {"user_id", "cube_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cube_id", nullable = false)
    private Cube cube;

    @Column(name = "written_content", nullable = false, columnDefinition = "text")
    private String writtenContent;

    @Column(name = "youtube_url", length = ReviewLimits.YOUTUBE_URL_MAX)
    private String youtubeUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToOne(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private ReviewMetrics metrics;

    @OneToOne(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Embedding embedding;

    public void setMetrics(ReviewMetrics metrics) {
        this.metrics = metrics;
        if (metrics != null) {
            metrics.setReview(this);
        }
    }

    public void setEmbedding(Embedding embedding) {
        this.embedding = embedding;
        if (embedding != null) {
            embedding.setReview(this);
        }
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}

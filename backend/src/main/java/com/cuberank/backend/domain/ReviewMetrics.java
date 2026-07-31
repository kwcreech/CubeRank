package com.cuberank.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "review_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewMetrics {

    @Id
    @Column(name = "review_id")
    private Long reviewId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "review_id")
    private Review review;

    @Column(name = "speed", nullable = false)
    private short speed;

    @Column(name = "stability", nullable = false)
    private short stability;

    @Column(name = "turning", nullable = false)
    private short turning;

    @Column(name = "customizability", nullable = false)
    private short customizability;

    @Column(name = "value", nullable = false)
    private short value;
}

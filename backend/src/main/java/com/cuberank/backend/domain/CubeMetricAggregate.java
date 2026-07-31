package com.cuberank.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import org.hibernate.annotations.Immutable;

/**
 * Read-only mapping of the {@code cube_metric_aggregates} database view.
 * Used by radar charts and Bayesian leaderboard scoring.
 */
@Entity
@Immutable
@Table(name = "cube_metric_aggregates")
@Getter
public class CubeMetricAggregate {

    @Id
    @Column(name = "cube_id")
    private Long cubeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private CubeStatus status;

    @Column(name = "type")
    private String type;

    @Column(name = "brand")
    private String brand;

    @Column(name = "review_count")
    private long reviewCount;

    @Column(name = "avg_speed")
    private BigDecimal avgSpeed;

    @Column(name = "avg_stability")
    private BigDecimal avgStability;

    @Column(name = "avg_turning")
    private BigDecimal avgTurning;

    @Column(name = "avg_customizability")
    private BigDecimal avgCustomizability;

    @Column(name = "avg_value")
    private BigDecimal avgValue;

    @Column(name = "avg_overall")
    private BigDecimal avgOverall;
}

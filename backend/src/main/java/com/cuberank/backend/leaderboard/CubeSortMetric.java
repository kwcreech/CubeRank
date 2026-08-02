package com.cuberank.backend.leaderboard;

import com.cuberank.backend.domain.CubeMetricAggregate;
import com.cuberank.backend.web.BadRequestException;
import java.math.BigDecimal;
import java.util.Locale;
import java.util.function.Function;

public enum CubeSortMetric {
    OVERALL(CubeMetricAggregate::getAvgOverall),
    SPEED(CubeMetricAggregate::getAvgSpeed),
    STABILITY(CubeMetricAggregate::getAvgStability),
    TURNING(CubeMetricAggregate::getAvgTurning),
    CUSTOMIZABILITY(CubeMetricAggregate::getAvgCustomizability),
    VALUE(CubeMetricAggregate::getAvgValue);

    private final Function<CubeMetricAggregate, BigDecimal> extractor;

    CubeSortMetric(Function<CubeMetricAggregate, BigDecimal> extractor) {
        this.extractor = extractor;
    }

    public BigDecimal rawAverage(CubeMetricAggregate aggregate) {
        return extractor.apply(aggregate);
    }

    public static CubeSortMetric fromParam(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return OVERALL;
        }
        try {
            return CubeSortMetric.valueOf(sortBy.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(
                    "sortBy must be one of: overall, speed, stability, turning, customizability, value");
        }
    }
}

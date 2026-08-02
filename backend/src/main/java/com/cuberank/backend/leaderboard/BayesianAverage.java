package com.cuberank.backend.leaderboard;

/**
 * Bayesian average: {@code (v/(v+m))*r + (m/(v+m))*C}
 * where {@code v} is review count, {@code r} is the item mean, {@code C} is the
 * global mean for the active filter set, and {@code m} is the prior strength.
 */
public final class BayesianAverage {

    private BayesianAverage() {
    }

    public static double score(double itemMean, long reviewCount, double globalMean, int priorStrength) {
        if (priorStrength < 0) {
            throw new IllegalArgumentException("priorStrength must be >= 0");
        }
        if (reviewCount < 0) {
            throw new IllegalArgumentException("reviewCount must be >= 0");
        }
        double v = reviewCount;
        double m = priorStrength;
        if (v + m == 0) {
            return globalMean;
        }
        return (v / (v + m)) * itemMean + (m / (v + m)) * globalMean;
    }
}

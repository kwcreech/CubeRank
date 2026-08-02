package com.cuberank.backend.leaderboard;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class BayesianAverageTest {

    @Test
    void withNoReviewsEqualsGlobalMean() {
        assertEquals(7.5, BayesianAverage.score(0, 0, 7.5, 8), 1e-9);
    }

    @Test
    void withManyReviewsApproachesItemMean() {
        double score = BayesianAverage.score(9.0, 1000, 5.0, 8);
        assertEquals(9.0, score, 0.05);
    }

    @Test
    void blendsTowardGlobalMeanWhenFewReviews() {
        // v=2, m=8, r=10, C=5 → (2/10)*10 + (8/10)*5 = 2 + 4 = 6
        assertEquals(6.0, BayesianAverage.score(10.0, 2, 5.0, 8), 1e-9);
    }
}

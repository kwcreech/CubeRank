package com.cuberank.backend.assistant;

import com.cuberank.backend.domain.AssistantQueryLog;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Pure helpers for rolling-window assistant rate limits (testable without Spring).
 */
public final class AssistantRateLimiter {

    private AssistantRateLimiter() {
    }

    public static boolean isLimited(long recentCount, int limitPerHour) {
        return recentCount >= limitPerHour;
    }

    /**
     * Seconds until the oldest entry in the window falls outside the rolling hour.
     * Returns at least 1 when limited.
     */
    public static int retryAfterSeconds(List<AssistantQueryLog> recentAscending, Instant now, int limitPerHour) {
        if (recentAscending == null || recentAscending.isEmpty() || recentAscending.size() < limitPerHour) {
            return 1;
        }
        Instant oldest = recentAscending.getFirst().getCreatedAt();
        Instant unlockAt = oldest.plus(Duration.ofHours(1));
        long seconds = Duration.between(now, unlockAt).getSeconds();
        return (int) Math.max(1, seconds);
    }

    public static int remainingQuota(long recentCount, int limitPerHour) {
        return (int) Math.max(0, limitPerHour - recentCount);
    }
}

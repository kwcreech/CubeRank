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

    /**
     * Soonest unlock across the user window and (when present) the IP window.
     */
    public static int retryAfterSeconds(
            List<AssistantQueryLog> userRecent,
            List<AssistantQueryLog> ipRecent,
            Instant now,
            int userLimitPerHour,
            int ipLimitPerHour) {
        int userRetry = Integer.MAX_VALUE;
        int ipRetry = Integer.MAX_VALUE;
        if (isLimited(size(userRecent), userLimitPerHour)) {
            userRetry = retryAfterSeconds(userRecent, now, userLimitPerHour);
        }
        if (isLimited(size(ipRecent), ipLimitPerHour)) {
            ipRetry = retryAfterSeconds(ipRecent, now, ipLimitPerHour);
        }
        int retry = Math.min(userRetry, ipRetry);
        return retry == Integer.MAX_VALUE ? 1 : retry;
    }

    private static int size(List<AssistantQueryLog> logs) {
        return logs == null ? 0 : logs.size();
    }

    public static int remainingQuota(long recentCount, int limitPerHour) {
        return (int) Math.max(0, limitPerHour - recentCount);
    }
}

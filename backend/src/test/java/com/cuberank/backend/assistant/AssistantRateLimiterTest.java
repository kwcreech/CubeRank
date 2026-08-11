package com.cuberank.backend.assistant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.cuberank.backend.domain.AssistantQueryLog;
import com.cuberank.backend.domain.AssistantQueryStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AssistantRateLimiterTest {

    @Test
    void limitedWhenCountReachesCap() {
        assertFalse(AssistantRateLimiter.isLimited(2, 3));
        assertTrue(AssistantRateLimiter.isLimited(3, 3));
        assertTrue(AssistantRateLimiter.isLimited(4, 3));
    }

    @Test
    void remainingQuotaNeverNegative() {
        assertEquals(3, AssistantRateLimiter.remainingQuota(0, 3));
        assertEquals(0, AssistantRateLimiter.remainingQuota(3, 3));
        assertEquals(0, AssistantRateLimiter.remainingQuota(5, 3));
    }

    @Test
    void retryAfterBasedOnOldestInWindow() {
        Instant now = Instant.parse("2026-08-11T12:00:00Z");
        Instant oldest = now.minusSeconds(3500);
        List<AssistantQueryLog> recent = List.of(
                log(oldest),
                log(now.minusSeconds(2000)),
                log(now.minusSeconds(100)));

        int retry = AssistantRateLimiter.retryAfterSeconds(recent, now, 3);
        // 3600 - 3500 = 100 seconds until oldest ages out
        assertEquals(100, retry);
    }

    @Test
    void retryAfterAtLeastOneWhenLimited() {
        Instant now = Instant.parse("2026-08-11T12:00:00Z");
        List<AssistantQueryLog> recent = List.of(
                log(now.minusSeconds(3599)),
                log(now.minusSeconds(10)),
                log(now.minusSeconds(1)));
        assertEquals(1, AssistantRateLimiter.retryAfterSeconds(recent, now, 3));
    }

    private static AssistantQueryLog log(Instant createdAt) {
        return AssistantQueryLog.builder()
                .userId(UUID.randomUUID())
                .createdAt(createdAt)
                .status(AssistantQueryStatus.ACCEPTED)
                .build();
    }
}

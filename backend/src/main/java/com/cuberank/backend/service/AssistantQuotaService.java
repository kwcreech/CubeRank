package com.cuberank.backend.service;

import com.cuberank.backend.assistant.AssistantRateLimiter;
import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.domain.AssistantQueryLog;
import com.cuberank.backend.domain.AssistantQueryStatus;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.repository.AssistantQueryLogRepository;
import com.cuberank.backend.repository.UserRepository;
import com.cuberank.backend.web.TooManyRequestsException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * Atomic assistant quota: lock the user row, count rolling windows, then insert the log.
 * Must not wrap OpenAI HTTP calls.
 */
@Service
public class AssistantQuotaService {

    static final String RATE_LIMIT_MESSAGE = "Rate limit exceeded: too many prompts this hour";

    public record Reservation(AssistantQueryLog log, int remainingUserQuota) {
    }

    private final UserRepository userRepository;
    private final AssistantQueryLogRepository queryLogRepository;
    private final AppProperties.Assistant assistant;

    public AssistantQuotaService(
            UserRepository userRepository,
            AssistantQueryLogRepository queryLogRepository,
            AppProperties appProperties) {
        this.userRepository = userRepository;
        this.queryLogRepository = queryLogRepository;
        this.assistant = appProperties.assistant();
    }

    @Transactional
    public Reservation reserve(User user, String clientIp, AssistantQueryStatus initialStatus) {
        userRepository
                .findByIdForUpdate(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found: " + user.getId()));

        Instant now = Instant.now();
        Instant windowStart = now.minus(Duration.ofHours(1));
        List<AssistantQueryLog> userRecent = queryLogRepository.findRecentAscending(user.getId(), windowStart);

        String ip = StringUtils.hasText(clientIp) ? clientIp.trim() : null;
        List<AssistantQueryLog> ipRecent = ip == null
                ? List.of()
                : queryLogRepository.findRecentByIpAscending(ip, windowStart);

        boolean userLimited = AssistantRateLimiter.isLimited(userRecent.size(), assistant.rateLimitPerHour());
        boolean ipLimited = ip != null
                && AssistantRateLimiter.isLimited(ipRecent.size(), assistant.ipRateLimitPerHour());
        if (userLimited || ipLimited) {
            int retryAfter = AssistantRateLimiter.retryAfterSeconds(
                    userRecent,
                    ipRecent,
                    now,
                    assistant.rateLimitPerHour(),
                    assistant.ipRateLimitPerHour());
            throw new TooManyRequestsException(RATE_LIMIT_MESSAGE, retryAfter);
        }

        AssistantQueryLog saved = queryLogRepository.save(AssistantQueryLog.builder()
                .userId(user.getId())
                .clientIp(ip)
                .status(initialStatus)
                .build());
        return new Reservation(
                saved, AssistantRateLimiter.remainingQuota(userRecent.size() + 1, assistant.rateLimitPerHour()));
    }

    @Transactional
    public void updateStatus(Long logId, AssistantQueryStatus status) {
        if (logId == null || status == null) {
            return;
        }
        queryLogRepository.findById(logId).ifPresent(log -> {
            log.setStatus(status);
            queryLogRepository.save(log);
        });
    }
}

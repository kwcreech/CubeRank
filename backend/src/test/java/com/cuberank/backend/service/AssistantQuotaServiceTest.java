package com.cuberank.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.domain.AssistantQueryLog;
import com.cuberank.backend.domain.AssistantQueryStatus;
import com.cuberank.backend.domain.Role;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.repository.AssistantQueryLogRepository;
import com.cuberank.backend.repository.UserRepository;
import com.cuberank.backend.web.TooManyRequestsException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AssistantQuotaServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AssistantQueryLogRepository queryLogRepository;

    private AssistantQuotaService quotaService;
    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .email("u@example.com")
                .username("tester")
                .role(Role.USER)
                .build();
        AppProperties props = new AppProperties(
                new AppProperties.Cors("http://localhost:3000"),
                new AppProperties.Supabase("https://example.supabase.co/auth/v1"),
                new AppProperties.Ingest("secret", "https://example.com", 250, 0, List.of(), List.of()),
                new AppProperties.Leaderboard(8),
                new AppProperties.OpenAi(
                        "test-key", "text-embedding-3-small", "gpt-4o-mini", "https://api.openai.com/v1"),
                new AppProperties.Assistant(
                        500,
                        3,
                        6,
                        6,
                        0.65,
                        0,
                        400,
                        4,
                        0,
                        List.of("ignore previous instructions"),
                        List.of("fuck", "shit")));
        quotaService = new AssistantQuotaService(userRepository, queryLogRepository, props);
        when(userRepository.findByIdForUpdate(user.getId())).thenReturn(Optional.of(user));
    }

    @Test
    void reserveInsertsWhenUnderCap() {
        when(queryLogRepository.findRecentAscending(eq(user.getId()), any())).thenReturn(List.of());
        when(queryLogRepository.findRecentByIpAscending(eq("203.0.113.8"), any())).thenReturn(List.of());
        when(queryLogRepository.save(any())).thenAnswer(invocation -> {
            AssistantQueryLog log = invocation.getArgument(0);
            log.setId(11L);
            return log;
        });

        AssistantQuotaService.Reservation reservation =
                quotaService.reserve(user, "203.0.113.8", AssistantQueryStatus.ACCEPTED);

        assertEquals(2, reservation.remainingUserQuota());
        assertEquals(11L, reservation.log().getId());
        ArgumentCaptor<AssistantQueryLog> captor = ArgumentCaptor.forClass(AssistantQueryLog.class);
        verify(queryLogRepository).save(captor.capture());
        assertEquals("203.0.113.8", captor.getValue().getClientIp());
        assertEquals(AssistantQueryStatus.ACCEPTED, captor.getValue().getStatus());
    }

    @Test
    void reserveThrowsWhenUserWindowIsFull() {
        when(queryLogRepository.findRecentAscending(eq(user.getId()), any())).thenReturn(logs(3));
        when(queryLogRepository.findRecentByIpAscending(eq("203.0.113.8"), any())).thenReturn(List.of());

        TooManyRequestsException ex = assertThrows(
                TooManyRequestsException.class,
                () -> quotaService.reserve(user, "203.0.113.8", AssistantQueryStatus.ACCEPTED));

        assertEquals(AssistantQuotaService.RATE_LIMIT_MESSAGE, ex.getMessage());
        verify(queryLogRepository, never()).save(any());
    }

    @Test
    void reserveThrowsWhenIpWindowIsFull() {
        when(queryLogRepository.findRecentAscending(eq(user.getId()), any())).thenReturn(List.of());
        when(queryLogRepository.findRecentByIpAscending(eq("203.0.113.8"), any())).thenReturn(logs(6));

        assertThrows(
                TooManyRequestsException.class,
                () -> quotaService.reserve(user, "203.0.113.8", AssistantQueryStatus.ACCEPTED));

        verify(queryLogRepository, never()).save(any());
    }

    @Test
    void nullIpSkipsIpCap() {
        when(queryLogRepository.findRecentAscending(eq(user.getId()), any())).thenReturn(List.of());
        when(queryLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        quotaService.reserve(user, null, AssistantQueryStatus.BLOCKED_INPUT);

        verify(queryLogRepository, never()).findRecentByIpAscending(any(), any());
        ArgumentCaptor<AssistantQueryLog> captor = ArgumentCaptor.forClass(AssistantQueryLog.class);
        verify(queryLogRepository).save(captor.capture());
        assertEquals(AssistantQueryStatus.BLOCKED_INPUT, captor.getValue().getStatus());
    }

    private static List<AssistantQueryLog> logs(int count) {
        Instant now = Instant.parse("2026-08-13T12:00:00Z");
        List<AssistantQueryLog> result = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            result.add(AssistantQueryLog.builder()
                    .userId(UUID.randomUUID())
                    .createdAt(now.minusSeconds(60L * (i + 1)))
                    .status(AssistantQueryStatus.ACCEPTED)
                    .build());
        }
        return result;
    }
}

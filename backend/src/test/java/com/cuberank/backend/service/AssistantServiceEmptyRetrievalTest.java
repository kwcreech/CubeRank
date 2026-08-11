package com.cuberank.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.domain.AssistantQueryStatus;
import com.cuberank.backend.domain.Role;
import com.cuberank.backend.domain.User;
import com.cuberank.backend.openai.OpenAiClient;
import com.cuberank.backend.repository.AssistantQueryLogRepository;
import com.cuberank.backend.security.AuthenticatedUser;
import com.cuberank.backend.web.dto.AssistantQueryRequest;
import com.cuberank.backend.web.dto.AssistantQueryResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AssistantServiceEmptyRetrievalTest {

    @Mock
    private OpenAiClient openAiClient;
    @Mock
    private EmbeddingService embeddingService;
    @Mock
    private AssistantQueryLogRepository queryLogRepository;
    @Mock
    private UserProvisioningService userProvisioningService;

    private AssistantService assistantService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.Cors("http://localhost:3000"),
                new AppProperties.Supabase("https://example.supabase.co/auth/v1"),
                new AppProperties.Ingest("secret", "https://example.com", 250, 0, List.of(), List.of()),
                new AppProperties.Leaderboard(8),
                new AppProperties.OpenAi("test-key", "text-embedding-3-small", "gpt-4o-mini", "https://api.openai.com/v1"),
                new AppProperties.Assistant(
                        500,
                        3,
                        6,
                        0,
                        List.of("ignore previous instructions"),
                        List.of("fuck", "shit")));
        assistantService = new AssistantService(
                openAiClient,
                embeddingService,
                queryLogRepository,
                userProvisioningService,
                props);
    }

    @Test
    void emptyRetrievalSkipsChatAndReturnsFixedAnswer() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("u@example.com")
                .username("tester")
                .role(Role.USER)
                .build();
        when(userProvisioningService.ensureUser(any())).thenReturn(user);
        when(queryLogRepository.findRecentAscending(eq(userId), any())).thenReturn(List.of());
        when(openAiClient.isConfigured()).thenReturn(true);
        when(openAiClient.embed(anyString())).thenReturn(new float[] {0.1f, 0.2f});
        when(embeddingService.findSimilar(any(), anyInt())).thenReturn(List.of());
        when(queryLogRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AssistantQueryResponse response = assistantService.query(
                new AuthenticatedUser(userId, "u@example.com", Role.USER),
                new AssistantQueryRequest("best beginner 3x3?"));

        assertTrue(response.answer().contains("don't have enough indexed reviews"));
        assertTrue(response.citations().isEmpty());
        assertEquals(2, response.remainingQuota());
        verify(openAiClient, never()).chat(anyString(), anyString());

        ArgumentCaptor<com.cuberank.backend.domain.AssistantQueryLog> logCaptor =
                ArgumentCaptor.forClass(com.cuberank.backend.domain.AssistantQueryLog.class);
        verify(queryLogRepository).save(logCaptor.capture());
        assertEquals(AssistantQueryStatus.ACCEPTED, logCaptor.getValue().getStatus());
    }
}

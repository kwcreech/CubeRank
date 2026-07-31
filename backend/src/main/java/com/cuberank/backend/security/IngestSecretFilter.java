package com.cuberank.backend.security;

import com.cuberank.backend.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Protects {@code /api/internal/**} with a shared secret header
 * ({@code X-Ingest-Secret}) instead of a user JWT. Used by GitHub Actions
 * and admin-triggered catalog ingest.
 */
@Component
public class IngestSecretFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Ingest-Secret";

    private final AppProperties appProperties;

    public IngestSecretFilter(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/internal/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String expected = appProperties.ingest().sharedSecret();
        String provided = request.getHeader(HEADER_NAME);

        if (expected == null || expected.isBlank()) {
            writeUnauthorized(response, "Ingest secret is not configured on the server");
            return;
        }
        if (provided == null || !constantTimeEquals(expected, provided)) {
            writeUnauthorized(response, "Invalid or missing ingest secret");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private static void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }

    private static boolean constantTimeEquals(String expected, String provided) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8), provided.getBytes(StandardCharsets.UTF_8));
    }
}

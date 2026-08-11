package com.cuberank.backend.web;

/**
 * Rate-limit exceeded. {@code retryAfterSeconds} is a hint for clients (may be null).
 */
public class TooManyRequestsException extends RuntimeException {

    private final Integer retryAfterSeconds;

    public TooManyRequestsException(String message, Integer retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public Integer getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

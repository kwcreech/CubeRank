package com.cuberank.backend.repository;

import java.util.UUID;

public interface UserLeaderboardProjection {

    UUID getId();

    String getUsername();

    String getAvatarUrl();

    long getReviewCount();
}

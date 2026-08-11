package com.cuberank.backend.repository;

import com.cuberank.backend.domain.AssistantQueryLog;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssistantQueryLogRepository extends JpaRepository<AssistantQueryLog, Long> {

    long countByUserIdAndCreatedAtGreaterThanEqual(UUID userId, Instant since);

    @Query("""
            select l from AssistantQueryLog l
            where l.userId = :userId and l.createdAt >= :since
            order by l.createdAt asc
            """)
    List<AssistantQueryLog> findRecentAscending(@Param("userId") UUID userId, @Param("since") Instant since);
}

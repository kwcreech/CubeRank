package com.cuberank.backend.repository;

import com.cuberank.backend.domain.Review;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByUserIdAndCubeId(UUID userId, Long cubeId);

    boolean existsByUserIdAndCubeId(UUID userId, Long cubeId);

    Page<Review> findByCubeIdOrderByCreatedAtDesc(Long cubeId, Pageable pageable);

    Page<Review> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserId(UUID userId);

    @Query("""
            select count(r) + 1
            from Review r
            where r.user.id <> :userId
              and (select count(r2) from Review r2 where r2.user.id = r.user.id) > :reviewCount
            """)
    long countUsersWithMoreReviewsThan(
            @Param("userId") UUID userId, @Param("reviewCount") long reviewCount);
}

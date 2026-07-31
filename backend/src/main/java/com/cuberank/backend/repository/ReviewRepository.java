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

    /**
     * Competition rank by review count: 1 + number of users with strictly more reviews.
     * Users with the same count share the same rank.
     */
    @Query("""
            select count(u) + 1
            from User u
            where (select count(r) from Review r where r.user = u) > :reviewCount
            """)
    long rankForReviewCount(@Param("reviewCount") long reviewCount);

    @Query("""
            select distinct r from Review r
            join fetch r.cube
            join fetch r.metrics
            where r.user.id = :userId
            """)
    java.util.List<Review> findAllWithCubeAndMetricsByUserId(@Param("userId") UUID userId);
}

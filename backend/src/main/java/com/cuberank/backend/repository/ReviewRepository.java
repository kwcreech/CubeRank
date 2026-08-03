package com.cuberank.backend.repository;

import com.cuberank.backend.domain.Review;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    @Query("select r from Review r where r.id = :id")
    Optional<Review> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    Optional<Review> findByUser_IdAndCube_Id(UUID userId, Long cubeId);

    boolean existsByUser_IdAndCube_Id(UUID userId, Long cubeId);

    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    Page<Review> findByCube_IdOrderByCreatedAtDesc(Long cubeId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Highest five-metric mean first; newest wins ties. Pass {@code Pageable.ofSize(1)} for best.
     */
    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    @Query("""
            select r from Review r
            join r.metrics m
            where r.cube.id = :cubeId
            order by (m.speed + m.stability + m.turning + m.customizability + m.value) / 5.0 desc,
                     r.createdAt desc
            """)
    List<Review> findByCubeIdOrderByMetricMeanDesc(@Param("cubeId") Long cubeId, Pageable pageable);

    /**
     * Lowest five-metric mean first; oldest wins ties. Pass {@code Pageable.ofSize(1)} for worst.
     */
    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    @Query("""
            select r from Review r
            join r.metrics m
            where r.cube.id = :cubeId
            order by (m.speed + m.stability + m.turning + m.customizability + m.value) / 5.0 asc,
                     r.createdAt asc
            """)
    List<Review> findByCubeIdOrderByMetricMeanAsc(@Param("cubeId") Long cubeId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "cube", "metrics"})
    Page<Review> findByUser_IdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUser_Id(UUID userId);

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

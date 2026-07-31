package com.cuberank.backend.repository;

import com.cuberank.backend.domain.CubeMetricAggregate;
import com.cuberank.backend.domain.CubeStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CubeMetricAggregateRepository extends JpaRepository<CubeMetricAggregate, Long> {

    Optional<CubeMetricAggregate> findByCubeId(Long cubeId);

    List<CubeMetricAggregate> findByStatus(CubeStatus status);

    @Query("""
            select a from CubeMetricAggregate a
            where a.status = :status
              and (:type is null or a.type = :type)
              and (:brand is null or lower(a.brand) = lower(:brand))
            """)
    List<CubeMetricAggregate> findFiltered(
            @Param("status") CubeStatus status,
            @Param("type") String type,
            @Param("brand") String brand);
}

package com.cuberank.backend.repository;

import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.web.dto.CubePickerDto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CubeRepository extends JpaRepository<Cube, Long> {

    Optional<Cube> findBySourceStoreAndShopifyProductId(String sourceStore, Long shopifyProductId);

    Page<Cube> findByStatus(CubeStatus status, Pageable pageable);

    Page<Cube> findByStatusAndType(CubeStatus status, String type, Pageable pageable);

    Page<Cube> findByStatusAndBrandIgnoreCase(CubeStatus status, String brand, Pageable pageable);

    Page<Cube> findByStatusAndTypeAndBrandIgnoreCase(
            CubeStatus status, String type, String brand, Pageable pageable);

    Page<Cube> findByStatusAndNameContainingIgnoreCase(CubeStatus status, String name, Pageable pageable);

    Page<Cube> findByStatusAndTypeAndNameContainingIgnoreCase(
            CubeStatus status, String type, String name, Pageable pageable);

    Page<Cube> findByStatusAndBrandIgnoreCaseAndNameContainingIgnoreCase(
            CubeStatus status, String brand, String name, Pageable pageable);

    Page<Cube> findByStatusAndTypeAndBrandIgnoreCaseAndNameContainingIgnoreCase(
            CubeStatus status, String type, String brand, String name, Pageable pageable);

    @Query(
            value = """
                    select c from Cube c, CubeMetricAggregate a
                    where a.cubeId = c.id
                      and c.status = :status
                      and a.reviewCount > 0
                      and (:type is null or c.type = :type)
                      and (:brand is null or lower(c.brand) = :brand)
                      and (:name is null or lower(c.name) like lower(concat('%', :name, '%')))
                    order by a.reviewCount desc, c.name asc
                    """,
            countQuery = """
                    select count(c) from Cube c, CubeMetricAggregate a
                    where a.cubeId = c.id
                      and c.status = :status
                      and a.reviewCount > 0
                      and (:type is null or c.type = :type)
                      and (:brand is null or lower(c.brand) = :brand)
                      and (:name is null or lower(c.name) like lower(concat('%', :name, '%')))
                    """)
    Page<Cube> findByStatusOrderByReviewCountDesc(
            @Param("status") CubeStatus status,
            @Param("type") String type,
            @Param("brand") String brand,
            @Param("name") String name,
            Pageable pageable);

    @Query("""
            select new com.cuberank.backend.web.dto.CubePickerDto(c.id, c.name, c.brand, c.type)
            from Cube c
            where c.status = :status and c.type = :type
            order by c.name
            """)
    List<CubePickerDto> findPickerByStatusAndType(
            @Param("status") CubeStatus status, @Param("type") String type);

    @Query("select distinct c.brand from Cube c where c.status = :status order by c.brand")
    List<String> findDistinctBrandsByStatus(@Param("status") CubeStatus status);

    @Query("select distinct c.type from Cube c where c.status = :status order by c.type")
    List<String> findDistinctTypesByStatus(@Param("status") CubeStatus status);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Cube c set c.status = :live where c.status = :staging")
    int promoteAllStagingToLive(
            @Param("staging") CubeStatus staging, @Param("live") CubeStatus live);

    long deleteByStatus(CubeStatus status);
}

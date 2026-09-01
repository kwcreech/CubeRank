package com.cuberank.backend.repository;

import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeStatus;
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

    @Query("""
            select c
            from Cube c
            where c.status = :status and c.type = :type
            order by c.name
            """)
    List<Cube> findPickerByStatusAndType(
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

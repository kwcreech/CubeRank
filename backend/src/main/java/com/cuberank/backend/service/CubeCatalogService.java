package com.cuberank.backend.service;

import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeMetricAggregate;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.repository.CubeMetricAggregateRepository;
import com.cuberank.backend.repository.CubeRepository;
import com.cuberank.backend.web.BadRequestException;
import com.cuberank.backend.web.NotFoundException;
import com.cuberank.backend.web.dto.AggregateMetricsDto;
import com.cuberank.backend.web.dto.CubeDetailDto;
import com.cuberank.backend.web.dto.CubeMetaResponse;
import com.cuberank.backend.web.dto.CubeSummaryDto;
import com.cuberank.backend.web.dto.PageResponse;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CubeCatalogService {

    private final CubeRepository cubeRepository;
    private final CubeMetricAggregateRepository aggregateRepository;

    public CubeCatalogService(
            CubeRepository cubeRepository, CubeMetricAggregateRepository aggregateRepository) {
        this.cubeRepository = cubeRepository;
        this.aggregateRepository = aggregateRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<CubeSummaryDto> listLive(String type, String brand, int page, int size) {
        Page<Cube> cubes = findByFilters(CubeStatus.LIVE, type, brand, page, size);
        return PageResponse.from(cubes.map(this::toSummary));
    }

    @Transactional(readOnly = true)
    public CubeDetailDto getLiveCube(long id) {
        Cube cube = cubeRepository
                .findById(id)
                .filter(c -> c.getStatus() == CubeStatus.LIVE)
                .orElseThrow(() -> new NotFoundException("Cube not found: " + id));
        return toDetail(cube);
    }

    @Transactional(readOnly = true)
    public CubeMetaResponse liveMeta() {
        return new CubeMetaResponse(
                cubeRepository.findDistinctTypesByStatus(CubeStatus.LIVE),
                cubeRepository.findDistinctBrandsByStatus(CubeStatus.LIVE));
    }

    @Transactional(readOnly = true)
    public PageResponse<CubeSummaryDto> listStaging(int page, int size) {
        Page<Cube> cubes = findByFilters(CubeStatus.STAGING, null, null, page, size);
        return PageResponse.from(cubes.map(this::toSummary));
    }

    @Transactional
    public CubeDetailDto approve(long id) {
        Cube cube = cubeRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException("Cube not found: " + id));
        if (cube.getStatus() == CubeStatus.LIVE) {
            return toDetail(cube);
        }
        if (cube.getStatus() != CubeStatus.STAGING) {
            throw new BadRequestException("Only STAGING cubes can be approved");
        }
        cube.setStatus(CubeStatus.LIVE);
        return toDetail(cubeRepository.save(cube));
    }

    @Transactional
    public void rejectStaging(long id) {
        Cube cube = cubeRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException("Cube not found: " + id));
        if (cube.getStatus() != CubeStatus.STAGING) {
            throw new BadRequestException("Only STAGING cubes can be rejected");
        }
        cubeRepository.delete(cube);
    }

    private Page<Cube> findByFilters(CubeStatus status, String type, String brand, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "name"));

        boolean hasType = type != null && !type.isBlank();
        boolean hasBrand = brand != null && !brand.isBlank();

        if (hasType && hasBrand) {
            return cubeRepository.findByStatusAndTypeAndBrandIgnoreCase(status, type.trim(), brand.trim(), pageable);
        }
        if (hasType) {
            return cubeRepository.findByStatusAndType(status, type.trim(), pageable);
        }
        if (hasBrand) {
            return cubeRepository.findByStatusAndBrandIgnoreCase(status, brand.trim(), pageable);
        }
        return cubeRepository.findByStatus(status, pageable);
    }

    private CubeSummaryDto toSummary(Cube cube) {
        Optional<CubeMetricAggregate> agg = aggregateRepository.findByCubeId(cube.getId());
        return new CubeSummaryDto(
                cube.getId(),
                cube.getName(),
                cube.getBrand(),
                cube.getType(),
                cube.getStatus(),
                cube.getImageUrl(),
                cube.getProductUrl(),
                agg.map(CubeMetricAggregate::getReviewCount).orElse(0L),
                agg.map(this::toAggregateMetrics).orElse(null));
    }

    private CubeDetailDto toDetail(Cube cube) {
        Optional<CubeMetricAggregate> agg = aggregateRepository.findByCubeId(cube.getId());
        return new CubeDetailDto(
                cube.getId(),
                cube.getName(),
                cube.getBrand(),
                cube.getType(),
                cube.getStatus(),
                cube.getImageUrl(),
                cube.getProductUrl(),
                cube.getSourceStore(),
                cube.getShopifyProductId(),
                cube.getCreatedAt(),
                cube.getUpdatedAt(),
                agg.map(CubeMetricAggregate::getReviewCount).orElse(0L),
                agg.map(this::toAggregateMetrics).orElse(null));
    }

    private AggregateMetricsDto toAggregateMetrics(CubeMetricAggregate agg) {
        if (agg.getReviewCount() <= 0) {
            return null;
        }
        return new AggregateMetricsDto(
                agg.getAvgSpeed(),
                agg.getAvgStability(),
                agg.getAvgTurning(),
                agg.getAvgCustomizability(),
                agg.getAvgValue(),
                agg.getAvgOverall());
    }
}

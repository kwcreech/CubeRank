package com.cuberank.backend.service;

import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeMetricAggregate;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.repository.CubeMetricAggregateRepository;
import com.cuberank.backend.repository.CubeRepository;
import com.cuberank.backend.web.BadRequestException;
import com.cuberank.backend.web.NotFoundException;
import com.cuberank.backend.web.dto.AggregateMetricsDto;
import com.cuberank.backend.web.dto.BulkStagingResult;
import com.cuberank.backend.web.dto.CubeDetailDto;
import com.cuberank.backend.web.dto.CubeMetaResponse;
import com.cuberank.backend.web.dto.CubePickerDto;
import com.cuberank.backend.web.dto.CubeSummaryDto;
import com.cuberank.backend.web.dto.PageResponse;
import java.util.List;
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
    public PageResponse<CubeSummaryDto> listLive(String type, String brand, String q, int page, int size) {
        Page<Cube> cubes = findByFilters(CubeStatus.LIVE, type, brand, q, page, size);
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
    public List<CubePickerDto> listLivePicker(String type) {
        if (type == null || type.isBlank()) {
            throw new BadRequestException("type is required");
        }
        return cubeRepository.findPickerByStatusAndType(CubeStatus.LIVE, type.trim());
    }

    @Transactional(readOnly = true)
    public CubeMetaResponse liveMeta() {
        return new CubeMetaResponse(
                cubeRepository.findDistinctTypesByStatus(CubeStatus.LIVE),
                cubeRepository.findDistinctBrandsByStatus(CubeStatus.LIVE));
    }

    @Transactional(readOnly = true)
    public PageResponse<CubeSummaryDto> listStaging(int page, int size) {
        Page<Cube> cubes = findByFilters(CubeStatus.STAGING, null, null, null, page, size);
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

    @Transactional
    public BulkStagingResult approveAllStaging() {
        int affected = cubeRepository.promoteAllStagingToLive(CubeStatus.STAGING, CubeStatus.LIVE);
        return new BulkStagingResult(affected);
    }

    @Transactional
    public BulkStagingResult rejectAllStaging() {
        int affected = Math.toIntExact(cubeRepository.deleteByStatus(CubeStatus.STAGING));
        return new BulkStagingResult(affected);
    }

    private Page<Cube> findByFilters(
            CubeStatus status, String type, String brand, String q, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "name"));

        boolean hasType = type != null && !type.isBlank();
        boolean hasBrand = brand != null && !brand.isBlank();
        boolean hasQ = q != null && !q.isBlank();
        String name = hasQ ? q.trim() : null;
        String typeValue = hasType ? type.trim() : null;
        String brandValue = hasBrand ? brand.trim() : null;

        if (hasQ) {
            if (hasType && hasBrand) {
                return cubeRepository.findByStatusAndTypeAndBrandIgnoreCaseAndNameContainingIgnoreCase(
                        status, typeValue, brandValue, name, pageable);
            }
            if (hasType) {
                return cubeRepository.findByStatusAndTypeAndNameContainingIgnoreCase(
                        status, typeValue, name, pageable);
            }
            if (hasBrand) {
                return cubeRepository.findByStatusAndBrandIgnoreCaseAndNameContainingIgnoreCase(
                        status, brandValue, name, pageable);
            }
            return cubeRepository.findByStatusAndNameContainingIgnoreCase(status, name, pageable);
        }

        if (hasType && hasBrand) {
            return cubeRepository.findByStatusAndTypeAndBrandIgnoreCase(
                    status, typeValue, brandValue, pageable);
        }
        if (hasType) {
            return cubeRepository.findByStatusAndType(status, typeValue, pageable);
        }
        if (hasBrand) {
            return cubeRepository.findByStatusAndBrandIgnoreCase(status, brandValue, pageable);
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

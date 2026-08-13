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
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
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
    public PageResponse<CubeSummaryDto> listLive(
            String type, String brand, String q, String sort, int page, int size) {
        Page<Cube> cubes = findByFilters(CubeStatus.LIVE, type, brand, q, sort, page, size);
        return toSummaryPage(cubes);
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
        Page<Cube> cubes = findByFilters(CubeStatus.STAGING, null, null, null, null, page, size);
        return toSummaryPage(cubes);
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
            CubeStatus status, String type, String brand, String q, String sort, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        boolean reviewCountSort = isReviewCountSort(sort);
        PageRequest pageable = reviewCountSort
                ? PageRequest.of(safePage, safeSize)
                : PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "name"));

        boolean hasType = type != null && !type.isBlank();
        boolean hasBrand = brand != null && !brand.isBlank();
        boolean hasQ = q != null && !q.isBlank();
        String name = hasQ ? q.trim() : null;
        String typeValue = hasType ? type.trim() : null;
        String brandValue = hasBrand ? brand.trim() : null;

        if (reviewCountSort) {
            String brandFilter = brandValue == null ? null : brandValue.toLowerCase(Locale.ROOT);
            return cubeRepository.findByStatusOrderByReviewCountDesc(
                    status, typeValue, brandFilter, name, pageable);
        }

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

    private static boolean isReviewCountSort(String sort) {
        if (sort == null || sort.isBlank() || "name".equalsIgnoreCase(sort.trim())) {
            return false;
        }
        if ("reviewCount".equalsIgnoreCase(sort.trim())) {
            return true;
        }
        throw new BadRequestException("sort must be name or reviewCount");
    }

    private PageResponse<CubeSummaryDto> toSummaryPage(Page<Cube> cubes) {
        List<Cube> content = cubes.getContent();
        Map<Long, CubeMetricAggregate> aggregatesByCubeId = Map.of();
        if (!content.isEmpty()) {
            List<Long> ids = content.stream().map(Cube::getId).toList();
            aggregatesByCubeId = aggregateRepository.findAllById(ids).stream()
                    .collect(Collectors.toMap(CubeMetricAggregate::getCubeId, Function.identity()));
        }
        Map<Long, CubeMetricAggregate> lookup = aggregatesByCubeId;
        List<CubeSummaryDto> items =
                content.stream().map(cube -> toSummary(cube, lookup.get(cube.getId()))).toList();
        return new PageResponse<>(
                items,
                cubes.getNumber(),
                cubes.getSize(),
                cubes.getTotalElements(),
                cubes.getTotalPages());
    }

    private CubeSummaryDto toSummary(Cube cube, CubeMetricAggregate agg) {
        return new CubeSummaryDto(
                cube.getId(),
                cube.getName(),
                cube.getBrand(),
                cube.getType(),
                cube.getStatus(),
                cube.getImageUrl(),
                cube.getProductUrl(),
                agg == null ? 0L : agg.getReviewCount(),
                agg == null ? null : toAggregateMetrics(agg));
    }

    private CubeDetailDto toDetail(Cube cube) {
        CubeMetricAggregate agg = aggregateRepository.findByCubeId(cube.getId()).orElse(null);
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
                agg == null ? 0L : agg.getReviewCount(),
                agg == null ? null : toAggregateMetrics(agg));
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

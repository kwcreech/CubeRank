package com.cuberank.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeMetricAggregate;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.repository.CubeMetricAggregateRepository;
import com.cuberank.backend.repository.CubeRepository;
import com.cuberank.backend.web.BadRequestException;
import com.cuberank.backend.web.dto.CubeSummaryDto;
import com.cuberank.backend.web.dto.PageResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class CubeCatalogServiceTest {

    @Mock
    private CubeRepository cubeRepository;

    @Mock
    private CubeMetricAggregateRepository aggregateRepository;

    private CubeCatalogService catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CubeCatalogService(cubeRepository, aggregateRepository);
    }

    @Test
    void listLiveLoadsAggregatesOnceForThePage() {
        Cube first = cube(1L, "Alpha");
        Cube second = cube(2L, "Beta");
        CubeMetricAggregate firstAgg = aggregate(1L, 4);
        CubeMetricAggregate secondAgg = aggregate(2L, 9);
        when(cubeRepository.findByStatus(eq(CubeStatus.LIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(first, second), PageRequest.of(0, 24), 2));
        when(aggregateRepository.findAllById(any())).thenReturn(List.of(firstAgg, secondAgg));

        PageResponse<CubeSummaryDto> result = catalogService.listLive(null, null, null, null, 0, 24);

        assertEquals(2, result.items().size());
        assertEquals(4L, result.items().get(0).reviewCount());
        assertEquals(9L, result.items().get(1).reviewCount());
        verify(aggregateRepository, times(1)).findAllById(any());
        verify(aggregateRepository, never()).findByCubeId(any());
        verify(aggregateRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void listLiveSortByReviewCountUsesAggregateQuery() {
        Cube cube = cube(7L, "Most Reviewed");
        CubeMetricAggregate agg = aggregate(7L, 21);
        when(aggregateRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(agg), PageRequest.of(0, 6), 1));
        when(cubeRepository.findAllById(List.of(7L))).thenReturn(List.of(cube));

        PageResponse<CubeSummaryDto> result =
                catalogService.listLive(null, null, null, "reviewCount", 0, 6);

        assertEquals(1, result.items().size());
        assertEquals(7L, result.items().get(0).id());
        assertEquals(21L, result.items().get(0).reviewCount());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(aggregateRepository).findAll(any(Specification.class), pageableCaptor.capture());
        Sort.Order reviewOrder = pageableCaptor.getValue().getSort().getOrderFor("reviewCount");
        assertTrue(reviewOrder != null && reviewOrder.isDescending());
        verify(cubeRepository, never()).findByStatus(any(), any());
        verify(aggregateRepository, never()).findAllById(any());
        verify(aggregateRepository, never()).findByCubeId(any());
    }

    @Test
    void listLiveDefaultSortOrdersByName() {
        when(cubeRepository.findByStatus(eq(CubeStatus.LIVE), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 24), 0));

        catalogService.listLive(null, null, null, "name", 0, 24);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(cubeRepository).findByStatus(eq(CubeStatus.LIVE), pageableCaptor.capture());
        Sort.Order nameOrder = pageableCaptor.getValue().getSort().getOrderFor("name");
        assertTrue(nameOrder != null && nameOrder.isAscending());
        verify(aggregateRepository, never()).findAllById(any());
        verify(aggregateRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void listLiveRejectsUnknownSort() {
        assertThrows(
                BadRequestException.class,
                () -> catalogService.listLive(null, null, null, "popularity", 0, 6));
        verify(cubeRepository, never()).findByStatus(any(), any());
        verify(aggregateRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void listStagingLoadsAggregatesOnceForThePage() {
        Cube cube = cube(3L, "Staging Cube");
        cube.setStatus(CubeStatus.STAGING);
        when(cubeRepository.findByStatus(eq(CubeStatus.STAGING), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(cube), PageRequest.of(0, 24), 1));
        when(aggregateRepository.findAllById(any())).thenReturn(List.of());

        PageResponse<CubeSummaryDto> result = catalogService.listStaging(0, 24);

        assertEquals(1, result.items().size());
        assertEquals(0L, result.items().get(0).reviewCount());
        verify(aggregateRepository, times(1)).findAllById(any());
        verify(aggregateRepository, never()).findByCubeId(any());
    }

    private static Cube cube(long id, String name) {
        return Cube.builder()
                .id(id)
                .name(name)
                .brand("GAN")
                .type("3x3")
                .status(CubeStatus.LIVE)
                .sourceStore("thecubicle")
                .build();
    }

    private static CubeMetricAggregate aggregate(long cubeId, long reviewCount) {
        CubeMetricAggregate agg = mock(CubeMetricAggregate.class);
        when(agg.getCubeId()).thenReturn(cubeId);
        when(agg.getReviewCount()).thenReturn(reviewCount);
        when(agg.getAvgControllability()).thenReturn(new BigDecimal("8.00"));
        when(agg.getAvgStability()).thenReturn(new BigDecimal("8.00"));
        when(agg.getAvgTurning()).thenReturn(new BigDecimal("8.00"));
        when(agg.getAvgCustomizability()).thenReturn(new BigDecimal("8.00"));
        when(agg.getAvgValue()).thenReturn(new BigDecimal("8.00"));
        when(agg.getAvgOverall()).thenReturn(new BigDecimal("8.00"));
        return agg;
    }
}

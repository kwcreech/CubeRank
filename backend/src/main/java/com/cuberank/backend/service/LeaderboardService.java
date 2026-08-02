package com.cuberank.backend.service;

import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeMetricAggregate;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.leaderboard.BayesianAverage;
import com.cuberank.backend.leaderboard.CubeSortMetric;
import com.cuberank.backend.repository.CubeMetricAggregateRepository;
import com.cuberank.backend.repository.CubeRepository;
import com.cuberank.backend.repository.UserLeaderboardProjection;
import com.cuberank.backend.repository.UserRepository;
import com.cuberank.backend.web.dto.AggregateMetricsDto;
import com.cuberank.backend.web.dto.CubeLeaderboardEntry;
import com.cuberank.backend.web.dto.PageResponse;
import com.cuberank.backend.web.dto.UserLeaderboardEntry;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaderboardService {

    private final CubeMetricAggregateRepository aggregateRepository;
    private final CubeRepository cubeRepository;
    private final UserRepository userRepository;
    private final AppProperties appProperties;

    public LeaderboardService(
            CubeMetricAggregateRepository aggregateRepository,
            CubeRepository cubeRepository,
            UserRepository userRepository,
            AppProperties appProperties) {
        this.aggregateRepository = aggregateRepository;
        this.cubeRepository = cubeRepository;
        this.userRepository = userRepository;
        this.appProperties = appProperties;
    }

    @Transactional(readOnly = true)
    public PageResponse<CubeLeaderboardEntry> cubeLeaderboard(
            String type, String brand, String sortBy, int page, int size) {
        CubeSortMetric metric = CubeSortMetric.fromParam(sortBy);
        int prior = Math.max(appProperties.leaderboard().bayesianPriorStrength(), 0);

        String typeFilter = blankToNull(type);
        String brandFilter = blankToNull(brand);

        List<CubeMetricAggregate> aggregates = aggregateRepository
                .findFiltered(CubeStatus.LIVE, typeFilter, brandFilter)
                .stream()
                .filter(a -> a.getReviewCount() > 0)
                .filter(a -> metric.rawAverage(a) != null)
                .toList();

        double globalMean = weightedGlobalMean(aggregates, metric);
        Map<Long, Cube> cubesById = cubeRepository
                .findAllById(aggregates.stream().map(CubeMetricAggregate::getCubeId).toList())
                .stream()
                .collect(Collectors.toMap(Cube::getId, Function.identity()));

        List<ScoredCube> scored = new ArrayList<>();
        for (CubeMetricAggregate aggregate : aggregates) {
            Cube cube = cubesById.get(aggregate.getCubeId());
            if (cube == null) {
                continue;
            }
            double raw = metric.rawAverage(aggregate).doubleValue();
            double bayesian = BayesianAverage.score(raw, aggregate.getReviewCount(), globalMean, prior);
            scored.add(new ScoredCube(cube, aggregate, raw, bayesian));
        }

        scored.sort(Comparator.comparingDouble(ScoredCube::bayesianScore)
                .reversed()
                .thenComparing(s -> s.cube().getName(), String.CASE_INSENSITIVE_ORDER));

        List<CubeLeaderboardEntry> ranked = new ArrayList<>(scored.size());
        for (int i = 0; i < scored.size(); i++) {
            ScoredCube row = scored.get(i);
            ranked.add(toCubeEntry(i + 1, row));
        }

        return PageResponse.fromList(ranked, page, size);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserLeaderboardEntry> userLeaderboard(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<UserLeaderboardProjection> result =
                userRepository.findReviewCountLeaderboard(PageRequest.of(safePage, safeSize));

        long offsetRankBase = safePage * (long) safeSize;
        List<UserLeaderboardEntry> entries = new ArrayList<>();
        Long previousCount = null;
        int previousRank = 0;

        for (int i = 0; i < result.getContent().size(); i++) {
            UserLeaderboardProjection row = result.getContent().get(i);
            int rank;
            if (previousCount != null && previousCount == row.getReviewCount()) {
                rank = previousRank;
            } else {
                rank = (int) offsetRankBase + i + 1;
            }
            previousCount = row.getReviewCount();
            previousRank = rank;
            entries.add(new UserLeaderboardEntry(
                    rank, row.getId(), row.getUsername(), row.getAvatarUrl(), row.getReviewCount()));
        }

        return new PageResponse<>(
                entries,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    private static double weightedGlobalMean(List<CubeMetricAggregate> aggregates, CubeSortMetric metric) {
        double weightedSum = 0;
        long totalReviews = 0;
        for (CubeMetricAggregate aggregate : aggregates) {
            BigDecimal avg = metric.rawAverage(aggregate);
            if (avg == null || aggregate.getReviewCount() <= 0) {
                continue;
            }
            weightedSum += avg.doubleValue() * aggregate.getReviewCount();
            totalReviews += aggregate.getReviewCount();
        }
        if (totalReviews == 0) {
            return 0;
        }
        return weightedSum / totalReviews;
    }

    private static CubeLeaderboardEntry toCubeEntry(int rank, ScoredCube row) {
        CubeMetricAggregate a = row.aggregate();
        return new CubeLeaderboardEntry(
                rank,
                row.cube().getId(),
                row.cube().getName(),
                row.cube().getBrand(),
                row.cube().getType(),
                row.cube().getImageUrl(),
                a.getReviewCount(),
                BigDecimal.valueOf(row.rawAverage()).setScale(2, RoundingMode.HALF_UP),
                roundScore(row.bayesianScore()),
                new AggregateMetricsDto(
                        a.getAvgSpeed(),
                        a.getAvgStability(),
                        a.getAvgTurning(),
                        a.getAvgCustomizability(),
                        a.getAvgValue(),
                        a.getAvgOverall()));
    }

    private static double roundScore(double score) {
        return BigDecimal.valueOf(score).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private record ScoredCube(Cube cube, CubeMetricAggregate aggregate, double rawAverage, double bayesianScore) {
        private ScoredCube {
            Objects.requireNonNull(cube);
            Objects.requireNonNull(aggregate);
        }
    }
}

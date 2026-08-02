package com.cuberank.backend.web.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    public static <T> PageResponse<T> fromList(List<T> allItems, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        int from = Math.min(safePage * safeSize, allItems.size());
        int to = Math.min(from + safeSize, allItems.size());
        int totalPages = safeSize == 0 ? 0 : (int) Math.ceil(allItems.size() / (double) safeSize);
        return new PageResponse<>(allItems.subList(from, to), safePage, safeSize, allItems.size(), totalPages);
    }
}

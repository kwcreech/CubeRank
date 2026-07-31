package com.cuberank.backend.web;

import com.cuberank.backend.service.CubeCatalogService;
import com.cuberank.backend.web.dto.CubeDetailDto;
import com.cuberank.backend.web.dto.CubeMetaResponse;
import com.cuberank.backend.web.dto.CubeSummaryDto;
import com.cuberank.backend.web.dto.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cubes")
public class CubeController {

    private final CubeCatalogService cubeCatalogService;

    public CubeController(CubeCatalogService cubeCatalogService) {
        this.cubeCatalogService = cubeCatalogService;
    }

    @GetMapping
    public PageResponse<CubeSummaryDto> listLive(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return cubeCatalogService.listLive(type, brand, page, size);
    }

    @GetMapping("/meta")
    public CubeMetaResponse meta() {
        return cubeCatalogService.liveMeta();
    }

    @GetMapping("/{id}")
    public CubeDetailDto getLive(@PathVariable long id) {
        return cubeCatalogService.getLiveCube(id);
    }
}

package com.cuberank.backend.web;

import com.cuberank.backend.service.CubeCatalogService;
import com.cuberank.backend.service.CubeCompareService;
import com.cuberank.backend.web.dto.CubeCompareResponse;
import com.cuberank.backend.web.dto.CubeDetailDto;
import com.cuberank.backend.web.dto.CubeMetaResponse;
import com.cuberank.backend.web.dto.CubePickerDto;
import com.cuberank.backend.web.dto.CubeSummaryDto;
import com.cuberank.backend.web.dto.PageResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cubes")
public class CubeController {

    private final CubeCatalogService cubeCatalogService;
    private final CubeCompareService cubeCompareService;

    public CubeController(CubeCatalogService cubeCatalogService, CubeCompareService cubeCompareService) {
        this.cubeCatalogService = cubeCatalogService;
        this.cubeCompareService = cubeCompareService;
    }

    @GetMapping
    public PageResponse<CubeSummaryDto> listLive(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return cubeCatalogService.listLive(type, brand, q, sort, page, size);
    }

    @GetMapping("/picker")
    public List<CubePickerDto> picker(@RequestParam String type) {
        return cubeCatalogService.listLivePicker(type);
    }

    @GetMapping("/meta")
    public CubeMetaResponse meta() {
        return cubeCatalogService.liveMeta();
    }

    @GetMapping("/compare")
    public CubeCompareResponse compare(@RequestParam long leftId, @RequestParam long rightId) {
        return cubeCompareService.compare(leftId, rightId);
    }

    @GetMapping("/{id}")
    public CubeDetailDto getLive(@PathVariable long id) {
        return cubeCatalogService.getLiveCube(id);
    }
}

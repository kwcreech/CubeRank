package com.cuberank.backend.web;

import com.cuberank.backend.service.CubeCatalogService;
import com.cuberank.backend.web.dto.BulkStagingResult;
import com.cuberank.backend.web.dto.CubeDetailDto;
import com.cuberank.backend.web.dto.CubeSummaryDto;
import com.cuberank.backend.web.dto.PageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cubes")
public class AdminCubeController {

    private final CubeCatalogService cubeCatalogService;

    public AdminCubeController(CubeCatalogService cubeCatalogService) {
        this.cubeCatalogService = cubeCatalogService;
    }

    @GetMapping("/staging")
    public PageResponse<CubeSummaryDto> listStaging(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return cubeCatalogService.listStaging(page, size);
    }

    @PostMapping("/staging/approve-all")
    public BulkStagingResult approveAllStaging() {
        return cubeCatalogService.approveAllStaging();
    }

    @PostMapping("/staging/reject-all")
    public BulkStagingResult rejectAllStaging() {
        return cubeCatalogService.rejectAllStaging();
    }

    @PostMapping("/{id}/approve")
    public CubeDetailDto approve(@PathVariable long id) {
        return cubeCatalogService.approve(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable long id) {
        cubeCatalogService.rejectStaging(id);
    }
}

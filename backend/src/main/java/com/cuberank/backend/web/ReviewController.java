package com.cuberank.backend.web;

import com.cuberank.backend.security.SecurityUtils;
import com.cuberank.backend.service.ReviewService;
import com.cuberank.backend.web.dto.CreateReviewRequest;
import com.cuberank.backend.web.dto.PageResponse;
import com.cuberank.backend.web.dto.ReviewResponse;
import com.cuberank.backend.web.dto.UpdateReviewRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/cube/{cubeId}")
    public PageResponse<ReviewResponse> listByCube(
            @PathVariable long cubeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reviewService.listByCube(cubeId, page, size);
    }

    @GetMapping("/cube/{cubeId}/mine")
    public ReviewResponse mineForCube(@PathVariable long cubeId) {
        return reviewService.getMineForCube(SecurityUtils.requireCurrentUser(), cubeId);
    }

    @GetMapping("/{id}")
    public ReviewResponse getById(@PathVariable long id) {
        return reviewService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@Valid @RequestBody CreateReviewRequest request) {
        return reviewService.create(SecurityUtils.requireCurrentUser(), request);
    }

    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable long id, @Valid @RequestBody UpdateReviewRequest request) {
        return reviewService.update(SecurityUtils.requireCurrentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        reviewService.delete(SecurityUtils.requireCurrentUser(), id);
    }
}

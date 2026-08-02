package com.cuberank.backend.web;

import com.cuberank.backend.service.LeaderboardService;
import com.cuberank.backend.web.dto.CubeLeaderboardEntry;
import com.cuberank.backend.web.dto.PageResponse;
import com.cuberank.backend.web.dto.UserLeaderboardEntry;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboards")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/cubes")
    public PageResponse<CubeLeaderboardEntry> cubes(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(defaultValue = "overall") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return leaderboardService.cubeLeaderboard(type, brand, sortBy, page, size);
    }

    @GetMapping("/users")
    public PageResponse<UserLeaderboardEntry> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return leaderboardService.userLeaderboard(page, size);
    }
}

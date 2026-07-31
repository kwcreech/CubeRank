package com.cuberank.backend.web;

import com.cuberank.backend.security.SecurityUtils;
import com.cuberank.backend.service.UserProfileService;
import com.cuberank.backend.web.dto.MeResponse;
import com.cuberank.backend.web.dto.UpdateMeRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class MeController {

    private final UserProfileService userProfileService;

    public MeController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public MeResponse getMe() {
        return userProfileService.getMe(SecurityUtils.requireCurrentUser());
    }

    @PatchMapping
    public MeResponse updateMe(@Valid @RequestBody UpdateMeRequest request) {
        if (request.username() == null && request.avatarUrl() == null) {
            throw new BadRequestException("Provide username and/or avatarUrl to update");
        }
        return userProfileService.updateMe(SecurityUtils.requireCurrentUser(), request);
    }
}

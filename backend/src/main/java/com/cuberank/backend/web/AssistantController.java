package com.cuberank.backend.web;

import com.cuberank.backend.security.SecurityUtils;
import com.cuberank.backend.service.AssistantService;
import com.cuberank.backend.web.dto.AssistantQueryRequest;
import com.cuberank.backend.web.dto.AssistantQueryResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/query")
    public AssistantQueryResponse query(
            @Valid @RequestBody AssistantQueryRequest request, HttpServletRequest httpRequest) {
        return assistantService.query(SecurityUtils.requireCurrentUser(), request, clientIp(httpRequest));
    }

    static String clientIp(HttpServletRequest request) {
        String addr = request.getRemoteAddr();
        if (!StringUtils.hasText(addr)) {
            return null;
        }
        return addr.trim();
    }
}

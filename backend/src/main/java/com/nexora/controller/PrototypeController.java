package com.nexora.controller;

import com.nexora.model.User;
import com.nexora.security.SecurityUtils;
import com.nexora.service.ProjectService;
import com.nexora.service.dto.PrototypeDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/prototypes")
public class PrototypeController {

    private final ProjectService projectService;
    private final SecurityUtils securityUtils;

    public PrototypeController(ProjectService projectService, SecurityUtils securityUtils) {
        this.projectService = projectService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<java.util.List<PrototypeDto.PrototypeResponse>> getAllPrototypes() {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.getAllPrototypes(user));
    }

    @PostMapping
    public ResponseEntity<PrototypeDto.PrototypeResponse> submitPrototype(
            @RequestBody PrototypeDto.SubmitPrototypeRequest request) {
        User member = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.submitPrototype(request, member));
    }

    @PostMapping("/{id}/manager-review")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<PrototypeDto.PrototypeResponse> managerReview(
            @PathVariable Long id,
            @RequestBody PrototypeDto.ManagerReviewRequest request) {
        User pm = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.managerReviewPrototype(id, request, pm));
    }

    @PostMapping("/{id}/client-review")
    @PreAuthorize("hasAnyRole('ROLE_CLIENT', 'ROLE_ADMIN')")
    public ResponseEntity<PrototypeDto.PrototypeResponse> clientReview(
            @PathVariable Long id,
            @RequestBody PrototypeDto.ClientReviewRequest request) {
        User client = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.clientReviewPrototype(id, request, client));
    }
}

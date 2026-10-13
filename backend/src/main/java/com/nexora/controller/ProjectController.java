package com.nexora.controller;

import com.nexora.model.Milestone;
import com.nexora.model.User;
import com.nexora.model.enums.UserRole;
import com.nexora.security.SecurityUtils;
import com.nexora.service.ProjectService;
import com.nexora.service.dto.ProjectDto;
import com.nexora.service.dto.PrototypeDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final SecurityUtils securityUtils;

    public ProjectController(ProjectService projectService, SecurityUtils securityUtils) {
        this.projectService = projectService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto.ProjectResponse>> getProjects() {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        if (currentUser.getRole() == UserRole.ROLE_ADMIN) {
            return ResponseEntity.ok(projectService.getAllProjects());
        } else if (currentUser.getRole() == UserRole.ROLE_CLIENT) {
            return ResponseEntity.ok(projectService.getProjectsForClient(currentUser.getId()));
        } else if (currentUser.getRole() == UserRole.ROLE_PM) {
            return ResponseEntity.ok(projectService.getProjectsForPm(currentUser.getId()));
        } else {
            // Team member sees ONLY their team's scoped projects!
            return ResponseEntity.ok(projectService.getProjectsForTeamMember(currentUser.getId()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto.ProjectResponse> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectDto.ProjectResponse> submitProject(@RequestBody ProjectDto.ProjectSubmissionRequest request) {
        User client = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.submitProject(request, client));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<ProjectDto.ProjectResponse> reviewProject(
            @PathVariable Long id,
            @RequestBody ProjectDto.ProjectReviewDecision decision) {
        User pm = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.reviewProject(id, decision, pm));
    }

    @PostMapping("/{id}/plan")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<ProjectDto.ProjectResponse> planProject(
            @PathVariable Long id,
            @RequestBody ProjectDto.ProjectPlanningRequest request) {
        User pm = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.planProject(id, request, pm));
    }

    @PostMapping("/{id}/authorize-development")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<ProjectDto.ProjectResponse> authorizeDevelopment(
            @PathVariable Long id,
            @RequestBody ProjectDto.AuthorizeDevelopmentRequest request) {
        User pm = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.authorizeDevelopment(id, request, pm));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<ProjectDto.ProjectResponse> completeProject(@PathVariable Long id) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.completeProject(id, user));
    }

    @PostMapping("/{id}/submit-final")
    public ResponseEntity<ProjectDto.ProjectResponse> submitFinalDelivery(
            @PathVariable Long id,
            @RequestBody ProjectDto.FinalDeliverySubmissionRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.submitFinalDelivery(id, request, user));
    }

    @PostMapping("/{id}/final-review")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<ProjectDto.ProjectResponse> reviewFinalDelivery(
            @PathVariable Long id,
            @RequestBody ProjectDto.FinalReviewDecision decision) {
        User pm = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(projectService.reviewFinalDelivery(id, decision, pm));
    }

    @GetMapping("/{id}/milestones")
    public ResponseEntity<List<Milestone>> getMilestones(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getMilestonesForProject(id));
    }

    @GetMapping("/{id}/prototypes")
    public ResponseEntity<List<PrototypeDto.PrototypeResponse>> getPrototypes(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getPrototypesForProject(id));
    }
}

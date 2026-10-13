package com.nexora.controller;

import com.nexora.model.User;
import com.nexora.security.SecurityUtils;
import com.nexora.service.TeamService;
import com.nexora.service.dto.TeamDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;
    private final SecurityUtils securityUtils;

    public TeamController(TeamService teamService, SecurityUtils securityUtils) {
        this.teamService = teamService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<TeamDto.TeamResponse>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamDto.TeamResponse> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<TeamDto.TeamResponse> createTeam(@RequestBody TeamDto.CreateTeamRequest request) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(teamService.createTeam(request, currentUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<TeamDto.TeamResponse> updateTeam(
            @PathVariable Long id,
            @RequestBody TeamDto.CreateTeamRequest request) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(teamService.updateTeam(id, request, currentUser));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<TeamDto.TeamResponse> addMember(
            @PathVariable Long id,
            @RequestBody TeamDto.AddMemberRequest request) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(teamService.addMember(id, request, currentUser));
    }

    @PutMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<TeamDto.TeamResponse> updateMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestBody TeamDto.AddMemberRequest request) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(teamService.updateMember(id, userId, request, currentUser));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<TeamDto.TeamResponse> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(teamService.removeMember(id, userId, currentUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        teamService.deleteTeam(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{userId}/transfer")
    @PreAuthorize("hasAnyRole('ROLE_PM', 'ROLE_ADMIN')")
    public ResponseEntity<TeamDto.TeamResponse> transferMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestBody TeamDto.TransferMemberRequest request) {
        User currentUser = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(teamService.transferMember(id, userId, request, currentUser));
    }

    @GetMapping("/recommendations/{projectId}")
    public ResponseEntity<List<TeamDto.WorkloadRecommendation>> getRecommendations(@PathVariable Long projectId) {
        return ResponseEntity.ok(teamService.getRecommendationsForProject(projectId));
    }
}

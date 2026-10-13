package com.nexora.controller;

import com.nexora.model.IssueComment;
import com.nexora.model.User;
import com.nexora.security.SecurityUtils;
import com.nexora.service.IssueService;
import com.nexora.service.dto.IssueDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueService issueService;
    private final SecurityUtils securityUtils;

    public IssueController(IssueService issueService, SecurityUtils securityUtils) {
        this.issueService = issueService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<IssueDto.IssueResponse>> getIssues(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long teamId) {
        if (projectId != null) {
            return ResponseEntity.ok(issueService.getIssuesForProject(projectId));
        } else if (assigneeId != null) {
            return ResponseEntity.ok(issueService.getIssuesForUser(assigneeId));
        } else if (teamId != null) {
            return ResponseEntity.ok(issueService.getIssuesForTeam(teamId));
        } else {
            return ResponseEntity.ok(issueService.getAllIssues());
        }
    }

    @PostMapping
    public ResponseEntity<IssueDto.IssueResponse> createIssue(@RequestBody IssueDto.CreateIssueRequest request) {
        User reporter = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(issueService.createIssue(request, reporter));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueDto.IssueResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody IssueDto.UpdateIssueStatusRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(issueService.updateStatus(id, request, user));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IssueDto.IssueResponse> assignIssue(
            @PathVariable Long id,
            @RequestParam(required = false) Long assigneeId,
            @RequestParam(required = false) Long teamId) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(issueService.assignIssue(id, assigneeId, teamId, user));
    }

    @PostMapping("/{id}/verify-qa")
    public ResponseEntity<IssueDto.IssueResponse> verifyQa(
            @PathVariable Long id,
            @RequestBody IssueDto.VerifyQaRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(issueService.verifyQa(id, request, user));
    }

    @PostMapping("/{id}/time-logs")
    public ResponseEntity<?> logTime(
            @PathVariable Long id,
            @RequestBody IssueDto.LogTimeRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        issueService.logTime(id, request, user);
        return ResponseEntity.ok(Map.of("message", "Time logged successfully"));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<IssueComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<IssueComment> addComment(
            @PathVariable Long id,
            @RequestBody IssueDto.AddCommentRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(issueService.addComment(id, request, user));
    }
}

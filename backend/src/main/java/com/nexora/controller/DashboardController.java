package com.nexora.controller;

import com.nexora.model.AuditLog;
import com.nexora.model.Notification;
import com.nexora.model.User;
import com.nexora.security.SecurityUtils;
import com.nexora.service.AuditService;
import com.nexora.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuditService auditService;
    private final SecurityUtils securityUtils;

    public DashboardController(DashboardService dashboardService,
                               AuditService auditService,
                               SecurityUtils securityUtils) {
        this.dashboardService = dashboardService;
        this.auditService = auditService;
        this.securityUtils = securityUtils;
    }

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminMetrics() {
        return ResponseEntity.ok(dashboardService.getAdminDashboardMetrics());
    }

    @GetMapping("/pm")
    public ResponseEntity<Map<String, Object>> getPmMetrics() {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(dashboardService.getPmDashboardMetrics(user.getId()));
    }

    @GetMapping("/client")
    public ResponseEntity<Map<String, Object>> getClientMetrics() {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(dashboardService.getClientDashboardMetrics(user.getId()));
    }

    @GetMapping("/member")
    public ResponseEntity<Map<String, Object>> getMemberMetrics() {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(dashboardService.getTeamMemberDashboardMetrics(user.getId()));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getRecentAuditLogs() {
        return ResponseEntity.ok(auditService.getRecentAuditLogs());
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(auditService.getUserNotifications(user.getId()));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        auditService.markNotificationRead(id);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }
}

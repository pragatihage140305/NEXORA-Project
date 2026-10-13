package com.nexora.service;

import com.nexora.model.AuditLog;
import com.nexora.model.Notification;
import com.nexora.model.User;
import com.nexora.repository.AuditLogRepository;
import com.nexora.repository.NotificationRepository;
import com.nexora.websocket.RealtimeEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final RealtimeEventService realtimeEventService;

    public AuditService(AuditLogRepository auditLogRepository,
                        NotificationRepository notificationRepository,
                        RealtimeEventService realtimeEventService) {
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
        this.realtimeEventService = realtimeEventService;
    }

    @Transactional
    public AuditLog logAction(User user, String action, String entityType, Long entityId, String details, String ipAddress) {
        AuditLog log = new AuditLog(user, action, entityType, entityId, details, ipAddress);
        AuditLog saved = auditLogRepository.save(log);
        realtimeEventService.broadcastOrgEvent("AUDIT_LOG_CREATED", saved);
        return saved;
    }

    @Transactional
    public Notification sendNotification(User recipient, String title, String message, String type, String link) {
        Notification notification = new Notification(recipient, title, message, type, link);
        Notification saved = notificationRepository.save(notification);
        realtimeEventService.sendUserEvent(recipient.getId(), "NOTIFICATION_RECEIVED", saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markNotificationRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
}

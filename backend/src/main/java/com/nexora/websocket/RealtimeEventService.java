package com.nexora.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class RealtimeEventService {

    private final SimpMessagingTemplate messagingTemplate;

    public RealtimeEventService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastOrgEvent(String type, Object payload) {
        messagingTemplate.convertAndSend("/topic/organization", Map.of(
                "type", type,
                "timestamp", System.currentTimeMillis(),
                "payload", payload
        ));
    }

    public void broadcastProjectEvent(Long projectId, String type, Object payload) {
        messagingTemplate.convertAndSend("/topic/project/" + projectId, Map.of(
                "type", type,
                "projectId", projectId,
                "timestamp", System.currentTimeMillis(),
                "payload", payload
        ));
        // Also ping organization stream for dashboard overview cards
        broadcastOrgEvent(type, payload);
    }

    public void broadcastTeamEvent(Long teamId, String type, Object payload) {
        messagingTemplate.convertAndSend("/topic/team/" + teamId, Map.of(
                "type", type,
                "teamId", teamId,
                "timestamp", System.currentTimeMillis(),
                "payload", payload
        ));
    }

    public void sendUserEvent(Long userId, String type, Object payload) {
        messagingTemplate.convertAndSend("/topic/user/" + userId, Map.of(
                "type", type,
                "userId", userId,
                "timestamp", System.currentTimeMillis(),
                "payload", payload
        ));
    }
}

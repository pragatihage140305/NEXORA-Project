package com.nexora.service.dto;

import com.nexora.model.PrototypeVersion;
import com.nexora.model.enums.PrototypeStatus;

public class PrototypeDto {

    public record SubmitPrototypeRequest(
            Long projectId,
            String versionNumber,
            String title,
            String previewUrl,
            String description,
            String featuresCovered,
            String knownLimitations,
            String screenshotsJson
    ) {}

    public record ManagerReviewRequest(
            String decision, // APPROVE_FOR_CLIENT, REQUEST_CHANGES
            String comments
    ) {}

    public record ClientReviewRequest(
            String decision, // APPROVE, REQUEST_CHANGES, REJECT
            String comments
    ) {}

    public record PrototypeResponse(
            Long id,
            Long projectId,
            String projectTitle,
            String projectCode,
            String versionNumber,
            String title,
            String previewUrl,
            String description,
            String featuresCovered,
            String knownLimitations,
            String screenshotsJson,
            PrototypeStatus status,
            Long submittedById,
            String submittedByName,
            String submittedAt,
            String managerReviewComments,
            String managerReviewedByName,
            String managerReviewedAt,
            String clientReviewComments,
            String clientReviewedByName,
            String clientReviewedAt
    ) {
        public static PrototypeResponse from(PrototypeVersion p) {
            return new PrototypeResponse(
                    p.getId(),
                    p.getProject().getId(),
                    p.getProject().getTitle(),
                    p.getProject().getProjectCode(),
                    p.getVersionNumber(),
                    p.getTitle(),
                    p.getPreviewUrl(),
                    p.getDescription(),
                    p.getFeaturesCovered(),
                    p.getKnownLimitations(),
                    p.getScreenshotsJson(),
                    p.getStatus(),
                    p.getSubmittedBy() != null ? p.getSubmittedBy().getId() : null,
                    p.getSubmittedBy() != null ? p.getSubmittedBy().getName() : null,
                    p.getSubmittedAt() != null ? p.getSubmittedAt().toString() : null,
                    p.getManagerReviewComments(),
                    p.getManagerReviewedBy() != null ? p.getManagerReviewedBy().getName() : null,
                    p.getManagerReviewedAt() != null ? p.getManagerReviewedAt().toString() : null,
                    p.getClientReviewComments(),
                    p.getClientReviewedBy() != null ? p.getClientReviewedBy().getName() : null,
                    p.getClientReviewedAt() != null ? p.getClientReviewedAt().toString() : null
            );
        }
    }
}

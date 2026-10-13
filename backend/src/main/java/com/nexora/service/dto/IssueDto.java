package com.nexora.service.dto;

import com.nexora.model.TaskIssue;
import com.nexora.model.enums.IssueStatus;
import com.nexora.model.enums.IssueType;
import com.nexora.model.enums.Priority;

import java.time.LocalDate;

public class IssueDto {

    public record CreateIssueRequest(
            Long projectId,
            Long milestoneId,
            String title,
            String description,
            IssueType type,
            Priority priority,
            Long assigneeId,
            Long teamId,
            LocalDate dueDate,
            Double estimatedHours,
            String labels
    ) {}

    public record UpdateIssueStatusRequest(
            IssueStatus status,
            String blockerReason
    ) {}

    public record VerifyQaRequest(
            boolean qaPassed,
            String qaNotes
    ) {}

    public record AddCommentRequest(
            String message,
            String attachmentUrl
    ) {}

    public record LogTimeRequest(
            Double hoursLogged,
            LocalDate workDate,
            String description
    ) {}

    public record IssueResponse(
            Long id,
            String issueKey,
            Long projectId,
            String projectTitle,
            String projectCode,
            Long milestoneId,
            String milestoneTitle,
            String title,
            String description,
            IssueType type,
            Priority priority,
            IssueStatus status,
            Long reporterId,
            String reporterName,
            Long assigneeId,
            String assigneeName,
            Long teamId,
            String teamName,
            LocalDate dueDate,
            Double estimatedHours,
            Double loggedHours,
            String labels,
            String blockerReason,
            boolean qaPassed,
            String qaVerifiedByName,
            String qaVerifiedAt,
            String qaNotes,
            String attachmentUrl,
            String createdAt,
            String updatedAt
    ) {
        public static IssueResponse from(TaskIssue i) {
            return new IssueResponse(
                    i.getId(),
                    i.getIssueKey(),
                    i.getProject().getId(),
                    i.getProject().getTitle(),
                    i.getProject().getProjectCode(),
                    i.getMilestone() != null ? i.getMilestone().getId() : null,
                    i.getMilestone() != null ? i.getMilestone().getTitle() : null,
                    i.getTitle(),
                    i.getDescription(),
                    i.getType(),
                    i.getPriority(),
                    i.getStatus(),
                    i.getReporter() != null ? i.getReporter().getId() : null,
                    i.getReporter() != null ? i.getReporter().getName() : null,
                    i.getAssignee() != null ? i.getAssignee().getId() : null,
                    i.getAssignee() != null ? i.getAssignee().getName() : null,
                    i.getTeam() != null ? i.getTeam().getId() : null,
                    i.getTeam() != null ? i.getTeam().getName() : null,
                    i.getDueDate(),
                    i.getEstimatedHours(),
                    i.getLoggedHours(),
                    i.getLabels(),
                    i.getBlockerReason(),
                    i.isQaPassed(),
                    i.getQaVerifiedBy() != null ? i.getQaVerifiedBy().getName() : null,
                    i.getQaVerifiedAt() != null ? i.getQaVerifiedAt().toString() : null,
                    i.getQaNotes(),
                    i.getAttachmentUrl(),
                    i.getCreatedAt().toString(),
                    i.getUpdatedAt().toString()
            );
        }
    }
}

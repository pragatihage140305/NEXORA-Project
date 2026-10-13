package com.nexora.service.dto;

import com.nexora.model.Project;
import com.nexora.model.enums.Priority;
import com.nexora.model.enums.ProjectStage;

import java.time.LocalDate;
import java.util.List;

public class ProjectDto {

    public record ProjectSubmissionRequest(
            String title,
            String description,
            String businessObjective,
            String expectedFeatures,
            String requirements,
            Double proposedBudget,
            String currency,
            LocalDate plannedStartDate,
            LocalDate plannedEndDate,
            Priority priority,
            String referenceDocuments,
            String additionalNotes
    ) {}

    public record ProjectReviewDecision(
            String decision, // ACCEPTED, REJECTED, NEEDS_INFORMATION
            String reviewComments,
            Long assignedPmId,
            Long assignedTeamId,
            LocalDate prototypeDeadline,
            String prototypeInstructions
    ) {}

    public record ProjectPlanningRequest(
            String description,
            String businessObjective,
            String expectedFeatures,
            String requirements,
            Double approvedBudget,
            LocalDate plannedStartDate,
            LocalDate plannedEndDate,
            Long primaryTeamId,
            List<Long> associatedTeamIds,
            Double estimatedHours,
            List<MilestoneInput> milestones
    ) {}

    public record MilestoneInput(
            String title,
            String description,
            LocalDate targetDate,
            Integer sequenceOrder
    ) {}

    public record AuthorizeDevelopmentRequest(
            LocalDate actualStartDate,
            LocalDate forecastEndDate,
            String developmentNotes,
            Long confirmedTeamId
    ) {}

    public record FinalDeliverySubmissionRequest(
            String deliverableNotes,
            String deploymentUrl
    ) {}

    public record FinalReviewDecision(
            String decision, // APPROVE_FINAL_PROJECT, REJECT, REQUEST_CHANGES
            String reviewComments
    ) {}

    public record ProjectResponse(
            Long id,
            String title,
            String projectCode,
            String description,
            String businessObjective,
            String expectedFeatures,
            String requirements,
            Long clientId,
            String clientName,
            String clientEmail,
            Long projectManagerId,
            String projectManagerName,
            Long primaryTeamId,
            String primaryTeamName,
            ProjectStage stage,
            Priority priority,
            Double proposedBudget,
            Double approvedBudget,
            String currency,
            LocalDate plannedStartDate,
            LocalDate actualStartDate,
            LocalDate plannedEndDate,
            LocalDate forecastEndDate,
            LocalDate actualEndDate,
            Double estimatedHours,
            Double actualLoggedHours,
            Integer progressPercentage,
            String developmentAuthorizedAt,
            String developmentAuthorizedByName,
            String developmentNotes,
            String delayReason,
            String referenceDocuments,
            boolean archived,
            String createdAt,
            long openIssuesCount,
            long blockedIssuesCount,
            boolean hasApprovedPrototype,
            String finalDeliverableNotes,
            String deploymentUrl,
            String finalReviewStatus,
            String finalSubmittedAt,
            String finalSubmittedByName,
            String finalReviewedAt,
            String finalReviewedByName,
            String finalReviewComments
    ) {}
}

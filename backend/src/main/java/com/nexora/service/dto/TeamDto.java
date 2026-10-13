package com.nexora.service.dto;

import com.nexora.model.Team;
import com.nexora.model.TeamMember;

import java.util.List;

public class TeamDto {

    public record CreateTeamRequest(
            String name,
            String code,
            String description,
            Long teamLeadId,
            String skills,
            Double weeklyCapacityHours,
            String notes,
            List<MemberAssignment> initialMembers
    ) {}

    public record MemberAssignment(
            Long userId,
            String teamRole,
            Double allocatedHoursPerWeek
    ) {}

    public record AddMemberRequest(
            Long userId,
            String teamRole,
            Double allocatedHoursPerWeek
    ) {}

    public record TransferMemberRequest(
            Long targetTeamId,
            String newTeamRole,
            Double allocatedHoursPerWeek,
            String taskResolutionPlan
    ) {}

    public record TeamMemberResponse(
            Long id,
            Long userId,
            String userName,
            String userEmail,
            String userJobTitle,
            String teamRole,
            Double allocatedHoursPerWeek,
            String joinedAt
    ) {
        public static TeamMemberResponse from(TeamMember tm) {
            return new TeamMemberResponse(
                    tm.getId(),
                    tm.getUser().getId(),
                    tm.getUser().getName(),
                    tm.getUser().getEmail(),
                    tm.getUser().getJobTitle(),
                    tm.getTeamRole(),
                    tm.getAllocatedHoursPerWeek(),
                    tm.getJoinedAt().toString()
            );
        }
    }

    public record TeamResponse(
            Long id,
            String name,
            String code,
            String description,
            Long teamLeadId,
            String teamLeadName,
            String skills,
            Double weeklyCapacityHours,
            String availabilityStatus,
            String notes,
            boolean active,
            int memberCount,
            List<TeamMemberResponse> members,
            // Workload metrics calculated in real-time
            Double activeAssignedHours,
            Double workloadPercentage,
            long activeTasksCount,
            long overdueTasksCount,
            long blockedTasksCount,
            long assignedProjectsCount,
            String teamStatus
    ) {}

    public record WorkloadRecommendation(
            Long teamId,
            String teamName,
            String teamCode,
            Double currentWorkloadPercentage,
            Double availableCapacityHours,
            int skillsMatchScore, // 0 to 100%
            long activeTasksCount,
            long blockedTasksCount,
            long overdueTasksCount,
            boolean isRecommended,
            String recommendationReason
    ) {}
}

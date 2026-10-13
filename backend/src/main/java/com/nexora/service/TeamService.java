package com.nexora.service;

import com.nexora.model.Project;
import com.nexora.model.Team;
import com.nexora.model.TeamMember;
import com.nexora.model.User;
import com.nexora.repository.ProjectRepository;
import com.nexora.repository.TaskIssueRepository;
import com.nexora.repository.TeamMemberRepository;
import com.nexora.repository.TeamRepository;
import com.nexora.repository.UserRepository;
import com.nexora.service.dto.TeamDto;
import com.nexora.websocket.RealtimeEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TaskIssueRepository taskIssueRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    private final RealtimeEventService realtimeEventService;

    public TeamService(TeamRepository teamRepository,
                       TeamMemberRepository teamMemberRepository,
                       UserRepository userRepository,
                       TaskIssueRepository taskIssueRepository,
                       ProjectRepository projectRepository,
                       AuditService auditService,
                       RealtimeEventService realtimeEventService) {
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.taskIssueRepository = taskIssueRepository;
        this.projectRepository = projectRepository;
        this.auditService = auditService;
        this.realtimeEventService = realtimeEventService;
    }

    @Transactional
    public TeamDto.TeamResponse createTeam(TeamDto.CreateTeamRequest request, User currentUser) {
        String code = request.code();
        if (code == null || code.isBlank()) {
            code = generateTeamCode(request.name());
        }
        if (teamRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Team code '" + code + "' already exists. Please choose a unique code.");
        }

        User teamLead = null;
        if (request.teamLeadId() != null) {
            teamLead = userRepository.findById(request.teamLeadId())
                    .orElseThrow(() -> new IllegalArgumentException("Team lead user not found"));
        }

        Team team = new Team(
                request.name(),
                code.toUpperCase().trim(),
                request.description(),
                teamLead,
                request.skills(),
                request.weeklyCapacityHours()
        );
        team.setNotes(request.notes());

        Team savedTeam = teamRepository.save(team);

        if (request.initialMembers() != null && !request.initialMembers().isEmpty()) {
            for (TeamDto.MemberAssignment ma : request.initialMembers()) {
                User memberUser = userRepository.findById(ma.userId())
                        .orElseThrow(() -> new IllegalArgumentException("User not found: " + ma.userId()));
                TeamMember tm = new TeamMember(savedTeam, memberUser, ma.teamRole(), ma.allocatedHoursPerWeek());
                savedTeam.addMember(tm);
            }
            savedTeam = teamRepository.save(savedTeam);
        }

        auditService.logAction(currentUser, "CREATE_TEAM", "TEAM", savedTeam.getId(),
                "Created team: " + savedTeam.getName() + " [" + savedTeam.getCode() + "]", null);

        realtimeEventService.broadcastOrgEvent("TEAM_CREATED", savedTeam.getId());

        return getTeamResponse(savedTeam);
    }

    @Transactional
    public TeamDto.TeamResponse updateTeam(Long teamId, TeamDto.CreateTeamRequest request, User currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        team.setName(request.name());
        team.setDescription(request.description());
        team.setSkills(request.skills());
        if (request.weeklyCapacityHours() != null) {
            team.setWeeklyCapacityHours(request.weeklyCapacityHours());
        }
        team.setNotes(request.notes());

        if (request.teamLeadId() != null) {
            User lead = userRepository.findById(request.teamLeadId())
                    .orElseThrow(() -> new IllegalArgumentException("Team lead not found"));
            team.setTeamLead(lead);
        }

        Team saved = teamRepository.save(team);
        auditService.logAction(currentUser, "UPDATE_TEAM", "TEAM", saved.getId(), "Updated team: " + saved.getName(), null);
        realtimeEventService.broadcastTeamEvent(saved.getId(), "TEAM_UPDATED", saved.getId());

        return getTeamResponse(saved);
    }

    @Transactional
    public TeamDto.TeamResponse addMember(Long teamId, TeamDto.AddMemberRequest request, User currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.userId()));

        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, user.getId())) {
            throw new IllegalArgumentException("User is already a member of this team");
        }

        TeamMember tm = new TeamMember(team, user, request.teamRole(), request.allocatedHoursPerWeek());
        team.addMember(tm);
        teamRepository.save(team);

        // Adjust capacity automatically if needed
        double updatedCapacity = team.getMembers().stream()
                .mapToDouble(m -> m.getAllocatedHoursPerWeek() != null ? m.getAllocatedHoursPerWeek() : 40.0)
                .sum();
        team.setWeeklyCapacityHours(updatedCapacity);
        teamRepository.save(team);

        auditService.logAction(currentUser, "ADD_TEAM_MEMBER", "TEAM", team.getId(),
                "Added user " + user.getName() + " as " + request.teamRole(), null);
        auditService.sendNotification(user, "Added to Team", "You have been added to team " + team.getName() + " as " + request.teamRole(), "TEAM_ASSIGNMENT", "/teams");

        realtimeEventService.broadcastTeamEvent(team.getId(), "TEAM_MEMBER_ADDED", user.getId());

        return getTeamResponse(team);
    }

    @Transactional
    public TeamDto.TeamResponse removeMember(Long teamId, Long userId, User currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        // Check if user has active tasks in this team
        long activeTasks = taskIssueRepository.findActiveByAssigneeId(userId).stream()
                .filter(i -> i.getTeam() != null && i.getTeam().getId().equals(teamId))
                .count();

        if (activeTasks > 0) {
            throw new IllegalStateException("Cannot remove member: User has " + activeTasks + " active unresolved tasks assigned under this team. Reassign tasks before removing.");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in team"));

        team.removeMember(member);
        teamMemberRepository.delete(member);

        double updatedCapacity = team.getMembers().stream()
                .mapToDouble(m -> m.getAllocatedHoursPerWeek() != null ? m.getAllocatedHoursPerWeek() : 40.0)
                .sum();
        team.setWeeklyCapacityHours(Math.max(updatedCapacity, 40.0));
        teamRepository.save(team);

        auditService.logAction(currentUser, "REMOVE_TEAM_MEMBER", "TEAM", teamId, "Removed user ID " + userId + " from team", null);
        realtimeEventService.broadcastTeamEvent(teamId, "TEAM_MEMBER_REMOVED", userId);

        return getTeamResponse(team);
    }

    @Transactional
    public TeamDto.TeamResponse updateMember(Long teamId, Long userId, TeamDto.AddMemberRequest request, User currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in team"));

        if (request.teamRole() != null && !request.teamRole().isBlank()) {
            member.setTeamRole(request.teamRole());
        }
        if (request.allocatedHoursPerWeek() != null && request.allocatedHoursPerWeek() > 0) {
            member.setAllocatedHoursPerWeek(request.allocatedHoursPerWeek());
        }

        teamMemberRepository.save(member);

        double updatedCapacity = team.getMembers().stream()
                .mapToDouble(m -> m.getAllocatedHoursPerWeek() != null ? m.getAllocatedHoursPerWeek() : 40.0)
                .sum();
        team.setWeeklyCapacityHours(Math.max(updatedCapacity, 40.0));
        teamRepository.save(team);

        auditService.logAction(currentUser, "UPDATE_TEAM_MEMBER", "TEAM", teamId,
                "Updated member " + member.getUser().getName() + " role to " + member.getTeamRole(), null);
        realtimeEventService.broadcastTeamEvent(teamId, "TEAM_MEMBER_UPDATED", userId);

        return getTeamResponse(team);
    }

    @Transactional
    public void deleteTeam(Long teamId, User currentUser) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        // Check if team has active projects assigned
        long activeProjects = projectRepository.findByPrimaryTeamId(teamId).stream()
                .filter(p -> !p.isArchived() && !"COMPLETED".equalsIgnoreCase(p.getStage().name()))
                .count();

        if (activeProjects > 0) {
            throw new IllegalStateException("Cannot delete team '" + team.getName() + "': " + activeProjects +
                    " active project(s) are currently assigned to this team. Please reassign these projects before deleting the team.");
        }

        // Check if active tasks exist
        var activeTasks = taskIssueRepository.findActiveByTeamId(teamId);
        if (!activeTasks.isEmpty()) {
            throw new IllegalStateException("Cannot delete team '" + team.getName() + "': There are " +
                    activeTasks.size() + " active task(s) assigned under this team. Please resolve or reassign tasks before deleting.");
        }

        // Disassociate any completed/archived projects
        var allAssigned = projectRepository.findByPrimaryTeamId(teamId);
        for (var p : allAssigned) {
            p.setPrimaryTeam(null);
            projectRepository.save(p);
        }

        auditService.logAction(currentUser, "DELETE_TEAM", "TEAM", teamId,
                "Deleted team: " + team.getName() + " [" + team.getCode() + "]", null);

        teamRepository.delete(team);
        realtimeEventService.broadcastOrgEvent("TEAM_DELETED", teamId);
    }

    @Transactional
    public TeamDto.TeamResponse transferMember(Long sourceTeamId, Long userId, TeamDto.TransferMemberRequest request, User currentUser) {
        Team sourceTeam = teamRepository.findById(sourceTeamId)
                .orElseThrow(() -> new IllegalArgumentException("Source team not found"));
        Team targetTeam = teamRepository.findById(request.targetTeamId())
                .orElseThrow(() -> new IllegalArgumentException("Target team not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Remove from source (ignore task block if resolution plan provided)
        TeamMember sourceMember = teamMemberRepository.findByTeamIdAndUserId(sourceTeamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User is not in source team"));

        sourceTeam.removeMember(sourceMember);
        teamMemberRepository.delete(sourceMember);

        TeamMember targetMember = new TeamMember(targetTeam, user, request.newTeamRole(), request.allocatedHoursPerWeek());
        targetTeam.addMember(targetMember);
        teamRepository.save(targetTeam);

        auditService.logAction(currentUser, "TRANSFER_TEAM_MEMBER", "TEAM", targetTeam.getId(),
                "Transferred " + user.getName() + " from " + sourceTeam.getName() + " to " + targetTeam.getName() + ". Resolution plan: " + request.taskResolutionPlan(), null);

        realtimeEventService.broadcastTeamEvent(sourceTeamId, "TEAM_MEMBER_TRANSFERRED", userId);
        realtimeEventService.broadcastTeamEvent(targetTeam.getId(), "TEAM_MEMBER_TRANSFERRED", userId);

        return getTeamResponse(targetTeam);
    }

    @Transactional(readOnly = true)
    public List<TeamDto.TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::getTeamResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamDto.TeamResponse getTeamById(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));
        return getTeamResponse(team);
    }

    /**
     * Intelligent Team Workload Recommendation Algorithm:
     * Calculates assigned active tasks, remaining estimated hours, available capacity hours,
     * current workload percentage = (remaining estimated hours / available capacity) * 100,
     * skills match score against project requirements, overdue tasks, blocked tasks.
     */
    @Transactional(readOnly = true)
    public List<TeamDto.WorkloadRecommendation> getRecommendationsForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        String requiredSkills = (project.getRequirements() != null ? project.getRequirements() : "") + " " +
                                (project.getExpectedFeatures() != null ? project.getExpectedFeatures() : "");
        Set<String> projectTokens = tokenizeSkills(requiredSkills);

        List<Team> allTeams = teamRepository.findByActiveTrue();
        List<TeamDto.WorkloadRecommendation> recommendations = new ArrayList<>();

        for (Team team : allTeams) {
            Double activeHours = taskIssueRepository.sumEstimatedHoursActiveByTeamId(team.getId());
            if (activeHours == null) activeHours = 0.0;

            double capacity = team.getWeeklyCapacityHours() != null && team.getWeeklyCapacityHours() > 0
                    ? team.getWeeklyCapacityHours() : 160.0;

            double workloadPercentage = Math.round((activeHours / capacity) * 1000.0) / 10.0;
            double availableCapacity = Math.max(0, capacity - activeHours);

            var activeTasks = taskIssueRepository.findActiveByTeamId(team.getId());
            long activeTasksCount = activeTasks.size();
            long blockedCount = activeTasks.stream().filter(t -> "BLOCKED".equalsIgnoreCase(t.getStatus().name())).count();
            long overdueCount = activeTasks.stream().filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())).count();

            // Calculate skills match score
            int matchScore = calculateSkillsMatch(team.getSkills(), projectTokens);

            // Decision logic
            boolean isRecommended = false;
            StringBuilder reason = new StringBuilder();

            if (workloadPercentage < 80.0 && matchScore >= 40 && blockedCount == 0) {
                isRecommended = true;
                reason.append("Optimal Choice: Workload is balanced (").append(workloadPercentage).append("%), ")
                      .append(matchScore).append("% skills match, and zero blocked tasks.");
            } else if (workloadPercentage >= 85.0) {
                reason.append("High Workload (").append(workloadPercentage).append("%): Team is near or exceeding capacity.");
            } else if (blockedCount > 0) {
                reason.append("Active Blockers: Team currently has ").append(blockedCount).append(" blocked issues.");
            } else {
                reason.append("Moderate Match: Workload at ").append(workloadPercentage).append("%, skills match score ").append(matchScore).append("%.");
            }

            recommendations.add(new TeamDto.WorkloadRecommendation(
                    team.getId(),
                    team.getName(),
                    team.getCode(),
                    workloadPercentage,
                    availableCapacity,
                    matchScore,
                    activeTasksCount,
                    blockedCount,
                    overdueCount,
                    isRecommended,
                    reason.toString()
            ));
        }

        // Sort by recommended first, then lowest workload, then highest skills match
        recommendations.sort(Comparator
                .comparing(TeamDto.WorkloadRecommendation::isRecommended).reversed()
                .thenComparing(TeamDto.WorkloadRecommendation::currentWorkloadPercentage)
                .thenComparing(Comparator.comparing(TeamDto.WorkloadRecommendation::skillsMatchScore).reversed()));

        return recommendations;
    }

    private TeamDto.TeamResponse getTeamResponse(Team team) {
        Double activeHours = taskIssueRepository.sumEstimatedHoursActiveByTeamId(team.getId());
        if (activeHours == null) activeHours = 0.0;

        double capacity = team.getWeeklyCapacityHours() != null && team.getWeeklyCapacityHours() > 0
                ? team.getWeeklyCapacityHours() : 160.0;
        double workloadPercentage = Math.round((activeHours / capacity) * 1000.0) / 10.0;

        var activeTasks = taskIssueRepository.findActiveByTeamId(team.getId());
        long activeCount = activeTasks.size();
        long blockedCount = activeTasks.stream().filter(t -> "BLOCKED".equalsIgnoreCase(t.getStatus().name())).count();
        long overdueCount = activeTasks.stream().filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())).count();

        List<TeamDto.TeamMemberResponse> members = team.getMembers().stream()
                .map(TeamDto.TeamMemberResponse::from)
                .collect(Collectors.toList());

        long assignedProjectsCount = projectRepository.findByPrimaryTeamId(team.getId()).stream()
                .filter(p -> !p.isArchived())
                .count();
        String teamStatus = assignedProjectsCount > 0 ? "Active" : "Empty";

        String availabilityStatus = workloadPercentage < 40.0
                ? "Available"
                : workloadPercentage < 85.0
                ? "Partially Occupied"
                : "Fully Occupied";
        team.setAvailabilityStatus(availabilityStatus);

        return new TeamDto.TeamResponse(
                team.getId(),
                team.getName(),
                team.getCode(),
                team.getDescription(),
                team.getTeamLead() != null ? team.getTeamLead().getId() : null,
                team.getTeamLead() != null ? team.getTeamLead().getName() : "Unassigned",
                team.getSkills(),
                team.getWeeklyCapacityHours(),
                availabilityStatus,
                team.getNotes(),
                team.isActive(),
                team.getMembers().size(),
                members,
                activeHours,
                workloadPercentage,
                activeCount,
                overdueCount,
                blockedCount,
                assignedProjectsCount,
                teamStatus
        );
    }

    private String generateTeamCode(String teamName) {
        if (teamName == null || teamName.isBlank()) return "TEAM-" + System.currentTimeMillis() % 1000;
        String clean = teamName.replaceAll("[^a-zA-Z0-9]", " ").trim();
        String[] parts = clean.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                sb.append(part.substring(0, Math.min(part.length(), 3)).toUpperCase());
            }
        }
        if (sb.length() < 3) sb.append("-TEAM");
        String candidate = sb.toString();
        if (candidate.length() > 8) candidate = candidate.substring(0, 8);
        int suffix = 1;
        while (teamRepository.existsByCode(candidate + "-" + suffix)) {
            suffix++;
        }
        return candidate + "-" + suffix;
    }

    private Set<String> tokenizeSkills(String text) {
        if (text == null) return Collections.emptySet();
        return Arrays.stream(text.toLowerCase().split("[,;\\s\\n\\r]+"))
                .map(String::trim)
                .filter(s -> s.length() > 2)
                .collect(Collectors.toSet());
    }

    private int calculateSkillsMatch(String teamSkills, Set<String> projectTokens) {
        if (teamSkills == null || teamSkills.isBlank() || projectTokens.isEmpty()) return 50; // default baseline
        Set<String> teamTokens = tokenizeSkills(teamSkills);
        long matches = teamTokens.stream().filter(projectTokens::contains).count();
        if (matches >= 3) return 95;
        if (matches == 2) return 80;
        if (matches == 1) return 65;
        return 50;
    }
}

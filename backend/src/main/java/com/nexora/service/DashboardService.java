package com.nexora.service;

import com.nexora.model.*;
import com.nexora.model.enums.*;
import com.nexora.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskIssueRepository taskIssueRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final PrototypeVersionRepository prototypeRepository;
    private final ProjectReportRepository reportRepository;
    private final BudgetExpenseRepository expenseRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardService(ProjectRepository projectRepository,
                            TaskIssueRepository taskIssueRepository,
                            TeamRepository teamRepository,
                            UserRepository userRepository,
                            PrototypeVersionRepository prototypeRepository,
                            ProjectReportRepository reportRepository,
                            BudgetExpenseRepository expenseRepository,
                            AuditLogRepository auditLogRepository) {
        this.projectRepository = projectRepository;
        this.taskIssueRepository = taskIssueRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.prototypeRepository = prototypeRepository;
        this.reportRepository = reportRepository;
        this.expenseRepository = expenseRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminDashboardMetrics() {
        Map<String, Object> m = new HashMap<>();

        List<Project> allProjects = projectRepository.findByArchivedFalse();
        m.put("totalProjects", allProjects.size());
        m.put("activeProjects", allProjects.stream().filter(p -> p.getStage() == ProjectStage.IN_DEVELOPMENT || p.getStage() == ProjectStage.PROTOTYPE_IN_PROGRESS).count());
        m.put("completedProjects", allProjects.stream().filter(p -> p.getStage() == ProjectStage.COMPLETED).count());
        m.put("planningProjects", allProjects.stream().filter(p -> p.getStage() == ProjectStage.PLANNING || p.getStage() == ProjectStage.SUBMITTED).count());
        m.put("delayedProjects", allProjects.stream().filter(p -> p.getForecastEndDate() != null && p.getPlannedEndDate() != null && p.getForecastEndDate().isAfter(p.getPlannedEndDate())).count());

        m.put("totalClients", userRepository.countByRole(UserRole.ROLE_CLIENT));
        m.put("totalProjectManagers", userRepository.countByRole(UserRole.ROLE_PM));
        m.put("totalTeamMembers", userRepository.countByRole(UserRole.ROLE_TEAM_MEMBER));
        m.put("totalTeams", teamRepository.count());

        List<TaskIssue> allIssues = taskIssueRepository.findAll();
        m.put("totalIssues", allIssues.size());
        m.put("openIssues", allIssues.stream().filter(i -> i.getStatus() == IssueStatus.OPEN || i.getStatus() == IssueStatus.TODO).count());
        m.put("inProgressIssues", allIssues.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count());
        m.put("blockedIssues", allIssues.stream().filter(i -> i.getStatus() == IssueStatus.BLOCKED).count());
        m.put("resolvedIssues", allIssues.stream().filter(i -> i.getStatus() == IssueStatus.RESOLVED || i.getStatus() == IssueStatus.CLOSED).count());
        m.put("criticalIssues", allIssues.stream().filter(i -> i.getPriority() == Priority.CRITICAL && i.getStatus() != IssueStatus.RESOLVED && i.getStatus() != IssueStatus.CLOSED).count());
        m.put("overdueIssues", allIssues.stream().filter(i -> i.getDueDate() != null && i.getDueDate().isBefore(LocalDate.now()) && i.getStatus() != IssueStatus.RESOLVED && i.getStatus() != IssueStatus.CLOSED).count());

        m.put("prototypesAwaitingApproval", prototypeRepository.countByStatus(PrototypeStatus.AWAITING_CLIENT_APPROVAL));
        m.put("prototypesApproved", prototypeRepository.countByStatus(PrototypeStatus.CLIENT_APPROVED));

        double totalBudget = allProjects.stream().mapToDouble(p -> p.getApprovedBudget() != null ? p.getApprovedBudget() : 0.0).sum();
        Double totalExpenses = expenseRepository.sumTotalOrganizationExpenses();
        m.put("totalApprovedBudget", totalBudget);
        m.put("totalRecordedExpenses", totalExpenses != null ? totalExpenses : 0.0);

        m.put("totalReportsGenerated", reportRepository.count());
        m.put("recentAuditLogs", auditLogRepository.findTop50ByOrderByTimestampDesc().stream().limit(8).collect(Collectors.toList()));

        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPmDashboardMetrics(Long pmId) {
        Map<String, Object> m = new HashMap<>();

        List<Project> pmProjects = projectRepository.findByProjectManagerId(pmId).stream()
                .filter(p -> !p.isArchived()).collect(Collectors.toList());

        m.put("totalAssignedProjects", pmProjects.size());
        m.put("projectsAwaitingReview", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.SUBMITTED || p.getStage() == ProjectStage.UNDER_REVIEW).count());
        m.put("projectsInPlanning", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.PLANNING).count());
        m.put("projectsAwaitingPrototype", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.PROTOTYPE_IN_PROGRESS).count());
        m.put("prototypesAwaitingClientApproval", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.AWAITING_CLIENT_APPROVAL).count());
        m.put("approvedAwaitingDevAuthorization", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.PROTOTYPE_APPROVED).count());
        m.put("activeDevelopmentProjects", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.IN_DEVELOPMENT).count());
        m.put("qaProjects", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.TESTING_QA).count());
        m.put("completedProjects", pmProjects.stream().filter(p -> p.getStage() == ProjectStage.COMPLETED).count());

        // Unassigned tasks across PM projects
        List<Long> projectIds = pmProjects.stream().map(Project::getId).collect(Collectors.toList());
        List<TaskIssue> pmIssues = taskIssueRepository.findAll().stream()
                .filter(i -> projectIds.contains(i.getProject().getId()))
                .collect(Collectors.toList());

        m.put("unassignedIssuesCount", pmIssues.stream().filter(i -> i.getAssignee() == null).count());
        m.put("blockedIssuesCount", pmIssues.stream().filter(i -> i.getStatus() == IssueStatus.BLOCKED).count());
        m.put("overdueIssuesCount", pmIssues.stream().filter(i -> i.getDueDate() != null && i.getDueDate().isBefore(LocalDate.now()) && i.getStatus() != IssueStatus.RESOLVED && i.getStatus() != IssueStatus.CLOSED).count());

        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getClientDashboardMetrics(Long clientId) {
        Map<String, Object> m = new HashMap<>();

        List<Project> clientProjects = projectRepository.findByClientId(clientId).stream()
                .filter(p -> !p.isArchived()).collect(Collectors.toList());

        m.put("myProjectsCount", clientProjects.size());
        m.put("activeProjectsCount", clientProjects.stream().filter(p -> p.getStage() == ProjectStage.IN_DEVELOPMENT || p.getStage() == ProjectStage.PROTOTYPE_IN_PROGRESS).count());
        m.put("pendingApprovalsCount", clientProjects.stream().filter(p -> p.getStage() == ProjectStage.AWAITING_CLIENT_APPROVAL).count());
        m.put("completedProjectsCount", clientProjects.stream().filter(p -> p.getStage() == ProjectStage.COMPLETED).count());

        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTeamMemberDashboardMetrics(Long userId) {
        Map<String, Object> m = new HashMap<>();

        List<TaskIssue> myTasks = taskIssueRepository.findByAssigneeId(userId);
        m.put("totalAssignedTasks", myTasks.size());
        m.put("todoTasks", myTasks.stream().filter(i -> i.getStatus() == IssueStatus.TODO || i.getStatus() == IssueStatus.OPEN).count());
        m.put("inProgressTasks", myTasks.stream().filter(i -> i.getStatus() == IssueStatus.IN_PROGRESS).count());
        m.put("blockedTasks", myTasks.stream().filter(i -> i.getStatus() == IssueStatus.BLOCKED).count());
        m.put("inReviewTasks", myTasks.stream().filter(i -> i.getStatus() == IssueStatus.IN_REVIEW || i.getStatus() == IssueStatus.READY_FOR_QA).count());
        m.put("resolvedTasks", myTasks.stream().filter(i -> i.getStatus() == IssueStatus.RESOLVED || i.getStatus() == IssueStatus.CLOSED).count());
        m.put("overdueTasks", myTasks.stream().filter(i -> i.getDueDate() != null && i.getDueDate().isBefore(LocalDate.now()) && i.getStatus() != IssueStatus.RESOLVED && i.getStatus() != IssueStatus.CLOSED).count());

        double logged = myTasks.stream().mapToDouble(i -> i.getLoggedHours() != null ? i.getLoggedHours() : 0.0).sum();
        double estimated = myTasks.stream().mapToDouble(i -> i.getEstimatedHours() != null ? i.getEstimatedHours() : 0.0).sum();
        m.put("totalLoggedHours", logged);
        m.put("totalEstimatedHours", estimated);

        return m;
    }
}

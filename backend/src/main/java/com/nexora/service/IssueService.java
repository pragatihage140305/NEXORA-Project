package com.nexora.service;

import com.nexora.model.*;
import com.nexora.model.enums.IssueStatus;
import com.nexora.model.enums.IssueType;
import com.nexora.model.enums.ProjectStage;
import com.nexora.repository.*;
import com.nexora.service.dto.IssueDto;
import com.nexora.websocket.RealtimeEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class IssueService {

    private final TaskIssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final IssueCommentRepository commentRepository;
    private final TimeLogRepository timeLogRepository;
    private final AuditService auditService;
    private final RealtimeEventService realtimeEventService;

    public IssueService(TaskIssueRepository issueRepository,
                        ProjectRepository projectRepository,
                        MilestoneRepository milestoneRepository,
                        TeamRepository teamRepository,
                        UserRepository userRepository,
                        IssueCommentRepository commentRepository,
                        TimeLogRepository timeLogRepository,
                        AuditService auditService,
                        RealtimeEventService realtimeEventService) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.milestoneRepository = milestoneRepository;
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.timeLogRepository = timeLogRepository;
        this.auditService = auditService;
        this.realtimeEventService = realtimeEventService;
    }

    @Transactional
    public IssueDto.IssueResponse createIssue(IssueDto.CreateIssueRequest request, User reporter) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + request.projectId()));

        String key = generateIssueKey(project);

        TaskIssue issue = new TaskIssue();
        issue.setIssueKey(key);
        issue.setProject(project);
        issue.setTitle(request.title());
        issue.setDescription(request.description());
        issue.setType(request.type() != null ? request.type() : IssueType.TASK);
        issue.setPriority(request.priority() != null ? request.priority() : com.nexora.model.enums.Priority.MEDIUM);
        issue.setStatus(IssueStatus.TODO);
        issue.setReporter(reporter);
        issue.setDueDate(request.dueDate());
        issue.setEstimatedHours(request.estimatedHours() != null ? request.estimatedHours() : 8.0);
        issue.setLabels(request.labels());

        if (request.milestoneId() != null) {
            milestoneRepository.findById(request.milestoneId()).ifPresent(issue::setMilestone);
        }

        if (request.assigneeId() != null) {
            userRepository.findById(request.assigneeId()).ifPresent(issue::setAssignee);
        }

        if (request.teamId() != null) {
            teamRepository.findById(request.teamId()).ifPresent(issue::setTeam);
        } else if (project.getPrimaryTeam() != null) {
            issue.setTeam(project.getPrimaryTeam());
        }

        TaskIssue saved = issueRepository.save(issue);

        // Update project total estimated hours
        double totalEst = issueRepository.findByProjectId(project.getId()).stream()
                .mapToDouble(i -> i.getEstimatedHours() != null ? i.getEstimatedHours() : 0.0)
                .sum();
        project.setEstimatedHours(totalEst);
        projectRepository.save(project);

        auditService.logAction(reporter, "CREATE_ISSUE", "ISSUE", saved.getId(),
                "Created " + saved.getType() + " " + saved.getIssueKey() + ": " + saved.getTitle(), null);

        if (saved.getAssignee() != null) {
            auditService.sendNotification(saved.getAssignee(), "New Task Assigned",
                    "You have been assigned to " + saved.getIssueKey() + ": " + saved.getTitle(),
                    "TASK_ASSIGNED", "/issues/" + saved.getId());
        }

        realtimeEventService.broadcastProjectEvent(project.getId(), "ISSUE_CREATED", saved.getId());

        return IssueDto.IssueResponse.from(saved);
    }

    /**
     * Updates issue status with strict Stage 7 gate enforcement.
     */
    @Transactional
    public IssueDto.IssueResponse updateStatus(Long issueId, IssueDto.UpdateIssueStatusRequest request, User user) {
        TaskIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));

        Project project = issue.getProject();
        IssueStatus targetStatus = request.status();

        // STRICT GATE: Cannot enter IN_PROGRESS before formal development authorization
        if (targetStatus == IssueStatus.IN_PROGRESS) {
            Set<ProjectStage> allowedStages = Set.of(
                    ProjectStage.IN_DEVELOPMENT,
                    ProjectStage.TESTING_QA,
                    ProjectStage.COMPLETED
            );
            if (!allowedStages.contains(project.getStage())) {
                throw new IllegalStateException("DEVELOPMENT GATE BLOCKED: Tasks cannot enter IN_PROGRESS until Stage 7 'Formal Development Authorization' is completed by the Project Manager.");
            }
        }

        // Blocker validation & PM Notification
        if (targetStatus == IssueStatus.BLOCKED) {
            if (request.blockerReason() == null || request.blockerReason().isBlank()) {
                throw new IllegalArgumentException("A blocker reason must be provided when marking a task as BLOCKED.");
            }
            issue.setBlockerReason(request.blockerReason());
            if (project.getProjectManager() != null) {
                auditService.sendNotification(project.getProjectManager(), "Task Blocker Reported!",
                        "Member " + user.getName() + " reported a blocker on " + issue.getIssueKey() + " (" + issue.getTitle() + "): " + request.blockerReason(),
                        "TASK_BLOCKER", "/issues/" + issue.getId());
            }
        } else {
            issue.setBlockerReason(null);
        }

        issue.setStatus(targetStatus);
        TaskIssue saved = issueRepository.save(issue);

        // Recalculate project progress
        recalculateProjectProgress(project);

        auditService.logAction(user, "UPDATE_ISSUE_STATUS", "ISSUE", saved.getId(),
                "Changed status of " + saved.getIssueKey() + " to " + targetStatus, null);

        realtimeEventService.broadcastProjectEvent(project.getId(), "ISSUE_STATUS_CHANGED", saved.getId());

        return IssueDto.IssueResponse.from(saved);
    }

    /**
     * QA Gate: Fixing a bug does not automatically mark it as QA-passed.
     */
    @Transactional
    public IssueDto.IssueResponse verifyQa(Long issueId, IssueDto.VerifyQaRequest request, User qaVerifier) {
        TaskIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));

        issue.setQaPassed(request.qaPassed());
        issue.setQaVerifiedBy(qaVerifier);
        issue.setQaVerifiedAt(LocalDateTime.now());
        issue.setQaNotes(request.qaNotes());

        if (request.qaPassed()) {
            issue.setStatus(IssueStatus.RESOLVED);
        } else {
            issue.setStatus(IssueStatus.REOPENED);
        }

        TaskIssue saved = issueRepository.save(issue);
        recalculateProjectProgress(saved.getProject());

        auditService.logAction(qaVerifier, "VERIFY_QA", "ISSUE", saved.getId(),
                "QA Verification for " + saved.getIssueKey() + ": " + (request.qaPassed() ? "PASSED" : "FAILED / REOPENED"), null);

        realtimeEventService.broadcastProjectEvent(saved.getProject().getId(), "ISSUE_QA_VERIFIED", saved.getId());

        return IssueDto.IssueResponse.from(saved);
    }

    @Transactional
    public IssueDto.IssueResponse assignIssue(Long issueId, Long assigneeId, Long teamId, User user) {
        TaskIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));

        if (assigneeId != null) {
            User assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new IllegalArgumentException("Assignee not found"));
            issue.setAssignee(assignee);
            auditService.sendNotification(assignee, "Task Assigned",
                    "You were assigned to " + issue.getIssueKey() + ": " + issue.getTitle(),
                    "TASK_ASSIGNED", "/issues/" + issue.getId());
        }

        if (teamId != null) {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
            issue.setTeam(team);
        }

        TaskIssue saved = issueRepository.save(issue);
        auditService.logAction(user, "ASSIGN_ISSUE", "ISSUE", saved.getId(),
                "Assigned " + saved.getIssueKey() + " to " + (saved.getAssignee() != null ? saved.getAssignee().getName() : "Unassigned"), null);

        realtimeEventService.broadcastProjectEvent(saved.getProject().getId(), "ISSUE_UPDATED", saved.getId());

        return IssueDto.IssueResponse.from(saved);
    }

    @Transactional
    public void logTime(Long issueId, IssueDto.LogTimeRequest request, User user) {
        TaskIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));

        TimeLog log = new TimeLog(
                issue,
                user,
                request.hoursLogged(),
                request.workDate() != null ? request.workDate() : LocalDate.now(),
                request.description()
        );
        timeLogRepository.save(log);

        // Update issue logged hours
        Double issueTotal = timeLogRepository.sumHoursByIssueId(issue.getId());
        issue.setLoggedHours(issueTotal);
        issueRepository.save(issue);

        // Update project logged hours
        Double projectTotal = timeLogRepository.sumHoursByProjectId(issue.getProject().getId());
        Project project = issue.getProject();
        project.setActualLoggedHours(projectTotal);
        projectRepository.save(project);

        auditService.logAction(user, "LOG_TIME", "ISSUE", issue.getId(),
                "Logged " + request.hoursLogged() + " hours on " + issue.getIssueKey(), null);

        realtimeEventService.broadcastProjectEvent(project.getId(), "TIME_LOGGED", issue.getId());
    }

    @Transactional
    public IssueComment addComment(Long issueId, IssueDto.AddCommentRequest request, User author) {
        TaskIssue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found: " + issueId));

        IssueComment comment = new IssueComment(issue, author, request.message());
        comment.setAttachmentUrl(request.attachmentUrl());
        IssueComment saved = commentRepository.save(comment);

        realtimeEventService.broadcastProjectEvent(issue.getProject().getId(), "ISSUE_COMMENT_ADDED", saved.getId());

        return saved;
    }

    @Transactional(readOnly = true)
    public List<IssueDto.IssueResponse> getIssuesForProject(Long projectId) {
        return issueRepository.findByProjectId(projectId).stream()
                .map(IssueDto.IssueResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueDto.IssueResponse> getIssuesForUser(Long userId) {
        return issueRepository.findByAssigneeId(userId).stream()
                .map(IssueDto.IssueResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueDto.IssueResponse> getIssuesForTeam(Long teamId) {
        return issueRepository.findByTeamId(teamId).stream()
                .map(IssueDto.IssueResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueDto.IssueResponse> getAllIssues() {
        return issueRepository.findAll().stream()
                .map(IssueDto.IssueResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueComment> getComments(Long issueId) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId);
    }

    private void recalculateProjectProgress(Project project) {
        var issues = issueRepository.findByProjectId(project.getId());
        if (issues.isEmpty()) return;

        long completed = issues.stream()
                .filter(i -> i.getStatus() == IssueStatus.RESOLVED || i.getStatus() == IssueStatus.CLOSED)
                .count();

        int percentage = (int) Math.round(((double) completed / issues.size()) * 100.0);
        project.setProgressPercentage(percentage);
        projectRepository.save(project);
    }

    private String generateIssueKey(Project project) {
        String base = project.getProjectCode() != null ? project.getProjectCode() : "NEX";
        long count = issueRepository.findByProjectId(project.getId()).size() + 1;
        return base + "-" + String.format("%03d", count);
    }
}

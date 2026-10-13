package com.nexora.model;

import com.nexora.model.enums.IssueStatus;
import com.nexora.model.enums.IssueType;
import com.nexora.model.enums.Priority;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_issues")
public class TaskIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String issueKey; // e.g. "PRJ-001"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "milestone_id")
    private Milestone milestone;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType type = IssueType.TASK;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status = IssueStatus.TODO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    private Team team;

    private LocalDate dueDate;
    private Double estimatedHours = 8.0;
    private Double loggedHours = 0.0;

    // Comma-separated labels: e.g. "frontend, auth, high-impact"
    private String labels;

    @Column(length = 1000)
    private String blockerReason;

    // QA Gate: Fixing a bug must not automatically mark QA as passed
    private boolean qaPassed = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "qa_verified_by_id")
    private User qaVerifiedBy;

    private LocalDateTime qaVerifiedAt;

    @Column(length = 2000)
    private String qaNotes;

    @Column(length = 1000)
    private String attachmentUrl;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public TaskIssue() {}

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIssueKey() { return issueKey; }
    public void setIssueKey(String issueKey) { this.issueKey = issueKey; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public Milestone getMilestone() { return milestone; }
    public void setMilestone(Milestone milestone) { this.milestone = milestone; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public IssueType getType() { return type; }
    public void setType(IssueType type) { this.type = type; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public IssueStatus getStatus() { return status; }
    public void setStatus(IssueStatus status) { this.status = status; }

    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }

    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }

    public Double getLoggedHours() { return loggedHours; }
    public void setLoggedHours(Double loggedHours) { this.loggedHours = loggedHours; }

    public String getLabels() { return labels; }
    public void setLabels(String labels) { this.labels = labels; }

    public String getBlockerReason() { return blockerReason; }
    public void setBlockerReason(String blockerReason) { this.blockerReason = blockerReason; }

    public boolean isQaPassed() { return qaPassed; }
    public void setQaPassed(boolean qaPassed) { this.qaPassed = qaPassed; }

    public User getQaVerifiedBy() { return qaVerifiedBy; }
    public void setQaVerifiedBy(User qaVerifiedBy) { this.qaVerifiedBy = qaVerifiedBy; }

    public LocalDateTime getQaVerifiedAt() { return qaVerifiedAt; }
    public void setQaVerifiedAt(LocalDateTime qaVerifiedAt) { this.qaVerifiedAt = qaVerifiedAt; }

    public String getQaNotes() { return qaNotes; }
    public void setQaNotes(String qaNotes) { this.qaNotes = qaNotes; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

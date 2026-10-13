package com.nexora.model;

import com.nexora.model.enums.Priority;
import com.nexora.model.enums.ProjectStage;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String projectCode;

    @Column(length = 4000)
    private String description;

    @Column(length = 2000)
    private String businessObjective;

    @Column(length = 3000)
    private String expectedFeatures;

    @Column(length = 4000)
    private String requirements;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "pm_id")
    private User projectManager;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "primary_team_id")
    private Team primaryTeam;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "project_teams",
        joinColumns = @JoinColumn(name = "project_id"),
        inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    private Set<Team> associatedTeams = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", columnDefinition = "varchar(50)", nullable = false)
    private ProjectStage stage = ProjectStage.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    // Budgets
    private Double proposedBudget;
    private Double approvedBudget;
    private String currency = "USD";

    // Dates
    private LocalDate plannedStartDate;
    private LocalDate actualStartDate;
    private LocalDate plannedEndDate;
    private LocalDate forecastEndDate;
    private LocalDate actualEndDate;

    // Progress metrics
    private Double estimatedHours = 0.0;
    private Double actualLoggedHours = 0.0;
    private Integer progressPercentage = 0;

    // Stage 7 Development Authorization Gate
    private LocalDateTime developmentAuthorizedAt;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "authorized_by_id")
    private User developmentAuthorizedBy;

    @Column(length = 2000)
    private String developmentNotes;

    @Column(length = 1000)
    private String delayReason;

    @Column(length = 2000)
    private String referenceDocuments;

    // Final Project Delivery & PM Review
    @Column(length = 4000)
    private String finalDeliverableNotes;

    @Column(length = 1000)
    private String deploymentUrl;

    @Column(length = 50)
    private String finalReviewStatus; // PENDING, APPROVED, REJECTED, CHANGES_REQUESTED

    private LocalDateTime finalSubmittedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "final_submitted_by_id")
    private User finalSubmittedBy;

    private LocalDateTime finalReviewedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "final_reviewed_by_id")
    private User finalReviewedBy;

    @Column(length = 2000)
    private String finalReviewComments;

    private boolean archived = false;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Project() {}

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getProjectCode() { return projectCode; }
    public void setProjectCode(String projectCode) { this.projectCode = projectCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBusinessObjective() { return businessObjective; }
    public void setBusinessObjective(String businessObjective) { this.businessObjective = businessObjective; }

    public String getExpectedFeatures() { return expectedFeatures; }
    public void setExpectedFeatures(String expectedFeatures) { this.expectedFeatures = expectedFeatures; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public User getClient() { return client; }
    public void setClient(User client) { this.client = client; }

    public User getProjectManager() { return projectManager; }
    public void setProjectManager(User projectManager) { this.projectManager = projectManager; }

    public Team getPrimaryTeam() { return primaryTeam; }
    public void setPrimaryTeam(Team primaryTeam) { this.primaryTeam = primaryTeam; }

    public Set<Team> getAssociatedTeams() { return associatedTeams; }
    public void setAssociatedTeams(Set<Team> associatedTeams) { this.associatedTeams = associatedTeams; }

    public ProjectStage getStage() { return stage; }
    public void setStage(ProjectStage stage) { this.stage = stage; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public Double getProposedBudget() { return proposedBudget; }
    public void setProposedBudget(Double proposedBudget) { this.proposedBudget = proposedBudget; }

    public Double getApprovedBudget() { return approvedBudget; }
    public void setApprovedBudget(Double approvedBudget) { this.approvedBudget = approvedBudget; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public LocalDate getPlannedStartDate() { return plannedStartDate; }
    public void setPlannedStartDate(LocalDate plannedStartDate) { this.plannedStartDate = plannedStartDate; }

    public LocalDate getActualStartDate() { return actualStartDate; }
    public void setActualStartDate(LocalDate actualStartDate) { this.actualStartDate = actualStartDate; }

    public LocalDate getPlannedEndDate() { return plannedEndDate; }
    public void setPlannedEndDate(LocalDate plannedEndDate) { this.plannedEndDate = plannedEndDate; }

    public LocalDate getForecastEndDate() { return forecastEndDate; }
    public void setForecastEndDate(LocalDate forecastEndDate) { this.forecastEndDate = forecastEndDate; }

    public LocalDate getActualEndDate() { return actualEndDate; }
    public void setActualEndDate(LocalDate actualEndDate) { this.actualEndDate = actualEndDate; }

    public Double getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Double estimatedHours) { this.estimatedHours = estimatedHours; }

    public Double getActualLoggedHours() { return actualLoggedHours; }
    public void setActualLoggedHours(Double actualLoggedHours) { this.actualLoggedHours = actualLoggedHours; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDateTime getDevelopmentAuthorizedAt() { return developmentAuthorizedAt; }
    public void setDevelopmentAuthorizedAt(LocalDateTime developmentAuthorizedAt) { this.developmentAuthorizedAt = developmentAuthorizedAt; }

    public User getDevelopmentAuthorizedBy() { return developmentAuthorizedBy; }
    public void setDevelopmentAuthorizedBy(User developmentAuthorizedBy) { this.developmentAuthorizedBy = developmentAuthorizedBy; }

    public String getDevelopmentNotes() { return developmentNotes; }
    public void setDevelopmentNotes(String developmentNotes) { this.developmentNotes = developmentNotes; }

    public String getDelayReason() { return delayReason; }
    public void setDelayReason(String delayReason) { this.delayReason = delayReason; }

    public String getReferenceDocuments() { return referenceDocuments; }
    public void setReferenceDocuments(String referenceDocuments) { this.referenceDocuments = referenceDocuments; }

    public String getFinalDeliverableNotes() { return finalDeliverableNotes; }
    public void setFinalDeliverableNotes(String finalDeliverableNotes) { this.finalDeliverableNotes = finalDeliverableNotes; }

    public String getDeploymentUrl() { return deploymentUrl; }
    public void setDeploymentUrl(String deploymentUrl) { this.deploymentUrl = deploymentUrl; }

    public String getFinalReviewStatus() { return finalReviewStatus; }
    public void setFinalReviewStatus(String finalReviewStatus) { this.finalReviewStatus = finalReviewStatus; }

    public LocalDateTime getFinalSubmittedAt() { return finalSubmittedAt; }
    public void setFinalSubmittedAt(LocalDateTime finalSubmittedAt) { this.finalSubmittedAt = finalSubmittedAt; }

    public User getFinalSubmittedBy() { return finalSubmittedBy; }
    public void setFinalSubmittedBy(User finalSubmittedBy) { this.finalSubmittedBy = finalSubmittedBy; }

    public LocalDateTime getFinalReviewedAt() { return finalReviewedAt; }
    public void setFinalReviewedAt(LocalDateTime finalReviewedAt) { this.finalReviewedAt = finalReviewedAt; }

    public User getFinalReviewedBy() { return finalReviewedBy; }
    public void setFinalReviewedBy(User finalReviewedBy) { this.finalReviewedBy = finalReviewedBy; }

    public String getFinalReviewComments() { return finalReviewComments; }
    public void setFinalReviewComments(String finalReviewComments) { this.finalReviewComments = finalReviewComments; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

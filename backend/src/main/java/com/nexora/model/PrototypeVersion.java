package com.nexora.model;

import com.nexora.model.enums.PrototypeStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prototype_versions")
public class PrototypeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String versionNumber; // e.g. "v1.0", "v1.1"

    @Column(nullable = false)
    private String title;

    private String previewUrl;

    @Column(length = 3000)
    private String description;

    @Column(length = 3000)
    private String featuresCovered;

    @Column(length = 2000)
    private String knownLimitations;

    @Column(length = 4000)
    private String screenshotsJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(50)", nullable = false)
    private PrototypeStatus status = PrototypeStatus.SUBMITTED_TO_MANAGER;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "submitted_by_id")
    private User submittedBy;

    private LocalDateTime submittedAt = LocalDateTime.now();

    // PM Review
    @Column(length = 2000)
    private String managerReviewComments;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manager_reviewed_by_id")
    private User managerReviewedBy;

    private LocalDateTime managerReviewedAt;

    // Client Review
    @Column(length = 2000)
    private String clientReviewComments;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_reviewed_by_id")
    private User clientReviewedBy;

    private LocalDateTime clientReviewedAt;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public PrototypeVersion() {}

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getVersionNumber() { return versionNumber; }
    public void setVersionNumber(String versionNumber) { this.versionNumber = versionNumber; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPreviewUrl() { return previewUrl; }
    public void setPreviewUrl(String previewUrl) { this.previewUrl = previewUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFeaturesCovered() { return featuresCovered; }
    public void setFeaturesCovered(String featuresCovered) { this.featuresCovered = featuresCovered; }

    public String getKnownLimitations() { return knownLimitations; }
    public void setKnownLimitations(String knownLimitations) { this.knownLimitations = knownLimitations; }

    public String getScreenshotsJson() { return screenshotsJson; }
    public void setScreenshotsJson(String screenshotsJson) { this.screenshotsJson = screenshotsJson; }

    public PrototypeStatus getStatus() { return status; }
    public void setStatus(PrototypeStatus status) { this.status = status; }

    public User getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(User submittedBy) { this.submittedBy = submittedBy; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getManagerReviewComments() { return managerReviewComments; }
    public void setManagerReviewComments(String managerReviewComments) { this.managerReviewComments = managerReviewComments; }

    public User getManagerReviewedBy() { return managerReviewedBy; }
    public void setManagerReviewedBy(User managerReviewedBy) { this.managerReviewedBy = managerReviewedBy; }

    public LocalDateTime getManagerReviewedAt() { return managerReviewedAt; }
    public void setManagerReviewedAt(LocalDateTime managerReviewedAt) { this.managerReviewedAt = managerReviewedAt; }

    public String getClientReviewComments() { return clientReviewComments; }
    public void setClientReviewComments(String clientReviewComments) { this.clientReviewComments = clientReviewComments; }

    public User getClientReviewedBy() { return clientReviewedBy; }
    public void setClientReviewedBy(User clientReviewedBy) { this.clientReviewedBy = clientReviewedBy; }

    public LocalDateTime getClientReviewedAt() { return clientReviewedAt; }
    public void setClientReviewedAt(LocalDateTime clientReviewedAt) { this.clientReviewedAt = clientReviewedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

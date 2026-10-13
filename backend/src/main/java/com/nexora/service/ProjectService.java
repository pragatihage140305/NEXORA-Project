package com.nexora.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexora.model.*;
import com.nexora.model.enums.*;
import com.nexora.repository.*;
import com.nexora.service.dto.ProjectDto;
import com.nexora.service.dto.PrototypeDto;
import com.nexora.websocket.RealtimeEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final PrototypeVersionRepository prototypeRepository;
    private final MilestoneRepository milestoneRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final TaskIssueRepository taskIssueRepository;
    private final ProjectReportRepository reportRepository;
    private final AuditService auditService;
    private final RealtimeEventService realtimeEventService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ProjectService(ProjectRepository projectRepository,
                          PrototypeVersionRepository prototypeRepository,
                          MilestoneRepository milestoneRepository,
                          TeamRepository teamRepository,
                          TeamMemberRepository teamMemberRepository,
                          UserRepository userRepository,
                          TaskIssueRepository taskIssueRepository,
                          ProjectReportRepository reportRepository,
                          AuditService auditService,
                          RealtimeEventService realtimeEventService) {
        this.projectRepository = projectRepository;
        this.prototypeRepository = prototypeRepository;
        this.milestoneRepository = milestoneRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.userRepository = userRepository;
        this.taskIssueRepository = taskIssueRepository;
        this.reportRepository = reportRepository;
        this.auditService = auditService;
        this.realtimeEventService = realtimeEventService;
    }

    /**
     * Stage 1: Client Submits Project.
     * Auto-generates Initial Project Assessment Report immediately.
     */
    @Transactional
    public ProjectDto.ProjectResponse submitProject(ProjectDto.ProjectSubmissionRequest request, User client) {
        String code = generateProjectCode(request.title());

        Project project = new Project();
        project.setTitle(request.title());
        project.setProjectCode(code);
        project.setDescription(request.description());
        project.setBusinessObjective(request.businessObjective());
        project.setExpectedFeatures(request.expectedFeatures());
        project.setRequirements(request.requirements());
        project.setClient(client);
        project.setStage(ProjectStage.SUBMITTED);
        project.setPriority(request.priority() != null ? request.priority() : Priority.MEDIUM);
        project.setProposedBudget(request.proposedBudget());
        project.setCurrency(request.currency() != null ? request.currency() : "USD");
        project.setPlannedStartDate(request.plannedStartDate());
        project.setPlannedEndDate(request.plannedEndDate());
        project.setReferenceDocuments(request.referenceDocuments());

        // Assign to first available Project Manager if any exists
        List<User> pms = userRepository.findByRole(UserRole.ROLE_PM);
        if (!pms.isEmpty()) {
            project.setProjectManager(pms.get(0));
        }

        Project saved = projectRepository.save(project);

        // Auto-generate Initial Project Assessment Report
        generateInitialAssessmentReport(saved);

        auditService.logAction(client, "SUBMIT_PROJECT", "PROJECT", saved.getId(),
                "Client submitted new project request: " + saved.getTitle() + " [" + saved.getProjectCode() + "]", null);

        // Notify PM and Admin
        for (User pm : pms) {
            auditService.sendNotification(pm, "New Project Submitted",
                    "Client " + client.getName() + " submitted project request '" + saved.getTitle() + "'. Review required.",
                    "PROJECT_REQUEST", "/projects/" + saved.getId());
        }

        realtimeEventService.broadcastOrgEvent("PROJECT_SUBMITTED", saved.getId());

        return toProjectResponse(saved);
    }

    /**
     * Stage 2: Project Manager Reviews Request.
     */
    @Transactional
    public ProjectDto.ProjectResponse reviewProject(Long projectId, ProjectDto.ProjectReviewDecision decision, User pm) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (decision.assignedPmId() != null) {
            User assignedPm = userRepository.findById(decision.assignedPmId())
                    .orElseThrow(() -> new IllegalArgumentException("Assigned PM not found"));
            project.setProjectManager(assignedPm);
        }

        if ("ACCEPTED".equalsIgnoreCase(decision.decision())) {
            if (decision.assignedTeamId() != null) {
                Team team = teamRepository.findById(decision.assignedTeamId()).orElse(null);
                if (team != null) {
                    validateTeamCapacityForAssignment(team);
                    project.setPrimaryTeam(team);
                }
            }

            LocalDate protoDeadline = decision.prototypeDeadline() != null ? decision.prototypeDeadline() : LocalDate.now().plusWeeks(2);
            LocalDate projectEnd = project.getPlannedEndDate() != null ? project.getPlannedEndDate() : LocalDate.now().plusMonths(3);

            // Seed key milestones if none exist
            if (milestoneRepository.findByProjectIdOrderBySequenceOrderAsc(project.getId()).isEmpty()) {
                Milestone m1 = new Milestone(project, "Milestone 1: Prototype & UX Flow Review",
                        "Create interactive wireframe and prototype specification file for client approval.",
                        protoDeadline, 1);
                Milestone m2 = new Milestone(project, "Milestone 2: Core Development & Architecture",
                        "Implement authorized frontend and backend components.",
                        projectEnd.minusWeeks(2), 2);
                Milestone m3 = new Milestone(project, "Milestone 3: QA Verification & Final Release",
                        "Pass QA verification gate, resolve critical bugs, and deliver to client.",
                        projectEnd, 3);
                milestoneRepository.saveAll(List.of(m1, m2, m3));
            }

            // Move straight to PROTOTYPE_IN_PROGRESS!
            project.setStage(ProjectStage.PROTOTYPE_IN_PROGRESS);

            // Notify Client
            auditService.sendNotification(project.getClient(), "Project Request Accepted!",
                    "Your project request '" + project.getTitle() + "' has been accepted by the Project Manager" +
                    (project.getPrimaryTeam() != null ? " and assigned to " + project.getPrimaryTeam().getName() : "") +
                    ". Prototype preparation is underway.",
                    "PROJECT_ACCEPTED", "/projects/" + project.getId());

            // Notify Assigned Team (e.g. Team 3)
            if (project.getPrimaryTeam() != null) {
                String teamNotice = "Project '" + project.getTitle() + "' has been assigned to your team! Mandate: Create Prototype by " +
                        protoDeadline + ". " + (decision.prototypeInstructions() != null ? decision.prototypeInstructions() : "Submit prototype file for PM review.");
                if (project.getPrimaryTeam().getTeamLead() != null) {
                    auditService.sendNotification(project.getPrimaryTeam().getTeamLead(), "New Project Assigned for Prototype!",
                            teamNotice, "PROTOTYPE_MANDATE", "/projects/" + project.getId());
                }
                // Also notify team members
                teamMemberRepository.findByTeamId(project.getPrimaryTeam().getId()).forEach(tm -> {
                    auditService.sendNotification(tm.getUser(), "New Project Assigned to Your Team!",
                            teamNotice, "PROTOTYPE_MANDATE", "/projects/" + project.getId());
                });
            }
        } else if ("REJECTED".equalsIgnoreCase(decision.decision())) {
            project.setStage(ProjectStage.REJECTED);
            project.setDelayReason(decision.reviewComments());
            auditService.sendNotification(project.getClient(), "Project Request Update",
                    "Your project request '" + project.getTitle() + "' was not accepted. Reason: " + decision.reviewComments(),
                    "PROJECT_REJECTED", "/projects/" + project.getId());
        } else if ("NEEDS_INFORMATION".equalsIgnoreCase(decision.decision()) || "REQUEST_CHANGES".equalsIgnoreCase(decision.decision())) {
            project.setStage(ProjectStage.NEEDS_INFORMATION);
            project.setDelayReason(decision.reviewComments());
            auditService.sendNotification(project.getClient(), "Changes Requested on Project Submission",
                    "Project Manager requested revisions for '" + project.getTitle() + "': " + decision.reviewComments(),
                    "PROJECT_NEEDS_INFO", "/projects/" + project.getId());
        }

        Project saved = projectRepository.save(project);
        auditService.logAction(pm, "REVIEW_PROJECT", "PROJECT", saved.getId(),
                "PM decided " + decision.decision() + ": " + decision.reviewComments() +
                (saved.getPrimaryTeam() != null ? " [Assigned: " + saved.getPrimaryTeam().getName() + "]" : ""), null);
        realtimeEventService.broadcastProjectEvent(saved.getId(), "PROJECT_STAGE_UPDATED", saved.getStage());

        return toProjectResponse(saved);
    }

    /**
     * Stage 3: Project Planning & Team Assignment.
     */
    @Transactional
    public ProjectDto.ProjectResponse planProject(Long projectId, ProjectDto.ProjectPlanningRequest request, User pm) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        if (request.description() != null) project.setDescription(request.description());
        if (request.businessObjective() != null) project.setBusinessObjective(request.businessObjective());
        if (request.expectedFeatures() != null) project.setExpectedFeatures(request.expectedFeatures());
        if (request.requirements() != null) project.setRequirements(request.requirements());
        if (request.approvedBudget() != null) project.setApprovedBudget(request.approvedBudget());
        if (request.plannedStartDate() != null) project.setPlannedStartDate(request.plannedStartDate());
        if (request.plannedEndDate() != null) project.setPlannedEndDate(request.plannedEndDate());
        if (request.estimatedHours() != null) project.setEstimatedHours(request.estimatedHours());

        if (request.primaryTeamId() != null) {
            Team primaryTeam = teamRepository.findById(request.primaryTeamId())
                    .orElseThrow(() -> new IllegalArgumentException("Primary team not found"));
            validateTeamCapacityForAssignment(primaryTeam);
            project.setPrimaryTeam(primaryTeam);
        }

        if (request.associatedTeamIds() != null && !request.associatedTeamIds().isEmpty()) {
            Set<Team> associated = new HashSet<>(teamRepository.findAllById(request.associatedTeamIds()));
            project.setAssociatedTeams(associated);
        }

        // Save milestones
        if (request.milestones() != null && !request.milestones().isEmpty()) {
            for (ProjectDto.MilestoneInput mi : request.milestones()) {
                Milestone m = new Milestone(project, mi.title(), mi.description(), mi.targetDate(), mi.sequenceOrder());
                milestoneRepository.save(m);
            }
        }

        // Project moves to PROTOTYPE_IN_PROGRESS stage
        project.setStage(ProjectStage.PROTOTYPE_IN_PROGRESS);
        Project saved = projectRepository.save(project);

        auditService.logAction(pm, "PLAN_PROJECT", "PROJECT", saved.getId(),
                "Project planned. Primary team assigned: " + (saved.getPrimaryTeam() != null ? saved.getPrimaryTeam().getName() : "None"), null);

        realtimeEventService.broadcastProjectEvent(saved.getId(), "PROJECT_PLANNED", saved.getStage());

        return toProjectResponse(saved);
    }

    /**
     * Stage 4: Submit Prototype (Team member).
     */
    @Transactional
    public PrototypeDto.PrototypeResponse submitPrototype(PrototypeDto.SubmitPrototypeRequest request, User member) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + request.projectId()));

        PrototypeVersion prototype = new PrototypeVersion();
        prototype.setProject(project);
        prototype.setVersionNumber(request.versionNumber() != null ? request.versionNumber() : "v1.0");
        prototype.setTitle(request.title());
        prototype.setPreviewUrl(request.previewUrl());
        prototype.setDescription(request.description());
        prototype.setFeaturesCovered(request.featuresCovered());
        prototype.setKnownLimitations(request.knownLimitations());
        prototype.setScreenshotsJson(request.screenshotsJson());
        prototype.setStatus(PrototypeStatus.SUBMITTED_TO_MANAGER);
        prototype.setSubmittedBy(member);
        prototype.setSubmittedAt(LocalDateTime.now());

        PrototypeVersion saved = prototypeRepository.save(prototype);

        project.setStage(ProjectStage.PROTOTYPE_SUBMITTED_TO_MANAGER);
        projectRepository.save(project);

        auditService.logAction(member, "SUBMIT_PROTOTYPE", "PROTOTYPE", saved.getId(),
                "Submitted prototype version " + saved.getVersionNumber() + " for project " + project.getTitle(), null);

        if (project.getProjectManager() != null) {
            auditService.sendNotification(project.getProjectManager(), "Prototype Submitted",
                    "New prototype " + saved.getVersionNumber() + " submitted for project '" + project.getTitle() + "'. Review required.",
                    "PROTOTYPE_SUBMITTED", "/projects/" + project.getId());
        }

        realtimeEventService.broadcastProjectEvent(project.getId(), "PROTOTYPE_SUBMITTED", saved.getId());

        return PrototypeDto.PrototypeResponse.from(saved);
    }

    /**
     * Stage 5: PM Reviews Prototype.
     */
    @Transactional
    public PrototypeDto.PrototypeResponse managerReviewPrototype(Long prototypeId, PrototypeDto.ManagerReviewRequest request, User pm) {
        PrototypeVersion prototype = prototypeRepository.findById(prototypeId)
                .orElseThrow(() -> new IllegalArgumentException("Prototype not found: " + prototypeId));

        Project project = prototype.getProject();
        prototype.setManagerReviewedBy(pm);
        prototype.setManagerReviewedAt(LocalDateTime.now());
        prototype.setManagerReviewComments(request.comments());

        if ("SEND_TO_CLIENT".equalsIgnoreCase(request.decision()) || "APPROVE_FOR_CLIENT".equalsIgnoreCase(request.decision()) || "ACCEPT_AND_SEND_TO_CLIENT".equalsIgnoreCase(request.decision())) {
            prototype.setStatus(PrototypeStatus.AWAITING_CLIENT_APPROVAL);
            project.setStage(ProjectStage.AWAITING_CLIENT_APPROVAL);
            if (project.getClient() != null) {
                auditService.sendNotification(project.getClient(), "Prototype Ready for Review",
                        "Project Manager has approved prototype " + prototype.getVersionNumber() + " for your review. Please review and provide approval.",
                        "PROTOTYPE_CLIENT_REVIEW", "/projects/" + project.getId());
            }
        } else if ("ACCEPT_PROTOTYPE".equalsIgnoreCase(request.decision()) || "ACCEPT".equalsIgnoreCase(request.decision())) {
            prototype.setStatus(PrototypeStatus.MANAGER_APPROVED);
            if (prototype.getSubmittedBy() != null) {
                auditService.sendNotification(prototype.getSubmittedBy(), "Prototype Accepted by PM",
                        "Project Manager accepted prototype " + prototype.getVersionNumber() + ". Ready to be sent to client for sign-off.",
                        "PROTOTYPE_PM_ACCEPTED", "/projects/" + project.getId());
            }
        } else if ("REJECT_PROTOTYPE".equalsIgnoreCase(request.decision()) || "REJECT".equalsIgnoreCase(request.decision())) {
            prototype.setStatus(PrototypeStatus.MANAGER_REJECTED);
            project.setStage(ProjectStage.PROTOTYPE_IN_PROGRESS);
            if (prototype.getSubmittedBy() != null) {
                auditService.sendNotification(prototype.getSubmittedBy(), "Prototype Rejected by PM",
                        "Project Manager rejected prototype " + prototype.getVersionNumber() + ": " + request.comments(),
                        "PROTOTYPE_REJECTED", "/projects/" + project.getId());
            }
        } else {
            prototype.setStatus(PrototypeStatus.CHANGES_REQUESTED_BY_MANAGER);
            project.setStage(ProjectStage.PROTOTYPE_IN_PROGRESS);
            if (prototype.getSubmittedBy() != null) {
                auditService.sendNotification(prototype.getSubmittedBy(), "Prototype Revision Requested",
                        "Project Manager requested changes on prototype " + prototype.getVersionNumber() + ": " + request.comments(),
                        "PROTOTYPE_CHANGES_REQUESTED", "/projects/" + project.getId());
            }
        }

        prototypeRepository.save(prototype);
        projectRepository.save(project);

        auditService.logAction(pm, "MANAGER_REVIEW_PROTOTYPE", "PROTOTYPE", prototype.getId(),
                "PM decision: " + request.decision() + " on " + prototype.getVersionNumber(), null);

        realtimeEventService.broadcastProjectEvent(project.getId(), "PROTOTYPE_REVIEWED_BY_PM", prototype.getId());

        return PrototypeDto.PrototypeResponse.from(prototype);
    }

    /**
     * Stage 6: Client Reviews Prototype (Approval / Changes Requested / Rejection).
     */
    @Transactional
    public PrototypeDto.PrototypeResponse clientReviewPrototype(Long prototypeId, PrototypeDto.ClientReviewRequest request, User client) {
        PrototypeVersion prototype = prototypeRepository.findById(prototypeId)
                .orElseThrow(() -> new IllegalArgumentException("Prototype not found: " + prototypeId));

        Project project = prototype.getProject();
        prototype.setClientReviewedBy(client);
        prototype.setClientReviewedAt(LocalDateTime.now());
        prototype.setClientReviewComments(request.comments());

        if ("APPROVE".equalsIgnoreCase(request.decision())) {
            prototype.setStatus(PrototypeStatus.CLIENT_APPROVED);
            project.setStage(ProjectStage.PROTOTYPE_APPROVED);

            if (project.getProjectManager() != null) {
                auditService.sendNotification(project.getProjectManager(), "Client Approved Prototype!",
                        "Client " + client.getName() + " has approved prototype version " + prototype.getVersionNumber() +
                        "! You may now formally authorize development.",
                        "PROTOTYPE_APPROVED", "/projects/" + project.getId());
            }
        } else if ("REQUEST_CHANGES".equalsIgnoreCase(request.decision())) {
            prototype.setStatus(PrototypeStatus.CLIENT_CHANGES_REQUESTED);
            project.setStage(ProjectStage.PROTOTYPE_IN_PROGRESS);

            if (project.getProjectManager() != null) {
                auditService.sendNotification(project.getProjectManager(), "Client Requested Prototype Changes",
                        "Client requested revisions on prototype " + prototype.getVersionNumber() + ": " + request.comments(),
                        "PROTOTYPE_REVISION_REQUESTED", "/projects/" + project.getId());
            }
        } else {
            prototype.setStatus(PrototypeStatus.CLIENT_REJECTED);
            project.setStage(ProjectStage.UNDER_REVIEW);
        }

        prototypeRepository.save(prototype);
        projectRepository.save(project);

        auditService.logAction(client, "CLIENT_REVIEW_PROTOTYPE", "PROTOTYPE", prototype.getId(),
                "Client decision: " + request.decision() + " for " + prototype.getVersionNumber(), null);

        realtimeEventService.broadcastProjectEvent(project.getId(), "PROTOTYPE_CLIENT_DECISION", prototype.getId());

        return PrototypeDto.PrototypeResponse.from(prototype);
    }

    /**
     * Stage 7: FORMAL DEVELOPMENT AUTHORIZATION GATE ("Authorize Development & Notify Client")
     * Enforces the hard business rule:
     * 1. Approved prototype version must exist.
     * 2. Milestones must be present.
     * 3. Responsible team must be assigned.
     * 4. Development start date must be set.
     */
    @Transactional
    public ProjectDto.ProjectResponse authorizeDevelopment(Long projectId, ProjectDto.AuthorizeDevelopmentRequest request, User pm) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // 1. Verify approved prototype exists
        boolean hasApprovedPrototype = prototypeRepository.existsByProjectIdAndStatus(projectId, PrototypeStatus.CLIENT_APPROVED);
        if (!hasApprovedPrototype) {
            throw new IllegalStateException("DEVELOPMENT GATE BLOCKED: A client-approved prototype is strictly required before authorizing development.");
        }

        // 2. Verify milestones exist
        var milestones = milestoneRepository.findByProjectIdOrderBySequenceOrderAsc(projectId);
        if (milestones.isEmpty()) {
            throw new IllegalStateException("DEVELOPMENT GATE BLOCKED: Project plan must contain at least one defined milestone before authorizing development.");
        }

        // 3. Verify primary team
        if (request.confirmedTeamId() != null) {
            Team confirmedTeam = teamRepository.findById(request.confirmedTeamId())
                    .orElseThrow(() -> new IllegalArgumentException("Team not found: " + request.confirmedTeamId()));
            project.setPrimaryTeam(confirmedTeam);
        }
        if (project.getPrimaryTeam() == null) {
            throw new IllegalStateException("DEVELOPMENT GATE BLOCKED: A primary responsible team must be assigned before development authorization.");
        }

        // 4. Verify dates
        LocalDate startDate = request.actualStartDate() != null ? request.actualStartDate() : LocalDate.now();
        project.setActualStartDate(startDate);
        if (request.forecastEndDate() != null) {
            project.setForecastEndDate(request.forecastEndDate());
        }

        // Authorize!
        project.setStage(ProjectStage.IN_DEVELOPMENT);
        project.setDevelopmentAuthorizedAt(LocalDateTime.now());
        project.setDevelopmentAuthorizedBy(pm);
        project.setDevelopmentNotes(request.developmentNotes());

        Project saved = projectRepository.save(project);

        auditService.logAction(pm, "AUTHORIZE_DEVELOPMENT", "PROJECT", saved.getId(),
                "Formally authorized development for project: " + saved.getTitle() + ". Assigned team: " + saved.getPrimaryTeam().getName(), null);

        // Notify client
        auditService.sendNotification(saved.getClient(), "Development Authorized!",
                "Development has officially commenced for '" + saved.getTitle() + "'. Targeted milestone: " + milestones.get(0).getTitle(),
                "DEVELOPMENT_AUTHORIZED", "/projects/" + saved.getId());

        // Notify assigned team lead and members
        if (saved.getPrimaryTeam().getTeamLead() != null) {
            auditService.sendNotification(saved.getPrimaryTeam().getTeamLead(), "Project Development Commenced",
                    "Project '" + saved.getTitle() + "' is now IN_DEVELOPMENT. Team tasks are active.",
                    "DEVELOPMENT_COMMENCED", "/projects/" + saved.getId());
        }

        realtimeEventService.broadcastProjectEvent(saved.getId(), "DEVELOPMENT_AUTHORIZED", saved.getId());
        realtimeEventService.broadcastOrgEvent("PROJECT_AUTHORIZED", saved.getId());

        return toProjectResponse(saved);
    }

    /**
     * Stage 10: Complete Project & Generate Closure Report.
     */
    @Transactional
    public ProjectDto.ProjectResponse completeProject(Long projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        project.setStage(ProjectStage.COMPLETED);
        project.setActualEndDate(LocalDate.now());
        project.setProgressPercentage(100);

        Project saved = projectRepository.save(project);

        // Auto-generate Final Closure Report
        generateFinalClosureReport(saved);

        auditService.logAction(user, "COMPLETE_PROJECT", "PROJECT", saved.getId(),
                "Project marked as completed: " + saved.getTitle(), null);

        auditService.sendNotification(saved.getClient(), "Project Completed Successfully",
                "Congratulations! Project '" + saved.getTitle() + "' deliverables have been finalized and completed.",
                "PROJECT_COMPLETED", "/projects/" + saved.getId());

        realtimeEventService.broadcastProjectEvent(saved.getId(), "PROJECT_COMPLETED", saved.getId());

        return toProjectResponse(saved);
    }

    /**
     * Stage 9: Team Submits Final Project Delivery.
     */
    @Transactional
    public ProjectDto.ProjectResponse submitFinalDelivery(Long projectId, ProjectDto.FinalDeliverySubmissionRequest request, User member) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        project.setFinalDeliverableNotes(request.deliverableNotes());
        String url = request.deploymentUrl() != null && !request.deploymentUrl().isBlank() ? request.deploymentUrl().trim() : null;
        project.setDeploymentUrl(url);
        project.setFinalSubmittedBy(member);
        project.setFinalSubmittedAt(LocalDateTime.now());
        project.setFinalReviewStatus("PENDING");
        project.setStage(ProjectStage.FINAL_REVIEW_PENDING);

        Project saved = projectRepository.save(project);

        auditService.logAction(member, "SUBMIT_FINAL_DELIVERY", "PROJECT", saved.getId(),
                "Final project delivery submitted for " + saved.getTitle() + (url != null ? " [Deployment URL: " + url + "]" : ""), null);

        if (saved.getProjectManager() != null) {
            auditService.sendNotification(saved.getProjectManager(), "Final Project Delivery Submitted",
                    "Team submitted final deliverables for '" + saved.getTitle() + "'. PM final review required.",
                    "FINAL_REVIEW_REQUIRED", "/projects/" + saved.getId());
        }

        realtimeEventService.broadcastProjectEvent(saved.getId(), "FINAL_DELIVERY_SUBMITTED", saved.getId());

        return toProjectResponse(saved);
    }

    /**
     * Stage 9/10: Project Manager Reviews Final Delivery (Approve Final Project / Reject / Request Changes).
     */
    @Transactional
    public ProjectDto.ProjectResponse reviewFinalDelivery(Long projectId, ProjectDto.FinalReviewDecision decision, User pm) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        project.setFinalReviewedBy(pm);
        project.setFinalReviewedAt(LocalDateTime.now());
        project.setFinalReviewComments(decision.reviewComments());

        if ("APPROVE_FINAL_PROJECT".equalsIgnoreCase(decision.decision()) || "APPROVE".equalsIgnoreCase(decision.decision())) {
            project.setFinalReviewStatus("APPROVED");
            project.setStage(ProjectStage.COMPLETED);
            project.setActualEndDate(LocalDate.now());
            project.setProgressPercentage(100);

            // Auto-generate Final Closure Report
            generateFinalClosureReport(project);

            auditService.sendNotification(project.getClient(), "Project Deliverables Approved & Ready!",
                    "Final deliverables for '" + project.getTitle() + "' have been approved by the Project Manager." +
                    (project.getDeploymentUrl() != null ? " Deployment URL: " + project.getDeploymentUrl() : ""),
                    "PROJECT_DELIVERY_APPROVED", "/projects/" + project.getId());

            if (project.getPrimaryTeam() != null && project.getPrimaryTeam().getTeamLead() != null) {
                auditService.sendNotification(project.getPrimaryTeam().getTeamLead(), "Final Delivery Approved!",
                        "PM approved the final delivery for '" + project.getTitle() + "'. Project marked COMPLETED.",
                        "PROJECT_COMPLETED", "/projects/" + project.getId());
            }
        } else if ("REQUEST_CHANGES".equalsIgnoreCase(decision.decision())) {
            project.setFinalReviewStatus("CHANGES_REQUESTED");
            project.setStage(ProjectStage.IN_DEVELOPMENT);

            if (project.getPrimaryTeam() != null && project.getPrimaryTeam().getTeamLead() != null) {
                auditService.sendNotification(project.getPrimaryTeam().getTeamLead(), "Changes Requested on Final Delivery",
                        "PM requested revisions for '" + project.getTitle() + "': " + decision.reviewComments(),
                        "FINAL_CHANGES_REQUESTED", "/projects/" + project.getId());
            }
        } else {
            project.setFinalReviewStatus("REJECTED");
            project.setStage(ProjectStage.IN_DEVELOPMENT);

            if (project.getPrimaryTeam() != null && project.getPrimaryTeam().getTeamLead() != null) {
                auditService.sendNotification(project.getPrimaryTeam().getTeamLead(), "Final Delivery Rejected",
                        "PM rejected final delivery submission: " + decision.reviewComments(),
                        "FINAL_DELIVERY_REJECTED", "/projects/" + project.getId());
            }
        }

        Project saved = projectRepository.save(project);
        auditService.logAction(pm, "FINAL_REVIEW_PROJECT", "PROJECT", saved.getId(),
                "PM decision " + decision.decision() + ": " + decision.reviewComments(), null);

        realtimeEventService.broadcastProjectEvent(saved.getId(), "FINAL_REVIEW_COMPLETED", saved.getId());

        return toProjectResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PrototypeDto.PrototypeResponse> getAllPrototypes(User currentUser) {
        if (currentUser.getRole() == UserRole.ROLE_ADMIN || currentUser.getRole() == UserRole.ROLE_PM) {
            return prototypeRepository.findAllByOrderByCreatedAtDesc().stream()
                    .map(PrototypeDto.PrototypeResponse::from)
                    .collect(Collectors.toList());
        } else if (currentUser.getRole() == UserRole.ROLE_CLIENT) {
            List<com.nexora.model.PrototypeVersion> clientProtos = prototypeRepository.findByProjectClientIdOrderByCreatedAtDesc(currentUser.getId());
            if (clientProtos.isEmpty()) {
                clientProtos = prototypeRepository.findAllByOrderByCreatedAtDesc();
            }
            return clientProtos.stream()
                    .map(PrototypeDto.PrototypeResponse::from)
                    .collect(Collectors.toList());
        } else {
            List<Long> teamIds = new ArrayList<>();
            teamMemberRepository.findByUserId(currentUser.getId()).forEach(tm -> teamIds.add(tm.getTeam().getId()));
            teamRepository.findByTeamLeadId(currentUser.getId()).forEach(t -> teamIds.add(t.getId()));
            if (teamIds.isEmpty()) {
                return prototypeRepository.findAllByOrderByCreatedAtDesc().stream()
                        .map(PrototypeDto.PrototypeResponse::from)
                        .collect(Collectors.toList());
            }
            return prototypeRepository.findByProjectPrimaryTeamIdInOrderByCreatedAtDesc(teamIds).stream()
                    .map(PrototypeDto.PrototypeResponse::from)
                    .collect(Collectors.toList());
        }
    }

    @Transactional(readOnly = true)
    public List<ProjectDto.ProjectResponse> getAllProjects() {
        return projectRepository.findByArchivedFalse().stream()
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDto.ProjectResponse> getProjectsForClient(Long clientId) {
        return projectRepository.findByClientId(clientId).stream()
                .filter(p -> !p.isArchived())
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDto.ProjectResponse> getProjectsForPm(Long pmId) {
        return projectRepository.findByProjectManagerId(pmId).stream()
                .filter(p -> !p.isArchived())
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDto.ProjectResponse> getProjectsForTeamMember(Long userId) {
        Set<Long> teamIds = new HashSet<>();
        teamMemberRepository.findByUserId(userId).forEach(tm -> teamIds.add(tm.getTeam().getId()));
        teamRepository.findByTeamLeadId(userId).forEach(t -> teamIds.add(t.getId()));

        if (teamIds.isEmpty()) {
            return getAllProjects();
        }
        return projectRepository.findByPrimaryTeamIdIn(new ArrayList<>(teamIds)).stream()
                .filter(p -> !p.isArchived())
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDto.ProjectResponse getProjectById(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
        return toProjectResponse(project);
    }

    @Transactional(readOnly = true)
    public List<PrototypeDto.PrototypeResponse> getPrototypesForProject(Long projectId) {
        return prototypeRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(PrototypeDto.PrototypeResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Milestone> getMilestonesForProject(Long projectId) {
        return milestoneRepository.findByProjectIdOrderBySequenceOrderAsc(projectId);
    }

    private void generateInitialAssessmentReport(Project project) {
        String title = "Initial Project Assessment Report - " + project.getTitle();
        String summary = "Automated preliminary assessment generated upon project intake. Evaluates scope, baseline budget, timeline expectations, and initial complexity.";

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("proposedBudget", project.getProposedBudget() != null ? project.getProposedBudget() : 0.0);
        metrics.put("currency", project.getCurrency());
        metrics.put("plannedDurationDays", calculateDaysBetween(project.getPlannedStartDate(), project.getPlannedEndDate()));
        metrics.put("preliminaryComplexity", project.getProposedBudget() != null && project.getProposedBudget() > 50000 ? "HIGH" : "MEDIUM");
        metrics.put("missingBudgetConfirmation", project.getProposedBudget() == null ? "Requires Confirmation" : "Provided");
        metrics.put("missingEndDateConfirmation", project.getPlannedEndDate() == null ? "Requires Confirmation" : "Provided");

        Map<String, Object> content = new HashMap<>();
        content.put("businessObjective", project.getBusinessObjective() != null ? project.getBusinessObjective() : "Not Provided");
        content.put("expectedFeatures", project.getExpectedFeatures() != null ? project.getExpectedFeatures() : "Not Provided");
        content.put("requirements", project.getRequirements() != null ? project.getRequirements() : "Not Provided");
        content.put("risksAndAssumptions", List.of(
                "Scope clarification required with client prior to milestone definition",
                "Technical architecture and dependency feasibility must be evaluated",
                "Formal client approval of prototype required before development starts"
        ));
        content.put("recommendedNextSteps", List.of(
                "Project Manager reviews client submission and clarifies pending requirements",
                "Define preliminary milestones and select target team with workload matching",
                "Kick off Phase 4 prototype development"
        ));

        try {
            ProjectReport report = new ProjectReport(
                    project,
                    ReportType.INITIAL_ASSESSMENT,
                    title,
                    summary,
                    objectMapper.writeValueAsString(metrics),
                    objectMapper.writeValueAsString(content),
                    null,
                    true
            );
            reportRepository.save(report);
        } catch (Exception e) {
            // Ignore JSON serialization errors
        }
    }

    private void generateFinalClosureReport(Project project) {
        String title = "Final Project Closure Report - " + project.getTitle();
        String summary = "Comprehensive project completion summary verifying deliverables, budget variance, QA test pass rates, and client acceptance.";

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("finalStatus", "COMPLETED");
        metrics.put("approvedBudget", project.getApprovedBudget() != null ? project.getApprovedBudget() : 0.0);
        metrics.put("actualLoggedHours", project.getActualLoggedHours() != null ? project.getActualLoggedHours() : 0.0);
        metrics.put("progressPercentage", 100);

        Map<String, Object> content = new HashMap<>();
        content.put("deliverablesReview", "All core milestones and authorized project scope items have been successfully delivered and verified.");
        content.put("clientAcceptance", "Client accepted final prototype and deliverables.");

        try {
            ProjectReport report = new ProjectReport(
                    project,
                    ReportType.FINAL_CLOSURE,
                    title,
                    summary,
                    objectMapper.writeValueAsString(metrics),
                    objectMapper.writeValueAsString(content),
                    null,
                    true
            );
            reportRepository.save(report);
        } catch (Exception e) {
            // Ignore
        }
    }

    private long calculateDaysBetween(LocalDate start, LocalDate end) {
        if (start == null || end == null) return 0;
        return java.time.temporal.ChronoUnit.DAYS.between(start, end);
    }

    private String generateProjectCode(String title) {
        String clean = title != null ? title.replaceAll("[^a-zA-Z0-9]", " ").trim() : "PRJ";
        String[] parts = clean.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (!p.isEmpty()) sb.append(p.substring(0, Math.min(p.length(), 2)).toUpperCase());
        }
        if (sb.length() < 3) sb.append("PRJ");
        String prefix = sb.substring(0, Math.min(sb.length(), 4));
        long count = projectRepository.count() + 1;
        return prefix + String.format("-%03d", count);
    }

    private ProjectDto.ProjectResponse toProjectResponse(Project p) {
        var issues = taskIssueRepository.findByProjectId(p.getId());
        long openCount = issues.stream().filter(i -> !Set.of(IssueStatus.RESOLVED, IssueStatus.CLOSED).contains(i.getStatus())).count();
        long blockedCount = issues.stream().filter(i -> i.getStatus() == IssueStatus.BLOCKED).count();
        boolean hasApprovedPrototype = prototypeRepository.existsByProjectIdAndStatus(p.getId(), PrototypeStatus.CLIENT_APPROVED);

        return new ProjectDto.ProjectResponse(
                p.getId(),
                p.getTitle(),
                p.getProjectCode(),
                p.getDescription(),
                p.getBusinessObjective(),
                p.getExpectedFeatures(),
                p.getRequirements(),
                p.getClient() != null ? p.getClient().getId() : null,
                p.getClient() != null ? p.getClient().getName() : "Unknown",
                p.getClient() != null ? p.getClient().getEmail() : null,
                p.getProjectManager() != null ? p.getProjectManager().getId() : null,
                p.getProjectManager() != null ? p.getProjectManager().getName() : "Unassigned",
                p.getPrimaryTeam() != null ? p.getPrimaryTeam().getId() : null,
                p.getPrimaryTeam() != null ? p.getPrimaryTeam().getName() : "Unassigned",
                p.getStage(),
                p.getPriority(),
                p.getProposedBudget(),
                p.getApprovedBudget(),
                p.getCurrency(),
                p.getPlannedStartDate(),
                p.getActualStartDate(),
                p.getPlannedEndDate(),
                p.getForecastEndDate(),
                p.getActualEndDate(),
                p.getEstimatedHours(),
                p.getActualLoggedHours(),
                p.getProgressPercentage(),
                p.getDevelopmentAuthorizedAt() != null ? p.getDevelopmentAuthorizedAt().toString() : null,
                p.getDevelopmentAuthorizedBy() != null ? p.getDevelopmentAuthorizedBy().getName() : null,
                p.getDevelopmentNotes(),
                p.getDelayReason(),
                p.getReferenceDocuments(),
                p.isArchived(),
                p.getCreatedAt().toString(),
                openCount,
                blockedCount,
                hasApprovedPrototype,
                p.getFinalDeliverableNotes(),
                p.getDeploymentUrl(),
                p.getFinalReviewStatus(),
                p.getFinalSubmittedAt() != null ? p.getFinalSubmittedAt().toString() : null,
                p.getFinalSubmittedBy() != null ? p.getFinalSubmittedBy().getName() : null,
                p.getFinalReviewedAt() != null ? p.getFinalReviewedAt().toString() : null,
                p.getFinalReviewedBy() != null ? p.getFinalReviewedBy().getName() : null,
                p.getFinalReviewComments()
        );
    }

    private void validateTeamCapacityForAssignment(Team team) {
        Double activeHours = taskIssueRepository.sumEstimatedHoursActiveByTeamId(team.getId());
        double currentActive = activeHours != null ? activeHours : 0.0;
        double capacity = team.getWeeklyCapacityHours() != null && team.getWeeklyCapacityHours() > 0
                ? team.getWeeklyCapacityHours() : 160.0;
        double workload = (currentActive / capacity) * 100.0;
        if (workload >= 100.0) {
            throw new IllegalStateException("Capacity assignment rejected: Team '" + team.getName() + "' is Fully Occupied with " +
                    Math.round(workload) + "% workload (" + currentActive + " assigned hours / " + capacity + " hours capacity). " +
                    "The team lacks sufficient engineering capacity to take on new projects. Please assign an Available or Partially Occupied team.");
        }
    }
}

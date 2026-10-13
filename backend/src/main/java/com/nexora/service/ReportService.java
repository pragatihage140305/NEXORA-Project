package com.nexora.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import com.nexora.model.*;
import com.nexora.model.enums.*;
import com.nexora.repository.*;
import com.nexora.service.dto.ReportDto;
import com.nexora.websocket.RealtimeEventService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final ProjectReportRepository reportRepository;
    private final ProjectRepository projectRepository;
    private final TaskIssueRepository taskIssueRepository;
    private final TeamRepository teamRepository;
    private final PrototypeVersionRepository prototypeRepository;
    private final BudgetExpenseRepository expenseRepository;
    private final AuditService auditService;
    private final RealtimeEventService realtimeEventService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ReportService(ProjectReportRepository reportRepository,
                         ProjectRepository projectRepository,
                         TaskIssueRepository taskIssueRepository,
                         TeamRepository teamRepository,
                         PrototypeVersionRepository prototypeRepository,
                         BudgetExpenseRepository expenseRepository,
                         AuditService auditService,
                         RealtimeEventService realtimeEventService) {
        this.reportRepository = reportRepository;
        this.projectRepository = projectRepository;
        this.taskIssueRepository = taskIssueRepository;
        this.teamRepository = teamRepository;
        this.prototypeRepository = prototypeRepository;
        this.expenseRepository = expenseRepository;
        this.auditService = auditService;
        this.realtimeEventService = realtimeEventService;
    }

    @Transactional
    public ReportDto.ReportResponse generateReport(ReportDto.GenerateReportRequest request, User user) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + request.projectId()));

        ReportType type = request.reportType();
        String title = formatReportTitle(type, project.getTitle());
        String summary = generateReportSummary(type, project, request.customNotes());

        Map<String, Object> metrics = buildReportMetrics(type, project);
        Map<String, Object> content = buildReportContent(type, project, request.customNotes());

        try {
            ProjectReport report = new ProjectReport(
                    project,
                    type,
                    title,
                    summary,
                    objectMapper.writeValueAsString(metrics),
                    objectMapper.writeValueAsString(content),
                    user,
                    false
            );
            ProjectReport saved = reportRepository.save(report);

            auditService.logAction(user, "GENERATE_REPORT", "REPORT", saved.getId(),
                    "Generated " + type + " report for " + project.getTitle(), null);

            realtimeEventService.broadcastProjectEvent(project.getId(), "REPORT_GENERATED", saved.getId());

            return ReportDto.ReportResponse.from(saved);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate report: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public List<ReportDto.ReportResponse> getReportsForProject(Long projectId) {
        return reportRepository.findByProjectIdOrderByGeneratedAtDesc(projectId).stream()
                .map(ReportDto.ReportResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReportDto.ReportResponse> getAllReports() {
        return reportRepository.findAll().stream()
                .sorted(Comparator.comparing(ProjectReport::getGeneratedAt).reversed())
                .map(ReportDto.ReportResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReportDto.ReportResponse getReportById(Long id) {
        ProjectReport report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        return ReportDto.ReportResponse.from(report);
    }

    // PDF Export using OpenPDF
    @Transactional(readOnly = true)
    public byte[] generatePdfReport(Long reportId) {
        ProjectReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        Project project = report.getProject();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Header Banner
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(15, 23, 42));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(30, 41, 59));
            Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(51, 65, 85));
            Font boldText = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, new Color(15, 23, 42));

            Paragraph header = new Paragraph("NEXORA ENTERPRISE PLATFORM", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(37, 99, 235)));
            header.setAlignment(Element.ALIGN_RIGHT);
            document.add(header);

            Paragraph title = new Paragraph(report.getTitle(), titleFont);
            title.setSpacingBefore(10);
            document.add(title);

            Paragraph meta = new Paragraph("Project: " + project.getTitle() + " (" + project.getProjectCode() + ")  |  Generated: " + report.getGeneratedAt() + "  |  Type: " + report.getReportType(), subTitleFont);
            meta.setSpacingAfter(15);
            document.add(meta);

            // Summary Section
            Paragraph sec1 = new Paragraph("Executive Summary", sectionFont);
            sec1.setSpacingAfter(6);
            document.add(sec1);

            Paragraph summaryPara = new Paragraph(report.getSummary() != null ? report.getSummary() : "No summary provided.", textFont);
            summaryPara.setSpacingAfter(15);
            document.add(summaryPara);

            // Project Details Table
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10);
            table.setSpacingAfter(15);

            addTableRow(table, "Project Stage", project.getStage().name(), boldText, textFont);
            addTableRow(table, "Client", project.getClient() != null ? project.getClient().getName() : "N/A", boldText, textFont);
            addTableRow(table, "Project Manager", project.getProjectManager() != null ? project.getProjectManager().getName() : "Unassigned", boldText, textFont);
            addTableRow(table, "Assigned Team", project.getPrimaryTeam() != null ? project.getPrimaryTeam().getName() : "Unassigned", boldText, textFont);
            addTableRow(table, "Proposed Budget", (project.getProposedBudget() != null ? project.getProposedBudget() : "0.0") + " " + project.getCurrency(), boldText, textFont);
            addTableRow(table, "Approved Budget", (project.getApprovedBudget() != null ? project.getApprovedBudget() : "0.0") + " " + project.getCurrency(), boldText, textFont);
            addTableRow(table, "Logged Hours / Estimated", project.getActualLoggedHours() + " / " + project.getEstimatedHours() + " hrs", boldText, textFont);
            addTableRow(table, "Completion Progress", project.getProgressPercentage() + "%", boldText, textFont);
            document.add(table);

            // Issues Breakdown
            var issues = taskIssueRepository.findByProjectId(project.getId());
            Paragraph sec2 = new Paragraph("Associated Issues & Delivery Status (" + issues.size() + " total)", sectionFont);
            sec2.setSpacingBefore(10);
            sec2.setSpacingAfter(6);
            document.add(sec2);

            PdfPTable issueTable = new PdfPTable(5);
            issueTable.setWidthPercentage(100);
            issueTable.setWidths(new float[]{2f, 4f, 2f, 2f, 2f});
            addTableHeader(issueTable, "Key", "Title", "Type", "Priority", "Status");

            for (TaskIssue i : issues.stream().limit(15).collect(Collectors.toList())) {
                addTableCell(issueTable, i.getIssueKey(), textFont);
                addTableCell(issueTable, i.getTitle(), textFont);
                addTableCell(issueTable, i.getType().name(), textFont);
                addTableCell(issueTable, i.getPriority().name(), textFont);
                addTableCell(issueTable, i.getStatus().name(), textFont);
            }
            document.add(issueTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error rendering PDF report: " + e.getMessage(), e);
        }
    }

    // Excel Export using Apache POI
    @Transactional(readOnly = true)
    public byte[] generateExcelReport(Long reportId) {
        ProjectReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        Project project = report.getProject();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Report Summary");

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Title Row
            org.apache.poi.ss.usermodel.Row titleRow = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(report.getTitle());

            sheet.createRow(1).createCell(0).setCellValue("Project Code: " + project.getProjectCode());
            sheet.createRow(2).createCell(0).setCellValue("Report Type: " + report.getReportType());
            sheet.createRow(3).createCell(0).setCellValue("Generated At: " + report.getGeneratedAt());

            // Project Attributes
            sheet.createRow(5).createCell(0).setCellValue("Key Attributes");
            sheet.getRow(5).getCell(0).setCellStyle(headerStyle);

            String[][] attrs = {
                    {"Project Stage", project.getStage().name()},
                    {"Client", project.getClient() != null ? project.getClient().getName() : "N/A"},
                    {"Project Manager", project.getProjectManager() != null ? project.getProjectManager().getName() : "N/A"},
                    {"Primary Team", project.getPrimaryTeam() != null ? project.getPrimaryTeam().getName() : "N/A"},
                    {"Approved Budget", String.valueOf(project.getApprovedBudget())},
                    {"Estimated Hours", String.valueOf(project.getEstimatedHours())},
                    {"Actual Logged Hours", String.valueOf(project.getActualLoggedHours())},
                    {"Progress %", String.valueOf(project.getProgressPercentage())}
            };

            int rowIdx = 6;
            for (String[] attr : attrs) {
                org.apache.poi.ss.usermodel.Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(attr[0]);
                r.createCell(1).setCellValue(attr[1]);
            }

            // Issues Sheet
            org.apache.poi.ss.usermodel.Sheet issueSheet = workbook.createSheet("Issues & Tasks");
            org.apache.poi.ss.usermodel.Row issueHeader = issueSheet.createRow(0);
            String[] colNames = {"Issue Key", "Title", "Type", "Priority", "Status", "Assignee", "Est Hours", "Logged Hours", "QA Passed"};
            for (int i = 0; i < colNames.length; i++) {
                org.apache.poi.ss.usermodel.Cell c = issueHeader.createCell(i);
                c.setCellValue(colNames[i]);
                c.setCellStyle(headerStyle);
            }

            var issues = taskIssueRepository.findByProjectId(project.getId());
            int iRow = 1;
            for (TaskIssue i : issues) {
                org.apache.poi.ss.usermodel.Row r = issueSheet.createRow(iRow++);
                r.createCell(0).setCellValue(i.getIssueKey());
                r.createCell(1).setCellValue(i.getTitle());
                r.createCell(2).setCellValue(i.getType().name());
                r.createCell(3).setCellValue(i.getPriority().name());
                r.createCell(4).setCellValue(i.getStatus().name());
                r.createCell(5).setCellValue(i.getAssignee() != null ? i.getAssignee().getName() : "Unassigned");
                r.createCell(6).setCellValue(i.getEstimatedHours() != null ? i.getEstimatedHours() : 0.0);
                r.createCell(7).setCellValue(i.getLoggedHours() != null ? i.getLoggedHours() : 0.0);
                r.createCell(8).setCellValue(i.isQaPassed() ? "YES" : "NO");
            }

            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            for (int i = 0; i < colNames.length; i++) issueSheet.autoSizeColumn(i);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error rendering Excel report: " + e.getMessage(), e);
        }
    }

    // Expense Management
    @Transactional
    public ReportDto.ExpenseResponse createExpense(ReportDto.CreateExpenseRequest request, User user) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + request.projectId()));

        LocalDate date = request.expenseDate() != null && !request.expenseDate().isBlank()
                ? LocalDate.parse(request.expenseDate()) : LocalDate.now();

        BudgetExpense expense = new BudgetExpense(
                project,
                request.category(),
                request.amount(),
                request.currency() != null ? request.currency() : project.getCurrency(),
                request.description(),
                user,
                date
        );
        BudgetExpense saved = expenseRepository.save(expense);

        auditService.logAction(user, "CREATE_EXPENSE", "EXPENSE", saved.getId(),
                "Recorded expense: " + saved.getAmount() + " " + saved.getCurrency() + " [" + saved.getCategory() + "]", null);

        realtimeEventService.broadcastProjectEvent(project.getId(), "EXPENSE_RECORDED", saved.getId());

        return new ReportDto.ExpenseResponse(
                saved.getId(),
                project.getId(),
                project.getTitle(),
                saved.getCategory(),
                saved.getAmount(),
                saved.getCurrency(),
                saved.getDescription(),
                user.getName(),
                saved.getExpenseDate().toString(),
                saved.getCreatedAt().toString()
        );
    }

    @Transactional(readOnly = true)
    public List<ReportDto.ExpenseResponse> getExpensesForProject(Long projectId) {
        return expenseRepository.findByProjectIdOrderByExpenseDateDesc(projectId).stream()
                .map(e -> new ReportDto.ExpenseResponse(
                        e.getId(),
                        e.getProject().getId(),
                        e.getProject().getTitle(),
                        e.getCategory(),
                        e.getAmount(),
                        e.getCurrency(),
                        e.getDescription(),
                        e.getRecordedBy() != null ? e.getRecordedBy().getName() : "System",
                        e.getExpenseDate().toString(),
                        e.getCreatedAt().toString()
                ))
                .collect(Collectors.toList());
    }

    // Scheduled background automation (runs every midnight to generate progress snapshots)
    @Scheduled(cron = "0 0 0 * * ?")
    public void runScheduledProjectSnapshots() {
        List<Project> activeProjects = projectRepository.findByStage(ProjectStage.IN_DEVELOPMENT);
        for (Project p : activeProjects) {
            try {
                generateReport(new ReportDto.GenerateReportRequest(p.getId(), ReportType.DEVELOPMENT_PROGRESS, "Scheduled Daily Development Snapshot"), null);
            } catch (Exception e) {
                // Log and continue
            }
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, Font labelFont, Font valFont) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setBackgroundColor(new Color(248, 250, 252));
        c1.setPadding(6);
        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "N/A", valFont));
        c2.setPadding(6);
        table.addCell(c1);
        table.addCell(c2);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, f));
            c.setBackgroundColor(new Color(37, 99, 235));
            c.setPadding(5);
            table.addCell(c);
        }
    }

    private void addTableCell(PdfPTable table, String text, Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setPadding(4);
        table.addCell(c);
    }

    private String formatReportTitle(ReportType type, String projectTitle) {
        String typeName = switch (type) {
            case INITIAL_ASSESSMENT -> "Initial Project Assessment Report";
            case PLANNING -> "Project Planning Report";
            case BUDGET_COST -> "Budget and Cost Report";
            case TEAM_WORKLOAD -> "Team Workload Report";
            case PROTOTYPE_REVIEW -> "Prototype Review Report";
            case DEVELOPMENT_PROGRESS -> "Development Progress Report";
            case ISSUE_BUG -> "Issue and Bug Report";
            case TIMELINE_DEADLINE -> "Timeline and Deadline Report";
            case TESTING_QA -> "Testing and QA Report";
            case FINAL_CLOSURE -> "Final Project Closure Report";
        };
        return typeName + " - " + projectTitle;
    }

    private String generateReportSummary(ReportType type, Project p, String customNotes) {
        String base = switch (type) {
            case INITIAL_ASSESSMENT -> "Preliminary assessment of requirements, proposed budget (" + p.getProposedBudget() + " " + p.getCurrency() + "), and target timelines.";
            case PLANNING -> "Detailed project plan with defined milestones, team allocation (" + (p.getPrimaryTeam() != null ? p.getPrimaryTeam().getName() : "Unassigned") + "), and approved budget.";
            case BUDGET_COST -> "Financial health analysis comparing approved budget (" + p.getApprovedBudget() + ") against recorded expenses and logged resource costs.";
            case TEAM_WORKLOAD -> "Resource utilization, capacity vs assigned work hours, and availability status for responsible delivery teams.";
            case PROTOTYPE_REVIEW -> "Evaluation of prototype deliverables, UX wireframes, client revisions, and approval gate clearance.";
            case DEVELOPMENT_PROGRESS -> "Execution velocity report tracking completed vs remaining tasks, current progress (" + p.getProgressPercentage() + "%).";
            case ISSUE_BUG -> "Quality and issue metrics breaking down bug severity, blocked tasks, and resolution velocity.";
            case TIMELINE_DEADLINE -> "Schedule variance report tracking planned vs forecast completion dates and milestone health.";
            case TESTING_QA -> "Quality assurance test execution results, pass rates, reopened defects, and release readiness.";
            case FINAL_CLOSURE -> "Formal project closure report verifying client acceptance, deliverable handoff, and performance metrics.";
        };
        return customNotes != null && !customNotes.isBlank() ? base + " Notes: " + customNotes : base;
    }

    private Map<String, Object> buildReportMetrics(ReportType type, Project p) {
        Map<String, Object> m = new HashMap<>();
        m.put("projectCode", p.getProjectCode());
        m.put("stage", p.getStage().name());
        m.put("progressPercentage", p.getProgressPercentage());
        m.put("estimatedHours", p.getEstimatedHours());
        m.put("actualLoggedHours", p.getActualLoggedHours());
        m.put("approvedBudget", p.getApprovedBudget() != null ? p.getApprovedBudget() : 0.0);
        Double expenses = expenseRepository.sumAmountByProjectId(p.getId());
        m.put("recordedExpenses", expenses != null ? expenses : 0.0);
        return m;
    }

    private Map<String, Object> buildReportContent(ReportType type, Project p, String customNotes) {
        Map<String, Object> c = new HashMap<>();
        c.put("businessObjective", p.getBusinessObjective() != null ? p.getBusinessObjective() : "Standard operational requirements");
        c.put("expectedFeatures", p.getExpectedFeatures() != null ? p.getExpectedFeatures() : "Full enterprise scope deliverables");
        c.put("notes", customNotes);
        return c;
    }
}

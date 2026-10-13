package com.nexora.controller;

import com.nexora.model.User;
import com.nexora.security.SecurityUtils;
import com.nexora.service.ReportService;
import com.nexora.service.dto.ReportDto;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final SecurityUtils securityUtils;

    public ReportController(ReportService reportService, SecurityUtils securityUtils) {
        this.reportService = reportService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<List<ReportDto.ReportResponse>> getReports(
            @RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            return ResponseEntity.ok(reportService.getReportsForProject(projectId));
        }
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReportDto.ReportResponse> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @PostMapping
    public ResponseEntity<ReportDto.ReportResponse> generateReport(@RequestBody ReportDto.GenerateReportRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(reportService.generateReport(request, user));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        byte[] pdfBytes = reportService.generatePdfReport(id);
        ReportDto.ReportResponse report = reportService.getReportById(id);

        String filename = "Nexora-Report-" + report.projectCode() + "-" + report.reportType() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @GetMapping("/{id}/excel")
    public ResponseEntity<byte[]> downloadExcel(@PathVariable Long id) {
        byte[] excelBytes = reportService.generateExcelReport(id);
        ReportDto.ReportResponse report = reportService.getReportById(id);

        String filename = "Nexora-Report-" + report.projectCode() + "-" + report.reportType() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/projects/{projectId}/expenses")
    public ResponseEntity<List<ReportDto.ExpenseResponse>> getExpenses(@PathVariable Long projectId) {
        return ResponseEntity.ok(reportService.getExpensesForProject(projectId));
    }

    @PostMapping("/projects/{projectId}/expenses")
    public ResponseEntity<ReportDto.ExpenseResponse> createExpense(
            @PathVariable Long projectId,
            @RequestBody ReportDto.CreateExpenseRequest request) {
        User user = securityUtils.getCurrentUserOrThrow();
        return ResponseEntity.ok(reportService.createExpense(request, user));
    }
}

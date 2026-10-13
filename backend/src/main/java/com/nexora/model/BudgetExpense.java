package com.nexora.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "budget_expenses")
public class BudgetExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    // Categories: Development, Infrastructure, Licensing, UI/UX Design, QA Testing, Operations
    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double amount;

    private String currency = "USD";

    @Column(length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recorded_by_id")
    private User recordedBy;

    @Column(nullable = false)
    private LocalDate expenseDate = LocalDate.now();

    private LocalDateTime createdAt = LocalDateTime.now();

    public BudgetExpense() {}

    public BudgetExpense(Project project, String category, Double amount, String currency, String description, User recordedBy, LocalDate expenseDate) {
        this.project = project;
        this.category = category;
        this.amount = amount;
        this.currency = currency != null ? currency : "USD";
        this.description = description;
        this.recordedBy = recordedBy;
        this.expenseDate = expenseDate != null ? expenseDate : LocalDate.now();
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

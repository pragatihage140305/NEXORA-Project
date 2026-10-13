package com.nexora.repository;

import com.nexora.model.BudgetExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetExpenseRepository extends JpaRepository<BudgetExpense, Long> {
    List<BudgetExpense> findByProjectIdOrderByExpenseDateDesc(Long projectId);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM BudgetExpense b WHERE b.project.id = :projectId")
    Double sumAmountByProjectId(@Param("projectId") Long projectId);

    @Query("SELECT COALESCE(SUM(b.amount), 0) FROM BudgetExpense b")
    Double sumTotalOrganizationExpenses();
}

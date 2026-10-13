package com.nexora.repository;

import com.nexora.model.TaskIssue;
import com.nexora.model.enums.IssueStatus;
import com.nexora.model.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskIssueRepository extends JpaRepository<TaskIssue, Long> {
    Optional<TaskIssue> findByIssueKey(String issueKey);
    boolean existsByIssueKey(String issueKey);

    List<TaskIssue> findByProjectId(Long projectId);
    List<TaskIssue> findByAssigneeId(Long assigneeId);
    List<TaskIssue> findByTeamId(Long teamId);
    List<TaskIssue> findByStatus(IssueStatus status);
    List<TaskIssue> findByProjectIdAndStatus(Long projectId, IssueStatus status);
    List<TaskIssue> findByMilestoneId(Long milestoneId);

    @Query("SELECT i FROM TaskIssue i WHERE i.team.id = :teamId AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    List<TaskIssue> findActiveByTeamId(@Param("teamId") Long teamId);

    @Query("SELECT i FROM TaskIssue i WHERE i.assignee.id = :assigneeId AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    List<TaskIssue> findActiveByAssigneeId(@Param("assigneeId") Long assigneeId);

    @Query("SELECT COUNT(i) FROM TaskIssue i WHERE i.status = :status")
    long countByStatus(@Param("status") IssueStatus status);

    @Query("SELECT COUNT(i) FROM TaskIssue i WHERE i.status = 'BLOCKED'")
    long countBlocked();

    @Query("SELECT COUNT(i) FROM TaskIssue i WHERE i.dueDate < :today AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    long countOverdue(@Param("today") LocalDate today);

    @Query("SELECT COUNT(i) FROM TaskIssue i WHERE i.priority = 'CRITICAL' AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    long countCriticalOpen();

    @Query("SELECT COALESCE(SUM(i.estimatedHours), 0) FROM TaskIssue i WHERE i.team.id = :teamId AND i.status NOT IN ('RESOLVED', 'CLOSED')")
    Double sumEstimatedHoursActiveByTeamId(@Param("teamId") Long teamId);
}

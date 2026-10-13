package com.nexora.repository;

import com.nexora.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    List<TimeLog> findByIssueIdOrderByWorkDateDesc(Long issueId);
    List<TimeLog> findByUserId(Long userId);

    @Query("SELECT COALESCE(SUM(t.hoursLogged), 0) FROM TimeLog t WHERE t.issue.id = :issueId")
    Double sumHoursByIssueId(@Param("issueId") Long issueId);

    @Query("SELECT COALESCE(SUM(t.hoursLogged), 0) FROM TimeLog t WHERE t.issue.project.id = :projectId")
    Double sumHoursByProjectId(@Param("projectId") Long projectId);
}

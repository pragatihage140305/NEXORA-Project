package com.nexora.repository;

import com.nexora.model.Milestone;
import com.nexora.model.enums.MilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdOrderBySequenceOrderAsc(Long projectId);
    List<Milestone> findByProjectIdAndStatus(Long projectId, MilestoneStatus status);
}

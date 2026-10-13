package com.nexora.repository;

import com.nexora.model.Project;
import com.nexora.model.enums.ProjectStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectCode(String projectCode);
    boolean existsByProjectCode(String projectCode);

    List<Project> findByClientId(Long clientId);
    List<Project> findByProjectManagerId(Long pmId);
    List<Project> findByPrimaryTeamId(Long teamId);
    List<Project> findByPrimaryTeamIdIn(List<Long> teamIds);
    List<Project> findByStage(ProjectStage stage);
    List<Project> findByArchivedFalse();

    @Query("SELECT p FROM Project p WHERE p.archived = false AND (p.client.id = :userId OR p.projectManager.id = :userId)")
    List<Project> findByUserInvolved(@Param("userId") Long userId);

    long countByStage(ProjectStage stage);
}

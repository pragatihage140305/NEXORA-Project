package com.nexora.repository;

import com.nexora.model.PrototypeVersion;
import com.nexora.model.enums.PrototypeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrototypeVersionRepository extends JpaRepository<PrototypeVersion, Long> {
    List<PrototypeVersion> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    Optional<PrototypeVersion> findFirstByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<PrototypeVersion> findByProjectIdAndStatus(Long projectId, PrototypeStatus status);
    boolean existsByProjectIdAndStatus(Long projectId, PrototypeStatus status);
    long countByStatus(PrototypeStatus status);
    List<PrototypeVersion> findAllByOrderByCreatedAtDesc();
    List<PrototypeVersion> findByProjectClientIdOrderByCreatedAtDesc(Long clientId);
    List<PrototypeVersion> findByProjectPrimaryTeamIdInOrderByCreatedAtDesc(List<Long> teamIds);
}

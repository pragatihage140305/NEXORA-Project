package com.nexora.repository;

import com.nexora.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByCode(String code);
    default Optional<Team> findByTeamCode(String teamCode) {
        return findByCode(teamCode);
    }
    boolean existsByCode(String code);
    List<Team> findByActiveTrue();
    List<Team> findByTeamLeadId(Long teamLeadId);
}

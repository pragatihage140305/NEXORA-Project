package com.nexora.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_members", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"team_id", "user_id"})
})
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    @JsonBackReference
    private Team team;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Configurable job role: "Frontend Developer", "Backend Developer", "UI/UX Designer", "QA Engineer", "DevOps Engineer", etc.
    @Column(nullable = false)
    private String teamRole;

    private Double allocatedHoursPerWeek = 40.0;

    private LocalDateTime joinedAt = LocalDateTime.now();

    public TeamMember() {}

    public TeamMember(Team team, User user, String teamRole, Double allocatedHoursPerWeek) {
        this.team = team;
        this.user = user;
        this.teamRole = teamRole;
        this.allocatedHoursPerWeek = allocatedHoursPerWeek != null ? allocatedHoursPerWeek : 40.0;
        this.joinedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getTeamRole() { return teamRole; }
    public void setTeamRole(String teamRole) { this.teamRole = teamRole; }

    public Double getAllocatedHoursPerWeek() { return allocatedHoursPerWeek; }
    public void setAllocatedHoursPerWeek(Double allocatedHoursPerWeek) { this.allocatedHoursPerWeek = allocatedHoursPerWeek; }

    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
}

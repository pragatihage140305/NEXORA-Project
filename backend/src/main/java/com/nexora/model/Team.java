package com.nexora.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(length = 2000)
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_lead_id")
    private User teamLead;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<TeamMember> members = new ArrayList<>();

    // Comma-separated or tags of skills: e.g. "React, TypeScript, Java, Spring Boot, MySQL"
    private String skills;

    // Total weekly capacity in hours (e.g. 160.0 hours for 4 full-time members)
    private Double weeklyCapacityHours = 160.0;

    // Status: AVAILABLE, PARTIALLY_BOOKED, HIGH_LOAD, OVERLOADED, INACTIVE
    private String availabilityStatus = "AVAILABLE";

    @Column(length = 2000)
    private String notes;

    private boolean active = true;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Team() {}

    public Team(String name, String code, String description, User teamLead, String skills, Double weeklyCapacityHours) {
        this.name = name;
        this.code = code;
        this.description = description;
        this.teamLead = teamLead;
        this.skills = skills;
        this.weeklyCapacityHours = weeklyCapacityHours != null ? weeklyCapacityHours : 160.0;
        this.availabilityStatus = "AVAILABLE";
        this.active = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addMember(TeamMember member) {
        members.add(member);
        member.setTeam(this);
    }

    public void removeMember(TeamMember member) {
        members.remove(member);
        member.setTeam(null);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getTeamLead() { return teamLead; }
    public void setTeamLead(User teamLead) { this.teamLead = teamLead; }

    public List<TeamMember> getMembers() { return members; }
    public void setMembers(List<TeamMember> members) { this.members = members; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public Double getWeeklyCapacityHours() { return weeklyCapacityHours; }
    public void setWeeklyCapacityHours(Double weeklyCapacityHours) { this.weeklyCapacityHours = weeklyCapacityHours; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

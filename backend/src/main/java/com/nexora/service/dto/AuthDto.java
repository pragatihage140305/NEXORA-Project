package com.nexora.service.dto;

import com.nexora.model.User;
import com.nexora.model.enums.UserRole;

public class AuthDto {

    public record LoginRequest(String email, String password) {}

    public record RegisterRequest(String name, String email, String password, UserRole role, String jobTitle, String department) {}

    public record LoginResponse(
            Long id,
            String name,
            String email,
            UserRole role,
            String jobTitle,
            String department,
            String avatarUrl,
            String token
    ) {
        public static LoginResponse fromUser(User user, String token) {
            return new LoginResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getJobTitle(),
                    user.getDepartment(),
                    user.getAvatarUrl(),
                    token
            );
        }
    }

    public record UserSummary(
            Long id,
            String name,
            String email,
            UserRole role,
            String jobTitle,
            String department,
            Double hourlyRate,
            boolean active
    ) {
        public static UserSummary from(User user) {
            return new UserSummary(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole(),
                    user.getJobTitle(),
                    user.getDepartment(),
                    user.getHourlyRate(),
                    user.isActive()
            );
        }
    }
}

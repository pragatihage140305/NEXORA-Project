package com.nexora.controller;

import com.nexora.model.User;
import com.nexora.model.enums.UserRole;
import com.nexora.repository.UserRepository;
import com.nexora.security.JwtUtils;
import com.nexora.security.SecurityUtils;
import com.nexora.service.AuditService;
import com.nexora.service.dto.AuthDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final SecurityUtils securityUtils;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.jwt.cookie-name:nexora_token}")
    private String cookieName;

    @Value("${app.jwt.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.jwt.expiration-ms:86400000}")
    private int jwtExpirationMs;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          JwtUtils jwtUtils,
                          SecurityUtils securityUtils,
                          PasswordEncoder passwordEncoder,
                          AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.securityUtils = securityUtils;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthDto.LoginRequest request, HttpServletResponse response) {
        if (request.email() == null || request.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().toLowerCase().trim(), request.password())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtils.generateTokenFromEmail(user.getEmail(), user.getRole().name());

        // Set secure HttpOnly cookie
        Cookie cookie = new Cookie(cookieName, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(jwtExpirationMs / 1000);
        response.addCookie(cookie);

        return ResponseEntity.ok(AuthDto.LoginResponse.fromUser(user, token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthDto.RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        if (request.email() == null || request.password() == null || request.name() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required"));
        }

        String email = request.email().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(409).body(Map.of("error", "Email is already registered. Please login instead."));
        }

        UserRole role = request.role() != null ? request.role() : UserRole.ROLE_CLIENT;
        String jobTitle = (request.jobTitle() != null && !request.jobTitle().isBlank()) ? request.jobTitle().trim() : "Member";
        String department = (request.department() != null && !request.department().isBlank()) ? request.department().trim() : "General";

        User newUser = new User(
                request.name().trim(),
                email,
                passwordEncoder.encode(request.password()),
                role,
                jobTitle,
                department
        );
        User savedUser = userRepository.save(newUser);

        try {
            auditService.logAction(savedUser, "REGISTER", "USER", savedUser.getId(),
                    "New account created with role " + savedUser.getRole().name(), httpRequest.getRemoteAddr());
        } catch (Exception ignored) {}

        String token = jwtUtils.generateTokenFromEmail(savedUser.getEmail(), savedUser.getRole().name());

        Cookie cookie = new Cookie(cookieName, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(jwtExpirationMs / 1000);
        response.addCookie(cookie);

        return ResponseEntity.ok(AuthDto.LoginResponse.fromUser(savedUser, token));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie(cookieName, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        return securityUtils.getCurrentUser()
                .map(user -> ResponseEntity.ok(AuthDto.UserSummary.from(user)))
                .orElseGet(() -> ResponseEntity.status(401).body(null));
    }

    @GetMapping("/users")
    public ResponseEntity<List<AuthDto.UserSummary>> getAllUsers() {
        List<AuthDto.UserSummary> users = userRepository.findByActiveTrue().stream()
                .map(AuthDto.UserSummary::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}

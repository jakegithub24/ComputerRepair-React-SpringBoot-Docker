package com.repairshop.service;

import com.repairshop.model.User;
import com.repairshop.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Seeds the default admin account on application startup if no ADMIN user exists.
 * Default credentials: username="admin", password="Admin@123" (hashed with Argon2id).
 * Requirement 9.1
 */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@repairshop.local";
    private static final String ADMIN_DEFAULT_PASSWORD = "Admin@123";
    private static final String ADMIN_ROLE = "ADMIN";

    private final UserRepository userRepository;
    private final AuthService authService;

    public AdminSeeder(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByRole(ADMIN_ROLE).isEmpty()) {
            String passwordHash = authService.hashPassword(ADMIN_DEFAULT_PASSWORD);
            User admin = new User(ADMIN_USERNAME, ADMIN_EMAIL, passwordHash, ADMIN_ROLE, Instant.now().toString());
            userRepository.save(admin);
        }
    }
}

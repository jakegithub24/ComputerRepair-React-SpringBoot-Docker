package com.repairshop;

import com.repairshop.model.User;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.AdminSeeder;
import com.repairshop.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for AdminSeeder.
 * Verifies seeding runs only when no admin exists.
 * Requirement 9.1
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminSeederTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void enableForeignKeys() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
    }

    @Test
    void adminSeederCreatesAdminWhenNoneExists() {
        // Remove any existing admin to simulate first startup
        userRepository.findByRole("ADMIN").ifPresent(admin -> userRepository.deleteById(admin.getId()));

        AdminSeeder seeder = new AdminSeeder(userRepository, authService);
        seeder.run(null);

        Optional<User> admin = userRepository.findByRole("ADMIN");
        assertThat(admin).isPresent();
        assertThat(admin.get().getUsername()).isEqualTo("admin");
        assertThat(admin.get().getRole()).isEqualTo("ADMIN");
        assertThat(admin.get().getPasswordHash()).startsWith("$argon2id$");
        assertThat(authService.verifyPassword("Admin@123", admin.get().getPasswordHash())).isTrue();
    }

    @Test
    void adminSeederDoesNotCreateDuplicateWhenAdminExists() {
        // Ensure at least one admin exists
        Optional<User> existingAdmin = userRepository.findByRole("ADMIN");
        if (existingAdmin.isEmpty()) {
            String hash = authService.hashPassword("Admin@123");
            userRepository.save(new User("admin", "admin@repairshop.local", hash, "ADMIN", Instant.now().toString()));
        }

        long countBefore = countAdmins();

        AdminSeeder seeder = new AdminSeeder(userRepository, authService);
        seeder.run(null);

        long countAfter = countAdmins();
        assertThat(countAfter).isEqualTo(countBefore);
    }

    private long countAdmins() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE role = 'ADMIN'", Long.class);
    }
}

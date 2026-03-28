package com.repairshop.property;

// Feature: computer-repair-shop, Property 1: Valid registration creates a user
// Validates: Requirements 2.1

import com.repairshop.dto.RegisterRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class ValidRegistrationPropertyTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void enableForeignKeys() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
    }

    /**
     * Property 1: Valid registration creates a user.
     *
     * For any unique username, valid email address, and password meeting complexity
     * rules, submitting a registration request should succeed and the user should
     * subsequently exist in the system.
     *
     * Validates: Requirements 2.1
     */
    @Test
    void validRegistrationCreatesUser() {
        for (int i = 0; i < 100; i++) {
            String username = "user_" + i + "_" + System.nanoTime();
            String email = username + "@example.com";
            String password = "Password1!" + i;

            UserResponse response = userService.register(new RegisterRequest(username, email, password));

            assertThat(response.id())
                    .as("Returned UserResponse must have a non-null id for iteration %d", i)
                    .isNotNull();

            final int iteration = i;
            assertThat(userRepository.findByUsername(username))
                    .as("User must be present in repository after registration for iteration %d", iteration)
                    .isPresent()
                    .hasValueSatisfying(user ->
                            assertThat(user.getPasswordHash())
                                    .as("Password hash must start with $argon2id$ for iteration %d", iteration)
                                    .startsWith("$argon2id$")
                    );

            // Clean up after each iteration
            userRepository.deleteById(response.id());
        }
    }
}

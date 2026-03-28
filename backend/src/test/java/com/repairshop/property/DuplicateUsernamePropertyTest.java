package com.repairshop.property;

// Feature: computer-repair-shop, Property 2: Duplicate username is rejected
// Validates: Requirements 2.2

import com.repairshop.dto.RegisterRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.exception.DuplicateUsernameException;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DuplicateUsernamePropertyTest {

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
     * Property 2: Duplicate username is rejected.
     *
     * For any username that already exists in the system, attempting to register
     * again with that username should throw a DuplicateUsernameException regardless
     * of the email or password provided.
     *
     * Validates: Requirements 2.2
     */
    @Test
    void duplicateUsernameIsRejected() {
        for (int i = 0; i < 100; i++) {
            String username = "dupuser_" + i + "_" + System.nanoTime();
            String firstEmail = username + "@first.com";
            String secondEmail = username + "@second.com";
            String firstPassword = "Password1!first";
            String secondPassword = "Password2@second";

            // Register the user for the first time — must succeed
            UserResponse first = userService.register(new RegisterRequest(username, firstEmail, firstPassword));

            try {
                // Attempt to register again with the same username but different email/password
                assertThatThrownBy(() ->
                        userService.register(new RegisterRequest(username, secondEmail, secondPassword))
                )
                        .as("Second registration with duplicate username '%s' (iteration %d) must throw DuplicateUsernameException", username, i)
                        .isInstanceOf(DuplicateUsernameException.class);
            } finally {
                // Clean up after each iteration
                userRepository.deleteById(first.id());
            }
        }
    }
}

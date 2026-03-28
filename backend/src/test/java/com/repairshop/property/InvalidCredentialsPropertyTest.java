package com.repairshop.property;

// Feature: computer-repair-shop, Property 7: Invalid credentials return 401
// Validates: Requirements 3.2, 9.3

import com.repairshop.dto.RegisterRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.exception.AuthenticationException;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.AuthService;
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
class InvalidCredentialsPropertyTest {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void enableForeignKeys() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
    }

    /**
     * Property 7: Invalid credentials return 401.
     *
     * For any login attempt using a non-existent username or an incorrect password,
     * the response should be 401 Unauthorized (AuthenticationException), and the
     * response body should not indicate which field was wrong.
     *
     * Validates: Requirements 3.2, 9.3
     */
    @Test
    void nonExistentUsernameReturns401() {
        for (int i = 0; i < 50; i++) {
            final String nonExistentUsername = "nonexistent_user_" + i + "_" + System.nanoTime();
            final int iteration = i;

            assertThatThrownBy(() -> authService.login(nonExistentUsername, "Password1!"))
                    .as("Login with non-existent username (iteration %d) must throw AuthenticationException", iteration)
                    .isInstanceOf(AuthenticationException.class);
        }
    }

    @Test
    void wrongPasswordReturns401() {
        for (int i = 0; i < 50; i++) {
            String username = "wrongpwd_user_" + i + "_" + System.nanoTime();
            String email = username + "@example.com";
            String correctPassword = "Password1!" + i;
            String wrongPassword = "WrongPass9@" + i;

            UserResponse registered = userService.register(new RegisterRequest(username, email, correctPassword));

            try {
                final int iteration = i;
                assertThatThrownBy(() -> authService.login(username, wrongPassword))
                        .as("Login with wrong password (iteration %d) must throw AuthenticationException", iteration)
                        .isInstanceOf(AuthenticationException.class);
            } finally {
                userRepository.deleteById(registered.id());
            }
        }
    }
}

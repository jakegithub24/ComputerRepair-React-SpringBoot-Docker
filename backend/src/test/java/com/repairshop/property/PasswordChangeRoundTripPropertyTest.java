package com.repairshop.property;

// Feature: computer-repair-shop, Property 11: Password change round-trip
// Validates: Requirements 5.2

import com.repairshop.dto.LoginResponse;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property 11: Password change round-trip.
 *
 * For any user, after a successful password change to a new valid password,
 * the user should be able to log in with the new password and should no longer
 * be able to log in with the old password.
 *
 * Validates: Requirements 5.2
 */
@SpringBootTest
@ActiveProfiles("test")
class PasswordChangeRoundTripPropertyTest {

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

    @Test
    void passwordChangeRoundTrip() {
        for (int i = 0; i < 100; i++) {
            String username = "pwchange_user_" + i + "_" + System.nanoTime();
            String email = username + "@example.com";
            String oldPassword = "OldPass1!" + i;
            String newPassword = "NewPass2@" + i;

            UserResponse registered = userService.register(new RegisterRequest(username, email, oldPassword));
            Long userId = registered.id();

            try {
                // Change password
                authService.changePassword(userId, oldPassword, newPassword);

                // Can log in with new password
                LoginResponse loginResponse = authService.login(username, newPassword);
                assertThat(loginResponse.token())
                        .as("Login with new password must succeed for iteration %d", i)
                        .isNotBlank();

                // Cannot log in with old password
                final int iter = i;
                assertThatThrownBy(() -> authService.login(username, oldPassword))
                        .as("Login with old password must fail after change for iteration %d", iter)
                        .isInstanceOf(AuthenticationException.class);
            } finally {
                userRepository.deleteById(userId);
            }
        }
    }
}

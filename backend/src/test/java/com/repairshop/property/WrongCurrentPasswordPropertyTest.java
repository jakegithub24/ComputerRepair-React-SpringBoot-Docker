package com.repairshop.property;

// Feature: computer-repair-shop, Property 12: Wrong current password blocks password change
// Validates: Requirements 5.3, 10.3

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
 * Property 12: Wrong current password blocks password change.
 *
 * For any authenticated user, submitting an incorrect current password to the
 * change-password endpoint should return 401 Unauthorized and leave the stored
 * password unchanged.
 *
 * Validates: Requirements 5.3, 10.3
 */
@SpringBootTest
@ActiveProfiles("test")
class WrongCurrentPasswordPropertyTest {

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
    void wrongCurrentPasswordBlocksPasswordChange() {
        for (int i = 0; i < 100; i++) {
            String username = "wrongcurr_user_" + i + "_" + System.nanoTime();
            String email = username + "@example.com";
            String correctPassword = "CorrectPass1!" + i;
            String wrongCurrentPassword = "WrongCurr2@" + i;
            String newPassword = "NewPass3#" + i;

            UserResponse registered = userService.register(new RegisterRequest(username, email, correctPassword));
            Long userId = registered.id();

            try {
                // Attempt change with wrong current password — must throw AuthenticationException
                final int iter = i;
                assertThatThrownBy(() -> authService.changePassword(userId, wrongCurrentPassword, newPassword))
                        .as("changePassword with wrong current password must throw AuthenticationException for iteration %d", iter)
                        .isInstanceOf(AuthenticationException.class);

                // Stored password must remain unchanged — old password still works
                String storedHash = userRepository.findById(userId)
                        .orElseThrow()
                        .getPasswordHash();
                assertThat(authService.verifyPassword(correctPassword, storedHash))
                        .as("Original password must still be valid after failed change attempt for iteration %d", i)
                        .isTrue();
            } finally {
                userRepository.deleteById(userId);
            }
        }
    }
}

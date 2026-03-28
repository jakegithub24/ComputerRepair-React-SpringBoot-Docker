package com.repairshop.property;

// Feature: computer-repair-shop, Property 4: Weak password is rejected
// Validates: Requirements 2.4, 5.4, 10.4

import com.repairshop.dto.RegisterRequest;
import com.repairshop.exception.ValidationException;
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
class WeakPasswordPropertyTest {

    @Autowired
    private UserService userService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void enableForeignKeys() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
    }

    /**
     * Property 4: Weak password is rejected.
     *
     * For any password string that is fewer than 8 characters, or lacks at least one
     * uppercase letter, one lowercase letter, one digit, or one special character,
     * submitting it during registration or password change should return a 400 Bad
     * Request response (ValidationException).
     *
     * Validates: Requirements 2.4, 5.4, 10.4
     */
    @Test
    void weakPasswordIsRejected() {
        String[] weakPasswords = {
            // Too short (< 8 chars)
            "Ab1!",
            "Ab1!xyz",
            "Short1!",
            // Missing uppercase
            "password1!",
            "alllower1!",
            "nouppercase1@",
            // Missing lowercase
            "PASSWORD1!",
            "ALLUPPERCASE1!",
            "NOLOWER1@",
            // Missing digit
            "Password!",
            "NoDigitHere!",
            "UpperLower!@",
            // Missing special character
            "Password1",
            "NoSpecial1A",
            "UpperLower1A",
            // Empty / blank
            "",
            "       ",
            // Only one type of character
            "aaaaaaaa",
            "AAAAAAAA",
            "11111111",
            "!!!!!!!!"
        };

        for (int i = 0; i < weakPasswords.length; i++) {
            final String weakPassword = weakPasswords[i];
            final int iteration = i;
            String username = "weakpwd_user_" + i + "_" + System.nanoTime();
            String email = username + "@example.com";

            assertThatThrownBy(() ->
                    userService.register(new RegisterRequest(username, email, weakPassword))
            )
                    .as("Registration with weak password (iteration %d, password='%s') must throw ValidationException",
                            iteration, weakPassword)
                    .isInstanceOf(ValidationException.class);
        }
    }

    /**
     * Property 4 (direct): validatePasswordComplexity rejects weak passwords directly.
     * This covers the reuse path for password change (Requirements 5.4, 10.4).
     */
    @Test
    void validatePasswordComplexityRejectsWeakPasswords() {
        String[] weakPasswords = {
            "short",
            "nouppercase1!",
            "NOLOWERCASE1!",
            "NoSpecialChar1",
            "NoDigit!Upper"
        };

        for (int i = 0; i < weakPasswords.length; i++) {
            final String weakPassword = weakPasswords[i];
            final int iteration = i;

            assertThatThrownBy(() -> UserService.validatePasswordComplexity(weakPassword))
                    .as("validatePasswordComplexity must throw ValidationException for weak password (iteration %d)", iteration)
                    .isInstanceOf(ValidationException.class);
        }
    }
}

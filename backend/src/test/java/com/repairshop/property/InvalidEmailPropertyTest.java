package com.repairshop.property;

// Feature: computer-repair-shop, Property 3: Invalid email format is rejected
// Validates: Requirements 2.3

import com.repairshop.dto.RegisterRequest;
import com.repairshop.exception.ValidationException;
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
class InvalidEmailPropertyTest {

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
     * Property 3: Invalid email format is rejected.
     *
     * For any string that does not conform to a valid email format (e.g., missing @,
     * missing domain), submitting it as the email field during registration should
     * return a 400 Bad Request response (ValidationException).
     *
     * Validates: Requirements 2.3
     */
    @Test
    void invalidEmailFormatIsRejected() {
        String[] invalidEmails = {
            "notanemail",
            "missing-at-sign",
            "@nodomain",
            "no-domain@",
            "spaces in@email.com",
            "double@@at.com",
            "",
            "   ",
            "plainaddress",
            "#@%^%#$@#$@#.com",
            "@example.com",
            "email.example.com",
            "email@example@example.com"
        };

        for (int i = 0; i < invalidEmails.length; i++) {
            final String invalidEmail = invalidEmails[i];
            final int iteration = i;
            String username = "invalidemail_user_" + i + "_" + System.nanoTime();
            String password = "Password1!";

            assertThatThrownBy(() ->
                    userService.register(new RegisterRequest(username, invalidEmail, password))
            )
                    .as("Registration with invalid email '%s' (iteration %d) must throw ValidationException",
                            invalidEmail, iteration)
                    .isInstanceOf(ValidationException.class);
        }
    }
}

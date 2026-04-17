package com.repairshop.property;

// Feature: computer-repair-shop, Property 6: Register then login round-trip
// Validates: Requirements 3.1

import com.repairshop.dto.LoginResponse;
import com.repairshop.dto.RegisterRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.AuthService;
import com.repairshop.service.UserService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RegisterLoginRoundTripPropertyTest {

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
     * Property 6: Register then login round-trip.
     *
     * For any valid registration (unique username, valid email, valid password),
     * the user should be able to immediately log in with those credentials and
     * receive a valid JWT.
     *
     * Validates: Requirements 3.1
     */
    @Test
    void registerThenLoginRoundTrip() {
        for (int i = 0; i < 10; i++) {
            String username = "roundtrip_user_" + i + "_" + System.nanoTime();
            String email = username + "@example.com";
            String password = "Password1!" + i;

            // Register
            UserResponse registered = userService.register(new RegisterRequest(username, email, password));
            assertThat(registered.id()).isNotNull();

            try {
                // Login with same credentials
                LoginResponse loginResponse = authService.login(username, password);

                assertThat(loginResponse.token())
                        .as("Login token must not be blank for iteration %d", i)
                        .isNotBlank();

                // Validate the JWT and check claims
                Claims claims = authService.validateToken(loginResponse.token());

                assertThat(claims.getSubject())
                        .as("JWT sub claim must equal username for iteration %d", i)
                        .isEqualTo(username);

                assertThat(claims.get("userId"))
                        .as("JWT userId claim must not be null for iteration %d", i)
                        .isNotNull();

                assertThat(claims.get("role"))
                        .as("JWT role claim must not be null for iteration %d", i)
                        .isNotNull();
            } finally {
                userRepository.deleteById(registered.id());
            }
        }
    }
}

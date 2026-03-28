package com.repairshop.property;

// Feature: computer-repair-shop, Property 8: JWT expiry is at most 24 hours
// Validates: Requirements 3.4, 9.4

import com.repairshop.model.User;
import com.repairshop.service.AuthService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class JwtExpiryPropertyTest {

    @Autowired
    private AuthService authService;

    /**
     * Property 8: JWT expiry is at most 24 hours.
     *
     * For any JWT issued by the system (user or admin), the difference between
     * the {@code exp} claim and the {@code iat} claim should be no greater than
     * 86400 seconds (24 hours).
     *
     * Validates: Requirements 3.4, 9.4
     */
    @Test
    void jwtExpiryAtMost24Hours() {
        String[] roles = {"USER", "ADMIN"};
        String now = Instant.now().toString();

        for (int i = 0; i < 100; i++) {
            String role = roles[i % 2];
            String username = "jwt_expiry_user_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";

            User user = new User(username, email, "$argon2id$test_hash", role, now);
            // id is null — AuthService.generateToken only uses username, id, and role
            user.setId((long) (i + 1));

            String token = authService.generateToken(user);
            Claims claims = authService.validateToken(token);

            long iat = claims.getIssuedAt().getTime() / 1000;
            long exp = claims.getExpiration().getTime() / 1000;
            long diffSeconds = exp - iat;

            assertThat(diffSeconds)
                    .as("JWT expiry window for role %s (iteration %d) must be <= 86400 seconds, but was %d",
                            role, i, diffSeconds)
                    .isLessThanOrEqualTo(86400L);
        }
    }
}

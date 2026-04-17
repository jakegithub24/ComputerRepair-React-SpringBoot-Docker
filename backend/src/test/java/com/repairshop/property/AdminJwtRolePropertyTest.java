package com.repairshop.property;

// Feature: computer-repair-shop, Property 18: Admin JWT contains the ADMIN role claim
// Validates: Requirements 9.2

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
class AdminJwtRolePropertyTest {

    @Autowired
    private AuthService authService;

    /**
     * Property 18: Admin JWT contains the ADMIN role claim.
     *
     * For any successful admin login, the decoded JWT payload should contain
     * "role": "ADMIN", and this claim should be absent or set to "USER" for
     * non-admin JWTs.
     *
     * Validates: Requirements 9.2
     */
    @Test
    void adminJwtContainsAdminRoleClaim() {
        String now = Instant.now().toString();

        for (int i = 0; i < 10; i++) {
            String adminUsername = "admin_jwt_test_" + i;
            User adminUser = new User(adminUsername, adminUsername + "@example.com",
                    "$argon2id$test_hash", "ADMIN", now);
            adminUser.setId((long) (i + 1));

            String adminToken = authService.generateToken(adminUser);
            Claims adminClaims = authService.validateToken(adminToken);

            assertThat(adminClaims.get("role"))
                    .as("Admin JWT must contain role=ADMIN for iteration %d", i)
                    .isEqualTo("ADMIN");

            assertThat(adminClaims.getSubject())
                    .as("Admin JWT sub must equal username for iteration %d", i)
                    .isEqualTo(adminUsername);

            // Verify USER-role JWT does NOT contain ADMIN
            String userUsername = "user_jwt_test_" + i;
            User regularUser = new User(userUsername, userUsername + "@example.com",
                    "$argon2id$test_hash", "USER", now);
            regularUser.setId((long) (i + 1000));

            String userToken = authService.generateToken(regularUser);
            Claims userClaims = authService.validateToken(userToken);

            assertThat(userClaims.get("role"))
                    .as("User JWT must contain role=USER (not ADMIN) for iteration %d", i)
                    .isEqualTo("USER");
        }
    }
}

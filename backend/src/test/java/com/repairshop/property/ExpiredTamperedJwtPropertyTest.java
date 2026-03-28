package com.repairshop.property;

// Feature: computer-repair-shop, Property 24: Expired or tampered JWT returns 401
// Validates: Requirements 13.2, 13.3

import com.repairshop.exception.AuthenticationException;
import com.repairshop.model.User;
import com.repairshop.service.AuthService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Property 24: Expired or tampered JWT returns 401.
 *
 * For any request to a protected endpoint made with a JWT that is expired or
 * has a modified signature, the response should be 401 Unauthorized.
 *
 * Validates: Requirements 13.2, 13.3
 */
@SpringBootTest
@ActiveProfiles("test")
class ExpiredTamperedJwtPropertyTest {

    @Autowired
    private AuthService authService;

    @Value("${jwt.secret}")
    private String jwtSecret;

    /**
     * Property 24 (expired): For any expired JWT, validateToken must throw AuthenticationException.
     */
    @Test
    void expiredJwtReturns401() {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        String now = Instant.now().toString();

        for (int i = 0; i < 100; i++) {
            String username = "expired_jwt_user_" + i;
            Date pastExpiry = new Date(System.currentTimeMillis() - 1000);

            String expiredToken = Jwts.builder()
                    .subject(username)
                    .claim("userId", (long) (i + 1))
                    .claim("role", "USER")
                    .issuedAt(new Date(System.currentTimeMillis() - 2000))
                    .expiration(pastExpiry)
                    .signWith(key)
                    .compact();

            assertThatThrownBy(() -> authService.validateToken(expiredToken))
                    .as("Expired token for user %s (iteration %d) should throw AuthenticationException", username, i)
                    .isInstanceOf(AuthenticationException.class);
        }
    }

    /**
     * Property 24 (tampered): For any JWT with a modified signature, validateToken must throw AuthenticationException.
     */
    @Test
    void tamperedJwtReturns401() {
        String now = Instant.now().toString();

        for (int i = 0; i < 100; i++) {
            String username = "tampered_jwt_user_" + i;
            User user = new User(username, username + "@test.com", "$argon2id$test_hash", "USER", now);
            user.setId((long) (i + 1));

            String validToken = authService.generateToken(user);

            // Tamper with the signature (last few characters of the token)
            String tamperedToken = validToken.substring(0, validToken.length() - 4) + "XXXX";

            assertThatThrownBy(() -> authService.validateToken(tamperedToken))
                    .as("Tampered token for user %s (iteration %d) should throw AuthenticationException", username, i)
                    .isInstanceOf(AuthenticationException.class);
        }
    }
}

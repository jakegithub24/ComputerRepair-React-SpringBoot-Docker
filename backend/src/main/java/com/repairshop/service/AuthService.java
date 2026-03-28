package com.repairshop.service;

import com.repairshop.dto.LoginResponse;
import com.repairshop.exception.AuthenticationException;
import com.repairshop.model.User;
import com.repairshop.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static com.repairshop.service.UserService.validatePasswordComplexity;

@Service
public class AuthService {

    private static final long EXPIRY_MS = 86400_000L; // 24 hours

    private final Argon2PasswordEncoder argon2 = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    private final SecretKey signingKey;
    private final UserRepository userRepository;

    public AuthService(@Value("${jwt.secret}") String jwtSecret, UserRepository userRepository) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.userRepository = userRepository;
    }

    /**
     * Hash a plaintext password using Argon2id.
     * The returned string starts with $argon2id$.
     */
    public String hashPassword(String plaintext) {
        return argon2.encode(plaintext);
    }

    /**
     * Verify a plaintext password against an Argon2id hash.
     */
    public boolean verifyPassword(String plaintext, String hash) {
        return argon2.matches(plaintext, hash);
    }

    /**
     * Generate a signed HS256 JWT for the given user.
     * Claims: sub=username, userId, role. Expiry: 24 hours.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRY_MS);

        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId", user.getId())
                .claim("role", user.getRole())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Authenticate a user by username and password.
     * Verifies the Argon2id hash and returns a signed JWT on success.
     * Throws AuthenticationException (401) without revealing which field was wrong.
     */
    public LoginResponse login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AuthenticationException("Invalid username or password"));

        if (!verifyPassword(password, user.getPasswordHash())) {
            throw new AuthenticationException("Invalid username or password");
        }

        String token = generateToken(user);
        return new LoginResponse(token);
    }

    /**
     * Change the password for the given user.
     * Verifies the current password, validates new password complexity, hashes and persists.
     * Throws AuthenticationException (401) if current password is wrong.
     * Throws ValidationException (400) if new password is too weak.
     * Requirements: 5.1, 5.2, 5.3, 5.4, 10.1, 10.2, 10.3, 10.4
     */
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));

        if (!verifyPassword(currentPassword, user.getPasswordHash())) {
            throw new AuthenticationException("Current password is incorrect");
        }

        validatePasswordComplexity(newPassword);

        user.setPasswordHash(hashPassword(newPassword));
        userRepository.save(user);
    }

    /**
     * Parse and validate a JWT, returning its claims.
     * Throws AuthenticationException if the token is invalid or expired.
     */
    public Claims validateToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            throw new AuthenticationException("Invalid or expired token");
        }
    }
}

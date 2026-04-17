package com.repairshop.property;

// Feature: computer-repair-shop, Property 5: Passwords are stored as Argon2id hashes
// Validates: Requirements 2.5

import com.repairshop.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class PasswordStoragePropertyTest {

    @Autowired
    private AuthService authService;

    /**
     * Property 5: Passwords are stored as Argon2id hashes.
     *
     * For any registered user, the value stored in the {@code password_hash} column
     * should begin with the Argon2id identifier ({@code $argon2id$}) and should
     * never equal the plaintext password.
     *
     * Validates: Requirements 2.5
     */
    @Test
    void passwordStoredAsArgon2id() {
        for (int i = 0; i < 10; i++) {
            String plaintext = "Password1!" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

            String hash = authService.hashPassword(plaintext);

            assertThat(hash)
                    .as("Hash for iteration %d must start with $argon2id$", i)
                    .startsWith("$argon2id$");

            assertThat(hash)
                    .as("Hash for iteration %d must not equal the plaintext password", i)
                    .isNotEqualTo(plaintext);

            assertThat(authService.verifyPassword(plaintext, hash))
                    .as("verifyPassword must return true for iteration %d", i)
                    .isTrue();
        }
    }
}

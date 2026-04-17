package com.repairshop.property;

// Feature: computer-repair-shop, Property 13: New orders are created with status Pending
// Validates: Requirements 6.1

import com.fasterxml.jackson.databind.ObjectMapper;
import com.repairshop.model.User;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 13: New orders are created with status Pending.
 *
 * For any valid order submission (authenticated user, valid service type,
 * non-empty device description), the returned order should have status = "Pending"
 * and a non-null unique ID.
 *
 * Validates: Requirements 6.1
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NewOrderStatusPendingPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String[] SERVICE_TYPES = {"BUY", "SELL", "UPGRADE", "REPAIR"};

    @Test
    void newOrdersAreCreatedWithStatusPending() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            // Create a user
            String username = "order_pending_user_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            String passwordHash = authService.hashPassword("TestPass1!");
            User user = new User(username, email, passwordHash, "USER", Instant.now().toString());
            User saved = userRepository.save(user);
            String token = authService.generateToken(saved);

            // Pick a random valid service type and a non-empty device description
            String serviceType = SERVICE_TYPES[rng.nextInt(SERVICE_TYPES.length)];
            String deviceDescription = "Device description " + i;
            String notes = rng.nextBoolean() ? "Some notes " + i : null;

            Map<String, Object> body = new java.util.HashMap<>();
            body.put("serviceType", serviceType);
            body.put("deviceDescription", deviceDescription);
            if (notes != null) body.put("notes", notes);

            MvcResult result = mockMvc.perform(post("/api/orders")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andReturn();

            Map<?, ?> response = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);

            assertThat(response.get("id"))
                    .as("Order ID should be non-null (trial %d)", i)
                    .isNotNull();
            assertThat(response.get("status"))
                    .as("Order status should be Pending (trial %d)", i)
                    .isEqualTo("Pending");
        }
    }
}

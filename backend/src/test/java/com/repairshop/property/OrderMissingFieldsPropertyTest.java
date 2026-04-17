package com.repairshop.property;

// Feature: computer-repair-shop, Property 14: Orders missing required fields return 400
// Validates: Requirements 6.3

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

import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 14: Orders missing required fields return 400.
 *
 * For any order submission where the service type or device description is absent
 * or blank, the response should be 400 Bad Request.
 *
 * Validates: Requirements 6.3
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderMissingFieldsPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    // Blank/null values to test
    private static final List<String> BLANK_VALUES = Arrays.asList(null, "", "   ");

    @Test
    void ordersMissingServiceTypeReturn400() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String username = "order_missing_st_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            User user = new User(username, email, authService.hashPassword("TestPass1!"), "USER", Instant.now().toString());
            User saved = userRepository.save(user);
            String token = authService.generateToken(saved);

            // Missing or blank serviceType, valid deviceDescription
            String blankServiceType = BLANK_VALUES.get(rng.nextInt(BLANK_VALUES.size()));
            Map<String, Object> body = new HashMap<>();
            if (blankServiceType != null) body.put("serviceType", blankServiceType);
            body.put("deviceDescription", "Some device " + i);

            mockMvc.perform(post("/api/orders")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void ordersMissingDeviceDescriptionReturn400() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String username = "order_missing_dd_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            User user = new User(username, email, authService.hashPassword("TestPass1!"), "USER", Instant.now().toString());
            User saved = userRepository.save(user);
            String token = authService.generateToken(saved);

            // Valid serviceType, missing or blank deviceDescription
            String blankDeviceDesc = BLANK_VALUES.get(rng.nextInt(BLANK_VALUES.size()));
            Map<String, Object> body = new HashMap<>();
            body.put("serviceType", "REPAIR");
            if (blankDeviceDesc != null) body.put("deviceDescription", blankDeviceDesc);

            mockMvc.perform(post("/api/orders")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
    }
}

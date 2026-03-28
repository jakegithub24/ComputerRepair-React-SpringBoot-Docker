package com.repairshop.property;

// Feature: computer-repair-shop, Property 15: New enquiries are created with status Open
// Validates: Requirements 7.1

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
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 15: New enquiries are created with status Open.
 *
 * For any valid enquiry submission (authenticated user, non-empty subject, non-empty message),
 * the returned enquiry should have status = "Open" and a non-null unique ID.
 *
 * Validates: Requirements 7.1
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NewEnquiryStatusOpenPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void newEnquiriesAreCreatedWithStatusOpen() throws Exception {
        int tries = 100;

        for (int i = 0; i < tries; i++) {
            String username = "enq_open_user_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            User user = new User(username, email, authService.hashPassword("TestPass1!"), "USER", Instant.now().toString());
            User saved = userRepository.save(user);
            String token = authService.generateToken(saved);

            Map<String, Object> body = new HashMap<>();
            body.put("subject", "Subject " + i);
            body.put("message", "Message body " + i);

            MvcResult result = mockMvc.perform(post("/api/enquiries")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isCreated())
                    .andReturn();

            Map<?, ?> response = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);

            assertThat(response.get("id"))
                    .as("Enquiry ID should be non-null (trial %d)", i)
                    .isNotNull();
            assertThat(response.get("status"))
                    .as("Enquiry status should be Open (trial %d)", i)
                    .isEqualTo("Open");
        }
    }
}

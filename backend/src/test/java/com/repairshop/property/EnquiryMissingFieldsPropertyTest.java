package com.repairshop.property;

// Feature: computer-repair-shop, Property 16: Enquiries missing required fields return 400
// Validates: Requirements 7.3

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
 * Property 16: Enquiries missing required fields return 400.
 *
 * For any enquiry submission where the subject or message body is absent or blank,
 * the response should be 400 Bad Request.
 *
 * Validates: Requirements 7.3
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EnquiryMissingFieldsPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final List<String> BLANK_VALUES = Arrays.asList(null, "", "   ");

    @Test
    void enquiriesMissingSubjectReturn400() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String username = "enq_missing_subj_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            User user = new User(username, email, authService.hashPassword("TestPass1!"), "USER", Instant.now().toString());
            User saved = userRepository.save(user);
            String token = authService.generateToken(saved);

            String blankSubject = BLANK_VALUES.get(rng.nextInt(BLANK_VALUES.size()));
            Map<String, Object> body = new HashMap<>();
            if (blankSubject != null) body.put("subject", blankSubject);
            body.put("message", "Valid message " + i);

            mockMvc.perform(post("/api/enquiries")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void enquiriesMissingMessageReturn400() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String username = "enq_missing_msg_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            User user = new User(username, email, authService.hashPassword("TestPass1!"), "USER", Instant.now().toString());
            User saved = userRepository.save(user);
            String token = authService.generateToken(saved);

            String blankMessage = BLANK_VALUES.get(rng.nextInt(BLANK_VALUES.size()));
            Map<String, Object> body = new HashMap<>();
            body.put("subject", "Valid subject " + i);
            if (blankMessage != null) body.put("message", blankMessage);

            mockMvc.perform(post("/api/enquiries")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
    }
}

package com.repairshop.property;

// Feature: computer-repair-shop, Property 19: Admin user list is complete and paginated
// Validates: Requirements 11.1

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.repairshop.model.User;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 19: Admin user list is complete and paginated.
 *
 * For any set of N registered users, the admin user list endpoint (across all pages)
 * should return exactly N users with no duplicates and no omissions.
 *
 * Validates: Requirements 11.1
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminUserListPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminUserListIsCompleteAndPaginated() throws Exception {
        int tries = 5;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String now = Instant.now().toString();
            String suffix = "_aulp_" + i + "_" + System.nanoTime();

            // Create an admin user for this trial
            User admin = new User("admin" + suffix, "admin" + suffix + "@test.com",
                    authService.hashPassword("Admin@123"), "ADMIN", now);
            admin = userRepository.save(admin);
            String adminToken = authService.generateToken(admin);

            // Create N random users (2-8)
            int n = rng.nextInt(2, 9);
            Set<Long> createdIds = new HashSet<>();
            for (int j = 0; j < n; j++) {
                String uname = "user" + j + suffix;
                User u = userRepository.save(new User(uname, uname + "@test.com",
                        authService.hashPassword("TestPass1!"), "USER", now));
                createdIds.add(u.getId());
            }
            // Also include the admin we created
            createdIds.add(admin.getId());
            int totalCreated = createdIds.size();

            // Fetch all pages with a small page size to exercise pagination
            int pageSize = 3;
            int page = 0;
            List<Long> collectedIds = new ArrayList<>();
            long totalElements;

            do {
                MvcResult result = mockMvc.perform(get("/api/admin/users")
                                .header("Authorization", "Bearer " + adminToken)
                                .param("page", String.valueOf(page))
                                .param("size", String.valueOf(pageSize)))
                        .andExpect(status().isOk())
                        .andReturn();

                JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
                totalElements = root.get("totalElements").asLong();
                JsonNode content = root.get("content");
                for (JsonNode userNode : content) {
                    collectedIds.add(userNode.get("id").asLong());
                }
                page++;
            } while ((long) (page - 1) * pageSize < totalElements - pageSize);

            // All created users must appear in the collected list
            for (Long id : createdIds) {
                assertThat(collectedIds)
                        .as("Created user id %d must appear in admin user list (trial %d)", id, i)
                        .contains(id);
            }

            // No duplicates
            Set<Long> uniqueIds = new HashSet<>(collectedIds);
            assertThat(uniqueIds.size())
                    .as("No duplicate user IDs in admin list (trial %d)", i)
                    .isEqualTo(collectedIds.size());

            // totalElements must be >= totalCreated (other tests may have added users)
            assertThat(totalElements)
                    .as("totalElements must be >= number of users created in this trial (trial %d)", i)
                    .isGreaterThanOrEqualTo(totalCreated);
        }
    }
}

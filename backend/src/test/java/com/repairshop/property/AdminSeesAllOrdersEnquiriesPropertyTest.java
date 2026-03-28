package com.repairshop.property;

// Feature: computer-repair-shop, Property 21: Admin sees all orders and enquiries
// Validates: Requirements 12.1, 12.2

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.repairshop.model.Enquiry;
import com.repairshop.model.Order;
import com.repairshop.model.User;
import com.repairshop.repository.EnquiryRepository;
import com.repairshop.repository.OrderRepository;
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
 * Property 21: Admin sees all orders and enquiries.
 *
 * For any set of orders or enquiries submitted by any combination of users,
 * the admin list endpoints (across all pages) should return all of them with no omissions.
 *
 * Validates: Requirements 12.1, 12.2
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminSeesAllOrdersEnquiriesPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminSeesAllOrdersAcrossAllUsers() throws Exception {
        int tries = 20;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String now = Instant.now().toString();
            String suffix = "_asao_" + i + "_" + System.nanoTime();

            // Create admin
            User admin = new User("admin" + suffix, "admin" + suffix + "@test.com",
                    authService.hashPassword("Admin@123"), "ADMIN", now);
            admin = userRepository.save(admin);
            String adminToken = authService.generateToken(admin);

            // Create 2-3 users, each with 1-3 orders
            int numUsers = rng.nextInt(2, 4);
            Set<Long> createdOrderIds = new HashSet<>();
            for (int u = 0; u < numUsers; u++) {
                String uname = "user" + u + suffix;
                User user = userRepository.save(new User(uname, uname + "@test.com",
                        authService.hashPassword("TestPass1!"), "USER", now));
                int numOrders = rng.nextInt(1, 4);
                for (int o = 0; o < numOrders; o++) {
                    Order order = orderRepository.save(new Order(user.getId(), "REPAIR",
                            "Device " + o + suffix, null, "Pending", now));
                    createdOrderIds.add(order.getId());
                }
            }

            // Fetch all order pages
            List<Long> collectedOrderIds = fetchAllIds("/api/admin/orders", adminToken);

            // All created orders must appear
            for (Long id : createdOrderIds) {
                assertThat(collectedOrderIds)
                        .as("Order id %d must appear in admin orders list (trial %d)", id, i)
                        .contains(id);
            }

            // No duplicates
            assertThat(new HashSet<>(collectedOrderIds).size())
                    .as("No duplicate order IDs in admin list (trial %d)", i)
                    .isEqualTo(collectedOrderIds.size());
        }
    }

    @Test
    void adminSeesAllEnquiriesAcrossAllUsers() throws Exception {
        int tries = 20;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String now = Instant.now().toString();
            String suffix = "_asae_" + i + "_" + System.nanoTime();

            // Create admin
            User admin = new User("admin" + suffix, "admin" + suffix + "@test.com",
                    authService.hashPassword("Admin@123"), "ADMIN", now);
            admin = userRepository.save(admin);
            String adminToken = authService.generateToken(admin);

            // Create 2-3 users, each with 1-3 enquiries
            int numUsers = rng.nextInt(2, 4);
            Set<Long> createdEnquiryIds = new HashSet<>();
            for (int u = 0; u < numUsers; u++) {
                String uname = "user" + u + suffix;
                User user = userRepository.save(new User(uname, uname + "@test.com",
                        authService.hashPassword("TestPass1!"), "USER", now));
                int numEnquiries = rng.nextInt(1, 4);
                for (int e = 0; e < numEnquiries; e++) {
                    Enquiry enquiry = enquiryRepository.save(new Enquiry(user.getId(),
                            "Subject " + e + suffix, "Message " + e, "Open", now));
                    createdEnquiryIds.add(enquiry.getId());
                }
            }

            // Fetch all enquiry pages
            List<Long> collectedEnquiryIds = fetchAllIds("/api/admin/enquiries", adminToken);

            // All created enquiries must appear
            for (Long id : createdEnquiryIds) {
                assertThat(collectedEnquiryIds)
                        .as("Enquiry id %d must appear in admin enquiries list (trial %d)", id, i)
                        .contains(id);
            }

            // No duplicates
            assertThat(new HashSet<>(collectedEnquiryIds).size())
                    .as("No duplicate enquiry IDs in admin list (trial %d)", i)
                    .isEqualTo(collectedEnquiryIds.size());
        }
    }

    private List<Long> fetchAllIds(String endpoint, String adminToken) throws Exception {
        int pageSize = 5;
        int page = 0;
        List<Long> ids = new ArrayList<>();
        long totalElements;

        do {
            MvcResult result = mockMvc.perform(get(endpoint)
                            .header("Authorization", "Bearer " + adminToken)
                            .param("page", String.valueOf(page))
                            .param("size", String.valueOf(pageSize)))
                    .andExpect(status().isOk())
                    .andReturn();

            JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
            totalElements = root.get("totalElements").asLong();
            JsonNode content = root.get("content");
            for (JsonNode node : content) {
                ids.add(node.get("id").asLong());
            }
            page++;
        } while ((long) (page - 1) * pageSize < totalElements - pageSize);

        return ids;
    }
}

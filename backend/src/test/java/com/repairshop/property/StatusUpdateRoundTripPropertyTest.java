package com.repairshop.property;

// Feature: computer-repair-shop, Property 22: Status update round-trip for orders and enquiries
// Validates: Requirements 12.3, 12.4

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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 22: Status update round-trip for orders and enquiries.
 *
 * For any order or enquiry and any valid status value, submitting a status update
 * should persist the new status, and the subsequently retrieved record should
 * reflect the updated status.
 *
 * Validates: Requirements 12.3, 12.4
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class StatusUpdateRoundTripPropertyTest {

    private static final List<String> ORDER_STATUSES = List.of("Pending", "In Progress", "Completed", "Cancelled");
    private static final List<String> ENQUIRY_STATUSES = List.of("Open", "In Progress", "Resolved", "Closed");

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
    void orderStatusUpdateRoundTrip() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String now = Instant.now().toString();
            String suffix = "_osurt_" + i + "_" + System.nanoTime();

            // Create admin
            User admin = new User("admin" + suffix, "admin" + suffix + "@test.com",
                    authService.hashPassword("Admin@123"), "ADMIN", now);
            admin = userRepository.save(admin);
            String adminToken = authService.generateToken(admin);

            // Create a user and an order
            String uname = "user" + suffix;
            User user = userRepository.save(new User(uname, uname + "@test.com",
                    authService.hashPassword("TestPass1!"), "USER", now));
            Order order = orderRepository.save(new Order(user.getId(), "REPAIR",
                    "Device" + suffix, null, "Pending", now));

            // Pick a random valid status
            String newStatus = ORDER_STATUSES.get(rng.nextInt(ORDER_STATUSES.size()));

            // PATCH the status
            String body = objectMapper.writeValueAsString(Map.of("status", newStatus));
            MvcResult result = mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andReturn();

            // Verify the returned order has the new status
            Map<?, ?> returned = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
            assertThat(returned.get("status"))
                    .as("Returned order status should be %s (trial %d)", newStatus, i)
                    .isEqualTo(newStatus);

            // Verify the persisted order has the new status
            Order persisted = orderRepository.findById(order.getId()).orElseThrow();
            assertThat(persisted.getStatus())
                    .as("Persisted order status should be %s (trial %d)", newStatus, i)
                    .isEqualTo(newStatus);
        }
    }

    @Test
    void enquiryStatusUpdateRoundTrip() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String now = Instant.now().toString();
            String suffix = "_esurt_" + i + "_" + System.nanoTime();

            // Create admin
            User admin = new User("admin" + suffix, "admin" + suffix + "@test.com",
                    authService.hashPassword("Admin@123"), "ADMIN", now);
            admin = userRepository.save(admin);
            String adminToken = authService.generateToken(admin);

            // Create a user and an enquiry
            String uname = "user" + suffix;
            User user = userRepository.save(new User(uname, uname + "@test.com",
                    authService.hashPassword("TestPass1!"), "USER", now));
            Enquiry enquiry = enquiryRepository.save(new Enquiry(user.getId(),
                    "Subject" + suffix, "Message", "Open", now));

            // Pick a random valid status
            String newStatus = ENQUIRY_STATUSES.get(rng.nextInt(ENQUIRY_STATUSES.size()));

            // PATCH the status
            String body = objectMapper.writeValueAsString(Map.of("status", newStatus));
            MvcResult result = mockMvc.perform(patch("/api/admin/enquiries/" + enquiry.getId() + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andReturn();

            // Verify the returned enquiry has the new status
            Map<?, ?> returned = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
            assertThat(returned.get("status"))
                    .as("Returned enquiry status should be %s (trial %d)", newStatus, i)
                    .isEqualTo(newStatus);

            // Verify the persisted enquiry has the new status
            Enquiry persisted = enquiryRepository.findById(enquiry.getId()).orElseThrow();
            assertThat(persisted.getStatus())
                    .as("Persisted enquiry status should be %s (trial %d)", newStatus, i)
                    .isEqualTo(newStatus);
        }
    }
}

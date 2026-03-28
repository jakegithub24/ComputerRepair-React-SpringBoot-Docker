package com.repairshop.property;

// Feature: computer-repair-shop, Property 23: Invalid status value returns 400
// Validates: Requirements 12.5

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

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 23: Invalid status value returns 400.
 *
 * For any status update request where the status value is not in the allowed set
 * (for orders: Pending/In Progress/Completed/Cancelled;
 *  for enquiries: Open/In Progress/Resolved/Closed),
 * the response should be 400 Bad Request.
 *
 * Validates: Requirements 12.5
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InvalidStatusPropertyTest {

    private static final List<String> INVALID_STATUSES = List.of(
            "", "invalid", "PENDING", "pending", "done", "closed", "open",
            "completed", "cancelled", "resolved", "random_status", "null",
            "In progress", "in progress", "IN PROGRESS"
    );

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
    void invalidOrderStatusReturns400() throws Exception {
        String now = Instant.now().toString();
        String suffix = "_isp_order_" + System.nanoTime();

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

        for (String invalidStatus : INVALID_STATUSES) {
            String body = objectMapper.writeValueAsString(Map.of("status", invalidStatus));
            mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }

        // Also test with null status field
        mockMvc.perform(patch("/api/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidEnquiryStatusReturns400() throws Exception {
        String now = Instant.now().toString();
        String suffix = "_isp_enquiry_" + System.nanoTime();

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

        // Invalid statuses for enquiries (also includes order-specific ones)
        List<String> invalidEnquiryStatuses = List.of(
                "", "invalid", "OPEN", "open", "done", "pending", "Pending",
                "Completed", "Cancelled", "random_status", "In progress", "in progress"
        );

        for (String invalidStatus : invalidEnquiryStatuses) {
            String body = objectMapper.writeValueAsString(Map.of("status", invalidStatus));
            mockMvc.perform(patch("/api/admin/enquiries/" + enquiry.getId() + "/status")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }

        // Also test with null status field
        mockMvc.perform(patch("/api/admin/enquiries/" + enquiry.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":null}"))
                .andExpect(status().isBadRequest());
    }
}

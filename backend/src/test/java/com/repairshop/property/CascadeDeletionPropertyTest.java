package com.repairshop.property;

// Feature: computer-repair-shop, Property 9: Account deletion cascades to all associated records
// Validates: Requirements 4.2, 11.2

import com.repairshop.model.Enquiry;
import com.repairshop.model.Order;
import com.repairshop.model.User;
import com.repairshop.repository.EnquiryRepository;
import com.repairshop.repository.OrderRepository;
import com.repairshop.repository.UserRepository;
import com.repairshop.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CascadeDeletionPropertyTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private EnquiryRepository enquiryRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void enableForeignKeys() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
    }

    /**
     * Property 9: Account deletion cascades to all associated records (repository level).
     *
     * For any user account with any number of orders (0-5) and enquiries (0-5),
     * deleting that account should result in all associated orders and enquiries
     * also being removed from the database.
     *
     * Validates: Requirements 4.2, 11.2
     */
    @Test
    void accountDeletionCascadesToAllAssociatedRecords() {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            int numOrders = rng.nextInt(0, 6);    // 0-5 inclusive
            int numEnquiries = rng.nextInt(0, 6); // 0-5 inclusive

            // Create a user with a unique username
            String username = "cascade_user_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            String now = Instant.now().toString();

            User user = new User(username, email, "$argon2id$test_hash", "USER", now);
            User savedUser = userRepository.save(user);
            Long userId = savedUser.getId();

            // Create N orders for this user
            for (int o = 0; o < numOrders; o++) {
                Order order = new Order(userId, "REPAIR", "Device " + o, null, "Pending", now);
                orderRepository.save(order);
            }

            // Create M enquiries for this user
            for (int e = 0; e < numEnquiries; e++) {
                Enquiry enquiry = new Enquiry(userId, "Subject " + e, "Message " + e, "Open", now);
                enquiryRepository.save(enquiry);
            }

            // Verify records exist before deletion
            assertThat(orderRepository.findByUserId(userId)).hasSize(numOrders);
            assertThat(enquiryRepository.findByUserId(userId)).hasSize(numEnquiries);

            // Delete the user — cascade should remove all associated records
            userRepository.deleteById(userId);

            // Assert all orders and enquiries for this user_id are gone
            assertThat(orderRepository.findByUserId(userId))
                    .as("Orders for deleted user %d (trial %d) should be empty", userId, i)
                    .isEmpty();
            assertThat(enquiryRepository.findByUserId(userId))
                    .as("Enquiries for deleted user %d (trial %d) should be empty", userId, i)
                    .isEmpty();
        }
    }

    /**
     * Property 9: Account deletion via DELETE /api/users/me cascades to all associated records.
     *
     * For any user account with any number of orders (0-5) and enquiries (0-5),
     * calling DELETE /api/users/me with a valid JWT should delete the user and all
     * associated orders and enquiries from the database.
     *
     * Validates: Requirements 4.2, 11.2
     */
    @Test
    void accountDeletionViaEndpointCascadesToAllAssociatedRecords() throws Exception {
        int tries = 5;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            int numOrders = rng.nextInt(0, 6);    // 0-5 inclusive
            int numEnquiries = rng.nextInt(0, 6); // 0-5 inclusive

            // Create a user with a unique username and a real Argon2id hash
            String username = "ep_cascade_user_" + i + "_" + System.nanoTime();
            String email = username + "@test.com";
            String now = Instant.now().toString();
            String passwordHash = authService.hashPassword("TestPass1!");

            User user = new User(username, email, passwordHash, "USER", now);
            User savedUser = userRepository.save(user);
            Long userId = savedUser.getId();

            // Generate a JWT for this user
            String token = authService.generateToken(savedUser);

            // Create N orders for this user
            for (int o = 0; o < numOrders; o++) {
                Order order = new Order(userId, "REPAIR", "Device " + o, null, "Pending", now);
                orderRepository.save(order);
            }

            // Create M enquiries for this user
            for (int e = 0; e < numEnquiries; e++) {
                Enquiry enquiry = new Enquiry(userId, "Subject " + e, "Message " + e, "Open", now);
                enquiryRepository.save(enquiry);
            }

            // Verify records exist before deletion
            assertThat(orderRepository.findByUserId(userId)).hasSize(numOrders);
            assertThat(enquiryRepository.findByUserId(userId)).hasSize(numEnquiries);

            // Call DELETE /api/users/me with the user's JWT
            mockMvc.perform(delete("/api/users/me")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isNoContent());

            // Assert user is gone
            assertThat(userRepository.findById(userId))
                    .as("User %d (trial %d) should be deleted", userId, i)
                    .isEmpty();

            // Assert all orders and enquiries for this user_id are gone
            assertThat(orderRepository.findByUserId(userId))
                    .as("Orders for deleted user %d (trial %d) should be empty", userId, i)
                    .isEmpty();
            assertThat(enquiryRepository.findByUserId(userId))
                    .as("Enquiries for deleted user %d (trial %d) should be empty", userId, i)
                    .isEmpty();
        }
    }
}

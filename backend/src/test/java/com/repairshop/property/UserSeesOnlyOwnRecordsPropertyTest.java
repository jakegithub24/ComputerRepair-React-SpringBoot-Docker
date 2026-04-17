package com.repairshop.property;

// Feature: computer-repair-shop, Property 17: Users see only their own records
// Validates: Requirements 8.1, 8.2

import com.fasterxml.jackson.databind.ObjectMapper;
import com.repairshop.model.Order;
import com.repairshop.model.User;
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
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 17: Users see only their own records.
 *
 * For any two distinct users A and B, the orders returned to user A should contain
 * only records whose user_id matches A, and should never include records belonging to user B.
 *
 * Validates: Requirements 8.1, 8.2
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserSeesOnlyOwnRecordsPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void usersSeesOnlyTheirOwnOrders() throws Exception {
        int tries = 10;
        ThreadLocalRandom rng = ThreadLocalRandom.current();

        for (int i = 0; i < tries; i++) {
            String now = Instant.now().toString();

            // Create user A
            String usernameA = "own_records_a_" + i + "_" + System.nanoTime();
            User userA = userRepository.save(new User(usernameA, usernameA + "@test.com",
                    authService.hashPassword("TestPass1!"), "USER", now));
            String tokenA = authService.generateToken(userA);

            // Create user B
            String usernameB = "own_records_b_" + i + "_" + System.nanoTime();
            User userB = userRepository.save(new User(usernameB, usernameB + "@test.com",
                    authService.hashPassword("TestPass1!"), "USER", now));
            String tokenB = authService.generateToken(userB);

            // Create 1-3 orders for user A
            int ordersA = rng.nextInt(1, 4);
            for (int o = 0; o < ordersA; o++) {
                orderRepository.save(new Order(userA.getId(), "REPAIR", "Device A " + o, null, "Pending", now));
            }

            // Create 1-3 orders for user B
            int ordersB = rng.nextInt(1, 4);
            for (int o = 0; o < ordersB; o++) {
                orderRepository.save(new Order(userB.getId(), "BUY", "Device B " + o, null, "Pending", now));
            }

            // User A fetches their orders
            MvcResult resultA = mockMvc.perform(get("/api/orders")
                            .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn();

            List<Map<?, ?>> ordersForA = objectMapper.readValue(
                    resultA.getResponse().getContentAsString(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            // All returned orders must belong to user A
            for (Map<?, ?> order : ordersForA) {
                Number returnedUserId = (Number) order.get("userId");
                assertThat(returnedUserId.longValue())
                        .as("Order userId should match user A's id (trial %d)", i)
                        .isEqualTo(userA.getId());
            }

            // User A should not see user B's orders
            assertThat(ordersForA)
                    .as("User A should see exactly their own orders (trial %d)", i)
                    .hasSize(ordersA);

            // User B fetches their orders
            MvcResult resultB = mockMvc.perform(get("/api/orders")
                            .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn();

            List<Map<?, ?>> ordersForB = objectMapper.readValue(
                    resultB.getResponse().getContentAsString(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));

            // All returned orders must belong to user B
            for (Map<?, ?> order : ordersForB) {
                Number returnedUserId = (Number) order.get("userId");
                assertThat(returnedUserId.longValue())
                        .as("Order userId should match user B's id (trial %d)", i)
                        .isEqualTo(userB.getId());
            }

            assertThat(ordersForB)
                    .as("User B should see exactly their own orders (trial %d)", i)
                    .hasSize(ordersB);
        }
    }
}

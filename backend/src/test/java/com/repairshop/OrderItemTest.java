package com.repairshop;

import com.repairshop.model.Order;
import com.repairshop.model.OrderItem;
import com.repairshop.model.User;
import com.repairshop.repository.OrderItemRepository;
import com.repairshop.repository.OrderRepository;
import com.repairshop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for OrderItem entity and repository.
 * Tests order details and item tracking with historical pricing.
 * Phase 8.2
 */
@SpringBootTest
@ActiveProfiles("test")
class OrderItemTest {

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setup() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
        jdbcTemplate.execute("DELETE FROM order_items");
        jdbcTemplate.execute("DELETE FROM orders");
        jdbcTemplate.execute("DELETE FROM users");

        // Create test user
        testUser = new User();
        testUser.setUsername("orderuser");
        testUser.setEmail("order@example.com");
        testUser.setPasswordHash("hashed_password");
        testUser.setRole("USER");
        testUser.setCreatedAt(Instant.now().toString());
        testUser = userRepository.save(testUser);

        // Create test order
        testOrder = new Order();
        testOrder.setUserId(testUser.getId());
        testOrder.setTotalPrice(0.0);
        testOrder.setShippingAddress("123 Test St, Test City, TC 12345");
        testOrder.setStatus("Pending");
        testOrder.setCreatedAt(Instant.now().toString());
        testOrder = orderRepository.save(testOrder);
    }

    @Test
    void testAddOrderItem() {
        OrderItem item = new OrderItem();
        item.setOrderId(testOrder.getId());
        item.setProductId("PROD-0001");
        item.setQuantity(2);
        item.setPriceAtPurchase(999.99);

        OrderItem saved = orderItemRepository.save(item);
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getQuantity()).isEqualTo(2);
        assertThat(saved.getPriceAtPurchase()).isEqualTo(999.99);
    }

    @Test
    void testFindByOrderId() {
        // Add multiple items to order
        for (int i = 0; i < 3; i++) {
            OrderItem item = new OrderItem();
            item.setOrderId(testOrder.getId());
            item.setProductId("PROD-" + i);
            item.setQuantity(i + 1);
            item.setPriceAtPurchase(100.0 * (i + 1));
            orderItemRepository.save(item);
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(testOrder.getId());
        assertThat(orderItems).hasSize(3);
    }

    @Test
    void testHistoricalPricing() {
        // Item 1: Product at $500
        OrderItem item1 = new OrderItem();
        item1.setOrderId(testOrder.getId());
        item1.setProductId("PROD-PRICE-001");
        item1.setQuantity(1);
        item1.setPriceAtPurchase(500.00);
        orderItemRepository.save(item1);

        // Item 2: Same product but different price (historical)
        Order order2 = new Order();
        order2.setUserId(testUser.getId());
        order2.setTotalPrice(0.0);
        order2.setShippingAddress("Same Address");
        order2.setStatus("Pending");
        order2.setCreatedAt(Instant.now().toString());
        order2 = orderRepository.save(order2);

        OrderItem item2 = new OrderItem();
        item2.setOrderId(order2.getId());
        item2.setProductId("PROD-PRICE-001");
        item2.setQuantity(1);
        item2.setPriceAtPurchase(450.00); // Price changed
        orderItemRepository.save(item2);

        // Verify both prices are preserved
        Optional<OrderItem> retrieved1 = orderItemRepository.findById(item1.getId());
        Optional<OrderItem> retrieved2 = orderItemRepository.findById(item2.getId());

        assertThat(retrieved1.get().getPriceAtPurchase()).isEqualTo(500.00);
        assertThat(retrieved2.get().getPriceAtPurchase()).isEqualTo(450.00);
    }

    @Test
    void testOrderItemQuantity() {
        OrderItem item = new OrderItem();
        item.setOrderId(testOrder.getId());
        item.setProductId("PROD-QTY");
        item.setQuantity(5);
        item.setPriceAtPurchase(199.99);

        OrderItem saved = orderItemRepository.save(item);
        assertThat(saved.getQuantity()).isEqualTo(5);

        // Verify quantity persists
        Optional<OrderItem> retrieved = orderItemRepository.findById(saved.getId());
        assertThat(retrieved.get().getQuantity()).isEqualTo(5);
    }

    @Test
    void testCalculateLineTotal() {
        OrderItem item = new OrderItem();
        item.setOrderId(testOrder.getId());
        item.setProductId("PROD-TOTAL");
        item.setQuantity(3);
        item.setPriceAtPurchase(49.99);

        OrderItem saved = orderItemRepository.save(item);

        // Manual calculation: 3 * 49.99 = 149.97
        double lineTotal = saved.getQuantity() * saved.getPriceAtPurchase();
        assertThat(lineTotal).isEqualTo(149.97);
    }

    @Test
    void testMultipleItemsInOrder() {
        // Create mixed items
        double[] prices = {99.99, 199.99, 49.99, 299.99};
        int[] quantities = {1, 2, 3, 1};
        double expectedTotal = 0.0;

        for (int i = 0; i < prices.length; i++) {
            OrderItem item = new OrderItem();
            item.setOrderId(testOrder.getId());
            item.setProductId("PROD-MULTI-" + i);
            item.setQuantity(quantities[i]);
            item.setPriceAtPurchase(prices[i]);
            orderItemRepository.save(item);
            expectedTotal += quantities[i] * prices[i];
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(testOrder.getId());
        assertThat(orderItems).hasSize(4);

        // Calculate order total
        double calculatedTotal = orderItems.stream()
                .mapToDouble(item -> item.getQuantity() * item.getPriceAtPurchase())
                .sum();
        assertThat(calculatedTotal).isEqualTo(expectedTotal);
    }

    @Test
    void testDeleteOrderItem() {
        OrderItem item = new OrderItem();
        item.setOrderId(testOrder.getId());
        item.setProductId("PROD-DELETE");
        item.setQuantity(2);
        item.setPriceAtPurchase(99.99);

        OrderItem saved = orderItemRepository.save(item);
        assertThat(saved.getId()).isNotNull();

        orderItemRepository.deleteById(saved.getId());

        Optional<OrderItem> deleted = orderItemRepository.findById(saved.getId());
        assertThat(deleted).isEmpty();
    }

    @Test
    void testCascadeDeleteOnOrderDelete() {
        // Add items
        OrderItem item1 = new OrderItem();
        item1.setOrderId(testOrder.getId());
        item1.setProductId("PROD-CASCADE-1");
        item1.setQuantity(1);
        item1.setPriceAtPurchase(100.00);
        orderItemRepository.save(item1);

        OrderItem item2 = new OrderItem();
        item2.setOrderId(testOrder.getId());
        item2.setProductId("PROD-CASCADE-2");
        item2.setQuantity(1);
        item2.setPriceAtPurchase(200.00);
        orderItemRepository.save(item2);

        List<OrderItem> itemsBefore = orderItemRepository.findByOrderId(testOrder.getId());
        assertThat(itemsBefore).hasSize(2);

        // Delete order
        orderRepository.deleteById(testOrder.getId());

        // Items should cascade delete
        List<OrderItem> itemsAfter = orderItemRepository.findByOrderId(testOrder.getId());
        assertThat(itemsAfter).isEmpty();
    }

    @Test
    void testOrderItemProductTracking() {
        // Track which products appear in an order
        OrderItem item = new OrderItem();
        item.setOrderId(testOrder.getId());
        item.setProductId("PROD-TRACK-001");
        item.setQuantity(2);
        item.setPriceAtPurchase(150.00);

        OrderItem saved = orderItemRepository.save(item);

        Optional<OrderItem> retrieved = orderItemRepository.findById(saved.getId());
        assertThat(retrieved.get().getProductId()).isEqualTo("PROD-TRACK-001");
        assertThat(retrieved.get().getOrderId()).isEqualTo(testOrder.getId());
    }
}

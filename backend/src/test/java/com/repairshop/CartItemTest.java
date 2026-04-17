package com.repairshop;

import com.repairshop.model.CartItem;
import com.repairshop.model.CatalogueItem;
import com.repairshop.model.User;
import com.repairshop.repository.CartItemRepository;
import com.repairshop.repository.CatalogueItemRepository;
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
 * Unit tests for CartItem entity and repository.
 * Tests shopping cart operations.
 * Phase 8.2
 */
@SpringBootTest
@ActiveProfiles("test")
class CartItemTest {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CatalogueItemRepository catalogueItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User testUser;
    private CatalogueItem testProduct;

    @BeforeEach
    void setup() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
        jdbcTemplate.execute("DELETE FROM cart_items");
        jdbcTemplate.execute("DELETE FROM order_items");
        jdbcTemplate.execute("DELETE FROM catalogue_items");
        jdbcTemplate.execute("DELETE FROM users");

        // Create test user
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("hashed_password");
        testUser.setRole("USER");
        testUser.setCreatedAt(Instant.now().toString());
        testUser = userRepository.save(testUser);

        // Create test product
        testProduct = new CatalogueItem();
        testProduct.setProductId("PROD-CART-001");
        testProduct.setName("Test Product");
        testProduct.setCategory("Laptop");
        testProduct.setPrice(999.99);
        testProduct.setStock(10);
        testProduct.setAvailable(1);
        testProduct.setCreatedAt(Instant.now().toString());
        testProduct.setUpdatedAt(Instant.now().toString());
        testProduct = catalogueItemRepository.save(testProduct);
    }

    @Test
    void testAddToCart() {
        CartItem cartItem = new CartItem();
        cartItem.setUserId(testUser.getId());
        cartItem.setProductId(testProduct.getProductId());
        cartItem.setQuantity(2);
        cartItem.setCreatedAt(Instant.now().toString());

        CartItem saved = cartItemRepository.save(cartItem);
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getQuantity()).isEqualTo(2);
    }

    @Test
    void testFindByUserId() {
        // Add multiple items to cart
        for (int i = 0; i < 3; i++) {
            CartItem cartItem = new CartItem();
            cartItem.setUserId(testUser.getId());
            cartItem.setProductId("PROD-" + i);
            cartItem.setQuantity(1 + i);
            cartItem.setCreatedAt(Instant.now().toString());
            cartItemRepository.save(cartItem);
        }

        List<CartItem> userCart = cartItemRepository.findByUserId(testUser.getId());
        assertThat(userCart).hasSize(3);
    }

    @Test
    void testFindByUserIdAndProductId() {
        CartItem cartItem = new CartItem();
        cartItem.setUserId(testUser.getId());
        cartItem.setProductId(testProduct.getProductId());
        cartItem.setQuantity(5);
        cartItem.setCreatedAt(Instant.now().toString());
        cartItemRepository.save(cartItem);

        Optional<CartItem> found = cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getProductId());
        assertThat(found).isPresent();
        assertThat(found.get().getQuantity()).isEqualTo(5);
    }

    @Test
    void testUpdateQuantity() {
        CartItem cartItem = new CartItem();
        cartItem.setUserId(testUser.getId());
        cartItem.setProductId(testProduct.getProductId());
        cartItem.setQuantity(1);
        cartItem.setCreatedAt(Instant.now().toString());

        CartItem saved = cartItemRepository.save(cartItem);
        assertThat(saved.getQuantity()).isEqualTo(1);

        // Update quantity
        saved.setQuantity(5);
        cartItemRepository.save(saved);

        Optional<CartItem> updated = cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getProductId());
        assertThat(updated.get().getQuantity()).isEqualTo(5);
    }

    @Test
    void testRemoveFromCart() {
        CartItem cartItem = new CartItem();
        cartItem.setUserId(testUser.getId());
        cartItem.setProductId(testProduct.getProductId());
        cartItem.setQuantity(3);
        cartItem.setCreatedAt(Instant.now().toString());

        CartItem saved = cartItemRepository.save(cartItem);
        assertThat(saved.getId()).isNotNull();

        cartItemRepository.deleteById(saved.getId());

        Optional<CartItem> deleted = cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getProductId());
        assertThat(deleted).isEmpty();
    }

    @Test
    void testClearUserCart() {
        // Add multiple items
        for (int i = 0; i < 3; i++) {
            CartItem cartItem = new CartItem();
            cartItem.setUserId(testUser.getId());
            cartItem.setProductId("PROD-CLEAR-" + i);
            cartItem.setQuantity(1);
            cartItem.setCreatedAt(Instant.now().toString());
            cartItemRepository.save(cartItem);
        }

        List<CartItem> userCart = cartItemRepository.findByUserId(testUser.getId());
        assertThat(userCart).hasSize(3);

        // Clear cart
        userCart.forEach(item -> cartItemRepository.deleteById(item.getId()));

        List<CartItem> emptyCart = cartItemRepository.findByUserId(testUser.getId());
        assertThat(emptyCart).isEmpty();
    }

    @Test
    void testMultipleUsersIndependentCarts() {
        // Create second user
        User user2 = new User();
        user2.setUsername("testuser2");
        user2.setEmail("test2@example.com");
        user2.setPasswordHash("hashed_password2");
        user2.setRole("USER");
        user2.setCreatedAt(Instant.now().toString());
        user2 = userRepository.save(user2);

        // Add items to user1 cart
        CartItem item1 = new CartItem();
        item1.setUserId(testUser.getId());
        item1.setProductId("PROD-1");
        item1.setQuantity(2);
        item1.setCreatedAt(Instant.now().toString());
        cartItemRepository.save(item1);

        // Add items to user2 cart
        CartItem item2 = new CartItem();
        item2.setUserId(user2.getId());
        item2.setProductId("PROD-2");
        item2.setQuantity(3);
        item2.setCreatedAt(Instant.now().toString());
        cartItemRepository.save(item2);

        List<CartItem> user1Cart = cartItemRepository.findByUserId(testUser.getId());
        List<CartItem> user2Cart = cartItemRepository.findByUserId(user2.getId());

        assertThat(user1Cart).hasSize(1);
        assertThat(user2Cart).hasSize(1);
        assertThat(user1Cart.get(0).getQuantity()).isEqualTo(2);
        assertThat(user2Cart.get(0).getQuantity()).isEqualTo(3);
    }

    @Test
    void testCartPersistsAcrossSessions() {
        CartItem cartItem = new CartItem();
        cartItem.setUserId(testUser.getId());
        cartItem.setProductId("PROD-PERSIST");
        cartItem.setQuantity(4);
        cartItem.setCreatedAt(Instant.now().toString());

        CartItem saved = cartItemRepository.save(cartItem);
        Long cartItemId = saved.getId();

        // Simulate new session - fetch same item
        Optional<CartItem> retrieved = cartItemRepository.findById(cartItemId);
        assertThat(retrieved).isPresent();
        assertThat(retrieved.get().getQuantity()).isEqualTo(4);
        assertThat(retrieved.get().getProductId()).isEqualTo("PROD-PERSIST");
    }
}

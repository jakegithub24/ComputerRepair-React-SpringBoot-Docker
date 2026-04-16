package com.repairshop;

import com.repairshop.model.CatalogueItem;
import com.repairshop.repository.CatalogueItemRepository;
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
 * Unit tests for CatalogueItem entity and repository.
 * Tests product CRUD operations, search, and inventory management.
 * Phase 8.2
 */
@SpringBootTest
@ActiveProfiles("test")
class CatalogueItemTest {

    @Autowired
    private CatalogueItemRepository catalogueItemRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setup() {
        jdbcTemplate.execute("PRAGMA foreign_keys = ON");
        jdbcTemplate.execute("DELETE FROM cart_items");
        jdbcTemplate.execute("DELETE FROM order_items");
        jdbcTemplate.execute("DELETE FROM catalogue_items");
    }

    @Test
    void testCreateProduct() {
        CatalogueItem product = new CatalogueItem();
        product.setProductId("PROD-0001");
        product.setName("Test Laptop");
        product.setCategory("Laptop");
        product.setDescription("High-performance laptop");
        product.setPrice(1299.99);
        product.setStock(5);
        product.setBrand("TechBrand");
        product.setModel("TB-2024");
        product.setSpecs("{\"ram\":\"16GB\",\"storage\":\"512GB\"}");
        product.setAvailable(1);
        product.setCreatedAt(Instant.now().toString());
        product.setUpdatedAt(Instant.now().toString());

        CatalogueItem saved = catalogueItemRepository.save(product);
        assertThat(saved).isNotNull();
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getProductId()).isEqualTo("PROD-0001");
        assertThat(saved.getPrice()).isEqualTo(1299.99);
    }

    @Test
    void testFindByProductId() {
        CatalogueItem product = new CatalogueItem();
        product.setProductId("PROD-TEST-001");
        product.setName("Test Product");
        product.setCategory("Desktop");
        product.setPrice(999.99);
        product.setStock(10);
        product.setAvailable(1);
        product.setCreatedAt(Instant.now().toString());
        product.setUpdatedAt(Instant.now().toString());

        catalogueItemRepository.save(product);

        Optional<CatalogueItem> found = catalogueItemRepository.findByProductId("PROD-TEST-001");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test Product");
    }

    @Test
    void testFindByCategory() {
        // Create multiple products in different categories
        for (int i = 0; i < 3; i++) {
            CatalogueItem product = new CatalogueItem();
            product.setProductId("PROD-RAM-" + i);
            product.setName("RAM " + i);
            product.setCategory("RAM");
            product.setPrice(50.0 + i * 10);
            product.setStock(20);
            product.setAvailable(1);
            product.setCreatedAt(Instant.now().toString());
            product.setUpdatedAt(Instant.now().toString());
            catalogueItemRepository.save(product);
        }

        List<CatalogueItem> rams = catalogueItemRepository.findByCategory("RAM");
        assertThat(rams).hasSize(3);
        assertThat(rams).allMatch(p -> "RAM".equals(p.getCategory()));
    }

    @Test
    void testUpdateStock() {
        CatalogueItem product = new CatalogueItem();
        product.setProductId("PROD-SSD-001");
        product.setName("SSD Storage");
        product.setCategory("SSD");
        product.setPrice(150.00);
        product.setStock(15);
        product.setAvailable(1);
        product.setCreatedAt(Instant.now().toString());
        product.setUpdatedAt(Instant.now().toString());

        CatalogueItem saved = catalogueItemRepository.save(product);
        assertThat(saved.getStock()).isEqualTo(15);

        // Update stock
        saved.setStock(10);
        saved.setUpdatedAt(Instant.now().toString());
        catalogueItemRepository.save(saved);

        Optional<CatalogueItem> updated = catalogueItemRepository.findByProductId("PROD-SSD-001");
        assertThat(updated.get().getStock()).isEqualTo(10);
    }

    @Test
    void testMarkUnavailable() {
        CatalogueItem product = new CatalogueItem();
        product.setProductId("PROD-UNAVAIL");
        product.setName("Out of Stock Product");
        product.setCategory("Monitor");
        product.setPrice(299.99);
        product.setStock(0);
        product.setAvailable(1);
        product.setCreatedAt(Instant.now().toString());
        product.setUpdatedAt(Instant.now().toString());

        CatalogueItem saved = catalogueItemRepository.save(product);

        // Mark as unavailable when stock is 0
        saved.setAvailable(0);
        saved.setUpdatedAt(Instant.now().toString());
        catalogueItemRepository.save(saved);

        Optional<CatalogueItem> found = catalogueItemRepository.findByProductId("PROD-UNAVAIL");
        assertThat(found.get().getAvailable()).isEqualTo(0);
    }

    @Test
    void testDeleteProduct() {
        CatalogueItem product = new CatalogueItem();
        product.setProductId("PROD-DELETE");
        product.setName("Product to Delete");
        product.setCategory("Keyboard");
        product.setPrice(99.99);
        product.setStock(5);
        product.setAvailable(1);
        product.setCreatedAt(Instant.now().toString());
        product.setUpdatedAt(Instant.now().toString());

        CatalogueItem saved = catalogueItemRepository.save(product);
        assertThat(saved.getId()).isNotNull();

        catalogueItemRepository.deleteById(saved.getId());

        Optional<CatalogueItem> deleted = catalogueItemRepository.findByProductId("PROD-DELETE");
        assertThat(deleted).isEmpty();
    }

    @Test
    void testPriceRange() {
        // Create products with various prices
        double[] prices = {49.99, 99.99, 199.99, 499.99, 1299.99};
        for (int i = 0; i < prices.length; i++) {
            CatalogueItem product = new CatalogueItem();
            product.setProductId("PROD-PRICE-" + i);
            product.setName("Product " + i);
            product.setCategory("Mixed");
            product.setPrice(prices[i]);
            product.setStock(10);
            product.setAvailable(1);
            product.setCreatedAt(Instant.now().toString());
            product.setUpdatedAt(Instant.now().toString());
            catalogueItemRepository.save(product);
        }

        List<CatalogueItem> products = catalogueItemRepository.findByCategory("Mixed");
        assertThat(products).hasSize(5);
        assertThat(products).extracting(CatalogueItem::getPrice).containsExactly(49.99, 99.99, 199.99, 499.99, 1299.99);
    }

    @Test
    void testProductSpecs() {
        CatalogueItem product = new CatalogueItem();
        product.setProductId("PROD-SPECS-001");
        product.setName("Gaming Laptop");
        product.setCategory("Laptop");
        product.setPrice(1499.99);
        product.setStock(3);
        product.setBrand("ASUS");
        product.setModel("ROG Strix G16");
        product.setSpecs("{\"processor\":\"Intel i7-13700H\",\"gpu\":\"RTX 4060\",\"ram\":\"16GB DDR5\",\"storage\":\"512GB SSD\",\"display\":\"16 inch QHD 165Hz\"}");
        product.setAvailable(1);
        product.setCreatedAt(Instant.now().toString());
        product.setUpdatedAt(Instant.now().toString());

        CatalogueItem saved = catalogueItemRepository.save(product);
        assertThat(saved.getSpecs()).contains("RTX 4060");
        assertThat(saved.getBrand()).isEqualTo("ASUS");
        assertThat(saved.getModel()).isEqualTo("ROG Strix G16");
    }
}

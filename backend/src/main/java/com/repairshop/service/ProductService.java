package com.repairshop.service;

import com.repairshop.dto.CatalogueItemRequest;
import com.repairshop.dto.PageResponse;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.CatalogueItem;
import com.repairshop.repository.CatalogueItemRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final CatalogueItemRepository catalogueItemRepository;

    public ProductService(CatalogueItemRepository catalogueItemRepository) {
        this.catalogueItemRepository = catalogueItemRepository;
    }

    /**
     * Get all available products with pagination
     */
    public PageResponse<CatalogueItem> getAllProducts(int page, int size) {
        List<CatalogueItem> all = new ArrayList<>();
        catalogueItemRepository.findAllAvailable().forEach(all::add);
        
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = (int) Math.min(fromIndex + size, total);

        List<CatalogueItem> content = (fromIndex >= total)
                ? List.of()
                : all.subList(fromIndex, toIndex);

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Get product by ID
     */
    public CatalogueItem getProductById(Long id) {
        return catalogueItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    /**
     * Get product by product_id
     */
    public CatalogueItem getProductByProductId(String productId) {
        return catalogueItemRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with product_id: " + productId));
    }

    /**
     * Search products by keyword with pagination
     */
    public PageResponse<CatalogueItem> searchProducts(String keyword, int page, int size) {
        List<CatalogueItem> results = catalogueItemRepository.searchByNameOrDescription("%" + keyword + "%");
        
        long total = results.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = (int) Math.min(fromIndex + size, total);

        List<CatalogueItem> content = (fromIndex >= total)
                ? List.of()
                : results.subList(fromIndex, toIndex);

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Get products by category with pagination
     */
    public PageResponse<CatalogueItem> getProductsByCategory(String category, int page, int size) {
        List<CatalogueItem> results = catalogueItemRepository.findByCategory(category);
        
        long total = results.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = (int) Math.min(fromIndex + size, total);

        List<CatalogueItem> content = (fromIndex >= total)
                ? List.of()
                : results.subList(fromIndex, toIndex);

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Create a new product (admin only)
     */
    public CatalogueItem createProduct(CatalogueItemRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ValidationException("Product name is required");
        }
        if (request.price() == null || request.price() < 0) {
            throw new ValidationException("Product price cannot be negative");
        }
        if (request.stock() == null || request.stock() < 0) {
            throw new ValidationException("Product stock cannot be negative");
        }

        String now = Instant.now().toString();
        CatalogueItem item = new CatalogueItem();
        item.setProductId("PROD-" + System.nanoTime());
        item.setName(request.name());
        item.setCategory(request.category());
        item.setDescription(request.description());
        item.setPrice(request.price());
        item.setStock(request.stock());
        item.setBrand(request.brand());
        item.setModel(request.model());
        item.setSpecs(request.specs());
        item.setImageBase64(request.imageBase64());
        item.setAvailable((request.available() != null && request.available()) ? 1 : 1);
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        return catalogueItemRepository.save(item);
    }

    /**
     * Update product (admin only)
     */
    public CatalogueItem updateProduct(Long id, CatalogueItemRequest request) {
        CatalogueItem item = getProductById(id);

        if (request.name() != null && !request.name().isBlank()) {
            item.setName(request.name());
        }
        if (request.category() != null) {
            item.setCategory(request.category());
        }
        if (request.description() != null) {
            item.setDescription(request.description());
        }
        if (request.price() != null && request.price() >= 0) {
            item.setPrice(request.price());
        }
        if (request.stock() != null && request.stock() >= 0) {
            item.setStock(request.stock());
        }
        if (request.brand() != null) {
            item.setBrand(request.brand());
        }
        if (request.model() != null) {
            item.setModel(request.model());
        }
        if (request.specs() != null) {
            item.setSpecs(request.specs());
        }
        if (request.imageBase64() != null) {
            item.setImageBase64(request.imageBase64());
        }

        item.setUpdatedAt(Instant.now().toString());
        return catalogueItemRepository.save(item);
    }

    /**
     * Delete product (admin only)
     */
    public void deleteProduct(Long id) {
        if (!catalogueItemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with id: " + id);
        }
        catalogueItemRepository.deleteById(id);
    }

    /**
     * Get available stock for a product
     */
    public int getAvailableStock(String productId) {
        return catalogueItemRepository.findByProductId(productId)
                .map(CatalogueItem::getStock)
                .orElse(0);
    }

    /**
     * Update product stock (reduce on order)
     */
    public void reduceStock(String productId, int quantity) {
        CatalogueItem item = getProductByProductId(productId);
        if (item.getStock() < quantity) {
            throw new ValidationException("Insufficient stock for product: " + productId);
        }
        item.setStock(item.getStock() - quantity);
        item.setUpdatedAt(Instant.now().toString());
        catalogueItemRepository.save(item);
    }

    /**
     * Restore product stock (on order cancellation)
     */
    public void restoreStock(String productId, int quantity) {
        CatalogueItem item = getProductByProductId(productId);
        item.setStock(item.getStock() + quantity);
        item.setUpdatedAt(Instant.now().toString());
        catalogueItemRepository.save(item);
    }
}

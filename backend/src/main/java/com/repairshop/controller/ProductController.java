package com.repairshop.controller;

import com.repairshop.dto.CatalogueItemRequest;
import com.repairshop.dto.PageResponse;
import com.repairshop.model.CatalogueItem;
import com.repairshop.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Public product endpoints under /api/products/**.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * GET /api/products — get all available products with pagination.
     * Query params: page (default 0), size (default 20).
     */
    @GetMapping
    public PageResponse<CatalogueItem> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.getAllProducts(page, size);
    }

    /**
     * GET /api/products/{id} — get product by ID.
     * Returns 404 if product not found.
     */
    @GetMapping("/{id}")
    public CatalogueItem getProduct(@PathVariable Long id) {
        return productService.getProductById(id);
    }

    /**
     * GET /api/products/search — search products by keyword with pagination.
     * Query params: q (search keyword), page (default 0), size (default 20).
     */
    @GetMapping("/search")
    public PageResponse<CatalogueItem> searchProducts(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.searchProducts(q, page, size);
    }

    /**
     * GET /api/products/category/{category} — get products by category with pagination.
     * Query params: page (default 0), size (default 20).
     */
    @GetMapping("/category/{category}")
    public PageResponse<CatalogueItem> getProductsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.getProductsByCategory(category, page, size);
    }
}

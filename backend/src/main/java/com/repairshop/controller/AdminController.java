package com.repairshop.controller;

import com.repairshop.dto.AdminEnquiryResponse;
import com.repairshop.dto.AdminOrderResponse;
import com.repairshop.dto.CatalogueItemRequest;
import com.repairshop.dto.PageResponse;
import com.repairshop.dto.StatusUpdateRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.model.CatalogueItem;
import com.repairshop.model.Enquiry;
import com.repairshop.model.Order;
import com.repairshop.service.EnquiryService;
import com.repairshop.service.OrderService;
import com.repairshop.service.ProductService;
import com.repairshop.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only endpoints under /api/admin/**.
 * Access is restricted to ROLE_ADMIN by Spring Security configuration.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final OrderService orderService;
    private final EnquiryService enquiryService;
    private final ProductService productService;

    public AdminController(UserService userService, OrderService orderService, EnquiryService enquiryService,
                          ProductService productService) {
        this.userService = userService;
        this.orderService = orderService;
        this.enquiryService = enquiryService;
        this.productService = productService;
    }

    // ==================== USER MANAGEMENT ====================

    /**
     * GET /api/admin/users — paginated list of active (non-deleted) users.
     */
    @GetMapping("/users")
    public PageResponse<UserResponse> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.listAllUsers(page, size);
    }

    /**
     * GET /api/admin/users/deleted — paginated list of soft-deleted users.
     */
    @GetMapping("/users/deleted")
    public PageResponse<UserResponse> listDeletedUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return userService.listDeletedUsers(page, size);
    }

    /**
     * DELETE /api/admin/users/{id} — physically delete a user by ID (hard delete).
     * Returns 204 No Content on success.
     * Returns 404 if user not found.
     */
    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUserById(id);
    }

    /**
     * PATCH /api/admin/users/{id}/deactivate — logically deactivate a user (soft delete).
     * Sets deleted_at without removing the record.
     */
    @PatchMapping("/users/{id}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateUser(@PathVariable Long id) {
        userService.deactivateUserById(id);
    }

    // ==================== ORDER MANAGEMENT ====================

    /**
     * GET /api/admin/orders — paginated list of all orders including submitting username.
     * Query params: page (default 0), size (default 20).
     */
    @GetMapping("/orders")
    public PageResponse<AdminOrderResponse> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return orderService.listAllOrders(page, size);
    }

    /**
     * PATCH /api/admin/orders/{id}/status — update order status.
     * Body: {"status": "..."} — valid values: Pending, Dispatched, Delivered, Cancelled.
     * Returns 400 if status is invalid, 404 if order not found.
     */
    @PatchMapping("/orders/{id}/status")
    public Order updateOrderStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return orderService.updateOrderStatus(id, request.status());
    }

    // ==================== ENQUIRY MANAGEMENT ====================

    /**
     * GET /api/admin/enquiries — paginated list of all enquiries including submitting username.
     * Query params: page (default 0), size (default 20).
     */
    @GetMapping("/enquiries")
    public PageResponse<AdminEnquiryResponse> listEnquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return enquiryService.listAllEnquiries(page, size);
    }

    /**
     * PATCH /api/admin/enquiries/{id}/status — update enquiry status.
     * Body: {"status": "..."} — valid values: Open, In Progress, Resolved, Closed.
     * Returns 400 if status is invalid, 404 if enquiry not found.
     */
    @PatchMapping("/enquiries/{id}/status")
    public Enquiry updateEnquiryStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return enquiryService.updateEnquiryStatus(id, request.status());
    }

    // ==================== PRODUCT MANAGEMENT ====================

    /**
     * POST /api/admin/products — create a new product.
     * Request body: CatalogueItemRequest
     * Returns 201 with created product.
     * Returns 400 if validation fails.
     */
    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogueItem createProduct(@RequestBody CatalogueItemRequest request) {
        return productService.createProduct(request);
    }

    /**
     * PUT /api/admin/products/{id} — update an existing product.
     * Request body: CatalogueItemRequest (partial updates supported)
     * Returns 200 with updated product.
     * Returns 404 if product not found.
     */
    @PutMapping("/products/{id}")
    public CatalogueItem updateProduct(@PathVariable Long id, @RequestBody CatalogueItemRequest request) {
        return productService.updateProduct(id, request);
    }

    /**
     * DELETE /api/admin/products/{id} — delete a product.
     * Returns 204 No Content on success.
     * Returns 404 if product not found.
     */
    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
    }

    /**
     * GET /api/admin/products — list all products with pagination.
     * Query params: page (default 0), size (default 20).
     */
    @GetMapping("/products")
    public PageResponse<CatalogueItem> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.getAllProducts(page, size);
    }
}

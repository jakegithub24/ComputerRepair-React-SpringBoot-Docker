package com.repairshop.controller;

import com.repairshop.dto.AdminEnquiryResponse;
import com.repairshop.dto.AdminOrderResponse;
import com.repairshop.dto.PageResponse;
import com.repairshop.dto.StatusUpdateRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.model.Enquiry;
import com.repairshop.model.Order;
import com.repairshop.service.EnquiryService;
import com.repairshop.service.OrderService;
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

    public AdminController(UserService userService, OrderService orderService, EnquiryService enquiryService) {
        this.userService = userService;
        this.orderService = orderService;
        this.enquiryService = enquiryService;
    }

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
     * Requirements: 11.2
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

    /**
     * GET /api/admin/orders — paginated list of all orders including submitting username.
     * Query params: page (default 0), size (default 20).
     * Requirements: 12.1
     */
    @GetMapping("/orders")
    public PageResponse<AdminOrderResponse> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return orderService.listAllOrders(page, size);
    }

    /**
     * GET /api/admin/enquiries — paginated list of all enquiries including submitting username.
     * Query params: page (default 0), size (default 20).
     * Requirements: 12.2
     */
    @GetMapping("/enquiries")
    public PageResponse<AdminEnquiryResponse> listEnquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return enquiryService.listAllEnquiries(page, size);
    }

    /**
     * PATCH /api/admin/orders/{id}/status — update order status.
     * Body: {"status": "..."} — valid values: Pending, In Progress, Completed, Cancelled.
     * Returns 400 if status is invalid, 404 if order not found.
     * Requirements: 12.3, 12.5
     */
    @PatchMapping("/orders/{id}/status")
    public Order updateOrderStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return orderService.updateOrderStatus(id, request.status());
    }

    /**
     * PATCH /api/admin/enquiries/{id}/status — update enquiry status.
     * Body: {"status": "..."} — valid values: Open, In Progress, Resolved, Closed.
     * Returns 400 if status is invalid, 404 if enquiry not found.
     * Requirements: 12.4, 12.5
     */
    @PatchMapping("/enquiries/{id}/status")
    public Enquiry updateEnquiryStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest request) {
        return enquiryService.updateEnquiryStatus(id, request.status());
    }
}

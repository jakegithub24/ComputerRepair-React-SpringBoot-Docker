package com.repairshop.controller;

import com.repairshop.dto.OrderItemResponse;
import com.repairshop.model.Order;
import com.repairshop.service.OrderService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * POST /api/orders — create order from cart.
     * Request body: { "shippingAddress": "..." }
     * Extracts userId from JWT claims. Returns 201 with created order.
     * Returns 400 if shippingAddress is missing/blank or cart is empty.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order createOrder(@RequestBody Map<String, String> request) {
        Long userId = extractUserId();
        String shippingAddress = request.get("shippingAddress");
        return orderService.createOrderFromCart(userId, shippingAddress);
    }

    /**
     * GET /api/orders — get orders for the authenticated user.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     */
    @GetMapping
    public List<Order> getOrders() {
        Long userId = extractUserId();
        return orderService.getOrdersForUser(userId);
    }

    /**
     * GET /api/orders/{id} — get order details with items.
     * Returns order with its associated items.
     * Returns 404 if order not found.
     */
    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id) {
        Long userId = extractUserId();
        Order order = orderService.getOrderWithItems(id);
        // Verify user owns this order
        if (!order.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized access to this order");
        }
        return order;
    }

    /**
     * GET /api/orders/{id}/items — get order items.
     * Returns list of items in the order.
     * Returns 404 if order not found.
     */
    @GetMapping("/{id}/items")
    public List<OrderItemResponse> getOrderItems(@PathVariable Long id) {
        Long userId = extractUserId();
        Order order = orderService.getOrderWithItems(id);
        // Verify user owns this order
        if (!order.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized access to this order");
        }
        return orderService.getOrderItems(id);
    }

    private Long extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        return ((Number) claims.get("userId")).longValue();
    }
}

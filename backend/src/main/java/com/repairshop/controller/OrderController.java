package com.repairshop.controller;

import com.repairshop.dto.OrderRequest;
import com.repairshop.model.Order;
import com.repairshop.service.OrderService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * POST /api/orders — submit a new order.
     * Extracts userId from JWT claims. Returns 201 with created order.
     * Returns 400 if serviceType or deviceDescription is missing/blank.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     * Requirements: 6.1, 6.2, 6.3
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Order createOrder(@RequestBody OrderRequest request) {
        Long userId = extractUserId();
        return orderService.createOrder(userId, request);
    }

    /**
     * GET /api/orders — get orders for the authenticated user.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     * Requirements: 8.1, 8.4
     */
    @GetMapping
    public List<Order> getOrders() {
        Long userId = extractUserId();
        return orderService.getOrdersForUser(userId);
    }

    private Long extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        return ((Number) claims.get("userId")).longValue();
    }
}

package com.repairshop.controller;

import com.repairshop.dto.CartItemResponse;
import com.repairshop.service.CartService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Cart endpoints under /api/cart/**.
 * All endpoints require authentication.
 */
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    /**
     * GET /api/cart — get all items in user's cart.
     * Returns list of cart items with product details and subtotals.
     */
    @GetMapping
    public List<CartItemResponse> getCartItems() {
        Long userId = extractUserId();
        return cartService.getCartItems(userId);
    }

    /**
     * POST /api/cart — add item to cart.
     * Request body: { "productId": "PROD-xxx", "quantity": 1 }
     * Returns 201 with added cart item.
     * Returns 400 if product not found or insufficient stock.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CartItemResponse addToCart(@RequestBody Map<String, Object> request) {
        Long userId = extractUserId();
        String productId = (String) request.get("productId");
        int quantity = ((Number) request.get("quantity")).intValue();
        
        cartService.addToCart(userId, productId, quantity);
        
        // Return the updated item
        List<CartItemResponse> items = cartService.getCartItems(userId);
        return items.stream()
                .filter(item -> item.productId().equals(productId))
                .findFirst()
                .orElse(null);
    }

    /**
     * PUT /api/cart/{productId} — update quantity of item in cart.
     * Request body: { "quantity": 5 }
     * Returns updated cart item.
     * Returns 404 if item not found in cart.
     */
    @PutMapping("/{productId}")
    public CartItemResponse updateQuantity(
            @PathVariable String productId,
            @RequestBody Map<String, Object> request) {
        Long userId = extractUserId();
        int quantity = ((Number) request.get("quantity")).intValue();
        
        cartService.updateQuantity(userId, productId, quantity);
        
        // Return the updated item
        List<CartItemResponse> items = cartService.getCartItems(userId);
        return items.stream()
                .filter(item -> item.productId().equals(productId))
                .findFirst()
                .orElse(null);
    }

    /**
     * DELETE /api/cart/{productId} — remove item from cart.
     * Returns 204 No Content on success.
     * Returns 404 if item not found in cart.
     */
    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromCart(@PathVariable String productId) {
        Long userId = extractUserId();
        cartService.removeFromCart(userId, productId);
    }

    /**
     * DELETE /api/cart — clear entire cart.
     * Returns 204 No Content on success.
     */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clearCart() {
        Long userId = extractUserId();
        cartService.clearCart(userId);
    }

    /**
     * GET /api/cart/total — get cart total price.
     * Returns { "total": 123.45 }
     */
    @GetMapping("/total")
    public Map<String, Double> getCartTotal() {
        Long userId = extractUserId();
        double total = cartService.getCartTotal(userId);
        return Map.of("total", total);
    }

    /**
     * GET /api/cart/count — get total number of items in cart.
     * Returns { "count": 5 }
     */
    @GetMapping("/count")
    public Map<String, Integer> getCartCount() {
        Long userId = extractUserId();
        int count = cartService.getCartItemCount(userId);
        return Map.of("count", count);
    }

    private Long extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        return ((Number) claims.get("userId")).longValue();
    }
}

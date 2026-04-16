package com.repairshop.service;

import com.repairshop.dto.CartItemResponse;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.CartItem;
import com.repairshop.model.CatalogueItem;
import com.repairshop.repository.CartItemRepository;
import com.repairshop.repository.CatalogueItemRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final CatalogueItemRepository catalogueItemRepository;

    public CartService(CartItemRepository cartItemRepository, CatalogueItemRepository catalogueItemRepository) {
        this.cartItemRepository = cartItemRepository;
        this.catalogueItemRepository = catalogueItemRepository;
    }

    /**
     * Add item to cart (or update quantity if already exists)
     */
    public CartItem addToCart(Long userId, String productId, int quantity) {
        if (quantity <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }

        // Verify product exists
        CatalogueItem product = catalogueItemRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        // Check stock
        if (product.getStock() < quantity) {
            throw new ValidationException("Insufficient stock available. Only " + product.getStock() + " available");
        }

        // Check if item already in cart
        java.util.Optional<CartItem> existing = cartItemRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            CartItem cartItem = existing.get();
            int newQuantity = cartItem.getQuantity() + quantity;
            if (product.getStock() < newQuantity) {
                throw new ValidationException("Insufficient stock. Can only add " + 
                        (product.getStock() - cartItem.getQuantity()) + " more");
            }
            cartItem.setQuantity(newQuantity);
            return cartItemRepository.save(cartItem);
        }

        // Create new cart item
        CartItem newItem = new CartItem(userId, productId, quantity, Instant.now().toString());
        return cartItemRepository.save(newItem);
    }

    /**
     * Get all cart items for user
     */
    public List<CartItemResponse> getCartItems(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        return items.stream()
                .map(item -> {
                    CatalogueItem product = catalogueItemRepository.findByProductId(item.getProductId())
                            .orElse(null);
                    if (product == null) {
                        return null;
                    }
                    return new CartItemResponse(
                            item.getId(),
                            item.getProductId(),
                            product.getName(),
                            product.getPrice(),
                            item.getQuantity(),
                            product.getPrice() * item.getQuantity(),
                            product.getImageBase64()
                    );
                })
                .filter(item -> item != null)
                .collect(Collectors.toList());
    }

    /**
     * Update quantity of item in cart
     */
    public CartItem updateQuantity(Long userId, String productId, int quantity) {
        if (quantity <= 0) {
            throw new ValidationException("Quantity must be greater than 0");
        }

        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        // Verify product exists and has enough stock
        CatalogueItem product = catalogueItemRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        if (product.getStock() < quantity) {
            throw new ValidationException("Insufficient stock. Only " + product.getStock() + " available");
        }

        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    /**
     * Remove item from cart
     */
    public void removeFromCart(Long userId, String productId) {
        CartItem cartItem = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));
        cartItemRepository.deleteById(cartItem.getId());
    }

    /**
     * Clear entire cart for user
     */
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    /**
     * Get cart total
     */
    public double getCartTotal(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        return items.stream()
                .mapToDouble(item -> {
                    CatalogueItem product = catalogueItemRepository.findByProductId(item.getProductId())
                            .orElse(null);
                    if (product == null) {
                        return 0;
                    }
                    return product.getPrice() * item.getQuantity();
                })
                .sum();
    }

    /**
     * Get cart item count
     */
    public int getCartItemCount(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        return items.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }
}

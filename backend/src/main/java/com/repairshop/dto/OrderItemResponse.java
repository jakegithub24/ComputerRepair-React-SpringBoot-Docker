package com.repairshop.dto;

public record OrderItemResponse(
        Long id,
        Long orderId,
        String productId,
        String productName,
        int quantity,
        double priceAtPurchase,
        double subtotal
) {}

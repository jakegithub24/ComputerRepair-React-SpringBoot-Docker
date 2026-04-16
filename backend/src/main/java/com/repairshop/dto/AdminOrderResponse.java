package com.repairshop.dto;

public record AdminOrderResponse(
        Long id,
        Long userId,
        String username,
        double totalPrice,
        String shippingAddress,
        String status,
        String createdAt
) {}

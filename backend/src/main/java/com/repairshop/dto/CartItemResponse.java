package com.repairshop.dto;

public record CartItemResponse(
        Long id,
        String productId,
        String productName,
        double productPrice,
        int quantity,
        double subtotal,
        String imageBase64
) {}

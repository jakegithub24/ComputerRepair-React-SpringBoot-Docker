package com.repairshop.dto;

public record AdminOrderResponse(
        Long id,
        Long userId,
        String username,
        String serviceType,
        String deviceDescription,
        String notes,
        String status,
        String createdAt
) {}

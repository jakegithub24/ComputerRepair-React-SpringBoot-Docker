package com.repairshop.dto;

public record AdminEnquiryResponse(
        Long id,
        Long userId,
        String username,
        String subject,
        String message,
        String status,
        String createdAt
) {}

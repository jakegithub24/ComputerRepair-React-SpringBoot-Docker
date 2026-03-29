package com.repairshop.dto;

public record ChatSessionResponse(
    Long id,
    Long userId,
    String username,
    String refType,
    Long refId,
    String subject,
    String status,
    String createdAt,
    String acceptedAt
) {}

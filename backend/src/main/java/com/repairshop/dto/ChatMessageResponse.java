package com.repairshop.dto;

public record ChatMessageResponse(
    Long id,
    Long sessionId,
    Long senderId,
    String senderUsername,
    String senderRole,
    String messageType,
    String content,
    String imageMimeType,
    String sentAt
) {}

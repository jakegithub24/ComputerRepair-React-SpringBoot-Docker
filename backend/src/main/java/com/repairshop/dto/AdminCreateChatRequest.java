package com.repairshop.dto;

public record AdminCreateChatRequest(
    Long orderId,   // The order ID to link the chat to
    String subject  // Initial subject/message
) {}

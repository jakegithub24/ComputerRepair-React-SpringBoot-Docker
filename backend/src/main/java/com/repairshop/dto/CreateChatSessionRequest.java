package com.repairshop.dto;

public record CreateChatSessionRequest(
    String refType,  // ORDER or ENQUIRY
    Long refId,
    String subject
) {}

package com.repairshop.dto;

public record SendMessageRequest(
    String messageType,   // TEXT or IMAGE
    String content,       // text or base64 image data
    String imageMimeType  // e.g. image/jpeg (only for IMAGE type)
) {}

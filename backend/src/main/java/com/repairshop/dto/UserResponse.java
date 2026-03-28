package com.repairshop.dto;

public record UserResponse(Long id, String username, String email, String role, String createdAt) {}

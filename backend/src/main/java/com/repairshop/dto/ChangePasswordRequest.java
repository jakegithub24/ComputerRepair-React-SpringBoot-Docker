package com.repairshop.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {}

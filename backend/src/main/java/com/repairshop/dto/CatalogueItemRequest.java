package com.repairshop.dto;

public record CatalogueItemRequest(
    String name,
    String category,
    String description,
    Double price,
    Integer stock,
    String brand,
    String model,
    String specs,
    String imageBase64,
    Boolean available
) {}

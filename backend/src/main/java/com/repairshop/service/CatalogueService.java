package com.repairshop.service;

import com.repairshop.dto.CatalogueItemRequest;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.CatalogueItem;
import com.repairshop.repository.CatalogueRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CatalogueService {

    private static final List<String> VALID_CATEGORIES = List.of(
            "Laptop", "Desktop", "RAM", "SSD", "HDD", "Router", "Pendrive",
            "Monitor", "Keyboard", "Mouse", "Printer", "GPU", "CPU", "Motherboard",
            "Power Supply", "Cooling", "Cable", "Accessory", "Other"
    );

    private final CatalogueRepository repo;

    public CatalogueService(CatalogueRepository repo) {
        this.repo = repo;
    }

    /** Public: get all available items */
    public List<CatalogueItem> getAvailable() {
        return repo.findAvailable();
    }

    /** Public: get all items (admin sees everything) */
    public List<CatalogueItem> getAll() {
        return repo.findAll();
    }

    /** Public: get single item by productId */
    public CatalogueItem getByProductId(String productId) {
        return repo.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
    }

    /** Admin: create a new catalogue item */
    public CatalogueItem create(CatalogueItemRequest req) {
        validate(req);
        String productId = generateProductId();
        String now = Instant.now().toString();

        CatalogueItem item = new CatalogueItem();
        item.setProductId(productId);
        item.setName(req.name().trim());
        item.setCategory(req.category());
        item.setDescription(req.description());
        item.setPrice(req.price() != null ? req.price() : 0.0);
        item.setStock(req.stock() != null ? req.stock() : 0);
        item.setBrand(req.brand());
        item.setModel(req.model());
        item.setSpecs(req.specs());
        item.setImageBase64(req.imageBase64());
        item.setAvailable(req.available() == null || req.available() ? 1 : 0);
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        return repo.save(item);
    }

    /** Admin: update an existing catalogue item */
    public CatalogueItem update(Long id, CatalogueItemRequest req) {
        CatalogueItem item = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Catalogue item not found: " + id));
        validate(req);

        item.setName(req.name().trim());
        item.setCategory(req.category());
        item.setDescription(req.description());
        item.setPrice(req.price() != null ? req.price() : item.getPrice());
        item.setStock(req.stock() != null ? req.stock() : item.getStock());
        item.setBrand(req.brand());
        item.setModel(req.model());
        item.setSpecs(req.specs());
        if (req.imageBase64() != null) item.setImageBase64(req.imageBase64());
        if (req.available() != null) item.setAvailable(req.available() ? 1 : 0);
        item.setUpdatedAt(Instant.now().toString());

        return repo.save(item);
    }

    /** Admin: delete a catalogue item */
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Catalogue item not found: " + id);
        }
        repo.deleteById(id);
    }

    private void validate(CatalogueItemRequest req) {
        if (req.name() == null || req.name().isBlank()) throw new ValidationException("Name is required");
        if (req.category() == null || !VALID_CATEGORIES.contains(req.category()))
            throw new ValidationException("Invalid category. Valid: " + VALID_CATEGORIES);
        if (req.price() != null && req.price() < 0) throw new ValidationException("Price cannot be negative");
        if (req.stock() != null && req.stock() < 0) throw new ValidationException("Stock cannot be negative");
    }

    private synchronized String generateProductId() {
        int next = repo.findMaxProductSequence() + 1;
        return String.format("PROD-%04d", next);
    }
}

package com.repairshop.controller;

import com.repairshop.dto.CatalogueItemRequest;
import com.repairshop.model.CatalogueItem;
import com.repairshop.service.CatalogueService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalogue")
public class CatalogueController {

    private final CatalogueService catalogueService;

    public CatalogueController(CatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    /** Public: list all available items */
    @GetMapping
    public List<CatalogueItem> getAvailable() {
        return catalogueService.getAvailable();
    }

    /** Public: get item by productId */
    @GetMapping("/{productId}")
    public CatalogueItem getByProductId(@PathVariable String productId) {
        return catalogueService.getByProductId(productId);
    }

    /** Admin: list all items including unavailable */
    @GetMapping("/admin/all")
    public List<CatalogueItem> getAll() {
        return catalogueService.getAll();
    }

    /** Admin: create item */
    @PostMapping("/admin")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogueItem create(@RequestBody CatalogueItemRequest req) {
        return catalogueService.create(req);
    }

    /** Admin: update item */
    @PutMapping("/admin/{id}")
    public CatalogueItem update(@PathVariable Long id, @RequestBody CatalogueItemRequest req) {
        return catalogueService.update(id, req);
    }

    /** Admin: delete item */
    @DeleteMapping("/admin/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        catalogueService.delete(id);
    }
}

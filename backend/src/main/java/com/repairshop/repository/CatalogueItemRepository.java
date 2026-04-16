package com.repairshop.repository;

import com.repairshop.model.CatalogueItem;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CatalogueItemRepository extends CrudRepository<CatalogueItem, Long> {

    @Query("SELECT * FROM catalogue_items WHERE product_id = :productId")
    Optional<CatalogueItem> findByProductId(@Param("productId") String productId);

    @Query("SELECT * FROM catalogue_items WHERE category = :category AND available = 1")
    List<CatalogueItem> findByCategory(@Param("category") String category);

    @Query("SELECT * FROM catalogue_items WHERE (name LIKE :keyword OR description LIKE :keyword) AND available = 1")
    List<CatalogueItem> searchByNameOrDescription(@Param("keyword") String keyword);

    @Query("SELECT * FROM catalogue_items WHERE available = 1")
    Iterable<CatalogueItem> findAllAvailable();
}

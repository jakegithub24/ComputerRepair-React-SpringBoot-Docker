package com.repairshop.repository;

import com.repairshop.model.CatalogueItem;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CatalogueRepository extends CrudRepository<CatalogueItem, Long> {

    @Query("SELECT * FROM catalogue_items ORDER BY category, name")
    List<CatalogueItem> findAll();

    @Query("SELECT * FROM catalogue_items WHERE available = 1 ORDER BY category, name")
    List<CatalogueItem> findAvailable();

    @Query("SELECT * FROM catalogue_items WHERE product_id = :productId LIMIT 1")
    Optional<CatalogueItem> findByProductId(@Param("productId") String productId);

    @Query("SELECT * FROM catalogue_items WHERE category = :category ORDER BY name")
    List<CatalogueItem> findByCategory(@Param("category") String category);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTR(product_id, 6) AS INTEGER)), 0) FROM catalogue_items WHERE product_id LIKE 'PROD-%'")
    int findMaxProductSequence();
}

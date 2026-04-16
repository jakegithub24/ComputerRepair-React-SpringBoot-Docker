package com.repairshop.repository;

import com.repairshop.model.CartItem;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends CrudRepository<CartItem, Long> {

    @Query("SELECT * FROM cart_items WHERE user_id = :userId")
    List<CartItem> findByUserId(@Param("userId") Long userId);

    @Query("SELECT * FROM cart_items WHERE user_id = :userId AND product_id = :productId")
    Optional<CartItem> findByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") String productId);

    @Query("DELETE FROM cart_items WHERE user_id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}

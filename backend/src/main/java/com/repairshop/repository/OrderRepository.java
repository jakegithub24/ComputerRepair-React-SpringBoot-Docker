package com.repairshop.repository;

import com.repairshop.model.Order;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends CrudRepository<Order, Long> {

    @Query("SELECT * FROM orders WHERE user_id = :userId")
    List<Order> findByUserId(@Param("userId") Long userId);

    @Query("SELECT * FROM orders")
    Iterable<Order> findAll();
}

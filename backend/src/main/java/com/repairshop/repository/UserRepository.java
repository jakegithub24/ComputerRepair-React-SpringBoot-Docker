package com.repairshop.repository;

import com.repairshop.model.User;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends CrudRepository<User, Long> {

    @Query("SELECT * FROM users WHERE username = :username LIMIT 1")
    Optional<User> findByUsername(@Param("username") String username);

    @Query("SELECT COUNT(*) > 0 FROM users WHERE username = :username")
    boolean existsByUsername(@Param("username") String username);

    @Query("SELECT * FROM users WHERE role = :role LIMIT 1")
    Optional<User> findByRole(@Param("role") String role);

    @Query("SELECT * FROM users WHERE deleted_at IS NULL")
    List<User> findAll();

    @Query("SELECT * FROM users WHERE deleted_at IS NOT NULL")
    List<User> findDeleted();

    @Query("SELECT * FROM users")
    List<User> findAllIncludingDeleted();
}

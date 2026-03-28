package com.repairshop.repository;

import com.repairshop.model.Enquiry;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EnquiryRepository extends CrudRepository<Enquiry, Long> {

    @Query("SELECT * FROM enquiries WHERE user_id = :userId")
    List<Enquiry> findByUserId(@Param("userId") Long userId);

    @Query("SELECT * FROM enquiries")
    Iterable<Enquiry> findAll();
}

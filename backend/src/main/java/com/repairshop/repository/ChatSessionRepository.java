package com.repairshop.repository;

import com.repairshop.model.ChatSession;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatSessionRepository extends CrudRepository<ChatSession, Long> {

    @Query("SELECT * FROM chat_sessions WHERE user_id = :userId ORDER BY created_at DESC")
    List<ChatSession> findByUserId(@Param("userId") Long userId);

    @Query("SELECT * FROM chat_sessions ORDER BY created_at DESC")
    List<ChatSession> findAll();

    @Query("SELECT * FROM chat_sessions WHERE status = 'PENDING' ORDER BY created_at DESC")
    List<ChatSession> findPending();
}

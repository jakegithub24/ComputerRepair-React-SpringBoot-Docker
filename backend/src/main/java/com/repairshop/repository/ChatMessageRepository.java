package com.repairshop.repository;

import com.repairshop.model.ChatMessage;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends CrudRepository<ChatMessage, Long> {

    @Query("SELECT * FROM chat_messages WHERE session_id = :sessionId ORDER BY sent_at ASC")
    List<ChatMessage> findBySessionId(@Param("sessionId") Long sessionId);
}

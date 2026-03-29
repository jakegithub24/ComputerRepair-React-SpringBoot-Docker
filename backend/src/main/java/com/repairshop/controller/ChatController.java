package com.repairshop.controller;

import com.repairshop.dto.*;
import com.repairshop.service.ChatService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    // ── REST endpoints ──────────────────────────────────────────────────────

    /** User: create a chat session request */
    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatSessionResponse createSession(@RequestBody CreateChatSessionRequest req) {
        Long userId = extractUserId();
        return chatService.createSession(userId, req);
    }

    /** User: get own sessions */
    @GetMapping("/sessions")
    public List<ChatSessionResponse> getMySessions() {
        Long userId = extractUserId();
        return chatService.getUserSessions(userId);
    }

    /** User/Admin: get messages for a session */
    @GetMapping("/sessions/{sessionId}/messages")
    public List<ChatMessageResponse> getMessages(@PathVariable Long sessionId) {
        Long requesterId = extractUserId();
        String role = extractRole();
        return chatService.getMessages(sessionId, requesterId, role);
    }

    /** User/Admin: send a message via REST (fallback) */
    @PostMapping("/sessions/{sessionId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse sendMessage(@PathVariable Long sessionId,
                                           @RequestBody SendMessageRequest req) {
        Long senderId = extractUserId();
        String role = extractRole();
        return chatService.sendMessage(sessionId, senderId, role, req);
    }

    /** Admin: get all sessions */
    @GetMapping("/admin/sessions")
    public List<ChatSessionResponse> getAllSessions() {
        return chatService.getAllSessions();
    }

    /** Admin: get pending sessions */
    @GetMapping("/admin/sessions/pending")
    public List<ChatSessionResponse> getPendingSessions() {
        return chatService.getPendingSessions();
    }

    /** Admin: accept a session */
    @PostMapping("/admin/sessions/{sessionId}/accept")
    public ChatSessionResponse acceptSession(@PathVariable Long sessionId) {
        return chatService.acceptSession(sessionId);
    }

    /** Admin: close a session */
    @PostMapping("/admin/sessions/{sessionId}/close")
    public ChatSessionResponse closeSession(@PathVariable Long sessionId) {
        return chatService.closeSession(sessionId);
    }

    // ── WebSocket message handlers ──────────────────────────────────────────

    /** Send a message via WebSocket: /app/chat/{sessionId}/send */
    @MessageMapping("/chat/{sessionId}/send")
    public void sendMessageWs(@DestinationVariable Long sessionId,
                               @Payload SendMessageRequest req,
                               Principal principal) {
        if (principal == null) return;
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) principal).getDetails();
        Long senderId = ((Number) claims.get("userId")).longValue();
        String role = claims.get("role", String.class);
        chatService.sendMessage(sessionId, senderId, role, req);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Long extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        return ((Number) claims.get("userId")).longValue();
    }

    private String extractRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        return claims.get("role", String.class);
    }
}

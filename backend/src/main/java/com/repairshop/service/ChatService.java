package com.repairshop.service;

import com.repairshop.dto.*;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.ChatMessage;
import com.repairshop.model.ChatSession;
import com.repairshop.model.User;
import com.repairshop.repository.ChatMessageRepository;
import com.repairshop.repository.ChatSessionRepository;
import com.repairshop.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class ChatService {

    private static final Set<String> VALID_REF_TYPES = Set.of("ORDER", "ENQUIRY");
    // Max image size: ~10MB base64 encoded (~7.5MB raw) — practical limit for SQLite BLOBs
    private static final int MAX_IMAGE_CONTENT_LENGTH = 14_000_000;

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatSessionRepository sessionRepo, ChatMessageRepository messageRepo,
                       UserRepository userRepo, SimpMessagingTemplate messagingTemplate) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.messagingTemplate = messagingTemplate;
    }

    /** User creates a chat request linked to an order or enquiry */
    public ChatSessionResponse createSession(Long userId, CreateChatSessionRequest req) {
        if (!VALID_REF_TYPES.contains(req.refType())) {
            throw new ValidationException("refType must be ORDER or ENQUIRY");
        }
        if (req.subject() == null || req.subject().isBlank()) {
            throw new ValidationException("Subject is required");
        }
        ChatSession session = new ChatSession(userId, req.refType(), req.refId(),
                req.subject(), "PENDING", Instant.now().toString());
        ChatSession saved = sessionRepo.save(session);

        // Notify admin of new pending chat request
        messagingTemplate.convertAndSend("/topic/admin/chat-requests", toResponse(saved));

        return toResponse(saved);
    }

    /** Admin accepts a pending chat session */
    public ChatSessionResponse acceptSession(Long sessionId) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));
        if (!"PENDING".equals(session.getStatus())) {
            throw new ValidationException("Session is not in PENDING state");
        }
        session.setStatus("ACTIVE");
        session.setAcceptedAt(Instant.now().toString());
        ChatSession saved = sessionRepo.save(session);

        // Notify the user their chat was accepted
        messagingTemplate.convertAndSendToUser(
                String.valueOf(session.getUserId()), "/queue/chat-accepted", toResponse(saved));

        return toResponse(saved);
    }

    /** Admin closes a chat session */
    public ChatSessionResponse closeSession(Long sessionId) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));
        session.setStatus("CLOSED");
        ChatSession saved = sessionRepo.save(session);

        messagingTemplate.convertAndSendToUser(
                String.valueOf(session.getUserId()), "/queue/chat-closed", toResponse(saved));

        return toResponse(saved);
    }

    /** Send a message in an active session */
    public ChatMessageResponse sendMessage(Long sessionId, Long senderId, String senderRole,
                                           SendMessageRequest req) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new ValidationException("Chat session is not active");
        }

        // Validate sender is participant (user or admin)
        if ("USER".equals(senderRole) && !session.getUserId().equals(senderId)) {
            throw new ValidationException("Not a participant of this session");
        }

        String type = req.messageType() != null ? req.messageType().toUpperCase() : "TEXT";
        if (!"TEXT".equals(type) && !"IMAGE".equals(type)) {
            throw new ValidationException("messageType must be TEXT or IMAGE");
        }
        if (req.content() == null || req.content().isBlank()) {
            throw new ValidationException("Content is required");
        }
        if ("IMAGE".equals(type) && req.content().length() > MAX_IMAGE_CONTENT_LENGTH) {
            throw new ValidationException("Image too large. Maximum size is ~10MB.");
        }

        ChatMessage msg = new ChatMessage(sessionId, senderId, senderRole, type,
                req.content(), req.imageMimeType(), Instant.now().toString());
        ChatMessage saved = messageRepo.save(msg);
        ChatMessageResponse response = toMessageResponse(saved);

        // Broadcast to session topic
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId, response);

        return response;
    }

    /** Get all messages for a session */
    public List<ChatMessageResponse> getMessages(Long sessionId, Long requesterId, String requesterRole) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));
        if ("USER".equals(requesterRole) && !session.getUserId().equals(requesterId)) {
            throw new ValidationException("Not a participant of this session");
        }
        return messageRepo.findBySessionId(sessionId).stream().map(this::toMessageResponse).toList();
    }

    /** Get sessions for a user */
    public List<ChatSessionResponse> getUserSessions(Long userId) {
        return sessionRepo.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    /** Get all sessions (admin) */
    public List<ChatSessionResponse> getAllSessions() {
        return sessionRepo.findAll().stream().map(this::toResponse).toList();
    }

    /** Get pending sessions (admin) */
    public List<ChatSessionResponse> getPendingSessions() {
        return sessionRepo.findPending().stream().map(this::toResponse).toList();
    }

    private ChatSessionResponse toResponse(ChatSession s) {
        String username = userRepo.findById(s.getUserId())
                .map(User::getUsername).orElse("unknown");
        return new ChatSessionResponse(s.getId(), s.getUserId(), username,
                s.getRefType(), s.getRefId(), s.getSubject(), s.getStatus(),
                s.getCreatedAt(), s.getAcceptedAt());
    }

    private ChatMessageResponse toMessageResponse(ChatMessage m) {
        String username = userRepo.findById(m.getSenderId())
                .map(User::getUsername).orElse("admin");
        return new ChatMessageResponse(m.getId(), m.getSessionId(), m.getSenderId(),
                username, m.getSenderRole(), m.getMessageType(),
                m.getContent(), m.getImageMimeType(), m.getSentAt());
    }
}

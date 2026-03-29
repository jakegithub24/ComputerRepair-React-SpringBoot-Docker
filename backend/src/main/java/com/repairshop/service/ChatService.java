package com.repairshop.service;

import com.repairshop.dto.*;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.ChatMessage;
import com.repairshop.model.ChatSession;
import com.repairshop.model.User;
import com.repairshop.repository.ChatMessageRepository;
import com.repairshop.repository.ChatSessionRepository;
import com.repairshop.repository.OrderRepository;
import com.repairshop.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class ChatService {

    private static final int MAX_IMAGE_CONTENT_LENGTH = 14_000_000; // ~10MB base64

    private final ChatSessionRepository sessionRepo;
    private final ChatMessageRepository messageRepo;
    private final UserRepository userRepo;
    private final OrderRepository orderRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatService(ChatSessionRepository sessionRepo, ChatMessageRepository messageRepo,
                       UserRepository userRepo, OrderRepository orderRepo,
                       SimpMessagingTemplate messagingTemplate) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.orderRepo = orderRepo;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * User creates a chat request — must be linked to one of their own orders.
     */
    public ChatSessionResponse createSession(Long userId, CreateChatSessionRequest req) {
        if (!"ORDER".equals(req.refType())) {
            throw new ValidationException("Chat requests must be linked to an ORDER");
        }
        if (req.refId() == null || req.refId() <= 0) {
            throw new ValidationException("A valid Order ID is required");
        }
        // Verify the order belongs to this user
        var order = orderRepo.findById(req.refId())
                .orElseThrow(() -> new ValidationException("Order #" + req.refId() + " not found"));
        if (!order.getUserId().equals(userId)) {
            throw new ValidationException("Order #" + req.refId() + " does not belong to your account");
        }
        if (req.subject() == null || req.subject().isBlank()) {
            throw new ValidationException("Subject is required");
        }
        ChatSession session = new ChatSession(userId, "ORDER", req.refId(),
                req.subject(), "PENDING", Instant.now().toString());
        ChatSession saved = sessionRepo.save(session);

        // Notify admin of new pending chat request
        messagingTemplate.convertAndSend("/topic/admin/chat-requests", toResponse(saved));

        return toResponse(saved);
    }

    /**
     * Admin initiates a chat session for a specific order (targets the order's owner).
     */
    public ChatSessionResponse adminCreateSession(AdminCreateChatRequest req) {
        if (req.orderId() == null || req.orderId() <= 0) {
            throw new ValidationException("A valid Order ID is required");
        }
        var order = orderRepo.findById(req.orderId())
                .orElseThrow(() -> new ValidationException("Order #" + req.orderId() + " not found"));
        String subject = req.subject() != null && !req.subject().isBlank()
                ? req.subject()
                : "Admin chat regarding Order #" + req.orderId();

        ChatSession session = new ChatSession(order.getUserId(), "ORDER", req.orderId(),
                subject, "ACTIVE", Instant.now().toString());
        session.setAcceptedAt(Instant.now().toString());
        // Admin-initiated: unread for user = 1 (they have a new chat)
        session.setUnreadUser(1);
        ChatSession saved = sessionRepo.save(session);

        ChatSessionResponse response = toResponse(saved);
        // Notify the user they have a new chat from admin
        messagingTemplate.convertAndSendToUser(
                String.valueOf(order.getUserId()), "/queue/chat-accepted", response);

        return response;
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

    /** Send a message — increments unread count for the other party */
    public ChatMessageResponse sendMessage(Long sessionId, Long senderId, String senderRole,
                                           SendMessageRequest req) {
        ChatSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new ValidationException("Chat session is not active");
        }
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

        // Increment unread for the OTHER party
        if ("USER".equals(senderRole)) {
            session.setUnreadAdmin(session.getUnreadAdmin() + 1);
        } else {
            session.setUnreadUser(session.getUnreadUser() + 1);
        }
        sessionRepo.save(session);

        ChatMessage msg = new ChatMessage(sessionId, senderId, senderRole, type,
                req.content(), req.imageMimeType(), Instant.now().toString());
        ChatMessage saved = messageRepo.save(msg);
        ChatMessageResponse response = toMessageResponse(saved);

        // Broadcast to session topic
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId, response);

        // Also push updated unread counts
        ChatSessionResponse updatedSession = toResponse(sessionRepo.findById(sessionId).orElse(session));
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId + "/session", updatedSession);

        return response;
    }

    /** Mark session as read for a given role — resets their unread count */
    public void markRead(Long sessionId, String role) {
        ChatSession session = sessionRepo.findById(sessionId).orElse(null);
        if (session == null) return;
        if ("USER".equals(role)) {
            session.setUnreadUser(0);
        } else {
            session.setUnreadAdmin(0);
        }
        sessionRepo.save(session);
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

    public List<ChatSessionResponse> getUserSessions(Long userId) {
        return sessionRepo.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public List<ChatSessionResponse> getAllSessions() {
        return sessionRepo.findAll().stream().map(this::toResponse).toList();
    }

    public List<ChatSessionResponse> getPendingSessions() {
        return sessionRepo.findPending().stream().map(this::toResponse).toList();
    }

    private ChatSessionResponse toResponse(ChatSession s) {
        String username = userRepo.findById(s.getUserId())
                .map(User::getUsername).orElse("unknown");
        return new ChatSessionResponse(s.getId(), s.getUserId(), username,
                s.getRefType(), s.getRefId(), s.getSubject(), s.getStatus(),
                s.getCreatedAt(), s.getAcceptedAt(), s.getUnreadUser(), s.getUnreadAdmin());
    }

    private ChatMessageResponse toMessageResponse(ChatMessage m) {
        String username = userRepo.findById(m.getSenderId())
                .map(User::getUsername).orElse("admin");
        return new ChatMessageResponse(m.getId(), m.getSessionId(), m.getSenderId(),
                username, m.getSenderRole(), m.getMessageType(),
                m.getContent(), m.getImageMimeType(), m.getSentAt());
    }
}

package com.repairshop.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("chat_messages")
public class ChatMessage {

    @Id
    private Long id;

    @Column("session_id")
    private Long sessionId;

    @Column("sender_id")
    private Long senderId;

    @Column("sender_role")
    private String senderRole; // USER or ADMIN

    @Column("message_type")
    private String messageType; // TEXT or IMAGE

    private String content; // text or base64 image data

    @Column("image_mime_type")
    private String imageMimeType;

    @Column("sent_at")
    private String sentAt;

    public ChatMessage() {}

    public ChatMessage(Long sessionId, Long senderId, String senderRole,
                       String messageType, String content, String imageMimeType, String sentAt) {
        this.sessionId = sessionId;
        this.senderId = senderId;
        this.senderRole = senderRole;
        this.messageType = messageType;
        this.content = content;
        this.imageMimeType = imageMimeType;
        this.sentAt = sentAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getImageMimeType() { return imageMimeType; }
    public void setImageMimeType(String imageMimeType) { this.imageMimeType = imageMimeType; }
    public String getSentAt() { return sentAt; }
    public void setSentAt(String sentAt) { this.sentAt = sentAt; }
}

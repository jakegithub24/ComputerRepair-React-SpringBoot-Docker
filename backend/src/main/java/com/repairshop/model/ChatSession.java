package com.repairshop.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("chat_sessions")
public class ChatSession {

    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    @Column("ref_type")
    private String refType; // ORDER or ENQUIRY

    @Column("ref_id")
    private Long refId;

    private String subject;

    private String status; // PENDING, ACTIVE, CLOSED

    @Column("created_at")
    private String createdAt;

    @Column("accepted_at")
    private String acceptedAt;

    public ChatSession() {}

    public ChatSession(Long userId, String refType, Long refId, String subject, String status, String createdAt) {
        this.userId = userId;
        this.refType = refType;
        this.refId = refId;
        this.subject = subject;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getRefType() { return refType; }
    public void setRefType(String refType) { this.refType = refType; }
    public Long getRefId() { return refId; }
    public void setRefId(Long refId) { this.refId = refId; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public String getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(String acceptedAt) { this.acceptedAt = acceptedAt; }
}

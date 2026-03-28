package com.repairshop.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("orders")
public class Order {

    @Id
    private Long id;

    @Column("user_id")
    private Long userId;

    @Column("service_type")
    private String serviceType;

    @Column("device_description")
    private String deviceDescription;

    private String notes;

    private String status;

    @Column("created_at")
    private String createdAt;

    public Order() {}

    public Order(Long userId, String serviceType, String deviceDescription, String notes, String status, String createdAt) {
        this.userId = userId;
        this.serviceType = serviceType;
        this.deviceDescription = deviceDescription;
        this.notes = notes;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }

    public String getDeviceDescription() { return deviceDescription; }
    public void setDeviceDescription(String deviceDescription) { this.deviceDescription = deviceDescription; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}

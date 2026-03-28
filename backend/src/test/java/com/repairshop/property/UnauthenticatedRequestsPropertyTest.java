package com.repairshop.property;

// Feature: computer-repair-shop, Property 10: Unauthenticated requests to protected endpoints return 401
// Validates: Requirements 4.3, 6.2, 7.2, 8.4, 11.4

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property 10: Unauthenticated requests to protected endpoints return 401.
 *
 * For any protected endpoint (order submission, enquiry submission, tracking,
 * account deletion, admin endpoints), a request made without a JWT or with a
 * missing Authorization header should return 401 Unauthorized.
 *
 * Spring Security intercepts requests before routing, so 401 is returned even
 * for routes whose controllers are not yet implemented.
 *
 * Validates: Requirements 4.3, 6.2, 7.2, 8.4, 11.4
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UnauthenticatedRequestsPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String EMPTY_JSON = "{}";

    /**
     * Property 10: POST /api/orders without auth returns 401.
     * Validates: Requirements 6.2
     */
    @Test
    void postOrdersWithoutAuthReturns401() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EMPTY_JSON))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: GET /api/orders without auth returns 401.
     * Validates: Requirements 8.4
     */
    @Test
    void getOrdersWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/orders"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: POST /api/enquiries without auth returns 401.
     * Validates: Requirements 7.2
     */
    @Test
    void postEnquiriesWithoutAuthReturns401() throws Exception {
        mockMvc.perform(post("/api/enquiries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EMPTY_JSON))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: GET /api/enquiries without auth returns 401.
     * Validates: Requirements 8.4
     */
    @Test
    void getEnquiriesWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/enquiries"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: DELETE /api/users/me without auth returns 401.
     * Validates: Requirements 4.3
     */
    @Test
    void deleteUsersMeWithoutAuthReturns401() throws Exception {
        mockMvc.perform(delete("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: GET /api/admin/users without auth returns 401.
     * Validates: Requirements 11.4
     */
    @Test
    void getAdminUsersWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: DELETE /api/admin/users/1 without auth returns 401.
     * Validates: Requirements 11.4
     */
    @Test
    void deleteAdminUserByIdWithoutAuthReturns401() throws Exception {
        mockMvc.perform(delete("/api/admin/users/1"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: GET /api/admin/orders without auth returns 401.
     * Validates: Requirements 11.4
     */
    @Test
    void getAdminOrdersWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: GET /api/admin/enquiries without auth returns 401.
     * Validates: Requirements 11.4
     */
    @Test
    void getAdminEnquiriesWithoutAuthReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/enquiries"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Property 10: POST /api/auth/change-password without auth returns 401.
     * Validates: Requirements 4.3
     */
    @Test
    void postChangePasswordWithoutAuthReturns401() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EMPTY_JSON))
                .andExpect(status().isUnauthorized());
    }
}

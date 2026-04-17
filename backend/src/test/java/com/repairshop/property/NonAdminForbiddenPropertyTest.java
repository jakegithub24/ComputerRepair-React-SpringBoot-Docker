package com.repairshop.property;

// Feature: computer-repair-shop, Property 20: Non-admin JWT on admin endpoints returns 403
// Validates: Requirements 11.3

import com.repairshop.model.User;
import com.repairshop.service.AuthService;
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
 * Property 20: Non-admin JWT on admin endpoints returns 403.
 *
 * For any request to /api/admin/** made with a valid JWT whose role claim is USER,
 * the response should be 403 Forbidden.
 *
 * Spring Security's access control is enforced before routing, so 403 is returned
 * for all /api/admin/** routes when the authenticated user has role USER.
 *
 * Validates: Requirements 11.3
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NonAdminForbiddenPropertyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    private static final String EMPTY_JSON = "{}";

    /**
     * Generates a valid JWT for a USER-role user across 100 iterations and verifies
     * that all admin endpoints return 403 Forbidden.
     */
    @Test
    void nonAdminJwtOnAdminEndpointsReturns403() throws Exception {
        for (int i = 0; i < 10; i++) {
            User user = new User(
                    "user_" + i,
                    "user" + i + "@example.com",
                    "hashed_password",
                    "USER",
                    "2024-01-01T00:00:00Z"
            );
            user.setId((long) (i + 1));

            String token = authService.generateToken(user);

            // GET /api/admin/users
            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            // DELETE /api/admin/users/1
            mockMvc.perform(delete("/api/admin/users/1")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            // GET /api/admin/orders
            mockMvc.perform(get("/api/admin/orders")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            // GET /api/admin/enquiries
            mockMvc.perform(get("/api/admin/enquiries")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            // PATCH /api/admin/orders/1/status
            mockMvc.perform(patch("/api/admin/orders/1/status")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(EMPTY_JSON))
                    .andExpect(status().isForbidden());

            // PATCH /api/admin/enquiries/1/status
            mockMvc.perform(patch("/api/admin/enquiries/1/status")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(EMPTY_JSON))
                    .andExpect(status().isForbidden());
        }
    }
}

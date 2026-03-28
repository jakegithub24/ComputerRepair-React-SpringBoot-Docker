package com.repairshop.controller;

import com.repairshop.service.UserService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * DELETE /api/users/me — delete the authenticated user's own account.
     * Extracts userId from JWT claims in SecurityContext.
     * CASCADE DELETE removes all associated orders and enquiries.
     * Returns 204 No Content on success.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     * Requirements: 4.2, 4.3
     */
    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOwnAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        Long userId = ((Number) claims.get("userId")).longValue();
        userService.deleteOwnAccount(userId);
    }
}

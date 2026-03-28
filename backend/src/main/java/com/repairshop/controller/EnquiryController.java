package com.repairshop.controller;

import com.repairshop.dto.EnquiryRequest;
import com.repairshop.model.Enquiry;
import com.repairshop.service.EnquiryService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enquiries")
public class EnquiryController {

    private final EnquiryService enquiryService;

    public EnquiryController(EnquiryService enquiryService) {
        this.enquiryService = enquiryService;
    }

    /**
     * POST /api/enquiries — submit a new enquiry.
     * Extracts userId from JWT claims. Returns 201 with created enquiry.
     * Returns 400 if subject or message is missing/blank.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     * Requirements: 7.1, 7.2, 7.3
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Enquiry createEnquiry(@RequestBody EnquiryRequest request) {
        Long userId = extractUserId();
        return enquiryService.createEnquiry(userId, request);
    }

    /**
     * GET /api/enquiries — get enquiries for the authenticated user.
     * Returns 401 if unauthenticated (enforced by Spring Security).
     * Requirements: 8.2, 8.4
     */
    @GetMapping
    public List<Enquiry> getEnquiries() {
        Long userId = extractUserId();
        return enquiryService.getEnquiriesForUser(userId);
    }

    private Long extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        return ((Number) claims.get("userId")).longValue();
    }
}

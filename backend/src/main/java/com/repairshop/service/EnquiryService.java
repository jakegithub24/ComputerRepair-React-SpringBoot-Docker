package com.repairshop.service;

import com.repairshop.dto.AdminEnquiryResponse;
import com.repairshop.dto.EnquiryRequest;
import com.repairshop.dto.PageResponse;
import com.repairshop.exception.InvalidStatusException;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.Enquiry;
import com.repairshop.model.User;
import com.repairshop.repository.EnquiryRepository;
import com.repairshop.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class EnquiryService {

    private static final Set<String> VALID_ENQUIRY_STATUSES = Set.of("Open", "In Progress", "Resolved", "Closed");

    private final EnquiryRepository enquiryRepository;
    private final UserRepository userRepository;

    public EnquiryService(EnquiryRepository enquiryRepository, UserRepository userRepository) {
        this.enquiryRepository = enquiryRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new enquiry for the given user.
     * Validates subject and message (not null/blank).
     * Persists with status "Open" and returns the created enquiry with its ID.
     * Requirements: 7.1, 7.3
     */
    public Enquiry createEnquiry(Long userId, EnquiryRequest request) {
        if (request.subject() == null || request.subject().isBlank()) {
            throw new ValidationException("Subject is required");
        }
        if (request.message() == null || request.message().isBlank()) {
            throw new ValidationException("Message is required");
        }

        Enquiry enquiry = new Enquiry(
                userId,
                request.subject(),
                request.message(),
                "Open",
                Instant.now().toString()
        );
        return enquiryRepository.save(enquiry);
    }

    /**
     * Return only the enquiries belonging to the authenticated user.
     * Requirements: 8.2
     */
    public List<Enquiry> getEnquiriesForUser(Long userId) {
        return enquiryRepository.findByUserId(userId);
    }

    /**
     * Return a paginated list of all enquiries across all users, including the submitting username.
     * Requirements: 12.2
     */
    public PageResponse<AdminEnquiryResponse> listAllEnquiries(int page, int size) {
        List<Enquiry> all = new ArrayList<>();
        enquiryRepository.findAll().forEach(all::add);
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = (int) Math.min(fromIndex + size, total);

        List<AdminEnquiryResponse> content = (fromIndex >= total)
                ? List.of()
                : all.subList(fromIndex, toIndex).stream()
                        .map(e -> {
                            String username = userRepository.findById(e.getUserId())
                                    .map(User::getUsername).orElse("unknown");
                            return new AdminEnquiryResponse(e.getId(), e.getUserId(), username,
                                    e.getSubject(), e.getMessage(), e.getStatus(), e.getCreatedAt());
                        })
                        .toList();

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Update the status of an enquiry (admin only).
     * Validates status value; throws InvalidStatusException (400) if invalid.
     * Throws ResourceNotFoundException (404) if enquiry not found.
     * Requirements: 12.4, 12.5
     */
    public Enquiry updateEnquiryStatus(Long enquiryId, String status) {
        if (status == null || !VALID_ENQUIRY_STATUSES.contains(status)) {
            throw new InvalidStatusException(
                    "Invalid enquiry status. Valid values: Open, In Progress, Resolved, Closed");
        }
        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Enquiry not found with id: " + enquiryId));
        enquiry.setStatus(status);
        return enquiryRepository.save(enquiry);
    }
}

package com.repairshop.service;

import com.repairshop.dto.PageResponse;
import com.repairshop.dto.RegisterRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.exception.AuthenticationException;
import com.repairshop.exception.DuplicateUsernameException;
import com.repairshop.exception.ResourceNotFoundException;
import com.repairshop.exception.ValidationException;
import com.repairshop.model.User;
import com.repairshop.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PASSWORD_UPPER = Pattern.compile("[A-Z]");
    private static final Pattern PASSWORD_LOWER = Pattern.compile("[a-z]");
    private static final Pattern PASSWORD_DIGIT = Pattern.compile("[0-9]");
    private static final Pattern PASSWORD_SPECIAL = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{}|;':\",./<>?]");

    private final UserRepository userRepository;
    private final AuthService authService;

    public UserService(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    public UserResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new DuplicateUsernameException("Username already taken");
        }

        if (!EMAIL_PATTERN.matcher(req.email()).matches()) {
            throw new ValidationException("Invalid email format");
        }

        validatePasswordComplexity(req.password());

        String hash = authService.hashPassword(req.password());
        User user = new User(req.username(), req.email(), hash, "USER", Instant.now().toString());
        User saved = userRepository.save(user);

        return new UserResponse(saved.getId(), saved.getUsername(), saved.getEmail(), saved.getRole(), saved.getCreatedAt(), saved.getDeletedAt());
    }

    /**
     * Logically delete the authenticated user's own account by setting deleted_at timestamp.
     * The record remains in the database but the account is deactivated.
     * Throws AuthenticationException (401) if the user is not found.
     * Requirements: 4.2
     */
    public void deleteOwnAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        user.setDeletedAt(Instant.now().toString());
        userRepository.save(user);
    }

    /**
     * Return a paginated list of all registered users (admin only).
     * Requirements: 11.1
     */
    public PageResponse<UserResponse> listAllUsers(int page, int size) {
        List<User> all = userRepository.findAll();
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        int fromIndex = page * size;
        int toIndex = (int) Math.min(fromIndex + size, total);

        List<UserResponse> content = (fromIndex >= total)
                ? List.of()
                : all.subList(fromIndex, toIndex).stream()
                        .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole(), u.getCreatedAt(), u.getDeletedAt()))
                        .toList();

        return new PageResponse<>(content, page, size, total, totalPages);
    }

    /**
     * Physically delete a user by ID (admin only — hard delete).
     * Removes the user record and all associated data permanently.
     * Throws ResourceNotFoundException (404) if the user is not found.
     * Requirements: 11.2
     */
    public void deleteUserById(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    /**
     * Logically deactivate a user by ID (admin only — soft delete).
     * Sets deleted_at without removing the record.
     */
    public void deactivateUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setDeletedAt(Instant.now().toString());
        userRepository.save(user);
    }

    /**
     * Validates password complexity rules. Throws ValidationException if the password does not meet requirements.
     * Can be reused by AuthService.changePassword().
     */
    public static void validatePasswordComplexity(String password) {
        if (password == null || password.length() < 8
                || !PASSWORD_UPPER.matcher(password).find()
                || !PASSWORD_LOWER.matcher(password).find()
                || !PASSWORD_DIGIT.matcher(password).find()
                || !PASSWORD_SPECIAL.matcher(password).find()) {
            throw new ValidationException(
                    "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character");
        }
    }
}

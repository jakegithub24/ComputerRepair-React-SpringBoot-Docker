package com.repairshop.controller;

import com.repairshop.dto.ChangePasswordRequest;
import com.repairshop.dto.LoginRequest;
import com.repairshop.dto.LoginResponse;
import com.repairshop.dto.RegisterRequest;
import com.repairshop.dto.UserResponse;
import com.repairshop.service.AuthService;
import com.repairshop.service.UserService;
import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    public AuthController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request.username(), request.password());
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@RequestBody ChangePasswordRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Claims claims = (Claims) ((UsernamePasswordAuthenticationToken) auth).getDetails();
        Long userId = ((Number) claims.get("userId")).longValue();
        authService.changePassword(userId, request.currentPassword(), request.newPassword());
    }
}

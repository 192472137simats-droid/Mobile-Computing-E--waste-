package com.vestige.controller;

import com.vestige.dto.request.AdminProvisionRequest;
import com.vestige.dto.request.LoginRequest;
import com.vestige.dto.request.PasswordResetRequest;
import com.vestige.dto.request.CompletePasswordResetRequest;
import com.vestige.dto.request.PublicUserRegisterRequest;
import com.vestige.dto.request.PublicVendorRegisterRequest;
import com.vestige.dto.request.UserRegisterRequest;
import com.vestige.dto.request.VendorRegisterRequest;
import com.vestige.dto.response.ApiResponse;
import com.vestige.dto.response.AuthMeResponse;
import com.vestige.dto.response.LoginResponse;
import com.vestige.dto.response.UserSummaryResponse;
import com.vestige.service.AuthService;
import com.vestige.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<ApiResponse<Object>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok(ApiResponse.ok("If an eligible account exists, a reset link has been sent.", null));
    }

    @PostMapping("/password-reset/complete")
    public ResponseEntity<ApiResponse<Object>> completePasswordReset(@Valid @RequestBody CompletePasswordResetRequest request) {
        passwordResetService.completeReset(request.token(), request.newPassword());
        return ResponseEntity.ok(ApiResponse.ok("Password updated. Please sign in again.", null));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Authentication successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthMeResponse>> getMe() {
        AuthMeResponse response = authService.getMe();
        return ResponseEntity.ok(ApiResponse.ok("Identity verified", response));
    }

    @PostMapping("/register/public/user")
    public ResponseEntity<ApiResponse<LoginResponse>> registerPublicUser(@Valid @RequestBody PublicUserRegisterRequest request) {
        LoginResponse response = authService.registerPublicUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User registered successfully", response));
    }

    @PostMapping("/register/public/vendor")
    public ResponseEntity<ApiResponse<LoginResponse>> registerPublicVendor(@Valid @RequestBody PublicVendorRegisterRequest request) {
        LoginResponse response = authService.registerPublicVendor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Vendor registered successfully. Verification pending.", response));
    }

    @PostMapping("/register/user")
    public ResponseEntity<ApiResponse<AuthMeResponse>> registerUser(@Valid @RequestBody UserRegisterRequest request) {
        AuthMeResponse response = authService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User profile registered successfully", response));
    }

    @PostMapping("/register/vendor")
    public ResponseEntity<ApiResponse<AuthMeResponse>> registerVendor(@Valid @RequestBody VendorRegisterRequest request) {
        AuthMeResponse response = authService.registerVendor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Vendor profile registered successfully. Verification pending.", response));
    }

    @PostMapping("/admin/provision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> provisionAdmin(
            @Valid @RequestBody AdminProvisionRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        UserSummaryResponse response = authService.provisionAdmin(request, clientIp);
        return ResponseEntity.ok(ApiResponse.ok("Administrator provisioned successfully", response));
    }
}

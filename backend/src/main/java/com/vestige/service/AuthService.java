package com.vestige.service;

import com.vestige.dto.request.AdminProvisionRequest;
import com.vestige.dto.request.LoginRequest;
import com.vestige.dto.request.PublicUserRegisterRequest;
import com.vestige.dto.request.PublicVendorRegisterRequest;
import com.vestige.dto.request.UserRegisterRequest;
import com.vestige.dto.request.VendorRegisterRequest;
import com.vestige.dto.response.AuthMeResponse;
import com.vestige.dto.response.LoginResponse;
import com.vestige.dto.response.UserSummaryResponse;
import com.vestige.dto.response.VendorSummaryResponse;
import com.vestige.exception.AccountSuspendedException;
import com.vestige.exception.ConflictException;
import com.vestige.exception.ForbiddenException;
import com.vestige.exception.UnauthorizedException;
import com.vestige.model.AdminAction;
import com.vestige.model.User;
import com.vestige.model.VendorDocument;
import com.vestige.model.VendorProfile;
import com.vestige.model.enums.PreferredLanguage;
import com.vestige.model.enums.UserRole;
import com.vestige.model.enums.VendorVerificationStatus;
import com.vestige.repository.AdminActionRepository;
import com.vestige.repository.UserRepository;
import com.vestige.repository.VendorDocumentRepository;
import com.vestige.repository.VendorProfileRepository;
import com.vestige.security.JwtTokenService;
import com.vestige.security.SecurityUtils;
import com.vestige.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final VendorDocumentRepository vendorDocumentRepository;
    private final AdminActionRepository adminActionRepository;
    private final RewardService rewardService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(UserRepository userRepository,
                       VendorProfileRepository vendorProfileRepository,
                       VendorDocumentRepository vendorDocumentRepository,
                       AdminActionRepository adminActionRepository,
                       RewardService rewardService,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.vendorDocumentRepository = vendorDocumentRepository;
        this.adminActionRepository = adminActionRepository;
        this.rewardService = rewardService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid login credentials. Please check your email and password."));

        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!matches) {
            throw new UnauthorizedException("Invalid login credentials. Please check your email and password.");
        }

        if (!user.isActive()) {
            throw new AccountSuspendedException("Account has been suspended. Please contact VESTIGE support.");
        }

        if (StringUtils.hasText(request.getExpectedRole())) {
            String expected = request.getExpectedRole().trim().toUpperCase();
            if (!user.getRole().name().equals(expected) && user.getRole() != UserRole.ADMIN) {
                throw new ForbiddenException(
                        "Access Denied: This portal is designated exclusively for " + expected +
                        " accounts. Your profile holds the " + user.getRole() + " role."
                );
            }
        }

        String token = jwtTokenService.generateToken(user);
        AuthMeResponse profile = buildAuthMeResponse(user);
        logger.info("User {} ({}) successfully authenticated via backend credentials", user.getEmail(), user.getRole());
        return new LoginResponse(token, profile);
    }

    @Transactional
    public LoginResponse registerPublicUser(PublicUserRegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ConflictException("An account with this email address already exists. Please sign in.");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(cleanEmail);
        user.setFullName(request.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(UserRole.USER);
        user.setPreferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : PreferredLanguage.en);
        user.setActive(true);
        user = userRepository.save(user);

        rewardService.getOrCreateAccount(user.getId());
        String token = jwtTokenService.generateToken(user);
        logger.info("Public user registered: {} ({})", user.getEmail(), user.getId());
        return new LoginResponse(token, buildAuthMeResponse(user));
    }

    @Transactional
    public LoginResponse registerPublicVendor(PublicVendorRegisterRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ConflictException("An account with this email address already exists. Please sign in.");
        }

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(cleanEmail);
        user.setFullName(request.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(UserRole.VENDOR);
        user.setPreferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : PreferredLanguage.en);
        user.setActive(true);
        user = userRepository.save(user);

        VendorProfile profile = new VendorProfile();
        profile.setUser(user);
        profile.setBusinessName(request.getBusinessName().trim());
        profile.setBusinessType(request.getBusinessType());
        profile.setAddress(request.getAddress().trim());
        profile.setCity(request.getCity().trim());
        profile.setState(request.getState().trim());
        profile.setPincode(request.getPincode().trim());
        profile.setWhatsappNumber(request.getWhatsappNumber());
        profile.setVerificationStatus(VendorVerificationStatus.PENDING);

        if (request.getServiceTypes() != null && !request.getServiceTypes().isEmpty()) {
            profile.setServiceTypes(request.getServiceTypes());
        }
        if (request.getDeviceCategories() != null && !request.getDeviceCategories().isEmpty()) {
            profile.setDeviceCategories(request.getDeviceCategories());
        }

        profile = vendorProfileRepository.save(profile);

        if (StringUtils.hasText(request.getDocumentUrl())) {
            VendorDocument doc = new VendorDocument(
                    profile.getId(),
                    StringUtils.hasText(request.getDocumentType()) ? request.getDocumentType() : "BUSINESS_REGISTRATION",
                    request.getDocumentUrl(),
                    "registration_document",
                    null,
                    "application/pdf"
            );
            vendorDocumentRepository.save(doc);
        }

        String token = jwtTokenService.generateToken(user);
        logger.info("Public vendor registered: {} ({}) with status PENDING", profile.getBusinessName(), profile.getId());
        return new LoginResponse(token, buildAuthMeResponse(user));
    }

    @Transactional
    public AuthMeResponse registerUser(UserRegisterRequest request) {
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        UUID userId = principal.getId();
        String email = principal.getEmail();

        User user = userRepository.findById(userId).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(userId);
            newUser.setEmail(StringUtils.hasText(email) ? email : "user-" + userId + "@vestige.internal");
            newUser.setPasswordHash("[SUPABASE_AUTH_MANAGED]");
            newUser.setRole(UserRole.USER);
            newUser.setActive(true);
            return newUser;
        });

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        user.setPreferredLanguage(request.getPreferredLanguage());
        user = userRepository.save(user);

        // Auto-initialize circular reward account
        rewardService.getOrCreateAccount(user.getId());

        logger.info("User profile registered for patron: {} ({})", user.getFullName(), user.getId());
        return buildAuthMeResponse(user);
    }

    @Transactional
    public AuthMeResponse registerVendor(VendorRegisterRequest request) {
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        UUID userId = principal.getId();
        String email = principal.getEmail();

        User user = userRepository.findById(userId).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(userId);
            newUser.setEmail(StringUtils.hasText(email) ? email : "vendor-" + userId + "@vestige.internal");
            newUser.setPasswordHash("[SUPABASE_AUTH_MANAGED]");
            newUser.setRole(UserRole.VENDOR);
            newUser.setActive(true);
            return newUser;
        });

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        user.setPreferredLanguage(request.getPreferredLanguage());
        user.setRole(UserRole.VENDOR);
        user = userRepository.save(user);

        final User finalUser = user;
        VendorProfile profile = vendorProfileRepository.findByUserId(userId).orElseGet(() -> {
            VendorProfile newProfile = new VendorProfile();
            newProfile.setUser(finalUser);
            newProfile.setVerificationStatus(VendorVerificationStatus.PENDING);
            return newProfile;
        });

        profile.setBusinessName(request.getBusinessName().trim());
        profile.setBusinessType(request.getBusinessType());
        profile.setAddress(request.getAddress().trim());
        profile.setCity(request.getCity().trim());
        profile.setState(request.getState().trim());
        profile.setPincode(request.getPincode().trim());
        profile.setWhatsappNumber(request.getWhatsappNumber());

        if (request.getServiceTypes() != null && !request.getServiceTypes().isEmpty()) {
            profile.setServiceTypes(request.getServiceTypes());
        }
        if (request.getDeviceCategories() != null && !request.getDeviceCategories().isEmpty()) {
            profile.setDeviceCategories(request.getDeviceCategories());
        }

        profile = vendorProfileRepository.save(profile);

        // Save optional initial verification document metadata
        if (StringUtils.hasText(request.getDocumentUrl())) {
            VendorDocument doc = new VendorDocument(
                    profile.getId(),
                    StringUtils.hasText(request.getDocumentType()) ? request.getDocumentType() : "BUSINESS_REGISTRATION",
                    request.getDocumentUrl(),
                    "registration_document",
                    null,
                    "application/pdf"
            );
            vendorDocumentRepository.save(doc);
        }

        logger.info("Vendor profile registered: {} ({}) with verification status PENDING", profile.getBusinessName(), profile.getId());
        return buildAuthMeResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthMeResponse getMe() {
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        User user = userRepository.findById(principal.getId())
                .or(() -> userRepository.findByEmail(principal.getEmail()))
                .orElseThrow(() -> new UnauthorizedException("User profile not found in VESTIGE archive"));

        return buildAuthMeResponse(user);
    }

    @Transactional
    public UserSummaryResponse provisionAdmin(AdminProvisionRequest request, String ipAddress) {
        UserPrincipal adminPrincipal = SecurityUtils.requireCurrentUser();
        SecurityUtils.assertActive();

        if (adminPrincipal.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only existing platform administrators can provision new administrators");
        }

        User targetUser = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + request.getTargetUserId()));

        targetUser.setRole(UserRole.ADMIN);
        targetUser = userRepository.save(targetUser);

        // Audit Log entry in admin_actions
        AdminAction action = new AdminAction(
                adminPrincipal.getId(),
                "PROVISION_ADMIN",
                "users",
                targetUser.getId(),
                "{\"notes\":\"" + (request.getAdminNotes() != null ? request.getAdminNotes() : "Platform Administrator appointment") + "\"}",
                ipAddress
        );
        adminActionRepository.save(action);

        logger.info("Admin {} provisioned user {} as ADMIN", adminPrincipal.getId(), targetUser.getId());
        return UserSummaryResponse.fromEntity(targetUser);
    }

    private AuthMeResponse buildAuthMeResponse(User user) {
        AuthMeResponse response = new AuthMeResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setRole(user.getRole());
        response.setPreferredLanguage(user.getPreferredLanguage());
        response.setActive(user.isActive());

        if (user.getRole() == UserRole.VENDOR) {
            vendorProfileRepository.findByUserId(user.getId())
                    .ifPresent(profile -> response.setVendorProfile(VendorSummaryResponse.fromEntity(profile)));
        } else if (user.getRole() == UserRole.USER) {
            try {
                var account = rewardService.getOrCreateAccount(user.getId());
                response.setRewardBalance(account.getBalance());
            } catch (Exception e) {
                response.setRewardBalance(0);
            }
        }

        return response;
    }
}

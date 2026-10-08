package com.vestige.service;

import com.vestige.dto.request.RecyclingStatusUpdateDTO;
import com.vestige.dto.response.RecyclingRequestResponse;
import com.vestige.model.*;
import com.vestige.model.enums.*;
import com.vestige.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.vestige.security.UserPrincipal;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecyclingServiceTest {

    @Mock
    private RecyclingRequestRepository recyclingRequestRepository;

    @Mock
    private RecyclingStatusHistoryRepository statusHistoryRepository;

    @Mock
    private DeviceSubmissionRepository submissionRepository;

    @Mock
    private VendorProfileRepository vendorProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RewardService rewardService;

    private RecyclingService recyclingService;

    private User testUser;
    private VendorProfile testVendor;
    private DeviceSubmission testSubmission;
    private RecyclingRequest testRequest;

    @BeforeEach
    void setUp() {
        recyclingService = new RecyclingService(
                recyclingRequestRepository,
                statusHistoryRepository,
                submissionRepository,
                vendorProfileRepository,
                userRepository,
                rewardService
        );

        testUser = new User("Test Patron", "test@vestige.internal", "pass", "+919999999999", UserRole.USER);
        testUser.setId(UUID.randomUUID());

        testVendor = new VendorProfile();
        User vendorUser = new User("Recycler", "recycler@example.com", "hash", null, UserRole.VENDOR);
        testVendor.setUser(vendorUser);
        testVendor.setId(UUID.randomUUID());
        testVendor.setBusinessName("Aegis Eco-Recycling");
        testVendor.setVerificationStatus(VendorVerificationStatus.VERIFIED);

        testSubmission = new DeviceSubmission();
        testSubmission.setId(UUID.randomUUID());
        testSubmission.setDeviceType(DeviceCategoryType.SMARTPHONE);
        testSubmission.setBrand("Google");
        testSubmission.setModel("Pixel 4");

        testRequest = new RecyclingRequest();
        testRequest.setId(UUID.randomUUID());
        testRequest.setUser(testUser);
        testRequest.setVendor(testVendor);
        testRequest.setSubmission(testSubmission);
        testRequest.setPickupAddress("123 Archival Street");
        testRequest.setPickupDate(LocalDate.now().plusDays(1));
        testRequest.setDeviceCount(2);
        testRequest.setStatus(RecyclingStatusType.SCHEDULED);

        UserPrincipal principal = UserPrincipal.fromEntity(vendorUser);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        lenient().when(userRepository.findById(vendorUser.getId())).thenReturn(Optional.of(vendorUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should transition status to COMPLETED and award reward points")
    void testUpdateStatusToCompletedAwardsPoints() {
        when(recyclingRequestRepository.findById(testRequest.getId())).thenReturn(Optional.of(testRequest));
        when(recyclingRequestRepository.save(any(RecyclingRequest.class))).thenAnswer(i -> i.getArgument(0));

        RecyclingStatusUpdateDTO updateDTO = new RecyclingStatusUpdateDTO();
        updateDTO.setStatus(RecyclingStatusType.COMPLETED);
        updateDTO.setNotes("Pickup completed and verified.");

        RecyclingRequestResponse res = recyclingService.updateStatus(testRequest.getId(), updateDTO);

        assertNotNull(res);
        assertEquals(RecyclingStatusType.COMPLETED, res.getStatus());
        assertEquals(100, res.getPointsAwarded()); // 50 * 2 devices

        verify(rewardService).awardPoints(
                eq(testUser.getId()),
                eq(100),
                eq(RewardSourceType.RECYCLING_PICKUP),
                eq(testRequest.getId()),
                anyString()
        );
        verify(statusHistoryRepository).save(any(RecyclingStatusHistory.class));
    }
}

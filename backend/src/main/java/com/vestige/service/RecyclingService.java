package com.vestige.service;

import com.vestige.dto.request.RecyclingRequestCreateDTO;
import com.vestige.dto.request.RecyclingStatusUpdateDTO;
import com.vestige.dto.response.RecyclingRequestResponse;
import com.vestige.exception.ForbiddenException;
import com.vestige.model.*;
import com.vestige.model.enums.*;
import com.vestige.repository.*;
import com.vestige.security.SecurityUtils;
import com.vestige.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RecyclingService {

    private final RecyclingRequestRepository recyclingRequestRepository;
    private final RecyclingStatusHistoryRepository statusHistoryRepository;
    private final DeviceSubmissionRepository submissionRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final UserRepository userRepository;
    private final RewardService rewardService;

    public RecyclingService(
            RecyclingRequestRepository recyclingRequestRepository,
            RecyclingStatusHistoryRepository statusHistoryRepository,
            DeviceSubmissionRepository submissionRepository,
            VendorProfileRepository vendorProfileRepository,
            UserRepository userRepository,
            RewardService rewardService
    ) {
        this.recyclingRequestRepository = recyclingRequestRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.submissionRepository = submissionRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.userRepository = userRepository;
        this.rewardService = rewardService;
    }

    @Transactional
    public RecyclingRequestResponse createRequest(RecyclingRequestCreateDTO dto) {
        SecurityUtils.assertActive();
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        UUID userId = principal.getRole() == UserRole.ADMIN && dto.getUserId() != null
                ? dto.getUserId() : principal.getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        VendorProfile vendor = vendorProfileRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new IllegalArgumentException("Recycling partner/vendor not found: " + dto.getVendorId()));

        // Gating: only verified vendors can accept recycling bookings
        SecurityUtils.assertVendorVerified(vendor);

        DeviceSubmission submission = null;
        if (dto.getSubmissionId() != null) {
            submission = submissionRepository.findById(dto.getSubmissionId())
                    .orElseThrow(() -> new IllegalArgumentException("Device submission not found: " + dto.getSubmissionId()));
            if (!submission.getUser().getId().equals(user.getId())) {
                throw new ForbiddenException("Device submission does not belong to this user");
            }
        }

        if (submission == null) {
            // Auto-create submission for direct recycling booking
            submission = new DeviceSubmission();
            submission.setUser(user);
            submission.setDeviceType(dto.getDeviceType() != null ? dto.getDeviceType() : DeviceCategoryType.OTHER);
            submission.setBrand(dto.getBrand() != null && !dto.getBrand().isBlank() ? dto.getBrand() : "General Equipment");
            submission.setModel(dto.getModel() != null && !dto.getModel().isBlank() ? dto.getModel() : "E-Waste Parcel");
            submission.setDeviceAgeYears(5);
            submission.setCondition(DeviceConditionGrade.POOR);
            submission.setEstimatedRepairCost(BigDecimal.valueOf(5000));
            submission.setOriginalValue(BigDecimal.valueOf(10000));
            submission.setPartAvailability(PartAvailabilityStatus.UNAVAILABLE);
            submission.setEngineScore(20);
            submission.setEngineRecommendation(EngineRecommendationType.RECYCLE);
            submission.setEngineConfidence(EngineConfidenceLevel.HIGH);
            submission.setEngineRationale("Direct collection parcel submitted for ethical e-waste recycling.");
            submission = submissionRepository.save(submission);
        }

        RecyclingRequest request = new RecyclingRequest();
        request.setUser(user);
        request.setVendor(vendor);
        request.setSubmission(submission);
        request.setPickupAddress(dto.getPickupAddress());
        request.setPickupDate(dto.getPickupDate() != null ? dto.getPickupDate() : LocalDate.now().plusDays(1));
        request.setPickupTime(dto.getPickupTime());
        request.setDeviceCount(dto.getDeviceCount() != null && dto.getDeviceCount() > 0 ? dto.getDeviceCount() : 1);
        request.setStatus(RecyclingStatusType.PENDING);
        request.setPointsAwarded(0);

        RecyclingRequest saved = recyclingRequestRepository.save(request);

        // Audit Trail
        RecyclingStatusHistory history = new RecyclingStatusHistory(
                saved,
                null,
                RecyclingStatusType.PENDING,
                user,
                "Recycling pickup request logged in archival registry."
        );
        statusHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Transactional
    public RecyclingRequestResponse updateStatus(UUID requestId, RecyclingStatusUpdateDTO dto) {
        RecyclingRequest request = recyclingRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Recycling request not found: " + requestId));

        SecurityUtils.assertActive();
        UserPrincipal principal = SecurityUtils.requireCurrentUser();

        if (principal.getRole() == UserRole.VENDOR) {
                // Verify vendor owns this assignment and is verified
                if (!request.getVendor().getUserId().equals(principal.getId())) {
                    throw new ForbiddenException("Access denied: You are not the assigned vendor for this collection");
                }
                SecurityUtils.assertVendorVerified(request.getVendor());
        } else if (principal.getRole() == UserRole.USER) {
                // User can only cancel their own pending request
                if (!request.getUser().getId().equals(principal.getId())) {
                    throw new ForbiddenException("Access denied: You are not the owner of this request");
                }
                if (dto.getStatus() != RecyclingStatusType.CANCELLED) {
                    throw new ForbiddenException("Device owners may only cancel a pending collection request");
                }
                if (request.getStatus() != RecyclingStatusType.PENDING) {
                    throw new ForbiddenException("Only pending collections can be cancelled by the owner");
                }
        }

        RecyclingStatusType prevStatus = request.getStatus();
        RecyclingStatusType newStatus = dto.getStatus();

        validateRecyclingTransition(prevStatus, newStatus);

        request.setStatus(newStatus);
        request.setUpdatedAt(OffsetDateTime.now());

        // Award reward points upon COMPLETED transition
        if (newStatus == RecyclingStatusType.COMPLETED && prevStatus != RecyclingStatusType.COMPLETED) {
            int points = 50 * Math.max(1, request.getDeviceCount());

            request.setPointsAwarded(points);

            // Credit user's circular rewards account
            rewardService.awardPoints(
                    request.getUser().getId(),
                    points,
                    RewardSourceType.RECYCLING_PICKUP,
                    request.getId(),
                    String.format("E-Waste recycling pickup completed (%d device(s)) by %s",
                            request.getDeviceCount(), request.getVendor().getBusinessName())
            );
        }

        RecyclingRequest updated = recyclingRequestRepository.save(request);

        // Record history
        User actor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Actor not found"));

        RecyclingStatusHistory history = new RecyclingStatusHistory(
                updated,
                prevStatus,
                newStatus,
                actor,
                dto.getNotes() != null ? dto.getNotes() : "Status progressed to " + newStatus
        );
        statusHistoryRepository.save(history);

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<RecyclingRequestResponse> getByUserId(UUID userId) {
        SecurityUtils.assertOwnershipOrAdmin(userId);

        List<RecyclingRequest> list = recyclingRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<RecyclingRequestResponse> responses = new ArrayList<>();
        for (RecyclingRequest req : list) {
            responses.add(mapToResponse(req));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<RecyclingRequestResponse> getByVendorId(UUID vendorId) {
        VendorProfile vendor = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        SecurityUtils.assertOwnershipOrAdmin(vendor.getUserId());
        SecurityUtils.assertVendorVerified(vendor);

        List<RecyclingRequest> list = recyclingRequestRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
        List<RecyclingRequestResponse> responses = new ArrayList<>();
        for (RecyclingRequest req : list) {
            responses.add(mapToResponse(req));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<RecyclingRequestResponse> getAll(RecyclingStatusType status) {
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        if (principal.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Administrative access required to view global collections");
        }

        List<RecyclingRequest> list = (status != null)
                ? recyclingRequestRepository.findByStatusOrderByCreatedAtDesc(status)
                : recyclingRequestRepository.findAll();
        List<RecyclingRequestResponse> responses = new ArrayList<>();
        for (RecyclingRequest req : list) {
            responses.add(mapToResponse(req));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public RecyclingRequestResponse getById(UUID id) {
        RecyclingRequest req = recyclingRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recycling request not found: " + id));

        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        SecurityUtils.assertActive();
        if (principal.getRole() != UserRole.ADMIN
                && !req.getUser().getId().equals(principal.getId())
                && !req.getVendor().getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Access denied: You are not authorized to view this request");
        }

        return mapToResponse(req);
    }

    private RecyclingRequestResponse mapToResponse(RecyclingRequest req) {
        RecyclingRequestResponse res = new RecyclingRequestResponse();
        res.setId(req.getId());
        if (req.getUser() != null) {
            res.setUserId(req.getUser().getId());
            res.setUserName(req.getUser().getFullName());
        }
        if (req.getVendor() != null) {
            res.setVendorId(req.getVendor().getId());
            res.setVendorBusinessName(req.getVendor().getBusinessName());
        }
        if (req.getSubmission() != null) {
            res.setSubmissionId(req.getSubmission().getId());
            res.setDeviceType(req.getSubmission().getDeviceType());
            res.setBrand(req.getSubmission().getBrand());
            res.setModel(req.getSubmission().getModel());
        }
        res.setPickupAddress(req.getPickupAddress());
        res.setPickupDate(req.getPickupDate());
        res.setPickupTime(req.getPickupTime());
        res.setDeviceCount(req.getDeviceCount());
        res.setStatus(req.getStatus());
        res.setPointsAwarded(req.getPointsAwarded());
        res.setCreatedAt(req.getCreatedAt());
        res.setUpdatedAt(req.getUpdatedAt());
        return res;
    }

    private void validateRecyclingTransition(RecyclingStatusType fromStatus, RecyclingStatusType toStatus) {
        if (fromStatus == null || toStatus == null) {
            throw new IllegalStateException("Recycling status cannot be null");
        }
        if (fromStatus == toStatus) {
            return; // Idempotent no-op
        }

        boolean valid = switch (fromStatus) {
            case PENDING -> toStatus == RecyclingStatusType.ACCEPTED || toStatus == RecyclingStatusType.SCHEDULED || toStatus == RecyclingStatusType.CANCELLED;
            case ACCEPTED -> toStatus == RecyclingStatusType.SCHEDULED || toStatus == RecyclingStatusType.COMPLETED || toStatus == RecyclingStatusType.CANCELLED;
            case SCHEDULED -> toStatus == RecyclingStatusType.COMPLETED || toStatus == RecyclingStatusType.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!valid) {
            throw new IllegalStateException(String.format("Invalid recycling status transition from %s to %s.", fromStatus, toStatus));
        }
    }
}

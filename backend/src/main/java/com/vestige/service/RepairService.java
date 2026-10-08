package com.vestige.service;

import com.vestige.dto.request.RepairBookingCreateDTO;
import com.vestige.dto.request.RepairStatusUpdateDTO;
import com.vestige.dto.response.RepairBookingResponse;
import com.vestige.exception.ForbiddenException;
import com.vestige.model.*;
import com.vestige.model.enums.*;
import com.vestige.repository.*;
import com.vestige.security.SecurityUtils;
import com.vestige.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RepairService {

    private final RepairBookingRepository repairBookingRepository;
    private final RepairStatusHistoryRepository statusHistoryRepository;
    private final DeviceSubmissionRepository submissionRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final UserRepository userRepository;
    private final RewardService rewardService;
    private final RepairStateMachine stateMachine;

    public RepairService(
            RepairBookingRepository repairBookingRepository,
            RepairStatusHistoryRepository statusHistoryRepository,
            DeviceSubmissionRepository submissionRepository,
            VendorProfileRepository vendorProfileRepository,
            UserRepository userRepository,
            RewardService rewardService,
            RepairStateMachine stateMachine
    ) {
        this.repairBookingRepository = repairBookingRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.submissionRepository = submissionRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.userRepository = userRepository;
        this.rewardService = rewardService;
        this.stateMachine = stateMachine;
    }

    @Transactional
    public RepairBookingResponse createBooking(RepairBookingCreateDTO dto) {
        SecurityUtils.assertActive();
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        UUID userId = principal.getRole() == UserRole.ADMIN && dto.getUserId() != null
                ? dto.getUserId() : principal.getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        VendorProfile vendor = vendorProfileRepository.findById(dto.getVendorId())
                .orElseThrow(() -> new IllegalArgumentException("Craftsman workshop not found: " + dto.getVendorId()));

        // Gating: only verified vendors can accept repair bookings
        SecurityUtils.assertVendorVerified(vendor);

        DeviceSubmission submission = submissionRepository.findById(dto.getSubmissionId())
                .orElseThrow(() -> new IllegalArgumentException("Device submission not found: " + dto.getSubmissionId()));

        // Ownership assertion on submission
        if (submission.getUser() == null || !submission.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Device submission does not belong to this user");
        }

        // Check if an active booking already exists for this submission
        Optional<RepairBooking> existingBooking = repairBookingRepository.findActiveBookingBySubmissionId(submission.getId());
        if (existingBooking.isPresent()) {
            throw new IllegalStateException("An active repair booking already exists for this diagnostic submission (ID: " + existingBooking.get().getId() + ")");
        }

        RepairBooking booking = new RepairBooking(
                user,
                vendor,
                submission,
                dto.getPreferredDate(),
                dto.getPreferredTime(),
                dto.getIssueDescription()
        );

        RepairBooking saved = repairBookingRepository.save(booking);

        // Audit log entry
        RepairStatusHistory history = new RepairStatusHistory(
                saved,
                null,
                BookingStatusType.PENDING,
                user,
                "Repair booking registered in atelier queue."
        );
        statusHistoryRepository.save(history);

        return mapToResponse(saved);
    }

    @Transactional
    public RepairBookingResponse updateStatus(UUID bookingId, RepairStatusUpdateDTO dto) {
        RepairBooking booking = repairBookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Repair booking not found: " + bookingId));

        BookingStatusType prevStatus = booking.getStatus();
        BookingStatusType newStatus = dto.getStatus();

        // Enforce state machine transition validity
        stateMachine.validateTransition(prevStatus, newStatus);

        SecurityUtils.assertActive();
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        User actor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Actor not found"));

        if (principal.getRole() == UserRole.VENDOR) {
                // Verify vendor owns this assignment and is verified
                if (!booking.getVendor().getUserId().equals(principal.getId())) {
                    throw new ForbiddenException("Access denied: You are not the assigned craftsman for this repair booking");
                }
                SecurityUtils.assertVendorVerified(booking.getVendor());
        } else if (principal.getRole() == UserRole.USER) {
                // User can only cancel their own pending/accepted booking
                if (!booking.getUser().getId().equals(principal.getId())) {
                    throw new ForbiddenException("Access denied: You are not the owner of this booking");
                }
                if (newStatus != BookingStatusType.CANCELLED) {
                    throw new ForbiddenException("Device owners may only cancel a pending or accepted booking");
                }
        }

        booking.setStatus(newStatus);
        booking.setUpdatedAt(OffsetDateTime.now());
        if (dto.getRejectionReason() != null) {
            booking.setRejectionReason(dto.getRejectionReason());
        }
        if (dto.getUserRating() != null) {
            booking.setUserRating(dto.getUserRating());
        }
        if (dto.getUserFeedback() != null) {
            booking.setUserFeedback(dto.getUserFeedback());
        }

        // Award reward points upon COMPLETED transition
        if (newStatus == BookingStatusType.COMPLETED && prevStatus != BookingStatusType.COMPLETED) {
            rewardService.awardPoints(
                    booking.getUser().getId(),
                    100, // 100 Circular Restoration Bonus Points
                    RewardSourceType.REPAIR_COMPLETION,
                    booking.getId(),
                    String.format("Hardware restoration completed for %s %s by %s",
                            booking.getSubmission().getBrand(),
                            booking.getSubmission().getModel(),
                            booking.getVendor().getBusinessName())
            );
        }

        RepairBooking updated = repairBookingRepository.save(booking);

        // Record immutable audit history
        RepairStatusHistory history = new RepairStatusHistory(
                updated,
                prevStatus,
                newStatus,
                actor,
                dto.getNotes() != null ? dto.getNotes() : "Repair status progressed to " + newStatus
        );
        statusHistoryRepository.save(history);

        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<RepairBookingResponse> getByUserId(UUID userId) {
        SecurityUtils.assertOwnershipOrAdmin(userId);

        List<RepairBooking> list = repairBookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<RepairBookingResponse> responses = new ArrayList<>();
        for (RepairBooking b : list) {
            responses.add(mapToResponse(b));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<RepairBookingResponse> getByVendorId(UUID vendorId) {
        VendorProfile vendor = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found: " + vendorId));

        SecurityUtils.assertOwnershipOrAdmin(vendor.getUserId());
        SecurityUtils.assertVendorVerified(vendor);

        List<RepairBooking> list = repairBookingRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
        List<RepairBookingResponse> responses = new ArrayList<>();
        for (RepairBooking b : list) {
            responses.add(mapToResponse(b));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<RepairBookingResponse> getAll(BookingStatusType status) {
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        if (principal.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Administrative access required to view global repair bookings");
        }

        List<RepairBooking> list = (status != null)
                ? repairBookingRepository.findByStatusOrderByCreatedAtDesc(status)
                : repairBookingRepository.findAll();
        List<RepairBookingResponse> responses = new ArrayList<>();
        for (RepairBooking b : list) {
            responses.add(mapToResponse(b));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public RepairBookingResponse getById(UUID id) {
        RepairBooking booking = repairBookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Repair booking not found: " + id));

        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        SecurityUtils.assertActive();
        if (principal.getRole() != UserRole.ADMIN
                && !booking.getUser().getId().equals(principal.getId())
                && !booking.getVendor().getUserId().equals(principal.getId())) {
            throw new ForbiddenException("Access denied: You are not authorized to view this repair booking");
        }

        return mapToResponse(booking);
    }

    private RepairBookingResponse mapToResponse(RepairBooking booking) {
        RepairBookingResponse res = new RepairBookingResponse();
        res.setId(booking.getId());
        if (booking.getUser() != null) {
            res.setUserId(booking.getUser().getId());
            res.setUserName(booking.getUser().getFullName());
        }
        if (booking.getVendor() != null) {
            res.setVendorId(booking.getVendor().getId());
            res.setVendorBusinessName(booking.getVendor().getBusinessName());
        }
        if (booking.getSubmission() != null) {
            res.setSubmissionId(booking.getSubmission().getId());
            res.setDeviceType(booking.getSubmission().getDeviceType());
            res.setBrand(booking.getSubmission().getBrand());
            res.setModel(booking.getSubmission().getModel());
        }
        res.setPreferredDate(booking.getPreferredDate());
        res.setPreferredTime(booking.getPreferredTime());
        res.setIssueDescription(booking.getIssueDescription());
        res.setStatus(booking.getStatus());
        res.setRejectionReason(booking.getRejectionReason());
        res.setUserRating(booking.getUserRating());
        res.setUserFeedback(booking.getUserFeedback());
        res.setCreatedAt(booking.getCreatedAt());
        res.setUpdatedAt(booking.getUpdatedAt());
        return res;
    }
}

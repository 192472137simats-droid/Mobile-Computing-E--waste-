package com.vestige.service;

import com.vestige.dto.analytics.TimeSeriesDataPoint;
import com.vestige.dto.payment.PaymentAdminMetricsDTO;
import com.vestige.dto.payment.PaymentOrderResponse;
import com.vestige.dto.payment.PaymentSummaryResponse;
import com.vestige.dto.payment.PaymentVerifyRequest;
import com.vestige.exception.ForbiddenException;
import com.vestige.exception.ResourceNotFoundException;
import com.vestige.model.AdminAction;
import com.vestige.model.Payment;
import com.vestige.model.RepairBooking;
import com.vestige.model.User;
import com.vestige.model.enums.PaymentStatusType;
import com.vestige.model.enums.BookingStatusType;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.AdminActionRepository;
import com.vestige.repository.PaymentRepository;
import com.vestige.repository.RepairBookingRepository;
import com.vestige.repository.UserRepository;
import com.vestige.security.SecurityUtils;
import com.vestige.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final RepairBookingRepository repairBookingRepository;
    private final UserRepository userRepository;
    private final AdminActionRepository adminActionRepository;
    private final RazorpayGateway razorpayGateway;

    @Value("${app.razorpay.key-id:rzp_test_placeholder}")
    private String razorpayKeyId;

    @Value("${app.razorpay.key-secret:rzp_secret_placeholder}")
    private String razorpayKeySecret;

    public PaymentService(PaymentRepository paymentRepository,
                          RepairBookingRepository repairBookingRepository,
                          UserRepository userRepository,
                          AdminActionRepository adminActionRepository,
                          RazorpayGateway razorpayGateway) {
        this.paymentRepository = paymentRepository;
        this.repairBookingRepository = repairBookingRepository;
        this.userRepository = userRepository;
        this.adminActionRepository = adminActionRepository;
        this.razorpayGateway = razorpayGateway;
    }

    @Transactional
    public PaymentOrderResponse createRepairPaymentOrder(UUID bookingId) {
        UserPrincipal currentUser = SecurityUtils.requireCurrentUser();
        SecurityUtils.assertActive();

        RepairBooking booking = repairBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Repair booking not found: " + bookingId));

        // Ownership validation
        if (!booking.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("You are not authorized to initiate payment for this repair booking");
        }
        if (booking.getStatus() == BookingStatusType.CANCELLED || booking.getStatus() == BookingStatusType.REJECTED) {
            throw new IllegalStateException("Cancelled or rejected bookings cannot be paid");
        }
        boolean alreadyPaid = paymentRepository
                .findByRelatedEntityTypeAndRelatedEntityIdOrderByCreatedAtDesc("REPAIR_BOOKING", bookingId)
                .stream().anyMatch(payment -> payment.getStatus() == PaymentStatusType.SUCCESS);
        if (alreadyPaid) {
            throw new IllegalStateException("This repair booking has already been paid");
        }

        // Server-side amount computation from verified database record
        BigDecimal payableAmount = booking.getSubmission().getEstimatedRepairCost();
        if (payableAmount == null || payableAmount.compareTo(BigDecimal.ZERO) <= 0) {
            payableAmount = BigDecimal.valueOf(500.00); // Standard restoration diagnostic base charge
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found"));

        String orderId = razorpayGateway.createOrder(payableAmount, booking.getId().toString());

        Payment payment = new Payment(
                user,
                "REPAIR_BOOKING",
                booking.getId(),
                orderId,
                payableAmount,
                "INR"
        );
        payment = paymentRepository.save(payment);

        logger.info("Created Razorpay payment order {} for booking {} amount {}", orderId, booking.getId(), payableAmount);

        return new PaymentOrderResponse(
                payment.getId(),
                orderId,
                payableAmount,
                "INR",
                razorpayKeyId,
                "VESTIGE Restoration Atelier",
                "Hardware Repair Service Fee - " + booking.getSubmission().getBrand() + " " + booking.getSubmission().getModel(),
                user.getEmail(),
                user.getPhone()
        );
    }

    @Transactional
    public PaymentSummaryResponse verifyPaymentSignature(PaymentVerifyRequest request) {
        UserPrincipal currentUser = SecurityUtils.requireCurrentUser();

        Payment payment = paymentRepository.findByProviderOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found: " + request.getRazorpayOrderId()));

        // Verify caller ownership
        if (!payment.getUser().getId().equals(currentUser.getId()) && currentUser.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Unauthorized to verify payment for this order");
        }

        boolean isValid = verifyRazorpayHmac(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!isValid) {
            logger.warn("Payment signature verification FAILED for order {}", request.getRazorpayOrderId());
            throw new IllegalArgumentException("Payment signature verification failed");
        }

        if (payment.getStatus() != PaymentStatusType.PENDING) {
            throw new IllegalStateException("Payment order has already been processed");
        }
        razorpayGateway.assertPaymentCaptured(request.getRazorpayOrderId(), request.getRazorpayPaymentId());

        payment.setStatus(PaymentStatusType.SUCCESS);
        payment.setProviderPaymentId(request.getRazorpayPaymentId());
        payment.setFailureReason(null);
        payment.setUpdatedAt(OffsetDateTime.now());
        payment = paymentRepository.save(payment);

        logger.info("Payment SUCCESS verified for order {} paymentId {}", request.getRazorpayOrderId(), request.getRazorpayPaymentId());

        return PaymentSummaryResponse.fromEntity(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentSummaryResponse> getUserPayments() {
        UserPrincipal currentUser = SecurityUtils.requireCurrentUser();
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(PaymentSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentAdminMetricsDTO getAdminPaymentMetrics() {
        UserPrincipal admin = SecurityUtils.requireCurrentUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Administrative clearance required to inspect financial metrics");
        }

        long total = paymentRepository.count();
        long success = paymentRepository.countByStatus(PaymentStatusType.SUCCESS);
        long pending = paymentRepository.countByStatus(PaymentStatusType.PENDING);
        long failed = paymentRepository.countByStatus(PaymentStatusType.FAILED) + paymentRepository.countByStatus(PaymentStatusType.CANCELLED);
        BigDecimal revenue = paymentRepository.sumTotalSuccessfulRevenue();

        List<PaymentSummaryResponse> recent = paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(20)
                .map(PaymentSummaryResponse::fromEntity)
                .collect(Collectors.toList());

        // Monthly timeline aggregates
        List<TimeSeriesDataPoint> timeline = buildMonthlyPaymentTimeline();

        return new PaymentAdminMetricsDTO(
                total,
                success,
                pending,
                failed,
                revenue != null ? revenue : BigDecimal.ZERO,
                timeline,
                recent
        );
    }

    @Transactional(readOnly = true)
    public List<PaymentSummaryResponse> getAllPaymentsForAdmin() {
        UserPrincipal admin = SecurityUtils.requireCurrentUser();
        if (admin.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Administrative clearance required");
        }

        return paymentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PaymentSummaryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private boolean verifyRazorpayHmac(String orderId, String paymentId, String signature) {
        if (!StringUtils.hasText(signature)) {
            return false;
        }

        try {
            String data = orderId + "|" + paymentId;
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return MessageDigest.isEqual(hexString.toString().getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            logger.error("Error computing HMAC signature: {}", e.getMessage());
            return false;
        }
    }

    private List<TimeSeriesDataPoint> buildMonthlyPaymentTimeline() {
        List<TimeSeriesDataPoint> points = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now();
        DateTimeFormatter labelFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = 5; i >= 0; i--) {
            OffsetDateTime start = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            OffsetDateTime end = start.plusMonths(1).minusNanos(1);
            long count = paymentRepository.countByStatusAndDateRange(PaymentStatusType.SUCCESS, start, end);
            points.add(new TimeSeriesDataPoint(start.format(labelFormatter), count));
        }
        return points;
    }
}

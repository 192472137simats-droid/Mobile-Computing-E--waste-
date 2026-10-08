package com.vestige.service;

import com.vestige.dto.payment.PaymentAdminMetricsDTO;
import com.vestige.dto.payment.PaymentOrderResponse;
import com.vestige.dto.payment.PaymentSummaryResponse;
import com.vestige.dto.payment.PaymentVerifyRequest;
import com.vestige.exception.ForbiddenException;
import com.vestige.model.*;
import com.vestige.model.enums.*;
import com.vestige.repository.*;
import com.vestige.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PaymentServiceTest {

    @Autowired
    private PaymentService paymentService;

    @MockBean
    private RazorpayGateway razorpayGateway;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorProfileRepository vendorProfileRepository;

    @Autowired
    private DeviceSubmissionRepository deviceSubmissionRepository;

    @Autowired
    private RepairBookingRepository repairBookingRepository;

    private User testUser;
    private User otherUser;
    private User adminUser;
    private VendorProfile testVendor;
    private DeviceSubmission testSubmission;
    private RepairBooking testBooking;

    @BeforeEach
    void setUp() {
        when(razorpayGateway.createOrder(any(BigDecimal.class), anyString()))
                .thenAnswer(invocation -> "order_" + UUID.randomUUID().toString().replace("-", ""));
        testUser = userRepository.save(new User("Payment Patron", "patron.pay@example.com", "hash", "+919111111111", UserRole.USER));
        otherUser = userRepository.save(new User("Other Patron", "other.patron@example.com", "hash", "+919222222222", UserRole.USER));
        adminUser = userRepository.save(new User("System Admin", "admin.pay@example.com", "hash", "+919333333333", UserRole.ADMIN));

        User vendorUser = userRepository.save(new User("Vendor Rep", "vendor.rep@example.com", "hash", "+919444444444", UserRole.VENDOR));
        VendorProfile vp = new VendorProfile();
        vp.setUser(vendorUser);
        vp.setBusinessName("Precision Workshop");
        vp.setAddress("123 Tech Lane");
        vp.setCity("Bengaluru");
        vp.setState("Karnataka");
        vp.setPincode("560001");
        vp.setVerificationStatus(VendorVerificationStatus.VERIFIED);
        testVendor = vendorProfileRepository.save(vp);

        DeviceSubmission sub = new DeviceSubmission();
        sub.setUser(testUser);
        sub.setDeviceType(DeviceCategoryType.SMARTPHONE);
        sub.setBrand("Google");
        sub.setModel("Pixel 7");
        sub.setDeviceAgeYears(2);
        sub.setCondition(DeviceConditionGrade.FAIR);
        sub.setEstimatedRepairCost(BigDecimal.valueOf(3200.00));
        sub.setPartAvailability(PartAvailabilityStatus.AVAILABLE);
        sub.setEngineScore(78);
        sub.setEngineRecommendation(EngineRecommendationType.REPAIR);
        sub.setEngineConfidence(EngineConfidenceLevel.HIGH);
        testSubmission = deviceSubmissionRepository.save(sub);

        RepairBooking booking = new RepairBooking();
        booking.setUser(testUser);
        booking.setVendor(testVendor);
        booking.setSubmission(testSubmission);
        booking.setPreferredDate(LocalDate.now().plusDays(2));
        booking.setPreferredTime(LocalTime.of(14, 0));
        booking.setIssueDescription("Cracked OLED screen glass");
        booking.setStatus(BookingStatusType.ACCEPTED);
        testBooking = repairBookingRepository.save(booking);
    }

    private void authenticateAs(User user) {
        UserPrincipal principal = UserPrincipal.fromEntity(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String signatureFor(String orderId, String paymentId) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec("rzp_secret_placeholder".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    @Test
    void testCreateRepairPaymentOrder_Success() {
        authenticateAs(testUser);

        PaymentOrderResponse response = paymentService.createRepairPaymentOrder(testBooking.getId());

        assertNotNull(response);
        assertNotNull(response.getPaymentId());
        assertTrue(response.getProviderOrderId().startsWith("order_"));
        assertEquals(BigDecimal.valueOf(3200.00), response.getAmount());
        assertEquals("INR", response.getCurrency());

        Payment saved = paymentRepository.findById(response.getPaymentId()).orElse(null);
        assertNotNull(saved);
        assertEquals(PaymentStatusType.PENDING, saved.getStatus());
        assertEquals(testUser.getId(), saved.getUser().getId());
    }

    @Test
    void testCreateRepairPaymentOrder_ForbiddenForOtherUser() {
        authenticateAs(otherUser);

        assertThrows(ForbiddenException.class, () -> {
            paymentService.createRepairPaymentOrder(testBooking.getId());
        });
    }

    @Test
    void testVerifyPaymentSignature_Success() {
        authenticateAs(testUser);
        PaymentOrderResponse order = paymentService.createRepairPaymentOrder(testBooking.getId());
        String paymentId = "pay_test" + UUID.randomUUID().toString().substring(0, 8);

        PaymentVerifyRequest verifyReq = new PaymentVerifyRequest(
                order.getProviderOrderId(),
                paymentId,
                signatureFor(order.getProviderOrderId(), paymentId)
        );

        PaymentSummaryResponse verified = paymentService.verifyPaymentSignature(verifyReq);

        assertNotNull(verified);
        assertEquals(PaymentStatusType.SUCCESS, verified.getStatus());
        assertEquals(order.getProviderOrderId(), verified.getProviderOrderId());
        assertNotNull(verified.getProviderPaymentId());
    }

    @Test
    void testCreateRepairPaymentOrder_RejectsAlreadyPaidBooking() {
        authenticateAs(testUser);
        PaymentOrderResponse order = paymentService.createRepairPaymentOrder(testBooking.getId());
        String paymentId = "pay_test" + UUID.randomUUID().toString().substring(0, 8);
        paymentService.verifyPaymentSignature(new PaymentVerifyRequest(
                order.getProviderOrderId(), paymentId, signatureFor(order.getProviderOrderId(), paymentId)));

        assertThrows(IllegalStateException.class,
                () -> paymentService.createRepairPaymentOrder(testBooking.getId()));
    }

    @Test
    void testVerifyPaymentSignature_InvalidSignatureFails() {
        authenticateAs(testUser);
        PaymentOrderResponse order = paymentService.createRepairPaymentOrder(testBooking.getId());

        PaymentVerifyRequest verifyReq = new PaymentVerifyRequest(
                order.getProviderOrderId(),
                "pay_test_failed",
                "" // Empty signature should fail
        );

        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.verifyPaymentSignature(verifyReq);
        });

        Payment payment = paymentRepository.findByProviderOrderId(order.getProviderOrderId()).orElse(null);
        assertNotNull(payment);
        assertEquals(PaymentStatusType.PENDING, payment.getStatus());
    }

    @Test
    void testGetUserPayments() {
        authenticateAs(testUser);
        paymentService.createRepairPaymentOrder(testBooking.getId());

        List<PaymentSummaryResponse> userPayments = paymentService.getUserPayments();
        assertFalse(userPayments.isEmpty());
        assertEquals(1, userPayments.size());
        assertEquals(testUser.getId(), userPayments.get(0).getUserId());
    }

    @Test
    void testGetAdminPaymentMetrics() {
        authenticateAs(testUser);
        PaymentOrderResponse order = paymentService.createRepairPaymentOrder(testBooking.getId());
        paymentService.verifyPaymentSignature(new PaymentVerifyRequest(
                order.getProviderOrderId(), "pay_123", signatureFor(order.getProviderOrderId(), "pay_123")));

        authenticateAs(adminUser);
        PaymentAdminMetricsDTO metrics = paymentService.getAdminPaymentMetrics();

        assertNotNull(metrics);
        assertTrue(metrics.getTotalPayments() >= 1);
        assertTrue(metrics.getSuccessfulPayments() >= 1);
        assertTrue(metrics.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0);
        assertFalse(metrics.getRevenueOverTime().isEmpty());
    }
}

package com.vestige.service;

import java.math.BigDecimal;

public interface RazorpayGateway {
    String createOrder(BigDecimal amount, String receipt);
    void assertPaymentCaptured(String orderId, String paymentId);
}

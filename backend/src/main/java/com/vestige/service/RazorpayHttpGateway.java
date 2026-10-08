package com.vestige.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
public class RazorpayHttpGateway implements RazorpayGateway {
    private static final URI ORDERS_URL = URI.create("https://api.razorpay.com/v1/orders");
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper;
    private final String keyId;
    private final String keySecret;

    public RazorpayHttpGateway(ObjectMapper objectMapper,
                               @Value("${app.razorpay.key-id:}") String keyId,
                               @Value("${app.razorpay.key-secret:}") String keySecret) {
        this.objectMapper = objectMapper;
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    @Override
    public String createOrder(BigDecimal amount, String receipt) {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("amount", amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.UNNECESSARY).longValueExact());
        body.put("currency", "INR");
        body.put("receipt", receipt);
        JsonNode response = request("POST", ORDERS_URL, body.toString());
        String orderId = response.path("id").asText();
        if (!orderId.startsWith("order_")) {
            throw new IllegalStateException("Payment provider returned an invalid order");
        }
        return orderId;
    }

    @Override
    public void assertPaymentCaptured(String orderId, String paymentId) {
        if (!paymentId.matches("pay_[A-Za-z0-9]+")) {
            throw new IllegalArgumentException("Invalid payment identifier");
        }
        JsonNode payment = request("GET", URI.create("https://api.razorpay.com/v1/payments/" + paymentId), null);
        if (!orderId.equals(payment.path("order_id").asText())
                || !"captured".equals(payment.path("status").asText())) {
            throw new IllegalStateException("Payment has not been captured for this order");
        }
    }

    private JsonNode request(String method, URI uri, String body) {
        if (keyId.isBlank() || keySecret.isBlank()
                || keyId.contains("placeholder") || keySecret.contains("placeholder")) {
            throw new IllegalStateException("Razorpay credentials are not configured");
        }
        String basic = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Basic " + basic)
                .header("Accept", "application/json");
        HttpRequest request = "POST".equals(method)
                ? builder.header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build()
                : builder.GET().build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Payment provider rejected the request (HTTP " + response.statusCode() + ")");
            }
            return objectMapper.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Payment provider request interrupted", e);
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Payment provider is unavailable", e);
        }
    }
}

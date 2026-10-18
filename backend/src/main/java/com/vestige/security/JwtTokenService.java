package com.vestige.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestige.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtTokenService {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenService.class);

    private final ObjectMapper objectMapper;
    private final String jwtSecret;
    private final long validitySeconds = 604800; // 7 days

    public JwtTokenService(
            ObjectMapper objectMapper,
            @Value("${app.jwt.secret}") String jwtSecret
    ) {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 characters");
        }
        this.objectMapper = objectMapper;
        this.jwtSecret = jwtSecret;
    }

    public JsonNode verifyToken(String token) {
        try {
            String[] parts = token.split("\\.", -1);
            if (parts.length != 3 || parts[2].isBlank()) {
                throw new IllegalArgumentException("Invalid token format");
            }
            JsonNode header = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[0]));
            if (!"HS256".equals(header.path("alg").asText())) {
                throw new IllegalArgumentException("Unsupported token algorithm");
            }
            byte[] expected = Base64.getUrlDecoder().decode(sign(parts[0] + "." + parts[1]));
            byte[] actual = Base64.getUrlDecoder().decode(parts[2]);
            if (!MessageDigest.isEqual(expected, actual)) {
                throw new IllegalArgumentException("Invalid token signature");
            }
            JsonNode payload = objectMapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
            if (!payload.path("exp").isNumber()
                    || payload.path("exp").asLong() <= System.currentTimeMillis() / 1000
                    || !payload.path("sub").isTextual()) {
                throw new IllegalArgumentException("Expired or incomplete token");
            }
            return payload;
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid authentication token", e);
        }
    }

    public String generateToken(User user) {
        try {
            long now = System.currentTimeMillis() / 1000;
            long exp = now + validitySeconds;

            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", user.getId().toString());
            payload.put("email", user.getEmail());
            payload.put("role", user.getRole().name());
            payload.put("full_name", user.getFullName());
            payload.put("cv", user.getCredentialVersion());
            payload.put("iat", now);
            payload.put("exp", exp);

            String headerJson = objectMapper.writeValueAsString(header);
            String payloadJson = objectMapper.writeValueAsString(payload);

            String encodedHeader = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
            String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));

            String dataToSign = encodedHeader + "." + encodedPayload;
            String signature = sign(dataToSign);

            return dataToSign + "." + signature;
        } catch (Exception e) {
            logger.error("Failed to generate JWT token for user {}: {}", user.getEmail(), e.getMessage());
            throw new IllegalStateException("Failed to generate authentication token", e);
        }
    }

    private String sign(String data) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        hmac.init(secretKey);
        byte[] rawHmac = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
    }
}

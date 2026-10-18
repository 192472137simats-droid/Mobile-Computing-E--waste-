package com.vestige.service;

import com.vestige.exception.ServiceUnavailableException;
import com.vestige.model.PasswordResetToken;
import com.vestige.model.User;
import com.vestige.repository.PasswordResetTokenRepository;
import com.vestige.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class PasswordResetService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetEmailSender emailSender;

    public PasswordResetService(UserRepository users, PasswordResetTokenRepository tokens,
                                PasswordEncoder passwordEncoder, PasswordResetEmailSender emailSender) {
        this.users = users;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
    }

    @Transactional
    public void requestReset(String email) {
        if (!emailSender.isConfigured()) {
            throw new ServiceUnavailableException("Password recovery email is not configured yet. Please contact support.");
        }
        users.findByEmail(email.trim().toLowerCase()).ifPresent(user -> {
            if (!user.isActive() || "[SUPABASE_AUTH_MANAGED]".equals(user.getPasswordHash())) return;
            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
            if (tokens.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                    .filter(token -> token.getCreatedAt().isAfter(now.minusMinutes(1))).isPresent()) return;

            byte[] random = new byte[32];
            RANDOM.nextBytes(random);
            String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
            tokens.deleteByUserId(user.getId());
            tokens.save(new PasswordResetToken(user.getId(), hash(rawToken), now, now.plusMinutes(30)));
            emailSender.sendResetLink(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void completeReset(String rawToken, String newPassword) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        PasswordResetToken token = tokens.findByHashForUpdate(hash(rawToken))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset link"));
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)) {
            throw new IllegalArgumentException("Invalid or expired password reset link");
        }
        User user = users.findById(token.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired password reset link"));
        if (!user.isActive()) throw new IllegalArgumentException("Invalid or expired password reset link");
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setCredentialVersion(user.getCredentialVersion() + 1);
        users.save(user);
        token.setUsedAt(now);
        tokens.save(token);
    }

    private static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}

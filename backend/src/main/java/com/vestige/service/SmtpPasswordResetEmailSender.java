package com.vestige.service;

import com.vestige.exception.ServiceUnavailableException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SmtpPasswordResetEmailSender implements PasswordResetEmailSender {
    private final ObjectProvider<JavaMailSender> mailSender;
    private final String fromAddress;
    private final String publicBaseUrl;
    private final Environment environment;

    public SmtpPasswordResetEmailSender(ObjectProvider<JavaMailSender> mailSender,
                                        @Value("${app.mail.from:}") String fromAddress,
                                        @Value("${app.public-base-url:http://localhost:5173}") String publicBaseUrl,
                                        Environment environment) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.publicBaseUrl = publicBaseUrl;
        this.environment = environment;
    }

    @Override
    public boolean isConfigured() {
        return mailSender.getIfAvailable() != null
                && StringUtils.hasText(fromAddress)
                && StringUtils.hasText(publicBaseUrl)
                && (!environment.matchesProfiles("prod") || !publicBaseUrl.contains("localhost"));
    }

    @Override
    public void sendResetLink(String email, String token) {
        if (!isConfigured()) {
            throw new ServiceUnavailableException("Password recovery email is not configured yet. Please contact support.");
        }
        String link = publicBaseUrl.replaceAll("/+$", "")
                + "/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(email);
        message.setSubject("Reset your VESTIGE password");
        message.setText("Use this link to reset your password within 30 minutes:\n\n" + link
                + "\n\nIf you did not request this, you can ignore this email.");
        mailSender.getObject().send(message);
    }
}

package com.vestige.service;

public interface PasswordResetEmailSender {
    boolean isConfigured();
    void sendResetLink(String email, String token);
}

package com.vestige.service;

import com.vestige.model.User;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.UserRepository;
import com.vestige.security.JwtTokenService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PasswordResetServiceTest {
    @Autowired PasswordResetService resetService;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtTokenService jwtTokenService;
    @Autowired MockMvc mockMvc;
    @MockBean PasswordResetEmailSender emailSender;

    @Test
    void resetIsSingleUseAndInvalidatesOldCredentials() throws Exception {
        when(emailSender.isConfigured()).thenReturn(true);
        String email = "reset-" + UUID.randomUUID() + "@example.com";
        User user = users.save(new User("Reset User", email, passwordEncoder.encode("OldPassword123"), null, UserRole.USER));
        String oldJwt = jwtTokenService.generateToken(user);

        resetService.requestReset(email);
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(emailSender).sendResetLink(eq(email), token.capture());
        String raw = token.getValue();
        assertFalse(raw.isBlank());

        resetService.completeReset(raw, "NewPassword123");
        User updated = users.findById(user.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("NewPassword123", updated.getPasswordHash()));
        assertFalse(passwordEncoder.matches("OldPassword123", updated.getPasswordHash()));
        assertEquals(1, updated.getCredentialVersion());
        assertNotEquals(jwtTokenService.verifyToken(oldJwt).path("cv").asLong(), updated.getCredentialVersion());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldJwt))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + jwtTokenService.generateToken(updated)))
                .andExpect(status().isOk());
        assertThrows(IllegalArgumentException.class, () -> resetService.completeReset(raw, "AnotherPassword123"));
    }

    @Test
    void unknownEmailDoesNotRevealWhetherAccountExists() {
        when(emailSender.isConfigured()).thenReturn(true);
        assertDoesNotThrow(() -> resetService.requestReset("missing@example.com"));
        verify(emailSender, never()).sendResetLink(anyString(), anyString());
    }

    @Test
    void publicRequestEndpointDoesNotExposeAccountExistence() throws Exception {
        when(emailSender.isConfigured()).thenReturn(true);
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType("application/json")
                        .content("{\"email\":\"missing@example.com\"}"))
                .andExpect(status().isOk());
    }
}

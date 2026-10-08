package com.vestige.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestige.model.User;
import com.vestige.model.enums.PreferredLanguage;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.UserRepository;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ObjectProvider<UserRepository> userRepositoryProvider;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final String TEST_SECRET = "vestige-test-secret-for-authentication-unit-tests";

    @BeforeEach
    void setUp() {
        lenient().when(userRepositoryProvider.getIfAvailable()).thenReturn(userRepository);
        filter = new JwtAuthenticationFilter(userRepositoryProvider, new JwtTokenService(objectMapper, TEST_SECRET));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private String createJwt(UUID sub, String email, long expSeconds) {
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                String.format("{\"sub\":\"%s\",\"email\":\"%s\",\"exp\":%d,\"role\":\"authenticated\"}", sub, email, expSeconds).getBytes(StandardCharsets.UTF_8)
        );
        try {
            String data = header + "." + payload;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(TEST_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return data + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    @Test
    @DisplayName("Missing token leaves SecurityContext unauthenticated")
    void testMissingToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Malformed token leaves SecurityContext unauthenticated")
    void testMalformedToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer invalid-token-string");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void testTamperedSignatureIsRejected() throws Exception {
        UUID userId = UUID.randomUUID();
        String token = createJwt(userId, "patron@vestige.internal", System.currentTimeMillis() / 1000 + 3600);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token.substring(0, token.length() - 1)
                + (token.endsWith("A") ? "B" : "A"));
        filter.doFilterInternal(request, new MockHttpServletResponse(), filterChain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Expired token is rejected and leaves SecurityContext unauthenticated")
    void testExpiredToken() throws Exception {
        UUID userId = UUID.randomUUID();
        long pastExp = (System.currentTimeMillis() / 1000) - 3600; // 1 hour ago
        String token = createJwt(userId, "expired@vestige.internal", pastExp);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Valid active user token enriches SecurityContext with database-verified role")
    void testValidActiveUserToken() throws Exception {
        UUID userId = UUID.randomUUID();
        long futureExp = (System.currentTimeMillis() / 1000) + 3600; // 1 hour ahead
        String token = createJwt(userId, "patron@vestige.internal", futureExp);

        User dbUser = new User("Archival Patron", "patron@vestige.internal", "hash", "+919876543210", UserRole.USER);
        dbUser.setId(userId);
        dbUser.setActive(true);
        dbUser.setPreferredLanguage(PreferredLanguage.en);

        when(userRepository.findById(userId)).thenReturn(Optional.of(dbUser));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        assertEquals(userId, principal.getId());
        assertEquals("patron@vestige.internal", principal.getEmail());
        assertEquals(UserRole.USER, principal.getRole());
        assertTrue(principal.isActive());
        verify(filterChain).doFilter(request, response);
    }
}

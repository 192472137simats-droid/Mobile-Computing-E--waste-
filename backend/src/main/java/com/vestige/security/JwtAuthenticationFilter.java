package com.vestige.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vestige.model.User;
import com.vestige.model.enums.PreferredLanguage;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final ObjectProvider<UserRepository> userRepositoryProvider;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(ObjectProvider<UserRepository> userRepositoryProvider, ObjectMapper objectMapper) {
        this.userRepositoryProvider = userRepositoryProvider;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String token = extractJwtFromRequest(request);
            if (StringUtils.hasText(token)) {
                processToken(token, request);
            }
        } catch (Exception ex) {
            logger.warn("Could not set user authentication in security context: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }

    private void processToken(String token, HttpServletRequest request) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                logger.warn("Invalid JWT token format received");
                return;
            }

            // Decode payload safely
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            JsonNode payload = objectMapper.readTree(payloadJson);

            // Extract sub (UUID) and email claims
            JsonNode subNode = payload.get("sub");
            JsonNode emailNode = payload.get("email");
            JsonNode expNode = payload.get("exp");

            // Expiration verification
            if (expNode != null && expNode.isNumber()) {
                long expSeconds = expNode.asLong();
                long nowSeconds = System.currentTimeMillis() / 1000;
                if (nowSeconds >= expSeconds) {
                    logger.warn("JWT token has expired (exp: {}, now: {})", expSeconds, nowSeconds);
                    return;
                }
            }

            if (subNode == null || !subNode.isTextual()) {
                logger.warn("JWT payload missing 'sub' claim");
                return;
            }

            UUID userUuid = UUID.fromString(subNode.asText());
            String email = emailNode != null && emailNode.isTextual() ? emailNode.asText() : "";

            // Check if user exists in public.users (with DB fault isolation)
            UserRepository userRepository = userRepositoryProvider.getIfAvailable();
            Optional<User> userOpt = Optional.empty();
            if (userRepository != null) {
                try {
                    userOpt = userRepository.findById(userUuid);
                    if (userOpt.isEmpty() && StringUtils.hasText(email)) {
                        userOpt = userRepository.findByEmail(email);
                    }
                } catch (Exception dbEx) {
                    logger.warn("Database lookup failed during JWT filter, proceeding with token claims: {}", dbEx.getMessage());
                }
            }

            UserPrincipal principal;
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                principal = UserPrincipal.fromEntity(user);
            } else {
                // Parse role and full name directly from JWT payload claims
                UserRole role = UserRole.USER;
                JsonNode appMetadata = payload.get("app_metadata");
                JsonNode userMetadata = payload.get("user_metadata");
                String roleClaim = null;
                if (appMetadata != null && appMetadata.has("role")) {
                    roleClaim = appMetadata.get("role").asText();
                } else if (userMetadata != null && userMetadata.has("role")) {
                    roleClaim = userMetadata.get("role").asText();
                }
                if (roleClaim != null) {
                    try {
                        role = UserRole.valueOf(roleClaim.toUpperCase());
                    } catch (Exception ignored) {}
                }

                String name = email;
                if (userMetadata != null && userMetadata.has("full_name") && userMetadata.get("full_name").isTextual()) {
                    name = userMetadata.get("full_name").asText();
                }

                principal = new UserPrincipal(
                        userUuid,
                        email,
                        StringUtils.hasText(name) ? name : "Archival Patron",
                        role,
                        PreferredLanguage.en,
                        true
                );
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception ex) {
            logger.debug("Failed to decode and authenticate JWT: {}", ex.getMessage());
        }
    }
}

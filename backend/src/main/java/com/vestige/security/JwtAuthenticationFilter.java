package com.vestige.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.vestige.model.User;
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
import java.util.Optional;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final ObjectProvider<UserRepository> userRepositoryProvider;
    private final JwtTokenService jwtTokenService;

    public JwtAuthenticationFilter(ObjectProvider<UserRepository> userRepositoryProvider, JwtTokenService jwtTokenService) {
        this.userRepositoryProvider = userRepositoryProvider;
        this.jwtTokenService = jwtTokenService;
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
            JsonNode payload = jwtTokenService.verifyToken(token);
            UUID userUuid = UUID.fromString(payload.path("sub").asText());
            UserRepository userRepository = userRepositoryProvider.getIfAvailable();
            if (userRepository == null) return;
            Optional<User> userOpt = userRepository.findById(userUuid);
            if (userOpt.isEmpty() || !userOpt.get().isActive()) return;
            UserPrincipal principal = UserPrincipal.fromEntity(userOpt.get());

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception ex) {
            logger.debug("Failed to decode and authenticate JWT: {}", ex.getMessage());
        }
    }
}

package com.vestige.service;

import com.vestige.model.User;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("prod")
public class BootstrapAdminService implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(BootstrapAdminService.class);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;

    public BootstrapAdminService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                                 @Value("${app.bootstrap.admin-email:}") String adminEmail,
                                 @Value("${app.bootstrap.admin-password:}") String adminPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail.trim().toLowerCase();
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        userRepository.findByEmail("admin@vestige.internal").ifPresent(legacy -> {
            if (passwordEncoder.matches("Admin@123", legacy.getPasswordHash())) {
                legacy.setActive(false);
                userRepository.save(legacy);
                logger.warn("Disabled legacy administrator with a known default password");
            }
        });

        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            logger.warn("Set APP_BOOTSTRAP_ADMIN_EMAIL and APP_BOOTSTRAP_ADMIN_PASSWORD to create the initial administrator");
            return;
        }
        if (adminPassword.length() < 14) {
            throw new IllegalArgumentException("Bootstrap admin password must contain at least 14 characters");
        }
        if (userRepository.findByEmail(adminEmail).isPresent()) return;

        User admin = new User("Platform Administrator", adminEmail,
                passwordEncoder.encode(adminPassword), null, UserRole.ADMIN);
        userRepository.save(admin);
        logger.info("Created initial production administrator: {}", adminEmail);
    }
}

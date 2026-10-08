package com.vestige.service;

import com.vestige.model.*;
import com.vestige.model.enums.*;
import com.vestige.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

@Component
@Profile("dev")
public class DataInitializationService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializationService.class);

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final DeviceSubmissionRepository deviceSubmissionRepository;
    private final RecyclingRequestRepository recyclingRequestRepository;
    private final RewardAccountRepository rewardAccountRepository;
    private final RewardTransactionRepository rewardTransactionRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializationService(
            UserRepository userRepository,
            VendorProfileRepository vendorProfileRepository,
            DeviceSubmissionRepository deviceSubmissionRepository,
            RecyclingRequestRepository recyclingRequestRepository,
            RewardAccountRepository rewardAccountRepository,
            RewardTransactionRepository rewardTransactionRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.deviceSubmissionRepository = deviceSubmissionRepository;
        this.recyclingRequestRepository = recyclingRequestRepository;
        this.rewardAccountRepository = rewardAccountRepository;
        this.rewardTransactionRepository = rewardTransactionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            seedInitialData();
        } catch (Exception e) {
            log.warn("Database initialization notice: {}", e.getMessage());
        }
    }

    @Transactional
    public void seedInitialData() {
        // 1. Seed Admin User
        if (!userRepository.existsByEmail("admin@vestige.internal")) {
            User admin = new User(
                    "VESTIGE Master Registrar",
                    "admin@vestige.internal",
                    passwordEncoder.encode("Admin@123"),
                    "+910000000000",
                    UserRole.ADMIN
            );
            userRepository.save(admin);
            log.info("Seeded platform admin user: admin@vestige.internal");
        }

        // 2. Seed Standard Demo User
        User demoUser = userRepository.findByEmail("user@vestige.internal").orElseGet(() -> {
            User user = new User(
                    "Archival Patron",
                    "user@vestige.internal",
                    passwordEncoder.encode("User@123"),
                    "+919876543210",
                    UserRole.USER
            );
            return userRepository.save(user);
        });

        // 3. Seed Reward Account for Demo User
        RewardAccount rewardAccount = rewardAccountRepository.findByUserId(demoUser.getId()).orElseGet(() -> {
            RewardAccount account = new RewardAccount();
            account.setUser(demoUser);
            account.setBalance(350);
            account.setLifetimeEarned(450);
            account.setLifetimeRedeemed(100);
            account.setUpdatedAt(OffsetDateTime.now());
            RewardAccount saved = rewardAccountRepository.save(account);

            // Initial transactions
            rewardTransactionRepository.save(new RewardTransaction(
                    saved,
                    150,
                    RewardTransactionType.EARNED,
                    RewardSourceType.RECYCLING_PICKUP,
                    null,
                    "E-Waste recycling completed: 3 legacy mobile phones"
            ));

            rewardTransactionRepository.save(new RewardTransaction(
                    saved,
                    300,
                    RewardTransactionType.EARNED,
                    RewardSourceType.RECYCLING_PICKUP,
                    null,
                    "E-Waste recycling completed: 1 vintage tower workstation"
            ));

            rewardTransactionRepository.save(new RewardTransaction(
                    saved,
                    100,
                    RewardTransactionType.REDEEMED,
                    RewardSourceType.REDEMPTION,
                    null,
                    "Redeemed: Zero-Landfill Tree Planting Certificate"
            ));

            return saved;
        });

        // 4. Seed Verified Recycler & Workshop Vendors
        if (vendorProfileRepository.count() == 0) {
            // Vendor 1: Aegis Eco-Recycling Guild
            User vendorUser1 = userRepository.findByEmail("aegis@vestige.internal").orElseGet(() ->
                    userRepository.save(new User("Master Kenneth Vance", "aegis@vestige.internal", passwordEncoder.encode("Vendor@123"), "+919888877771", UserRole.VENDOR))
            );

            VendorProfile vendor1 = new VendorProfile();
            vendor1.setUser(vendorUser1);
            vendor1.setBusinessName("Aegis Eco-Recycling Guild");
            vendor1.setBusinessType("Authorized E-Waste Dismantler & Recycler");
            vendor1.setAddress("42 Industrial Archival Way, Peenya Phase 2");
            vendor1.setCity("Bengaluru");
            vendor1.setState("Karnataka");
            vendor1.setPincode("560058");
            vendor1.setWhatsappNumber("+919888877771");
            vendor1.setServiceTypes(List.of("RECYCLE", "REPAIR"));
            vendor1.setDeviceCategories(List.of("SMARTPHONE", "LAPTOP", "TABLET", "DESKTOP", "OTHER"));
            vendor1.setVerificationStatus(VendorVerificationStatus.VERIFIED);
            vendor1.setRatingAvg(BigDecimal.valueOf(4.90));
            vendor1.setRatingCount(128);
            VendorProfile savedVendor1 = vendorProfileRepository.save(vendor1);

            // Vendor 2: Zero-Landfill Circular Metals
            User vendorUser2 = userRepository.findByEmail("zerolandfill@vestige.internal").orElseGet(() ->
                    userRepository.save(new User("Eleanor Finch", "zerolandfill@vestige.internal", passwordEncoder.encode("Vendor@123"), "+919888877772", UserRole.VENDOR))
            );

            VendorProfile vendor2 = new VendorProfile();
            vendor2.setUser(vendorUser2);
            vendor2.setBusinessName("Zero-Landfill Circular Metals & Recovery");
            vendor2.setBusinessType("Certified Precious Metal & E-Waste Extractor");
            vendor2.setAddress("18 Foundry Lane, Sanathnagar Industrial Area");
            vendor2.setCity("Hyderabad");
            vendor2.setState("Telangana");
            vendor2.setPincode("500018");
            vendor2.setWhatsappNumber("+919888877772");
            vendor2.setServiceTypes(List.of("RECYCLE"));
            vendor2.setDeviceCategories(List.of("LAPTOP", "DESKTOP", "OTHER"));
            vendor2.setVerificationStatus(VendorVerificationStatus.VERIFIED);
            vendor2.setRatingAvg(BigDecimal.valueOf(4.95));
            vendor2.setRatingCount(84);
            vendorProfileRepository.save(vendor2);

            // Vendor 3: Parchment Restoration Workshop
            User vendorUser3 = userRepository.findByEmail("parchment@vestige.internal").orElseGet(() ->
                    userRepository.save(new User("Arthur Pendelton", "parchment@vestige.internal", passwordEncoder.encode("Vendor@123"), "+919888877773", UserRole.VENDOR))
            );

            VendorProfile vendor3 = new VendorProfile();
            vendor3.setUser(vendorUser3);
            vendor3.setBusinessName("Parchment Restoration Workshop");
            vendor3.setBusinessType("Master Precision Micro-Electronics Atelier");
            vendor3.setAddress("7 Antique Clocktower Lane, T. Nagar");
            vendor3.setCity("Chennai");
            vendor3.setState("Tamil Nadu");
            vendor3.setPincode("600017");
            vendor3.setWhatsappNumber("+919888877773");
            vendor3.setServiceTypes(List.of("REPAIR"));
            vendor3.setDeviceCategories(List.of("SMARTPHONE", "LAPTOP", "TABLET"));
            vendor3.setVerificationStatus(VendorVerificationStatus.VERIFIED);
            vendor3.setRatingAvg(BigDecimal.valueOf(4.88));
            vendor3.setRatingCount(210);
            vendorProfileRepository.save(vendor3);

            // 5. Seed sample device submission & sample recycling request
            DeviceSubmission sampleSub = new DeviceSubmission();
            sampleSub.setUser(demoUser);
            sampleSub.setDeviceType(DeviceCategoryType.LAPTOP);
            sampleSub.setBrand("Lenovo");
            sampleSub.setModel("ThinkPad T440p");
            sampleSub.setDeviceAgeYears(8);
            sampleSub.setCondition(DeviceConditionGrade.POOR);
            sampleSub.setKnownIssues(List.of("Motherboard Short Circuit", "Broken Display Hinge", "Swollen Battery"));
            sampleSub.setEstimatedRepairCost(BigDecimal.valueOf(14500));
            sampleSub.setOriginalValue(BigDecimal.valueOf(18000));
            sampleSub.setPartAvailability(PartAvailabilityStatus.UNAVAILABLE);
            sampleSub.setEngineScore(18);
            sampleSub.setEngineRecommendation(EngineRecommendationType.RECYCLE);
            sampleSub.setEngineConfidence(EngineConfidenceLevel.HIGH);
            sampleSub.setEngineRationale("Repair cost (80.6% of valuation) and scarce obsolete parts make ethical zero-landfill e-waste recycling the optimal route.");
            DeviceSubmission savedSub = deviceSubmissionRepository.save(sampleSub);

            RecyclingRequest sampleReq = new RecyclingRequest();
            sampleReq.setUser(demoUser);
            sampleReq.setVendor(savedVendor1);
            sampleReq.setSubmission(savedSub);
            sampleReq.setPickupAddress("Flat 304, Heritage Apartments, 12th Cross, Indiranagar, Bengaluru");
            sampleReq.setPickupDate(LocalDate.now().plusDays(2));
            sampleReq.setPickupTime(LocalTime.of(10, 30));
            sampleReq.setDeviceCount(2);
            sampleReq.setStatus(RecyclingStatusType.SCHEDULED);
            sampleReq.setPointsAwarded(0);
            recyclingRequestRepository.save(sampleReq);

            log.info("Initialized VESTIGE Phase 4 seed data: 3 vendors, 1 user, 1 submission, 1 recycling request.");
        }
    }
}

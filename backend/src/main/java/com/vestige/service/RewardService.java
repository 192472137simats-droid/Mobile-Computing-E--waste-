package com.vestige.service;

import com.vestige.dto.request.RedeemRewardRequestDTO;
import com.vestige.dto.response.RedemptionResponse;
import com.vestige.dto.response.RewardAccountResponse;
import com.vestige.dto.response.RewardCatalogItemDTO;
import com.vestige.dto.response.RewardTransactionResponse;
import com.vestige.model.Redemption;
import com.vestige.model.RewardAccount;
import com.vestige.model.RewardTransaction;
import com.vestige.model.User;
import com.vestige.model.enums.RedemptionStatusType;
import com.vestige.model.enums.RewardSourceType;
import com.vestige.model.enums.RewardTransactionType;
import com.vestige.repository.RedemptionRepository;
import com.vestige.repository.RewardAccountRepository;
import com.vestige.repository.RewardTransactionRepository;
import com.vestige.repository.UserRepository;
import com.vestige.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class RewardService {

    private final RewardAccountRepository rewardAccountRepository;
    private final RewardTransactionRepository rewardTransactionRepository;
    private final RedemptionRepository redemptionRepository;
    private final UserRepository userRepository;

    public RewardService(
            RewardAccountRepository rewardAccountRepository,
            RewardTransactionRepository rewardTransactionRepository,
            RedemptionRepository redemptionRepository,
            UserRepository userRepository
    ) {
        this.rewardAccountRepository = rewardAccountRepository;
        this.rewardTransactionRepository = rewardTransactionRepository;
        this.redemptionRepository = redemptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RewardAccount getOrCreateAccount(UUID userId) {
        return rewardAccountRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                    RewardAccount newAccount = new RewardAccount(user);
                    return rewardAccountRepository.save(newAccount);
                });
    }

    @Transactional(readOnly = true)
    public RewardAccountResponse getAccountResponse(UUID userId) {
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        SecurityUtils.assertOwnershipOrAdmin(effectiveUserId);

        RewardAccount account = rewardAccountRepository.findByUserId(effectiveUserId)
                .orElseGet(() -> {
                    User user = userRepository.findById(effectiveUserId).orElse(null);
                    RewardAccount emptyAccount = new RewardAccount();
                    emptyAccount.setBalance(0);
                    emptyAccount.setLifetimeEarned(0);
                    emptyAccount.setLifetimeRedeemed(0);
                    emptyAccount.setUser(user);
                    return emptyAccount;
                });

        RewardAccountResponse response = new RewardAccountResponse();
        response.setId(account.getId());
        if (account.getUser() != null) {
            response.setUserId(account.getUser().getId());
            response.setUserName(account.getUser().getFullName());
        } else {
            response.setUserId(effectiveUserId);
            response.setUserName("Valued Device Owner");
        }
        response.setBalance(account.getBalance() != null ? account.getBalance() : 0);
        response.setLifetimeEarned(account.getLifetimeEarned() != null ? account.getLifetimeEarned() : 0);
        response.setLifetimeRedeemed(account.getLifetimeRedeemed() != null ? account.getLifetimeRedeemed() : 0);
        response.setUpdatedAt(account.getUpdatedAt());
        return response;
    }

    @Transactional(readOnly = true)
    public List<RewardTransactionResponse> getTransactions(UUID userId) {
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        SecurityUtils.assertOwnershipOrAdmin(effectiveUserId);

        List<RewardTransaction> transactions = rewardTransactionRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);
        List<RewardTransactionResponse> responses = new ArrayList<>();
        for (RewardTransaction tx : transactions) {
            RewardTransactionResponse res = new RewardTransactionResponse();
            res.setId(tx.getId());
            if (tx.getAccount() != null) {
                res.setAccountId(tx.getAccount().getId());
            }
            res.setPoints(tx.getPoints());
            res.setTransactionType(tx.getTransactionType());
            res.setSource(tx.getSource());
            res.setReferenceId(tx.getReferenceId());
            res.setDescription(tx.getDescription());
            res.setCreatedAt(tx.getCreatedAt());
            responses.add(res);
        }
        return responses;
    }

    @Transactional
    public RewardTransaction awardPoints(UUID userId, int points, RewardSourceType source, UUID referenceId, String description) {
        if (points <= 0) {
            return null;
        }

        // Idempotency Guard: prevent duplicate rewards for the same workflow event
        if (referenceId != null && source != null) {
            if (rewardTransactionRepository.existsByReferenceIdAndSource(referenceId, source)) {
                List<RewardTransaction> existing = rewardTransactionRepository.findByReferenceIdAndSource(referenceId, source);
                if (!existing.isEmpty()) {
                    return existing.get(0);
                }
            }
        }

        RewardAccount account = getOrCreateAccount(userId);
        account.setBalance(account.getBalance() + points);
        account.setLifetimeEarned(account.getLifetimeEarned() + points);
        account.setUpdatedAt(OffsetDateTime.now());
        rewardAccountRepository.save(account);

        RewardTransaction transaction = new RewardTransaction(
                account,
                points,
                RewardTransactionType.EARNED,
                source,
                referenceId,
                description
        );
        return rewardTransactionRepository.save(transaction);
    }

    @Transactional
    public RedemptionResponse redeemPoints(RedeemRewardRequestDTO dto) {
        UUID effectiveUserId = dto.getUserId() != null ? dto.getUserId() : SecurityUtils.getCurrentUserId();
        SecurityUtils.assertOwnershipOrAdmin(effectiveUserId);
        SecurityUtils.assertActive();

        if (dto.getPoints() == null || dto.getPoints() <= 0) {
            throw new IllegalArgumentException("Points to redeem must be greater than zero.");
        }

        User user = userRepository.findById(effectiveUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + effectiveUserId));

        RewardCatalogItemDTO catalogItem = getCatalog().stream()
                .filter(item -> item.getTitle().equals(dto.getRewardItem()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Reward item is not in the catalog"));
        if (!catalogItem.getPointsCost().equals(dto.getPoints())) {
            throw new IllegalArgumentException("Reward points do not match the catalog price");
        }

        RewardAccount account = rewardAccountRepository.findByUserIdForUpdate(effectiveUserId)
                .orElseGet(() -> getOrCreateAccount(effectiveUserId));
        if (account.getBalance() < dto.getPoints()) {
            throw new IllegalStateException(String.format(
                    "Insufficient points balance (%d available, %d required).",
                    account.getBalance(), dto.getPoints()
            ));
        }

        // Deduct points
        account.setBalance(account.getBalance() - dto.getPoints());
        account.setLifetimeRedeemed(account.getLifetimeRedeemed() + dto.getPoints());
        account.setUpdatedAt(OffsetDateTime.now());
        rewardAccountRepository.save(account);

        // Record Redemption
        Redemption redemption = new Redemption(
                user,
                dto.getRewardItem(),
                dto.getPoints(),
                RedemptionStatusType.FULFILLED,
                dto.getDeliveryNotes() != null ? dto.getDeliveryNotes() : "Instant electronic certificate generated."
        );
        Redemption savedRedemption = redemptionRepository.save(redemption);

        // Record Audit Transaction
        RewardTransaction transaction = new RewardTransaction(
                account,
                dto.getPoints(),
                RewardTransactionType.REDEEMED,
                RewardSourceType.REDEMPTION,
                savedRedemption.getId(),
                "Redeemed reward: " + dto.getRewardItem()
        );
        rewardTransactionRepository.save(transaction);

        RedemptionResponse res = new RedemptionResponse();
        res.setId(savedRedemption.getId());
        res.setUserId(user.getId());
        res.setRewardItem(savedRedemption.getRewardItem());
        res.setPointsUsed(savedRedemption.getPointsUsed());
        res.setStatus(savedRedemption.getStatus());
        res.setFulfillmentNotes(savedRedemption.getFulfillmentNotes());
        res.setCreatedAt(savedRedemption.getCreatedAt());
        return res;
    }

    @Transactional(readOnly = true)
    public List<RedemptionResponse> getRedemptions(UUID userId) {
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        SecurityUtils.assertOwnershipOrAdmin(effectiveUserId);

        List<Redemption> redemptions = redemptionRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);
        List<RedemptionResponse> list = new ArrayList<>();
        for (Redemption r : redemptions) {
            RedemptionResponse res = new RedemptionResponse();
            res.setId(r.getId());
            res.setUserId(r.getUser().getId());
            res.setRewardItem(r.getRewardItem());
            res.setPointsUsed(r.getPointsUsed());
            res.setStatus(r.getStatus());
            res.setFulfillmentNotes(r.getFulfillmentNotes());
            res.setCreatedAt(r.getCreatedAt());
            list.add(res);
        }
        return list;
    }

    public List<RewardCatalogItemDTO> getCatalog() {
        return List.of(
                new RewardCatalogItemDTO(
                        "rw-01",
                        "₹500 Circular Workshop Voucher",
                        "Applicable towards hardware diagnostics, micro-soldering, or parts replacement at any verified VESTIGE craftsman workshop.",
                        200,
                        "REPAIR_CREDIT",
                        "tools",
                        "MOST POPULAR"
                ),
                new RewardCatalogItemDTO(
                        "rw-02",
                        "15% Certified Repair Discount Voucher",
                        "Redeemable for a 15% discount on labor fees for smartphone, laptop, or vintage audio repair bookings.",
                        150,
                        "REPAIR_CREDIT",
                        "shield",
                        "BEST VALUE"
                ),
                new RewardCatalogItemDTO(
                        "rw-03",
                        "Zero-Landfill Tree Planting Certificate",
                        "Plant a certified native tree in an urban afforestation zone, complete with archival digital registration and GPS coordinates.",
                        100,
                        "SUSTAINABILITY",
                        "crest",
                        "ECO-HERO"
                ),
                new RewardCatalogItemDTO(
                        "rw-04",
                        "Eco-Packaging & Device Care Kit",
                        "Archival maintenance bundle including biodegradable anti-static sleeves, precision screw bits, and microfiber cloth.",
                        300,
                        "PHYSICAL_GOOD",
                        "archive",
                        "SPECIAL"
                ),
                new RewardCatalogItemDTO(
                        "rw-05",
                        "₹1,000 Refurbished Device Purchase Credit",
                        "Direct credit towards purchasing certified pre-owned restored laptops or smartphones from registered circular vendors.",
                        450,
                        "DEVICE_CREDIT",
                        "star",
                        "PREMIUM"
                )
        );
    }
}

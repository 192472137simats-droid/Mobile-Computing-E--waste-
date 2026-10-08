package com.vestige.service;

import com.vestige.dto.request.RedeemRewardRequestDTO;
import com.vestige.dto.response.RedemptionResponse;
import com.vestige.model.RewardAccount;
import com.vestige.model.User;
import com.vestige.model.enums.PreferredLanguage;
import com.vestige.model.enums.RewardSourceType;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.RedemptionRepository;
import com.vestige.repository.RewardAccountRepository;
import com.vestige.repository.RewardTransactionRepository;
import com.vestige.repository.UserRepository;
import com.vestige.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock
    private RewardAccountRepository rewardAccountRepository;

    @Mock
    private RewardTransactionRepository rewardTransactionRepository;

    @Mock
    private RedemptionRepository redemptionRepository;

    @Mock
    private UserRepository userRepository;

    private RewardService rewardService;

    private User testUser;
    private RewardAccount testAccount;

    @BeforeEach
    void setUp() {
        rewardService = new RewardService(
                rewardAccountRepository,
                rewardTransactionRepository,
                redemptionRepository,
                userRepository
        );

        testUser = new User("Test Patron", "test@vestige.internal", "pass", "+919999999999", UserRole.USER);
        testUser.setId(UUID.randomUUID());

        testAccount = new RewardAccount(testUser);
        testAccount.setId(UUID.randomUUID());
        testAccount.setBalance(300);
        testAccount.setLifetimeEarned(300);
        testAccount.setLifetimeRedeemed(0);

        UserPrincipal principal = new UserPrincipal(testUser.getId(), testUser.getEmail(), testUser.getFullName(), UserRole.USER, PreferredLanguage.en, true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should successfully award points to user account")
    void testAwardPoints() {
        when(rewardAccountRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testAccount));
        when(rewardAccountRepository.save(any(RewardAccount.class))).thenReturn(testAccount);
        when(rewardTransactionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var tx = rewardService.awardPoints(testUser.getId(), 50, RewardSourceType.RECYCLING_PICKUP, UUID.randomUUID(), "Recycling bonus");

        assertNotNull(tx);
        assertEquals(350, testAccount.getBalance());
        assertEquals(350, testAccount.getLifetimeEarned());
        verify(rewardAccountRepository).save(testAccount);
        verify(rewardTransactionRepository).save(any());
    }

    @Test
    @DisplayName("Should successfully redeem reward when balance is sufficient")
    void testRedeemPointsSuccess() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(rewardAccountRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testAccount));
        when(rewardAccountRepository.save(any(RewardAccount.class))).thenReturn(testAccount);
        when(redemptionRepository.save(any())).thenAnswer(i -> {
            var r = (com.vestige.model.Redemption) i.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        RedeemRewardRequestDTO dto = new RedeemRewardRequestDTO(
                testUser.getId(),
                "₹500 Circular Workshop Voucher",
                200,
                "Workshop code delivery"
        );

        RedemptionResponse res = rewardService.redeemPoints(dto);

        assertNotNull(res);
        assertEquals(100, testAccount.getBalance());
        assertEquals(200, testAccount.getLifetimeRedeemed());
        assertEquals("₹500 Circular Workshop Voucher", res.getRewardItem());
    }

    @Test
    @DisplayName("Should throw exception when points balance is insufficient")
    void testRedeemPointsInsufficient() {
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(rewardAccountRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testAccount));

        RedeemRewardRequestDTO dto = new RedeemRewardRequestDTO(
                testUser.getId(),
                "₹1,000 Refurbished Device Purchase Credit",
                450, // exceeds 300 balance
                "Notes"
        );

        assertThrows(IllegalStateException.class, () -> rewardService.redeemPoints(dto));
    }
}

package com.vestige.repository;

import com.vestige.model.RewardAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RewardAccountRepository extends JpaRepository<RewardAccount, UUID> {
    Optional<RewardAccount> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM RewardAccount a WHERE a.user.id = :userId")
    Optional<RewardAccount> findByUserIdForUpdate(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(a.balance), 0) FROM RewardAccount a")
    Long calculateTotalOutstandingBalance();
}

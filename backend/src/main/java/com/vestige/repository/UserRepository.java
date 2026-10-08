package com.vestige.repository;

import com.vestige.model.User;
import com.vestige.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
    long countByRole(UserRole role);
    long countByRoleAndIsActiveTrue(UserRole role);
    long countByIsActiveTrue();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.createdAt >= :startDate AND u.createdAt <= :endDate")
    long countByRoleAndDateRange(@Param("role") UserRole role,
                                 @Param("startDate") OffsetDateTime startDate,
                                 @Param("endDate") OffsetDateTime endDate);

    List<User> findAllByOrderByCreatedAtDesc();
}

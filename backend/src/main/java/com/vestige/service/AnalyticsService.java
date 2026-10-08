package com.vestige.service;

import com.vestige.dto.analytics.*;
import com.vestige.model.User;
import com.vestige.model.VendorProfile;
import com.vestige.model.enums.*;
import com.vestige.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository userRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final DeviceSubmissionRepository deviceSubmissionRepository;
    private final RepairBookingRepository repairBookingRepository;
    private final RecyclingRequestRepository recyclingRequestRepository;
    private final RewardAccountRepository rewardAccountRepository;
    private final RewardTransactionRepository rewardTransactionRepository;
    private final RedemptionRepository redemptionRepository;

    public AnalyticsService(
            UserRepository userRepository,
            VendorProfileRepository vendorProfileRepository,
            DeviceSubmissionRepository deviceSubmissionRepository,
            RepairBookingRepository repairBookingRepository,
            RecyclingRequestRepository recyclingRequestRepository,
            RewardAccountRepository rewardAccountRepository,
            RewardTransactionRepository rewardTransactionRepository,
            RedemptionRepository redemptionRepository
    ) {
        this.userRepository = userRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.deviceSubmissionRepository = deviceSubmissionRepository;
        this.repairBookingRepository = repairBookingRepository;
        this.recyclingRequestRepository = recyclingRequestRepository;
        this.rewardAccountRepository = rewardAccountRepository;
        this.rewardTransactionRepository = rewardTransactionRepository;
        this.redemptionRepository = redemptionRepository;
    }

    private OffsetDateTime[] resolveDateRange(LocalDate from, LocalDate to) {
        LocalDate end = (to != null) ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate start = (from != null) ? from : end.minusDays(90);

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("The 'from' date must be on or before the 'to' date.");
        }

        OffsetDateTime startOdt = start.atStartOfDay().atOffset(ZoneOffset.UTC);
        OffsetDateTime endOdt = end.atTime(LocalTime.MAX).atOffset(ZoneOffset.UTC);
        return new OffsetDateTime[]{startOdt, endOdt};
    }

    public AdminOverviewDTO getAdminOverview(LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        AdminOverviewDTO dto = new AdminOverviewDTO();
        dto.setTotalUsers(userRepository.countByRole(UserRole.USER));
        dto.setActiveUsers(userRepository.countByRoleAndIsActiveTrue(UserRole.USER));
        dto.setTotalVendors(vendorProfileRepository.count());
        dto.setVerifiedVendors(vendorProfileRepository.countByVerificationStatus(VendorVerificationStatus.VERIFIED));

        long submissions = deviceSubmissionRepository.countByCreatedAtBetween(start, end);
        long repairRecs = deviceSubmissionRepository.countByEngineRecommendationAndCreatedAtBetween(EngineRecommendationType.REPAIR, start, end);
        long recycleRecs = deviceSubmissionRepository.countByEngineRecommendationAndCreatedAtBetween(EngineRecommendationType.RECYCLE, start, end);
        dto.setTotalSubmissions(submissions);
        dto.setRepairRecommendations(repairRecs);
        dto.setRecycleRecommendations(recycleRecs);

        long completedRepairs = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.COMPLETED, start, end);
        long totalRepairs = repairBookingRepository.countByCreatedAtBetween(start, end);
        long pendingRepairs = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.PENDING, start, end);
        long eligibleRepairs = totalRepairs - pendingRepairs;
        double repairRate = eligibleRepairs > 0 ? ((double) completedRepairs / eligibleRepairs) * 100.0 : 0.0;
        dto.setCompletedRepairs(completedRepairs);
        dto.setRepairCompletionRate(Math.round(repairRate * 10.0) / 10.0);

        long completedRecycling = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.COMPLETED, start, end);
        long totalRecycling = recyclingRequestRepository.countByCreatedAtBetween(start, end);
        long pendingRecycling = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.PENDING, start, end);
        long eligibleRecycling = totalRecycling - pendingRecycling;
        double recyclingRate = eligibleRecycling > 0 ? ((double) completedRecycling / eligibleRecycling) * 100.0 : 0.0;
        dto.setCompletedRecycling(completedRecycling);
        dto.setRecyclingCompletionRate(Math.round(recyclingRate * 10.0) / 10.0);

        dto.setTotalPointsIssued(rewardTransactionRepository.sumPointsByTypeAndCreatedAtBetween(RewardTransactionType.EARNED, start, end));
        dto.setTotalPointsRedeemed(rewardTransactionRepository.sumPointsByTypeAndCreatedAtBetween(RewardTransactionType.REDEEMED, start, end));
        dto.setOutstandingPointsBalance(rewardAccountRepository.calculateTotalOutstandingBalance());

        // Build 6-period monthly activity overview
        dto.setActivityOverTime(buildActivityTimeline(start, end, null, null));
        return dto;
    }

    public DeviceAnalyticsDTO getAdminDeviceAnalytics(LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        DeviceAnalyticsDTO dto = new DeviceAnalyticsDTO();
        long total = deviceSubmissionRepository.countByCreatedAtBetween(start, end);
        dto.setTotalSubmissions(total);
        dto.setRepairCount(deviceSubmissionRepository.countByEngineRecommendationAndCreatedAtBetween(EngineRecommendationType.REPAIR, start, end));
        dto.setRecycleCount(deviceSubmissionRepository.countByEngineRecommendationAndCreatedAtBetween(EngineRecommendationType.RECYCLE, start, end));

        Double avgScore = deviceSubmissionRepository.calculateAverageEngineScore(start, end);
        dto.setAverageRepairabilityScore(avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0.0);

        // Category distribution
        List<Object[]> cats = deviceSubmissionRepository.countGroupedByCategory(start, end);
        List<DistributionItem> catItems = new ArrayList<>();
        for (Object[] row : cats) {
            String key = row[0].toString();
            long count = ((Number) row[1]).longValue();
            double pct = total > 0 ? ((double) count / total) * 100.0 : 0.0;
            catItems.add(new DistributionItem(key, key, count, Math.round(pct * 10.0) / 10.0));
        }
        dto.setCategoryDistribution(catItems);

        // Condition distribution
        List<Object[]> conds = deviceSubmissionRepository.countGroupedByCondition(start, end);
        List<DistributionItem> condItems = new ArrayList<>();
        for (Object[] row : conds) {
            String key = row[0].toString();
            long count = ((Number) row[1]).longValue();
            double pct = total > 0 ? ((double) count / total) * 100.0 : 0.0;
            condItems.add(new DistributionItem(key, key, count, Math.round(pct * 10.0) / 10.0));
        }
        dto.setConditionDistribution(condItems);

        // Brand distribution (top 8)
        List<Object[]> brands = deviceSubmissionRepository.countGroupedByBrand(start, end);
        List<DistributionItem> brandItems = new ArrayList<>();
        int countLimit = 0;
        for (Object[] row : brands) {
            if (countLimit++ >= 8) break;
            String brandName = (row[0] != null) ? capitalize(row[0].toString()) : "Unknown";
            long count = ((Number) row[1]).longValue();
            double pct = total > 0 ? ((double) count / total) * 100.0 : 0.0;
            brandItems.add(new DistributionItem(brandName, brandName, count, Math.round(pct * 10.0) / 10.0));
        }
        dto.setBrandDistribution(brandItems);

        // Confidence distribution
        List<Object[]> confs = deviceSubmissionRepository.countGroupedByConfidence(start, end);
        List<DistributionItem> confItems = new ArrayList<>();
        for (Object[] row : confs) {
            if (row[0] != null) {
                String key = row[0].toString();
                long count = ((Number) row[1]).longValue();
                double pct = total > 0 ? ((double) count / total) * 100.0 : 0.0;
                confItems.add(new DistributionItem(key, key, count, Math.round(pct * 10.0) / 10.0));
            }
        }
        dto.setConfidenceDistribution(confItems);

        dto.setSubmissionsOverTime(buildActivityTimeline(start, end, "SUBMISSIONS", null));
        return dto;
    }

    public RepairAnalyticsDTO getAdminRepairAnalytics(LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        RepairAnalyticsDTO dto = new RepairAnalyticsDTO();
        long total = repairBookingRepository.countByCreatedAtBetween(start, end);
        dto.setTotalBookings(total);

        long pending = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.PENDING, start, end);
        long accepted = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.ACCEPTED, start, end);
        long inProgress = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.IN_PROGRESS, start, end);
        long completed = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.COMPLETED, start, end);
        long cancelled = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.CANCELLED, start, end);
        long rejected = repairBookingRepository.countByStatusAndCreatedAtBetween(BookingStatusType.REJECTED, start, end);

        dto.setPendingCount(pending);
        dto.setAcceptedCount(accepted);
        dto.setInProgressCount(inProgress);
        dto.setCompletedCount(completed);
        dto.setCancelledCount(cancelled);
        dto.setRejectedCount(rejected);

        long eligible = total - pending;
        double compRate = eligible > 0 ? ((double) completed / eligible) * 100.0 : 0.0;
        dto.setCompletionRate(Math.round(compRate * 10.0) / 10.0);

        List<Object[]> costStats = repairBookingRepository.calculateAverageRepairCostAndSampleSize(start, end);
        if (!costStats.isEmpty() && costStats.get(0)[0] != null) {
            dto.setAverageEstimatedCost(Math.round(((Number) costStats.get(0)[0]).doubleValue() * 100.0) / 100.0);
            dto.setCostSampleSize(((Number) costStats.get(0)[1]).longValue());
        }

        List<DistributionItem> statusDist = new ArrayList<>();
        statusDist.add(new DistributionItem("COMPLETED", "Completed", completed, total > 0 ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("IN_PROGRESS", "In Progress", inProgress, total > 0 ? Math.round(((double) inProgress / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("ACCEPTED", "Accepted", accepted, total > 0 ? Math.round(((double) accepted / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("PENDING", "Pending", pending, total > 0 ? Math.round(((double) pending / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("CANCELLED", "Cancelled", cancelled, total > 0 ? Math.round(((double) cancelled / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("REJECTED", "Rejected", rejected, total > 0 ? Math.round(((double) rejected / total) * 1000.0) / 10.0 : 0.0));
        dto.setStatusDistribution(statusDist);

        dto.setRepairsOverTime(buildActivityTimeline(start, end, "REPAIRS", null));
        return dto;
    }

    public RecyclingAnalyticsDTO getAdminRecyclingAnalytics(LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        RecyclingAnalyticsDTO dto = new RecyclingAnalyticsDTO();
        long total = recyclingRequestRepository.countByCreatedAtBetween(start, end);
        dto.setTotalRequests(total);
        dto.setTotalDevicesRecycled(recyclingRequestRepository.sumCompletedDeviceCount(start, end));

        long pending = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.PENDING, start, end);
        long accepted = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.ACCEPTED, start, end);
        long scheduled = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.SCHEDULED, start, end);
        long completed = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.COMPLETED, start, end);
        long cancelled = recyclingRequestRepository.countByStatusAndCreatedAtBetween(RecyclingStatusType.CANCELLED, start, end);

        dto.setPendingCount(pending);
        dto.setAcceptedCount(accepted);
        dto.setScheduledCount(scheduled);
        dto.setCompletedCount(completed);
        dto.setCancelledCount(cancelled);

        long eligible = total - pending;
        double compRate = eligible > 0 ? ((double) completed / eligible) * 100.0 : 0.0;
        dto.setCompletionRate(Math.round(compRate * 10.0) / 10.0);

        List<DistributionItem> statusDist = new ArrayList<>();
        statusDist.add(new DistributionItem("COMPLETED", "Completed", completed, total > 0 ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("SCHEDULED", "Scheduled", scheduled, total > 0 ? Math.round(((double) scheduled / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("ACCEPTED", "Accepted", accepted, total > 0 ? Math.round(((double) accepted / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("PENDING", "Pending", pending, total > 0 ? Math.round(((double) pending / total) * 1000.0) / 10.0 : 0.0));
        statusDist.add(new DistributionItem("CANCELLED", "Cancelled", cancelled, total > 0 ? Math.round(((double) cancelled / total) * 1000.0) / 10.0 : 0.0));
        dto.setStatusDistribution(statusDist);

        dto.setCollectionsOverTime(buildActivityTimeline(start, end, "RECYCLING", null));
        return dto;
    }

    public RewardAnalyticsDTO getAdminRewardAnalytics(LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        RewardAnalyticsDTO dto = new RewardAnalyticsDTO();
        dto.setTotalPointsIssued(rewardTransactionRepository.sumPointsByTypeAndCreatedAtBetween(RewardTransactionType.EARNED, start, end));
        dto.setTotalPointsRedeemed(rewardTransactionRepository.sumPointsByTypeAndCreatedAtBetween(RewardTransactionType.REDEEMED, start, end));
        dto.setOutstandingBalance(rewardAccountRepository.calculateTotalOutstandingBalance());
        dto.setTotalTransactionsCount(rewardTransactionRepository.countByCreatedAtBetween(start, end));
        dto.setTotalRedemptionsCount(redemptionRepository.countByCreatedAtBetween(start, end));

        List<Object[]> sources = rewardTransactionRepository.sumEarnedPointsGroupedBySource(start, end);
        List<DistributionItem> sourceDist = new ArrayList<>();
        long totalIssued = dto.getTotalPointsIssued();
        for (Object[] row : sources) {
            String srcKey = row[0].toString();
            long pts = ((Number) row[1]).longValue();
            double pct = totalIssued > 0 ? ((double) pts / totalIssued) * 100.0 : 0.0;
            sourceDist.add(new DistributionItem(srcKey, srcKey.replace('_', ' '), pts, Math.round(pct * 10.0) / 10.0));
        }
        dto.setPointsBySource(sourceDist);
        dto.setIssuanceOverTime(buildActivityTimeline(start, end, "REWARDS", null));
        return dto;
    }

    public List<VendorWorkloadSummaryDTO> getAdminVendorWorkload(LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        List<VendorProfile> vendors = vendorProfileRepository.findAll();
        List<VendorWorkloadSummaryDTO> summaryList = new ArrayList<>();

        for (VendorProfile v : vendors) {
            long totalRepairs = repairBookingRepository.countByVendorAndCreatedAtBetween(v, start, end);
            long completedRepairs = repairBookingRepository.countByVendorAndStatusAndCreatedAtBetween(v, BookingStatusType.COMPLETED, start, end);
            double repairRate = totalRepairs > 0 ? ((double) completedRepairs / totalRepairs) * 100.0 : 0.0;

            long totalRecycling = recyclingRequestRepository.countByVendorAndCreatedAtBetween(v, start, end);
            long completedRecycling = recyclingRequestRepository.countByVendorAndStatusAndCreatedAtBetween(v, RecyclingStatusType.COMPLETED, start, end);
            double recyclingRate = totalRecycling > 0 ? ((double) completedRecycling / totalRecycling) * 100.0 : 0.0;

            summaryList.add(new VendorWorkloadSummaryDTO(
                    v.getId(),
                    v.getBusinessName(),
                    v.getVerificationStatus().name(),
                    totalRepairs,
                    completedRepairs,
                    Math.round(repairRate * 10.0) / 10.0,
                    totalRecycling,
                    completedRecycling,
                    Math.round(recyclingRate * 10.0) / 10.0
            ));
        }
        return summaryList;
    }

    public VendorAnalyticsDTO getVendorAnalytics(UUID vendorId, LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        VendorProfile vendor = vendorProfileRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("VendorProfile not found for ID: " + vendorId));

        VendorAnalyticsDTO dto = new VendorAnalyticsDTO();
        dto.setBusinessName(vendor.getBusinessName());
        dto.setVerificationStatus(vendor.getVerificationStatus().name());

        long totalRepairs = repairBookingRepository.countByVendorAndCreatedAtBetween(vendor, start, end);
        long completedRepairs = repairBookingRepository.countByVendorAndStatusAndCreatedAtBetween(vendor, BookingStatusType.COMPLETED, start, end);
        long activeRepairs = repairBookingRepository.countByVendorAndStatusAndCreatedAtBetween(vendor, BookingStatusType.IN_PROGRESS, start, end)
                + repairBookingRepository.countByVendorAndStatusAndCreatedAtBetween(vendor, BookingStatusType.ACCEPTED, start, end);
        double repairRate = totalRepairs > 0 ? ((double) completedRepairs / totalRepairs) * 100.0 : 0.0;

        dto.setAssignedRepairs(totalRepairs);
        dto.setCompletedRepairs(completedRepairs);
        dto.setActiveRepairs(activeRepairs);
        dto.setRepairCompletionRate(Math.round(repairRate * 10.0) / 10.0);

        long totalRecycling = recyclingRequestRepository.countByVendorAndCreatedAtBetween(vendor, start, end);
        long completedRecycling = recyclingRequestRepository.countByVendorAndStatusAndCreatedAtBetween(vendor, RecyclingStatusType.COMPLETED, start, end);
        long activeRecycling = recyclingRequestRepository.countByVendorAndStatusAndCreatedAtBetween(vendor, RecyclingStatusType.SCHEDULED, start, end)
                + recyclingRequestRepository.countByVendorAndStatusAndCreatedAtBetween(vendor, RecyclingStatusType.ACCEPTED, start, end);
        double recyclingRate = totalRecycling > 0 ? ((double) completedRecycling / totalRecycling) * 100.0 : 0.0;

        dto.setAssignedRecycling(totalRecycling);
        dto.setCompletedRecycling(completedRecycling);
        dto.setActiveRecycling(activeRecycling);
        dto.setRecyclingCompletionRate(Math.round(recyclingRate * 10.0) / 10.0);

        List<Object[]> statusCounts = repairBookingRepository.countGroupedByStatusForVendor(vendor, start, end);
        List<DistributionItem> statusDist = new ArrayList<>();
        for (Object[] row : statusCounts) {
            String key = row[0].toString();
            long count = ((Number) row[1]).longValue();
            double pct = totalRepairs > 0 ? ((double) count / totalRepairs) * 100.0 : 0.0;
            statusDist.add(new DistributionItem(key, key, count, Math.round(pct * 10.0) / 10.0));
        }
        dto.setRepairStatusDistribution(statusDist);
        dto.setMonthlyActivity(buildActivityTimeline(start, end, "VENDOR_ACTIVITY", vendor));
        return dto;
    }

    public UserAnalyticsDTO getUserAnalytics(UUID userId, LocalDate from, LocalDate to) {
        OffsetDateTime[] range = resolveDateRange(from, to);
        OffsetDateTime start = range[0];
        OffsetDateTime end = range[1];

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found for ID: " + userId));

        UserAnalyticsDTO dto = new UserAnalyticsDTO();
        dto.setTotalSubmissions(deviceSubmissionRepository.countByUserAndCreatedAtBetween(user, start, end));
        dto.setRepairRecommendations(deviceSubmissionRepository.countByUserAndEngineRecommendationAndCreatedAtBetween(user, EngineRecommendationType.REPAIR, start, end));
        dto.setRecycleRecommendations(deviceSubmissionRepository.countByUserAndEngineRecommendationAndCreatedAtBetween(user, EngineRecommendationType.RECYCLE, start, end));

        dto.setTotalRepairsBooked(repairBookingRepository.countByUserAndCreatedAtBetween(user, start, end));
        dto.setCompletedRepairs(repairBookingRepository.countByUserAndStatusAndCreatedAtBetween(user, BookingStatusType.COMPLETED, start, end));

        dto.setTotalRecyclingRequests(recyclingRequestRepository.countByUserAndCreatedAtBetween(user, start, end));
        dto.setCompletedRecycling(recyclingRequestRepository.countByUserAndStatusAndCreatedAtBetween(user, RecyclingStatusType.COMPLETED, start, end));
        dto.setTotalDevicesRecycled(recyclingRequestRepository.sumCompletedDeviceCountForUser(user, start, end));

        rewardAccountRepository.findByUserId(userId).ifPresent(acc -> {
            dto.setCurrentPointsBalance(acc.getBalance() != null ? acc.getBalance().longValue() : 0L);
            dto.setLifetimePointsEarned(acc.getLifetimeEarned() != null ? acc.getLifetimeEarned().longValue() : 0L);
            dto.setLifetimePointsRedeemed(acc.getLifetimeRedeemed() != null ? acc.getLifetimeRedeemed().longValue() : 0L);
        });

        dto.setPersonalActivityTimeline(buildActivityTimeline(start, end, "USER_TIMELINE", user));
        return dto;
    }

    private List<TimeSeriesDataPoint> buildActivityTimeline(OffsetDateTime start, OffsetDateTime end, String type, Object context) {
        List<TimeSeriesDataPoint> points = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        LocalDate sDate = start.toLocalDate().withDayOfMonth(1);
        LocalDate eDate = end.toLocalDate().withDayOfMonth(1);

        LocalDate current = sDate;
        while (!current.isAfter(eDate)) {
            OffsetDateTime pStart = current.atStartOfDay().atOffset(ZoneOffset.UTC);
            OffsetDateTime pEnd = current.plusMonths(1).atStartOfDay().minusNanos(1).atOffset(ZoneOffset.UTC);
            String label = current.format(fmt);

            long count = 0;
            if (type == null) {
                // Platform total activity count
                count = deviceSubmissionRepository.countByCreatedAtBetween(pStart, pEnd)
                        + repairBookingRepository.countByCreatedAtBetween(pStart, pEnd)
                        + recyclingRequestRepository.countByCreatedAtBetween(pStart, pEnd);
            } else if ("SUBMISSIONS".equals(type)) {
                count = deviceSubmissionRepository.countByCreatedAtBetween(pStart, pEnd);
            } else if ("REPAIRS".equals(type)) {
                count = repairBookingRepository.countByCreatedAtBetween(pStart, pEnd);
            } else if ("RECYCLING".equals(type)) {
                count = recyclingRequestRepository.countByCreatedAtBetween(pStart, pEnd);
            } else if ("REWARDS".equals(type)) {
                count = rewardTransactionRepository.countByCreatedAtBetween(pStart, pEnd);
            } else if ("VENDOR_ACTIVITY".equals(type) && context instanceof VendorProfile v) {
                count = repairBookingRepository.countByVendorAndCreatedAtBetween(v, pStart, pEnd)
                        + recyclingRequestRepository.countByVendorAndCreatedAtBetween(v, pStart, pEnd);
            } else if ("USER_TIMELINE".equals(type) && context instanceof User u) {
                count = deviceSubmissionRepository.countByUserAndCreatedAtBetween(u, pStart, pEnd)
                        + repairBookingRepository.countByUserAndCreatedAtBetween(u, pStart, pEnd)
                        + recyclingRequestRepository.countByUserAndCreatedAtBetween(u, pStart, pEnd);
            }

            points.add(new TimeSeriesDataPoint(label, count));
            current = current.plusMonths(1);
        }
        return points;
    }

    private String capitalize(String text) {
        if (text == null || text.isBlank()) return text;
        return Character.toUpperCase(text.charAt(0)) + text.substring(1).toLowerCase();
    }
}

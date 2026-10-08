package com.vestige.service;

import com.vestige.dto.request.DeviceAssessmentRequest;
import com.vestige.dto.response.DeviceAssessmentResponse;
import com.vestige.engine.AssessmentResult;
import com.vestige.engine.DecisionEngineService;
import com.vestige.model.DeviceSubmission;
import com.vestige.model.User;
import com.vestige.model.enums.UserRole;
import com.vestige.repository.DeviceSubmissionRepository;
import com.vestige.repository.UserRepository;
import com.vestige.security.SecurityUtils;
import com.vestige.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceSubmissionService {

    private final DeviceSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final DecisionEngineService decisionEngineService;

    public DeviceSubmissionService(
            DeviceSubmissionRepository submissionRepository,
            UserRepository userRepository,
            DecisionEngineService decisionEngineService
    ) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.decisionEngineService = decisionEngineService;
    }

    @Transactional
    public DeviceAssessmentResponse submitAssessment(DeviceAssessmentRequest req) {
        SecurityUtils.assertActive();
        UserPrincipal principal = SecurityUtils.requireCurrentUser();
        UUID userId = principal.getRole() == UserRole.ADMIN && req.getUserId() != null
                ? req.getUserId() : principal.getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Run Decision Engine evaluation
        AssessmentResult result = decisionEngineService.evaluate(
                req.getDeviceType(),
                req.getDeviceAgeYears() != null ? req.getDeviceAgeYears() : 1,
                req.getCondition(),
                req.getEstimatedRepairCost(),
                req.getOriginalValue(),
                req.getPartAvailability(),
                req.getKnownIssues()
        );

        DeviceSubmission sub = new DeviceSubmission();
        sub.setUser(user);
        sub.setDeviceType(req.getDeviceType());
        sub.setBrand(req.getBrand());
        sub.setModel(req.getModel());
        sub.setDeviceAgeYears(req.getDeviceAgeYears());
        sub.setCondition(req.getCondition());
        sub.setKnownIssues(req.getKnownIssues() != null ? req.getKnownIssues() : new ArrayList<>());
        sub.setEstimatedRepairCost(req.getEstimatedRepairCost());
        sub.setOriginalValue(req.getOriginalValue());
        sub.setPartAvailability(req.getPartAvailability());
        sub.setEngineScore(result.score());
        sub.setEngineRecommendation(result.recommendation());
        sub.setEngineConfidence(result.confidence());
        sub.setEngineRationale(result.rationale());

        return mapToResponse(submissionRepository.save(sub));
    }

    @Transactional(readOnly = true)
    public DeviceAssessmentResponse getById(UUID id) {
        DeviceSubmission sub = submissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Device submission not found: " + id));

        if (sub.getUser() != null) {
            SecurityUtils.assertOwnershipOrAdmin(sub.getUser().getId());
        }

        return mapToResponse(sub);
    }

    @Transactional(readOnly = true)
    public List<DeviceAssessmentResponse> getByUserId(UUID userId) {
        SecurityUtils.assertOwnershipOrAdmin(userId);

        List<DeviceSubmission> list = submissionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<DeviceAssessmentResponse> responses = new ArrayList<>();
        for (DeviceSubmission sub : list) {
            responses.add(mapToResponse(sub));
        }
        return responses;
    }

    private DeviceAssessmentResponse mapToResponse(DeviceSubmission sub) {
        DeviceAssessmentResponse res = new DeviceAssessmentResponse();
        res.setId(sub.getId());
        if (sub.getUser() != null) {
            res.setUserId(sub.getUser().getId());
        }
        res.setDeviceType(sub.getDeviceType());
        res.setBrand(sub.getBrand());
        res.setModel(sub.getModel());
        res.setDeviceAgeYears(sub.getDeviceAgeYears());
        res.setCondition(sub.getCondition());
        res.setKnownIssues(sub.getKnownIssues());
        res.setEstimatedRepairCost(sub.getEstimatedRepairCost());
        res.setOriginalValue(sub.getOriginalValue());
        res.setPartAvailability(sub.getPartAvailability());
        res.setEngineScore(sub.getEngineScore());
        res.setEngineRecommendation(sub.getEngineRecommendation());
        res.setEngineConfidence(sub.getEngineConfidence());
        res.setEngineRationale(sub.getEngineRationale());
        res.setCreatedAt(sub.getCreatedAt());
        return res;
    }
}

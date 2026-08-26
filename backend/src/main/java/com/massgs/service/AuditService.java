package com.massgs.service;

import com.massgs.entity.AuditLog;
import com.massgs.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(Long userId, String actionType, String entityName, Long entityId, String payloadJson) {
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .actionType(actionType)
                .entityName(entityName)
                .entityId(entityId)
                .payloadJson(payloadJson)
                .build();
        auditLogRepository.save(auditLog);
    }
}

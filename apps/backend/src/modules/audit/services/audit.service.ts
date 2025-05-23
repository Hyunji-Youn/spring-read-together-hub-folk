import { prisma } from '../../../config/database';
import { Prisma } from '@prisma/client';

// AuditLogs 타입 인터페이스 정의
interface AuditLog {
  audit_id: number;
  event_type: string;
  user_id: number;
  target_id?: number;
  details?: string;
  created_at: Date;
  user?: {
    username: string;
    name: string;
  };
}

/**
 * Audit event types
 */
export enum AuditEventType {
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  USER_CREATED = 'USER_CREATED',
  USER_DELETED = 'USER_DELETED',
  REGISTRATION_ATTEMPT = 'REGISTRATION_ATTEMPT',
  REGISTRATION_FAILURE = 'REGISTRATION_FAILURE',
  REGISTRATION_ATTEMPT_BLOCKED = 'REGISTRATION_ATTEMPT_BLOCKED',
  EMAIL_SEND_FAILURE = 'EMAIL_SEND_FAILURE',
  ACCOUNT_APPROVED = 'ACCOUNT_APPROVED',
  ACCOUNT_REJECTED = 'ACCOUNT_REJECTED',
}

/**
 * Create audit log entry
 * 
 * @param eventType - Type of audit event
 * @param userId - User ID who performed the action
 * @param targetId - Target entity ID (if applicable)
 * @param details - Additional event details
 * @returns Promise with created audit log or null on error
 */
export const createAuditLog = async (
  eventType: AuditEventType,
  userId: number,
  targetId?: number,
  details?: Record<string, any>
): Promise<AuditLog | null> => {
  try {
    // 테이블이 없을 수 있으므로, 직접 SQL을 사용하는 대신 로깅만 수행
    console.log('Audit log event:', {
      eventType,
      userId,
      targetId,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date().toISOString()
    });
    
    // 개발 환경에서는 실제 데이터베이스 작업 건너뛰기
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // 프로덕션 환경에서는 실제 저장 시도
    try {
      // Prisma 타입을 우회하여 정확한 모델명으로 접근 (타입 캐스팅 사용)
      const prismaAny = prisma as any;
      
      // 테이블 존재 여부 확인 없이 바로 시도
      const result = await prismaAny.auditLogs.create({
    data: {
      event_type: eventType,
      user_id: userId,
      target_id: targetId,
          details: details ? JSON.stringify(details) : null,
      created_at: new Date(),
    }
  });
      
      return result;
    } catch (dbError) {
      // 데이터베이스 오류 발생 시 로그만 남기고 계속 진행
      console.warn('Failed to write to audit logs database:', dbError);
      return null;
    }
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // 감사 로그 생성 실패해도 애플리케이션 기능은 계속 동작하도록 함
    return null;
  }
};

/**
 * Get audit logs with optional filtering
 * 
 * @param filter - Filter options
 * @returns Promise with audit logs and pagination info
 */
export const getAuditLogs = async (filter?: {
  eventType?: AuditEventType;
  userId?: number;
  targetId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: AuditLog[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  }
}> => {
  try {
  const { eventType, userId, targetId, startDate, endDate, limit = 50, offset = 0 } = filter || {};
  
    // 테이블이 없을 수 있으므로 안전하게 처리
    try {
      // Prisma 타입을 우회하여 정확한 모델명으로 접근 (타입 캐스팅 사용)
      const prismaAny = prisma as any;
      
      // 쿼리 최적화를 위한 where 조건 구성
  const where: any = {};
  
      // 조건부 필터 적용 (성능 최적화)
  if (eventType) {
    where.event_type = eventType;
  }
  
  if (userId) {
    where.user_id = userId;
  }
  
  if (targetId) {
    where.target_id = targetId;
  }
  
      // 날짜 필터 최적화
  if (startDate || endDate) {
    where.created_at = {};
    
    if (startDate) {
      where.created_at.gte = startDate;
    }
    
    if (endDate) {
      where.created_at.lte = endDate;
    }
  }
  
      // 캐시 성능 최적화를 위해 카운트 쿼리와 데이터 쿼리를 병렬로 실행
      const [totalCount, logs] = await Promise.all([
        // 총 레코드 수 카운트 (필요한 경우)
        prismaAny.auditLogs.count({ where }),
        
        // 실제 데이터 쿼리
        prismaAny.auditLogs.findMany({
    where,
    orderBy: {
      created_at: 'desc',
    },
    skip: offset,
    take: limit,
          // 연관 데이터 최적화 로딩 (N+1 문제 방지)
    include: {
      user: {
        select: {
          username: true,
          name: true,
        },
      },
    },
        })
      ]);
      
      // 결과와 메타데이터 반환
      return {
        logs,
        pagination: {
          total: totalCount,
          offset,
          limit,
          hasMore: offset + logs.length < totalCount
        }
      };
    } catch (dbError) {
      console.warn('Failed to query audit logs database:', dbError);
      // 데이터베이스 오류 발생 시 빈 결과 반환
      return {
        logs: [],
        pagination: {
          total: 0,
          offset: 0,
          limit: 0,
          hasMore: false
        }
      };
    }
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    // 조회 실패 시 빈 결과 반환
    return {
      logs: [],
      pagination: {
        total: 0,
        offset: 0,
        limit: 0,
        hasMore: false
      }
    };
  }
}; 
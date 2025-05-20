import { PrismaClient } from '@prisma/client';

// Prisma 로깅 설정
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
  });
};

// 전역 타입 선언
type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// 싱글톤 패턴으로 PrismaClient 인스턴스 관리
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// 싱글톤 인스턴스 생성 또는 재사용
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 데이터베이스 연결 테스트 함수
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
} 
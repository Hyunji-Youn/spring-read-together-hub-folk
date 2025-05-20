module.exports = {
  apps : [{
    name   : "spring-backend", // PM2에서 사용할 앱 이름 (원하는 이름으로 변경 가능)
    script : "./dist/index.js", // TypeScript 빌드 후 생성되는 주 실행 파일 경로
    // instances : "max", // CPU 코어 수만큼 인스턴스 실행 (클러스터 모드)
    // exec_mode : "cluster",
    watch: false, // 프로덕션에서는 보통 false 또는 특정 경로만 감시
    max_memory_restart: '1G', // 메모리 제한 초과 시 자동 재시작
    env_production: { // NODE_ENV=production 환경에서 적용될 변수들
       NODE_ENV: "production",
    }
  }]
} 
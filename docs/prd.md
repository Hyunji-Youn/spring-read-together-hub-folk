# 영어 원서 읽기 동아리 Spring 홈페이지 PRD

## 1. 개요 (Introduction)

### 1.1 TL;DR
본 문서는 영어 원서 읽기 동아리 Spring을 위한 홈페이지 구축 프로젝트의 요구사항 정의서입니다.  
핵심 목표는 동아리 활동 정보의 비대칭 해소, 회원 참여도 향상, 운영 및 관리 업무의 자동화입니다.  
커뮤니티 기능, 자료 공유, 일정 관리를 중심으로 개발됩니다.

### 1.2 문제 정의 (Problem Statement)
- 비공식 채널(카톡, 메신저 등)에 정보가 파편화되어 있어 혼란 발생
- 신규 회원 적응 어려움
- 운영진의 과도한 수동 업무 부담
- 회원 참여도 저하

### 1.3 목표 (Goals)
#### 비즈니스 목표
- 운영 자동화로 관리 효율성 30% 이상 증가
- 정보 체계화로 신규 회원 적응도 증가

#### 사용자 목표
- 모든 활동 정보를 한 플랫폼에서 쉽게 확인
- 자유로운 소통과 소속감 증진
- 자신이 참여한 활동 기록 조회

#### 비목표 (Non-Goals)
- 실시간 채팅, 결제 시스템, 푸시 알림
- 비밀번호 변경/찾기 기능
- 고도화된 권한 시스템 (4단계 적용)

---

## 2. 사용자 (Users)

| 사용자 그룹       | 주요 권한 및 기능 요약                                          |
|------------------|-------------------------------------------------------------|
| 동아리 회원       | 대부분의 기능 이용 가능 (게시판, 자료실, 일정 확인 등)               |
| 잠재 회원         | 공개 정보(소개 페이지 등)만 열람 가능                             |
| 사서 (Librarian) | 일정 등록/수정/삭제 가능. 회원 삭제 권한 있음                       |
| 관리자 (Admin)   | 전체 기능 제어 가능 (회원 관리, 콘텐츠 관리, 사서 계정 관리 등, 회원 삭제 권한만 없음)       |

---

## 3. 사용자 경험 (UX Flow)

### 3.1 회원 가입 및 승인
1. 잠재 회원이 가입 신청 양식 작성 후 제출
2. 관리자는 관리자 페이지에서 승인/반려
3. 승인 시 로그인 가능 상태 부여

### 3.2 일정 관리
1. 관리자/사서 로그인 후 일정 추가
2. 상세 정보 입력 → 저장
3. 일반 회원은 일정 열람만 가능

### 3.3 자료 공유
1. 로그인 후 자료 업로드 or 게시글 작성
2. 파일 첨부 및 저장
3. 목록 검색, 열람, 다운로드 가능

### 3.4 수다방
1. 짧은 글 작성 후 등록
2. 댓글 작성 가능
3. 본인 글/댓글 수정·삭제 가능
4. UI는 채팅 창처럼 리스트에서 모든 글 확인 가능

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 회원 관리
- 가입 신청 양식 (이름, ID, 비밀번호, 이메일, 휴대폰 번호 필수, 가입 암호 'test123test123', 사서/일반회원 구분)
- 관리자 승인/반려 기능(사서/일반회원 모두)
- 로그인 후 자신의 정보 수정 기능(관리자와 회원 본인만 수정 가능, 가입 암호 변경 불가)
- 회원 목록 및 실명(ID) 표시

### 4.2 콘텐츠 관리
- 소개 페이지(동아리 소개, 읽은 책 리스트, 표지, 사진)
- 게시판 (자유게시판, 독서후기 등의 목적)
- 자료실 (문서, 이미지, 동영상 각각 따로 제작)
- 공지사항 및 중요 정보 게시

### 4.3 캘린더 및 일정 관리
- 월/주/일별 보기 캘린더
- 일정 등록/수정/삭제 (관리자/사서)
- 일정 상세 정보 팝업

### 4.4 소통 기능
- 회원 연락망 조회
- 회원 가입 신청 시 관리자에게 이메일 발신 기능
- 수다방 (3줄 제한, 댓글 포함)

### 4.5 관리자 기능
- 관리자 페이지 전용 로그인
- 회원/콘텐츠/일정 관리 기능
- 관리자 아이디/암호는 'admin/admin'

---

## 5. 비기능 요구사항

### 5.1 Secure JWT Implementation
- Token Signing: Use strong algorithms (RS256) with properly secured keys
- Limited Claims: Include only necessary information in the payload
- Short Expiration: Set short expiration times and implement refresh tokens
- Secure Storage: Store Refresh Tokens in httpOnly, Secure cookies with `SameSite=Strict` (or `Lax`) attribute. Access Tokens should be stored in JavaScript memory (e.g., variables) and not in LocalStorage or SessionStorage due to XSS vulnerability.
- Token Validation: Verify signature, expiration, and claims on every request

### 5.2 Password Management
- Use a strong, modern hashing algorithm designed specifically for passwords: Argon2id
- Salt Management:  Always use a unique salt for each password 
- Let the hashing library handle salt generation and storage 

### 5.3 Secure Login Endpoint Implementation.
- HTTPS Only: Enforce HTTPS for all authentication traffic  
- CSRF Protection: Implement anti-CSRF tokens for login forms  
- Same-Site Cookies: Use SameSite=Lax or Strict for cookies  
- Secure and HttpOnly Flags: Set these flags on authentication cookies  
- Content Security Policy: Implement CSP headers to prevent XSS attacks

### 5.4 Types of Rate Limiting 
- Fixed Window Limiting: 5 per minute

### 5.5 페이지 로딩 성능 
- 페이지 로딩 시간: 주요 페이지 2초 이내

---

## 6. 사용자 내러티브 (User Narrative)

> "신입들이 뭘 해야 할지 몰라요. 회장님은 다 수동으로 관리하고 있고요. 이 웹사이트가 있다면 소개 페이지로 쉽게 이해하고, 가입 신청도 가능하고, 자료랑 사진도 한눈에 보일 거예요. 수다방에서 질문하고, 자료실에서 필요한 것 찾아보면 더 편하고 즐거운 동아리 활동이 될 거예요!"

---

## 7. 성공 지표 (Success Metrics)

| 항목                | 목표 수치                        |
|---------------------|-------------------------------|
| 일정 등록 활성도      | 월 2건 이상                    |
| 수다방 활성도        | 주 7건 이상 (일 1회)            |
| 게시판 활성도        | 월 신규 글 20건 이상              |
| 소개 페이지 체류 시간 | 평균 2분 이상                    |

---

## 8. 기술 고려사항 (Technical Considerations)

- **권한 관리**: 4단계 권한 (관리자-Admin, 사서-Librarian, 동아리 회원, 잠재 회원) - Node.js 백엔드에서 RBAC(Role-Based Access Control) 패턴을 적용합니다. 사용자 인증 시 발급되는 JWT에 역할(role) 정보를 포함하고, 각 API 엔드포인트 접근 시 해당 역할을 확인하는 미들웨어를 구현합니다. 서비스 계층에서도 보조적으로 권한 검사를 수행할 수 있습니다.
- **파일 업로드**: 최대 동영상 500MB 제한 - 기본적으로 Supabase Storage를 활용합니다. Node.js 백엔드는 파일 메타데이터 관리 및 Supabase Storage 접근을 위한 인증 토큰/URL 생성을 담당합니다. 대안으로, `multer` 라이브러리를 사용하여 Node.js 서버가 직접 파일을 받아 AWS S3, Google Cloud Storage 등 외부 클라우드 스토리지에 업로드하는 방식도 고려할 수 있으나, 초기에는 Supabase Storage의 편의성을 활용합니다.
- **반응형 웹**: 다양한 기기 대응 (프론트엔드 담당).
- **이메일 발송**: 고정 관리자 주소 사용(`00@gmail.com`) - Node.js 백엔드에서 `nodemailer` 라이브러리와 외부 SMTP 서비스(예: SendGrid, AWS SES, Resend 등)를 연동하여 가입 신청 알림 등의 이메일을 발송합니다.

- **프론트엔드 기술 스택 (Frontend Technical Stack)**:
    - **Framework**: React - 컴포넌트 기반 UI 개발 및 풍부한 생태계 활용.
    - **Language**: TypeScript - 정적 타입 지원으로 코드 안정성 및 개발 효율성 증대.
    - **UI Components**: shadcn/ui (Radix UI 기반) - 접근성을 고려한 고품질 UI 컴포넌트 라이브러리.
    - **Styling**: Tailwind CSS - Utility-first CSS 프레임워크로 빠른 UI 개발 지원.
    - **Routing**: React Router DOM - SPA(Single Page Application) 라우팅 관리.
    - **State Management/Data Fetching**: TanStack React Query - 서버 상태 관리, 캐싱, 백그라운드 업데이트 등 API 데이터 연동 최적화.
    - **Form Handling**: React Hook Form, Zod (유효성 검사) - 폼 상태 관리 및 스키마 기반 유효성 검증.
    - **Date Handling**: date-fns, React Day Picker - 날짜/시간 처리 및 달력 UI.
    - **Charts**: Recharts - 데이터 시각화.
    - **Carousel**: Embla Carousel React - 이미지/콘텐츠 슬라이더.
    - **Toasts/Notifications**: Sonner - 사용자 알림.
    - **Icons**: Lucide React - 아이콘 라이브러리.
    - **Build Tool**: Vite - 빠른 개발 서버 및 프로덕션 빌드.
    - **Linting/Formatting**: ESLint, Prettier (ESLint와 통합) - 코드 스타일 일관성 유지.
    - **Other Key Libraries**: `class-variance-authority`, `clsx`, `cmdk`, `input-otp`, `next-themes`, `react-resizable-panels`, `tailwind-merge`, `tailwindcss-animate`, `vaul`.
    - **(자료실 기능 확장 시 고려)**: PDF 뷰어, 비디오 플레이어 등 특정 파일 형식 처리를 위한 라이브러리 (필요시 도입 검토).

- **백엔드 기술 스택 (Backend Technical Stack - Node.js & Express.js 중심)**:
    - **런타임 환경 (Runtime Environment)**: Node.js (최신 LTS 버전 권장) - 비동기 I/O 처리 성능 및 JavaScript 생태계 활용.
    - **웹 프레임워크 (Web Framework)**: Express.js - 가볍고 유연한 Node.js 웹 애플리케이션 프레임워크.
    - **언어 (Language)**: TypeScript - 코드 안정성, 가독성 및 유지보수성 향상. (컴파일러: `tsc`, 개발 시 실행: `ts-node-dev` 또는 `Nodemon` + `tsc-watch`).
    - **데이터베이스 (Database)**: Supabase (PostgreSQL) - 관계형 데이터베이스. Node.js 서버가 PostgreSQL DB로 직접 연결하여 사용합니다. Supabase 플랫폼에서 제공하는 암호화(at rest, in transit) 및 백업/복구 기능을 활용합니다. (Supabase의 BaaS 기능 중 인증, Edge Functions 등은 직접 사용하지 않음).
    - **ORM (Object-Relational Mapper)**: Prisma - 타입 안전성을 제공하는 차세대 ORM. 스키마 관리, 마이그레이션, 쿼리 빌더 기능 활용. (대안: Sequelize).
    - **인증 (Authentication)**: Passport.js (`passport-jwt` 전략) - JWT(JSON Web Token) 기반 인증 구현.
        - **JWT Signing Algorithm**: **RS256** (비대칭 키 암호화 방식) 사용을 원칙으로 하며, 공개키/비밀키 쌍의 안전한 관리가 필수입니다. (PRD 5.1 Token Signing 준수)
        - **Token Types**:
            - **Access Token**: 짧은 만료 시간(예: 15분 ~ 1시간)을 가지며, API 접근 권한 부여에 사용됩니다. 페이로드에는 최소한의 클레임(예: `userId`, `role`)만 포함합니다. (PRD 5.1 Limited Claims, Short Expiration 준수). **클라이언트 측 JavaScript 메모리(예: 변수)에 저장되며, 페이지 새로고침 등으로 메모리에서 소실될 경우 Refresh Token을 사용하여 재발급받습니다. XSS 공격에 취약할 수 있는 LocalStorage 또는 SessionStorage에는 저장하지 않습니다.**
            - **Refresh Token**: 긴 만료 시간(예: 7일 ~ 30일)을 가지며, Access Token 재발급에만 사용됩니다. Refresh Token은 탈취 시 위험을 줄이기 위해 1회용으로 사용 후 재발급하거나, 특정 기준에 따라 무효화하는 전략을 고려합니다.
        - **Token Storage**:
            - Access Token은 상기 "Token Types"에서 명시한 대로 JavaScript 메모리에 저장 후, API 요청 시 HTTP 헤더(Authorization: Bearer TOKEN)에 담아 전송합니다.
            - Refresh Token은 **`httpOnly`, `Secure` 쿠키**에 저장하여 JavaScript에서의 접근을 차단하고, CSRF 공격 방지를 위해 `SameSite=Strict` (또는 `Lax`) 속성을 설정합니다. (PRD 5.1 Secure Storage 및 사용자 요청 사항 준수)
        - **Token Issuance & Validation**: 로그인 성공 시 Access Token와 Refresh Token을 발급합니다. 모든 보호된 API 요청 시 Access Token의 서명, 만료 시간, 클레임을 검증하는 미들웨어를 통과해야 합니다. (PRD 5.1 Token Validation 준수)
    - **API 스타일**: RESTful API - 명확한 자원 기반의 URL 구조와 표준 HTTP 메소드 사용.
    - **데이터 유효성 검사 (Data Validation)**: Zod - 스키마 기반 데이터 유효성 검사 라이브러리. API 요청 본문(body), 파라미터(params), 쿼리(query) 등의 유효성을 검증하여 서비스 안정성 확보.
    - **보안 (Security)**:
        - **JWT 보안 강화**: (상기 "인증" 섹션의 JWT 관련 내용과 PRD 5.1 Secure JWT Implementation 지침을 철저히 준수합니다.)
            - 키 관리: RS256 사용 시 키 유출 방지를 위한 엄격한 관리 절차 수립.
            - HTTPS 강제: 모든 JWT 통신은 HTTPS를 통해 이루어지도록 강제합니다. (PRD 5.3 HTTPS Only 준수)
        - 비밀번호 해싱: **Argon2id** - 강력한 최신 비밀번호 해싱 알고리즘. (PRD 5.2 Password Management 준수)
        - CORS (Cross-Origin Resource Sharing): `cors` 미들웨어를 사용하여 특정 또는 모든 출처의 요청 허용/차단.
        - HTTP 헤더 보안: `helmet` 미들웨어를 사용하여 일반적인 웹 취약점으로부터 애플리케이션 보호.
        - SQL Injection 방지: Prisma와 같은 ORM 사용 시 Prepared Statements를 통해 기본적으로 방지.
        - API Rate Limiting: `express-rate-limit` 미들웨어를 사용하여 특정 IP 또는 사용자의 과도한 요청 제한 (PRD 5.4 항목 대응).
        - 환경 변수 보안: 민감한 정보(DB 접속 정보, API 키 등)는 `.env` 파일을 통해 관리하고, 프로덕션 환경에서는 플랫폼 환경 변수 사용.
    - **파일 처리 (File Handling - 서버 직접 업로드 시)**: `multer` 미들웨어 - Supabase Storage를 사용하지 않고 서버가 직접 파일 업로드를 처리할 경우 사용. (본 프로젝트에서는 Supabase Storage 우선 활용).
    - **개발 및 운영 도구 (Development & Operations Tools)**:
        - **패키지 매니저 (Package Manager)**: npm 또는 yarn - 의존성 관리.
        - **버전 관리 (Version Control)**: Git - 소스 코드 형상 관리.
        - **프로세스 매니저 (Process Manager - 프로덕션)**: PM2 - Node.js 애플리케이션의 무중단 서비스, 클러스터링, 모니터링 지원.
    - **테스팅 (Testing)**:
        - **프레임워크**: Jest - 통합 테스팅 프레임워크 (단위, 통합, E2E 테스트 지원).
        - **HTTP 요청 테스트 (통합 테스트)**: Supertest - Express.js API 엔드포인트 테스트.
        - **모킹 (Mocking)**: Jest Mocks - 의존성 모의 처리.
    - **로깅 (Logging)**:
        - Winston 또는 Pino - 유연한 설정이 가능한 로깅 라이브러리. 파일 및 콘솔 로깅, 로그 레벨(info, error, debug 등) 관리.
        - 프로덕션 환경: 외부 로깅 서비스 (예: Sentry, Logtail/Better Stack, AWS CloudWatch Logs) 연동하여 중앙 집중식 로그 수집 및 분석 고려.
    - **환경 변수 관리**: `dotenv` 라이브러리 (개발 환경), OS 환경 변수 또는 클라우드 플랫폼 환경 변수 (스테이징/프로덕션).
    - **API 문서화**: Swagger (OpenAPI Specification) - `swagger-ui-express`, `tsoa` (TypeScript 기반 코드에서 OpenAPI 명세 자동 생성) 또는 `NestJS` 프레임워크 내장 기능 활용 고려 (Express.js 직접 사용 시 `tsoa` 또는 주석 기반 `swagger-jsdoc` 등 검토).
    - **실시간 기능 고려**: "수다방" UI가 채팅창과 유사하나 "실시간 채팅"은 비목표임. 초기에는 REST API와 프론트엔드의 주기적 폴링으로 구현. 향후 더 즉각적인 업데이트가 필요할 경우 WebSocket (`socket.io`, `ws`) 또는 Server-Sent Events (SSE) 도입을 "11. 향후 고려사항"에 추가 검토.

- **배포 전략**:
    - **프론트엔드**: Vercel, 정적 사이트 호스팅 플랫폼 
    - **백엔드 (Node.js/Express.js)**: 직접 서버 호스팅.
    - **데이터베이스 (Supabase PostgreSQL)**: Supabase 클라우드 플랫폼 (기존 사용) - Node.js 백엔드에서 직접 연결.
    - **스토리지 (Supabase Storage)**: Supabase 클라우드 플랫폼 (기존 사용) - Node.js 백엔드를 통해 접근 제어.

### 8.1 통합 프로젝트 폴더 구조 (Integrated Project Folder Structure)

본 프로젝트는 프론트엔드와 Node.js 백엔드를 명확히 구분하는 모노레포 (`pnpm workspaces`, `yarn workspaces`, `Turborepo`, `Lerna` 등 활용) 또는 개별 레포지토리 구성을 고려합니다. 다음은 가독성 및 관심사 분리를 고려한 모노레포 내 일반적인 폴더 구조 예시입니다.

```
/spring-read-together-hub/  (Project Root)
├── apps/
│   ├── frontend/            # React/Vite 기반 프론트엔드 애플리케이션
│   │   ├── public/          # 정적 에셋 (favicon, robots.txt 등)
│   │   ├── src/             # 프론트엔드 소스 코드
│   │   │   ├── App.tsx      # 메인 애플리케이션 컴포넌트
│   │   │   ├── main.tsx     # 애플리케이션 진입점 (DOM 렌더링)
│   │   │   ├── assets/      # 이미지, 폰트 등 내부 에셋
│   │   │   ├── components/  # 공통/재사용 UI 컴포넌트
│   │   │   │   ├── auth/
│   │   │   │   ├── board/
│   │   │   │   ├── common/
│   │   │   │   └── layout/    # 페이지 레이아웃 컴포넌트 (Header, Footer, Sidebar 등)
│   │   │   ├── config/      # API URL, 환경 변수 등 프론트엔드 설정
│   │   │   ├── hooks/       # 커스텀 React Hooks
│   │   │   ├── lib/         # 외부 라이브러리 설정, 유틸리티 함수 (axios 인스턴스 등)
│   │   │   ├── pages/       # 라우트별 페이지 레벨 컴포넌트
│   │   │   ├── services/    # API 호출 함수 모듈 (TanStack Query 연동)
│   │   │   ├── store/       # 전역 상태 관리 (예: Zustand, Jotai - 필요시)
│   │   │   ├── styles/      # 전역 CSS, Tailwind CSS 설정 파일 (tailwind.config.js, index.css 등)
│   │   │   └── types/       # 프론트엔드 공용 TypeScript 타입 정의
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── backend/             # Node.js/Express.js 기반 백엔드 애플리케이션
│       ├── src/
│       │   ├── app.ts       # Express 애플리케이션 생성 및 미들웨어 설정, 서버 시작 로직
│       │   ├── config/      # 환경 변수 로드, 데이터베이스 연결 설정, 로거 설정 등
│       │   ├── common/      # 여러 모듈에서 공통으로 사용되는 유틸리티, 상수, 타입 등
│       │   ├── modules/     # 기능별 모듈 디렉토리 (DDD 스타일 접근 시 도메인별 구성)
│       │   │   ├── auth/      # 인증 관련 (controllers, services, routes, DTOs, middlewares)
│       │   │   ├── users/     # 사용자 관리 관련
│       │   │   ├── posts/     # 게시글(게시판, 공지사항 등) 관련
│       │   │   ├── materials/ # 자료실 관련
│       │   │   ├── schedules/ # 일정 관리 관련
│       │   │   └── ... (기능별 추가 모듈)
│       │   ├── middlewares/ # 전역 또는 특정 라우트에 적용되는 Express 미들웨어 (예: 에러 핸들러, 요청 로거)
│       │   ├── jobs/        # (선택적) 스케줄링된 작업 또는 백그라운드 작업 로직 (`node-cron` 등 활용)
│       │   └── swagger.ts   # (선택적) Swagger/OpenAPI 설정 파일 (tsoa, swagger-jsdoc 사용 시)
│       ├── prisma/          # Prisma ORM 사용 시 스키마 파일(schema.prisma), 마이그레이션, 시딩 스크립트
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── tests/           # 백엔드 테스트 코드를 단위(unit), 통합(integration), 종단간(E2E) 테스트로 구분하여 관리합니다.
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example     # 환경 변수 예시 파일
├── packages/
│   └── shared-types/      # (선택적, 모노레포) 프론트엔드-백엔드 간 공유 TypeScript 타입
│       ├── src/
│       └── package.json
├── .gitignore
├── README.md
└── package.json             # (루트 package.json: 워크스페이스 관리용)
```

**폴더 구조 설명 (백엔드 중심)**:
- **`apps/backend/src/`**: 백엔드 핵심 소스 코드.
    - `app.ts`: Express 앱 인스턴스 생성, 전역 미들웨어 설정, 라우터 연결, 서버 리스닝 시작.
    - `config/`: 환경 변수(`dotenv`), 데이터베이스 연결(ORM 초기화), 로거 설정 등 애플리케이션 설정 파일.
    - `common/`: 여러 모듈에서 재사용될 수 있는 유틸리티 함수, 상수, 공통 타입/인터페이스, 기본 에러 클래스 등.
    - `modules/`: 애플리케이션의 주요 기능을 도메인 또는 기능별로 분리한 모듈 디렉터리. 각 모듈은 자체적으로 `controllers`, `services`, `routes`, `dto` (Data Transfer Objects), `middlewares` 등을 가질 수 있어 응집도를 높이고 결합도를 낮춥니다. (예: `auth`, `users`, `posts` 등)
    - `middlewares/`: 전역적으로 사용되거나 여러 라우트에서 공통으로 사용될 미들웨어 (예: 전역 에러 핸들러, 404 핸들러, 상세 요청 로거).
    - `jobs/`: (선택 사항) `node-cron` 등을 사용하여 주기적으로 실행되어야 하는 작업(예: 데이터 정리, 알림 발송) 로직.
    - `swagger.ts`: (선택 사항) API 문서 자동 생성을 위한 Swagger/OpenAPI 관련 설정.
- **`apps/backend/prisma/`**: Prisma ORM을 사용할 경우, 데이터베이스 스키마 정의 파일(`schema.prisma`), 마이그레이션 실행 결과, 데이터 시딩(seeding) 스크립트가 위치합니다. (다른 ORM 사용 시 해당 ORM의 마이그레이션/스키마 관리 방식에 따름)
- **`apps/backend/tests/`**: 백엔드 테스트 코드를 단위(unit), 통합(integration), 종단간(E2E) 테스트로 구분하여 관리합니다.
- **`packages/shared-types/`**: (모노레포 활용 시 선택 사항) 프론트엔드와 백엔드 간에 공유되어야 하는 TypeScript 타입이나 인터페이스를 관리하여 타입 일관성을 유지합니다.

---

## 9. 개발 마일스톤 (Milestones & Sequencing)

1. **요구사항 확정 및 설계** (1주)
2. **회원 관리 기능 개발** (2주)
3. **콘텐츠 관리 기능 개발** (3주)
4. **일정 관리 기능 개발** (4주)
5. **소통 기능 개발** (5주)
6. **관리자 기능 및 통합 테스트** (6주)
7. **베타 테스트 및 운영 개시** (7주)

---

## 10. 제약사항 (Constraints)

- 비밀번호 변경 불가(test123test123으로 고정)
- 관리자 이메일 주소 고정
- 사용자명은 `실명 (아이디)` 형식
- 수다방 글자 수 제한 (3줄)
- 회원 탈퇴 기능 없음

---

## 11. 향후 고려사항 (Future Considerations)

- 비밀번호 찾기, 탈퇴 절차 개선
- 일정/공지 알림 기능
- 댓글 고도화 (대댓글, 수정 이력 등)
- 통합 검색 기능
- 회원별 활동 기록 기능
- 모바일 앱 개발
# 영어 원서 읽기 동아리 "Spring" 홈페이지

## Project Overview

본 프로젝트는 영어 원서 읽기 동아리 "Spring"을 위한 홈페이지를 구축합니다.
핵심 목표는 동아리 활동 정보의 비대칭 해소, 회원 참여도 향상, 운영 및 관리 업무의 자동화입니다.
주요 기능으로는 커뮤니티 기능, 자료 공유, 일정 관리가 있습니다.

### 핵심 목표
- 운영 자동화로 관리 효율성 30% 이상 증가
- 정보 체계화로 신규 회원 적응도 증가
- 모든 활동 정보를 한 플랫폼에서 쉽게 확인
- 자유로운 소통과 소속감 증진
- 자신이 참여한 활동 기록 조회

### 주요 기능
- 회원 관리 (가입 신청, 승인/반려, 정보 수정)
- 콘텐츠 관리 (소개 페이지, 게시판, 자료실, 공지사항)
- 캘린더 및 일정 관리 (월/주/일별 보기)
- 소통 기능 (회원 연락망, 수다방)
- 관리자 기능 (회원/콘텐츠/일정 관리)

## Project info

**URL**: https://lovable.dev/projects/449f5f3a-555b-4b34-b83b-ef37d4d7111b

## Shared Types

This project uses a shared types package to maintain consistency between frontend and backend.

### Installing Shared Types

When you update the shared types, run:

```bash
# Linux/WSL
./scripts/install-shared-types.sh

# Windows
scripts\install-shared-types.bat

# Or using npm scripts
npm run install:shared-types
```

### Development Setup

1. Install dependencies for all packages:
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd apps/backend
   npm install
   
   # Install shared types dependencies
   cd ../../shared/types
   npm install
   ```

2. Install shared types:
   ```bash
   # From root directory
   npm run install:shared-types
   ```

3. Start development servers:
   ```bash
   # Frontend (from root)
   npm run dev
   
   # Backend (from apps/backend)
   npm run dev
   ```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/449f5f3a-555b-4b34-b83b-ef37d4d7111b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Install shared types.
npm run install:shared-types

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with a modern technology stack for both frontend and backend.

**Frontend Technical Stack:**

- **Framework**: React - 컴포넌트 기반 UI 개발 및 풍부한 생태계 활용
- **Language**: TypeScript - 정적 타입 지원으로 코드 안정성 및 개발 효율성 증대
- **UI Components**: shadcn/ui (Radix UI 기반) - 접근성을 고려한 고품질 UI 컴포넌트 라이브러리
- **Styling**: Tailwind CSS - Utility-first CSS 프레임워크로 빠른 UI 개발 지원
- **Routing**: React Router DOM - SPA(Single Page Application) 라우팅 관리
- **State Management/Data Fetching**: TanStack React Query - 서버 상태 관리, 캐싱, 백그라운드 업데이트 등 API 데이터 연동 최적화
- **Form Handling**: React Hook Form, Zod (유효성 검사) - 폼 상태 관리 및 스키마 기반 유효성 검증
- **Date Handling**: date-fns, React Day Picker - 날짜/시간 처리 및 달력 UI
- **Charts**: Recharts - 데이터 시각화
- **Carousel**: Embla Carousel React - 이미지/콘텐츠 슬라이더
- **Toasts/Notifications**: Sonner - 사용자 알림
- **Icons**: Lucide React - 아이콘 라이브러리
- **Build Tool**: Vite - 빠른 개발 서버 및 프로덕션 빌드
- **Linting/Formatting**: ESLint, Prettier - 코드 스타일 일관성 유지
- **Other Key Libraries**: `class-variance-authority`, `clsx`, `cmdk`, `input-otp`, `next-themes`, `react-resizable-panels`, `tailwind-merge`, `tailwindcss-animate`, `vaul`

**Backend Technical Stack (Node.js & Express.js 중심):**

- **Runtime Environment**: Node.js (최신 LTS 버전 권장) - 비동기 I/O 처리 성능 및 JavaScript 생태계 활용
- **Web Framework**: Express.js - 가볍고 유연한 Node.js 웹 애플리케이션 프레임워크
- **Language**: TypeScript - 코드 안정성, 가독성 및 유지보수성 향상
- **Database**: Supabase (PostgreSQL) - 관계형 데이터베이스
- **ORM**: Prisma - 타입 안전성을 제공하는 차세대 ORM
- **Authentication**: Passport.js (`passport-jwt` 전략) - JWT 기반 인증 구현
  - RS256 알고리즘 사용
  - Access Token (15분~1시간)과 Refresh Token (7일~30일) 구현
  - httpOnly, Secure 쿠키 사용
- **API Style**: RESTful API - 명확한 자원 기반의 URL 구조와 표준 HTTP 메소드 사용
- **Data Validation**: Zod - 스키마 기반 데이터 유효성 검사
- **Security**:
  - `helmet` - 일반적인 웹 취약점 방지
  - `cors` - Cross-Origin Resource Sharing 설정
  - Argon2id - 비밀번호 해싱
  - `express-rate-limit` - API 요청 제한
- **Package Manager**: npm or yarn
- **Version Control**: Git
- **Process Manager (Production)**: PM2 - Node.js 애플리케이션의 무중단 서비스, 클러스터링, 모니터링 지원
- **Testing**: Jest, Supertest - 통합 테스팅 프레임워크
- **Logging**: Winston or Pino - 유연한 설정이 가능한 로깅 라이브러리
- **Environment Variable Management**: `dotenv`

## How can I deploy this project?

**Frontend Deployment:**
- Vercel 또는 정적 사이트 호스팅 플랫폼

**Backend (Node.js/Express.js) Deployment:**
- 직접 서버 호스팅 (예: AWS EC2, DigitalOcean Droplet, Heroku)

**Database (Supabase PostgreSQL):**
- Supabase 클라우드 플랫폼 (Node.js 백엔드에서 직접 연결)

**Storage (Supabase Storage):**
- Supabase 클라우드 플랫폼 (Node.js 백엔드를 통해 접근 제어)

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Folder Structure

The project follows a monorepo structure (or can be individual repositories) to clearly separate frontend and backend concerns.

```
/spring-read-together-hub/  (Project Root)
├── apps/
│   ├── frontend/            # React/Vite based frontend application
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── config/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── styles/
│   │   │   └── types/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   └── backend/             # Node.js/Express.js based backend application
│       ├── src/
│       │   ├── app.ts
│       │   ├── config/
│       │   ├── common/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── posts/
│       │   │   ├── materials/
│       │   │   └── schedules/
│       │   ├── middlewares/
│       │   ├── jobs/        # Optional for scheduled tasks
│       │   └── swagger.ts   # Optional for API documentation
│       ├── prisma/
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
├── packages/
│   └── shared-types/      # Optional: Shared TypeScript types (for monorepo)
│       ├── src/
│       └── package.json
├── .gitignore
├── README.md
└── package.json             # Root package.json for workspace management
```

## 제약사항 (Constraints)

- 비밀번호 변경 불가 (test123으로 고정)
- 관리자 이메일 주소 고정
- 사용자명은 `실명 (아이디)` 형식
- 수다방 글자 수 제한 (3줄)
- 회원 탈퇴 기능 없음

## 향후 고려사항 (Future Considerations)

- 비밀번호 찾기, 탈퇴 절차 개선
- 일정/공지 알림 기능
- 댓글 고도화 (대댓글, 수정 이력 등)
- 통합 검색 기능
- 회원별 활동 기록 기능
- 모바일 앱 개발

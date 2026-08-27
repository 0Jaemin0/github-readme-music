# readme.fm

YouTube 링크로 GitHub README용 음악 카드를 만드는 서비스입니다.

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 검증

```bash
npm run lint
npm run typecheck
npm run build
```

## 기술 스택

- Next.js (App Router) / TypeScript
- Tailwind CSS / shadcn/ui
- Noto Sans KR

## 폴더 구조

```text
src/
├── app/                                  # Next.js 라우트와 전역 레이아웃
├── components/
│   ├── ThemeToggle.tsx                    # 여러 기능에서 쓸 수 있는 공용 컴포넌트
│   └── ui/                                # shadcn/ui가 관리하는 프리미티브
├── features/
│   └── card-generator/
│       ├── components/                    # 카드 생성 기능 전용 UI
│       ├── hooks/                         # 카드 생성 화면의 상태·이벤트 조합
│       ├── lib/                           # 순수 변환·검증 유틸
│       ├── mocks/                         # API 연결 전의 목업 데이터
│       └── model/                         # 타입과 UI 선택지
└── lib/                                   # 기능에 종속되지 않는 공용 유틸
```

## 파일·코드 분리 기준

- Next.js 예약 파일은 프레임워크 규칙을 따른다. 예: `page.tsx`, `layout.tsx`
- 서비스·기능 컴포넌트 파일은 PascalCase를 사용한다. 예: `CardGenerator.tsx`
- shadcn/ui 컴포넌트는 CLI 호환성을 위해 kebab-case를 유지한다. 예: `button.tsx`
- 화면 상태와 사용자 이벤트 조합은 기능 내부 Hook으로 분리한다.
- API 또는 목업 데이터와 무관하게 동작하는 변환·검증 로직은 `lib`에 둔다.
- 실제 API 연결 전 데이터는 `mocks`에 두고, 이후 서버 구현으로 교체한다.
- 여러 기능에서 재사용되는 코드만 `src/components` 또는 `src/lib`로 올린다.

# github-readme-music

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

## 카드 미리 보기

<a href="https://www.youtube.com/watch?v=NI5rV1SII_0" target="_blank" rel="noopener noreferrer"><img src="https://github-readme-music.vercel.app/card/NI5rV1SII_0.svg?style=player&title=%EA%B9%80%EC%8A%B9%EB%AF%BC+-+%EB%AF%B8%EC%B3%A4%EB%8B%A4%EA%B3%A0+%ED%95%B4+%7C+MW+HAUS&artist=%EA%B9%80%EC%8A%B9%EB%AF%BC&duration=3%3A25&cover=https%3A%2F%2Fi.ytimg.com%2Fvi%2FNI5rV1SII_0%2Fmaxresdefault.jpg&coverX=50&coverY=50&coverScale=100&coverRatio=1.7777777777777777&waveform=51%2C35%2C47%2C79%2C35%2C69&tw=220.96250915527344&aw=35.88750076293945&pbx=55.33749961853027&pby=98&pbw=265.1499996185303&pbh=6&bg=0a0a0a&border=262626&text=fafafa&muted=a3a3a3&accent=fafafa&gradient=0&bw=0&r=22&progress=0" alt="김승민 - 미쳤다고 해 | MW HAUS — 김승민" width="380" /></a>

<a href="https://www.youtube.com/watch?v=NI5rV1SII_0" target="_blank" rel="noopener noreferrer"><img src="https://github-readme-music.vercel.app/card/NI5rV1SII_0.svg?style=compact&title=%EA%B9%80%EC%8A%B9%EB%AF%BC+-+%EB%AF%B8%EC%B3%A4%EB%8B%A4%EA%B3%A0+%ED%95%B4+%7C+MW+HAUS&artist=%EA%B9%80%EC%8A%B9%EB%AF%BC&duration=3%3A25&cover=https%3A%2F%2Fi.ytimg.com%2Fvi%2FNI5rV1SII_0%2Fmaxresdefault.jpg&coverX=50&coverY=50&coverScale=100&coverRatio=1.7777777777777777&waveform=51%2C35%2C47%2C79%2C35%2C69&tw=180.96250915527344&aw=35.88750076293945&pbx=55.33749961853027&pby=98&pbw=265.1499996185303&pbh=6&bg=0a0a0a&border=262626&text=fafafa&muted=a3a3a3&accent=fafafa&gradient=0&bw=0&r=22&progress=0" alt="김승민 - 미쳤다고 해 | MW HAUS — 김승민" width="460" /></a>

<a href="https://www.youtube.com/watch?v=NI5rV1SII_0" target="_blank" rel="noopener noreferrer"><img src="https://github-readme-music.vercel.app/card/NI5rV1SII_0.svg?style=vertical&title=%EA%B9%80%EC%8A%B9%EB%AF%BC+-+%EB%AF%B8%EC%B3%A4%EB%8B%A4%EA%B3%A0+%ED%95%B4+%7C+MW+HAUS&artist=%EA%B9%80%EC%8A%B9%EB%AF%BC&duration=3%3A25&cover=https%3A%2F%2Fi.ytimg.com%2Fvi%2FNI5rV1SII_0%2Fmaxresdefault.jpg&coverX=50&coverY=50&coverScale=100&coverRatio=1.7777777777777777&waveform=51%2C35%2C47%2C79%2C35%2C69&tw=220.96250915527344&aw=35.88750076293945&pbx=55.33749961853027&pby=98&pbw=265.1499996185303&pbh=6&bg=0a0a0a&border=262626&text=fafafa&muted=a3a3a3&accent=fafafa&gradient=0&bw=0&r=22&progress=0" alt="김승민 - 미쳤다고 해 | MW HAUS — 김승민" width="260" /></a>

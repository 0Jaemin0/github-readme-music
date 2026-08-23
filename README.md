# readme.fm

YouTube 링크로 GitHub README에 넣을 음악 카드를 만드는 서비스입니다.

## 시작하기

의존성을 설치합니다.

```bash
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 검사

```bash
npm run lint
npm run typecheck
npm run build
```

## 기술 스택

- Next.js (App Router) / TypeScript
- Tailwind CSS
- shadcn/ui / Lucide Icons
- ESLint / TypeScript

## 폴더 구조

```text
src/
├── app/          # App Router의 페이지·레이아웃
├── components/
│   └── ui/       # shadcn/ui로 관리하는 공용 프리미티브
└── lib/          # 공용 유틸리티
```

기능별 코드, 훅, 타입은 실제 기능을 만들 때 해당 기능의 범위 안에서 추가합니다. 아직 확정되지 않은 구조나 빈 폴더는 미리 만들지 않습니다.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

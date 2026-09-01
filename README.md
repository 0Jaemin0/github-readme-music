# github-readme-music

YouTube 링크 하나로 GitHub 프로필 README에 나를 표현할 음악 카드를 만드는 서비스입니다.

[서비스 이용하기](https://github-readme-music.vercel.app)

## 프로젝트 소개

GitHub 프로필 README는 개발자 자신을 소개하는 공간입니다. github-readme-music은 좋아하는 음악 한 곡을 카드로 만들어, 프로필에 조금 더 개인적인 분위기와 취향을 담을 수 있게 합니다.

YouTube 영상 링크를 입력하면 제목, 채널명, 재생 시간, 썸네일을 바탕으로 카드를 만들고, 완성된 삽입 코드를 바로 README에 사용할 수 있습니다.

## 주요 기능

- YouTube 영상 메타데이터 자동 조회
- 일반형·가로형·세로형 음악 카드 제공
- 색상, 그라데이션, 테두리, 앨범 커버 크롭, 재생 위치 커스터마이즈
- GitHub README에 바로 넣을 수 있는 SVG 카드와 삽입 코드 생성
- 카드 클릭 시 설정한 시간의 YouTube 영상으로 이동

## 서비스 이용 방법

1. [github-readme-music](https://github-readme-music.vercel.app)에 YouTube 영상 링크를 입력합니다.
2. 원하는 카드 형태와 디자인을 선택합니다.
3. `README 삽입 코드`를 복사합니다.
4. GitHub 프로필 저장소의 `README.md`에 붙여 넣고 커밋합니다.

생성된 카드는 SVG로 제공되며, GitHub README에서도 앨범 커버가 보이도록 처리됩니다.

## 기술 스택

Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · YouTube Data API v3 · Vercel

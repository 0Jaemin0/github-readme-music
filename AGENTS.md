# Project Agent Rules

`AGENTS.md`는 readme.fm의 에이전트 작업 규칙을 찾는 진입점이다. 세부 정책은 `docs/agents`에, 반복 작업의 실행 절차는 `.agents/skills`에 둔다.

readme.fm은 YouTube 링크로 GitHub README용 음악 카드를 만드는 서비스다. 제품·UI·기술 스택이 바뀔 수 있는 초기 단계이므로, 현재 요구사항과 확정된 결정만 기준으로 작업한다.

## 작업 라우팅

| 작업 | 실행 절차 | 정책과 판단 기준 |
| --- | --- | --- |
| GitHub 이슈, 브랜치, 커밋, PR, 리뷰 대응 | `.agents/skills/github-workflow/SKILL.md` | `docs/agents/github.md` |
| PR 리뷰 및 리뷰 코멘트 후보 작성 | `.agents/skills/pr-review/SKILL.md` | `docs/agents/pr-review.md` |
| 트러블슈팅·기술 문서의 초안과 저장 | `.agents/skills/tech-documentation/SKILL.md` | `docs/agents/troubleshooting.md` 또는 `docs/agents/tech-note.md` |
| 프론트엔드·백엔드 관점이 함께 필요한 기능 개발 | `.agents/skills/multi-agent-orchestration/SKILL.md` | `docs/agents/multi-agent.md` |

여러 작업 성격이 겹치면 관련 Skill과 정책 문서를 함께 확인한다. 정책·정의는 `docs/agents`를 단일 기준으로 삼고, Skill에는 실행 절차만 둔다.

## 적용 우선순위

1. 사용자의 현재 요청
2. `AGENTS.md`
3. 해당 작업의 `SKILL.md`
4. 해당 작업의 `docs/agents/*.md`

## 공통 원칙

- 요청 범위를 벗어난 의존성 추가, 구조 변경, 리팩터링은 하지 않는다.
- 확정되지 않은 제품 정책·서버 계약·기술 선택은 임의로 정하지 않고 필요한 정보를 확인한다.
- 기존 사용자 변경사항과 작업 범위 밖 파일은 되돌리거나 커밋하지 않는다.
- API 키, Supabase 서비스 역할 키, 개인 식별 정보는 코드·문서·커밋에 포함하지 않는다.
- 새 환경변수는 실제 도입 시 `.env.example`에 키 이름과 설명만 추가한다.
- YouTube API 응답과 사용자 입력은 신뢰하지 않고 검증한다.
- 인기 음악은 조회·미리보기가 아니라 최종 카드 생성 횟수로 집계한다.

## 외부 생성·수정

GitHub 이슈·PR·리뷰 코멘트나 Notion 문서처럼 외부 서비스에 생성·수정하는 작업은 전체 초안을 먼저 보여준다. 사용자가 명시적으로 승인한 경우에만 실제 외부 변경을 수행한다.

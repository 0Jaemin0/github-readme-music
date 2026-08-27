---
name: multi-agent-orchestration
description: readme.fm의 프론트엔드와 백엔드·외부 연동이 함께 걸린 기능을 전문 역할로 검토하고, 메인 Codex가 하나의 구현안으로 통합한다.
---

# Multi-agent Orchestration

프론트엔드·서버·외부 API 경계가 함께 있는 기능 또는 사용자가 멀티 에이전트 협업을 요청한 경우에 사용한다. 역할 정의와 승인 경계는 [정책](../../../docs/agents/multi-agent.md)을 따른다.

## Routing

- 화면 구조, 상태, 접근성만 바뀌면 `frontend_engineer`만 호출한다.
- API, 입력 검증, 환경 변수, Supabase처럼 서버 경계가 바뀌면 `backend_engineer`만 호출한다.
- YouTube 메타데이터 조회처럼 두 경계가 함께 바뀌면 `frontend_engineer`와 `backend_engineer`를 독립적으로 검토시키고, 필요하면 읽기 전용 `integration_reviewer`를 추가한다.
- GitHub 이슈·PR·최종 리뷰는 기존 GitHub 및 PR 리뷰 Skill로 넘긴다.

## Collaboration Flow

1. 메인 Codex가 PM 요청을 완료 기준과 변경 범위로 정리한다.
2. 필요한 역할은 구현 전에 `권장 구조 / 위험 요소와 검증 / 미확정 사항`을 보고한다.
3. 메인 Codex가 충돌을 해결하고 단일 구현 계획을 결정한다.
4. 한 역할 또는 메인 Codex만 해당 파일을 수정한다. 리뷰 역할은 같은 파일을 병렬로 수정하지 않는다.
5. 구현 후 관련 검증을 실행하고, API·UI 경계 변경이면 해당 역할의 후속 검토를 요청한다.

## Main Codex Deliverable

최종 응답에는 결정한 구조, 역할별로 반영한 핵심 의견, 변경 파일, 검증 결과, 남은 미확정 사항만 간결히 정리한다.

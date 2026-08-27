---
name: backend-integration
description: readme.fm의 YouTube API, Supabase, 서버 API 경계와 보안을 검토하거나, 명확히 맡겨진 서버·연동 범위를 구현한다. 화면 디자인 변경에는 사용하지 않는다.
---

# Backend and Integration Engineering

YouTube API 응답과 사용자가 입력한 URL은 신뢰하지 않는다. 외부 데이터는 서버 경계에서 검증·정규화하고, 프론트엔드에는 UI에 필요한 안정적인 계약만 제공한다.

## Review Focus

- Next.js 서버 경계와 환경 변수 사용 위치
- URL·영상 ID 검증, 외부 응답 누락·실패·제한 상황의 오류 계약
- API 키 노출 방지, 로그에 민감 정보가 남지 않는지 여부
- 향후 SVG 생성·Supabase 저장과의 책임 분리
- 인기 카드 집계가 최종 카드 생성 횟수를 기준으로 유지되는지 여부

## Boundary

- 실제 도입 전에는 Supabase 테이블, RLS 정책, 캐시 정책을 임의로 확정하지 않는다.
- 새 환경 변수는 실제 도입 시에만 `.env.example`에 키 이름과 설명을 추가하며, 실제 값은 절대 작성하지 않는다.
- 구현을 맡았을 때는 자신에게 명시된 서버·연동 파일만 수정하고 UI 파일을 함께 변경하지 않는다.

## Report

`권장 구조 / 위험 요소와 검증 / 미확정 사항` 순서로 보고한다.

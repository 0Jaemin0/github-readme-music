# GitHub Workflow Agent Rules

## 기본 원칙

- GitHub 작업 전 `git status --short`, 현재 브랜치, `git remote -v`를 확인한다.
- 기존 사용자 변경사항과 작업 범위 밖 파일은 되돌리거나 커밋하지 않는다.
- 이슈, PR, 리뷰 코멘트를 외부에 게시하거나 수정하기 전에는 제목·본문 전체 초안을 보여주고 명시적 승인을 받는다.
- `.github`의 실제 이슈·PR 템플릿을 단일 기준으로 사용한다.
- `main`에는 직접 푸시하지 않고 PR로 병합한다.

## Issue

이슈 작성 전 작업 목적과 완료 조건을 확인하고, 실제 `.github/ISSUE_TEMPLATE` 파일의 구조를 따른다.

- 버그: `bug.yml`
- 기능: `feature.yml`
- 리팩터링: `refactor.yml`

현재 템플릿에 맞는 유형이 없는 운영·문서 작업은 가장 가까운 템플릿으로 초안을 작성한다.

이슈 제목은 작업 내용을 바로 설명하는 문장으로 작성한다. `feat:`, `fix:`, `chore:`, `docs:`처럼 작업 성격을 나타내는 접두어는 제목에 쓰지 않고, **Label**로 구분한다.

이슈를 생성할 때는 다음 메타데이터를 반드시 지정한다.

- **Assignee**: 실제 작업 담당자. 개인 프로젝트에서는 이슈 작성자 또는 구현자를 지정한다.
- **Label**: 작업 성격을 나타내는 라벨을 정확히 하나 이상 지정한다.

현재 저장소에서는 아래 라벨만 사용한다.

| 작업 성격 | 라벨 |
| --- | --- |
| 기능 개발 | `Feature` |
| 오류 수정 | `Bug` |
| 리팩터링 | `Refactor` |
| 문서·규칙 변경 | `Docs` |
| 설정·의존성·운영 작업 | `Chore` |

라벨이 없는 이슈는 생성하지 않는다. 새 라벨이 필요하면 이슈 생성 전에 이름과 용도를 먼저 제안하고 승인받는다.

이슈 템플릿에서 필수가 아닌 입력 항목에 적을 내용이 없으면 비워 둔다. GitHub Issue Form은 생성 시 항목 제목을 제거할 수 없으므로, 형식 자체를 임의로 바꾸거나 의미 없는 문구를 채우지 않는다.

## Branch

이슈가 있는 작업은 다음 형식을 사용한다.

```text
type/#issue-number-short-description
```

```text
feature/#12-card-preview
fix/#27-youtube-url-validation
docs/#3-repository-rules
chore/#1-agent-setup
```

허용 type은 `feature`, `fix`, `refactor`, `hotfix`, `docs`, `chore`, `test`, `ci`다. 작업 요약은 소문자와 하이픈을 사용한다.

이슈가 없는 아주 작은 문서·설정 작업은 `docs/short-description`, `chore/short-description` 형식을 사용할 수 있다. 기능·버그·구조 변경은 반드시 이슈부터 만든다.

## Commit

커밋은 Conventional Commits 형식을 사용한다.

```text
type: 작업 내용
```

사용 가능한 type은 `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`다.

- 메시지는 한국어로 작성하고 실제 변경 내용과 일치시킨다.
- 한 커밋에는 하나의 논리적 변경만 담는다.
- 스코프는 필요할 때만 사용한다.
- 커밋 전 `git diff --name-only`, `git status --short`로 포함 파일을 확인한다.

## Pull Request

- PR 작성 전 `.github/pull_request_template.md`의 현재 구조를 확인한다.
- PR 제목도 이슈와 같이 작업 내용만 작성하며 `feat:`, `fix:`, `chore:`, `docs:` 등의 접두어는 사용하지 않는다. 작업 성격은 Label로 구분한다.
- 관련 이슈를 연결하고, 변경 목적·핵심 변경·검증 결과를 작성한다.
- 실제 작업 담당자를 Assignee로 지정한다. 개인 프로젝트에서는 PR 작성자 또는 구현자를 지정한다.
- 관련 이슈와 같은 성격의 라벨을 최소 하나 지정한다. 예를 들어 설정 작업 PR에는 `Chore`, 문서 작업 PR에는 `Docs`를 사용한다.
- UI 변경이 있으면 스크린샷 또는 영상을 첨부한다.
- 검증하지 못한 항목은 이유를 명시한다.
- PR 하나에는 하나의 목적만 담는다.
- 기본 병합 방식은 squash merge이며, squash 커밋 메시지는 PR 제목을 사용한다.

PR 템플릿의 선택 섹션은 실제 작성할 내용이 있을 때만 남긴다. 내용이 없으면 해당 제목과 안내문 전체를 제거한다. 예를 들어 UI 변경이 없으면 `스크린샷` 섹션을, 별도 리뷰 요청이 없으면 `리뷰 요구사항` 섹션을 삭제한다.

## 검증

기술 스택이 확정되기 전에는 lint·test·build 명령을 가정하지 않는다. 스택 도입 후 실제 명령을 이 문서에 추가한다.

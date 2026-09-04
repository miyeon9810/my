-- =========================================================
-- 알바/직원 관리 앱 — MVP 1단계 스키마 (PostgreSQL)
-- 포지션(사장님 뷰) + 체크리스트(알바생 뷰) 하이브리드 구조
-- =========================================================

-- ---------------------------------------------------------
-- 계정
-- ---------------------------------------------------------

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 매장 (다점포 확장 대비, 모든 데이터는 store_id 기준으로 분리)
-- ---------------------------------------------------------

CREATE TABLE stores (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  address    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 매장-계정 연결. 한 계정이 여러 매장 소속 가능 (다점포 사장님/직원 겸직 대비)
CREATE TABLE store_members (
  id         BIGSERIAL PRIMARY KEY,
  store_id   BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'inactive')),
  invited_at TIMESTAMPTZ,
  joined_at  TIMESTAMPTZ,
  UNIQUE (store_id, user_id)
);

-- ---------------------------------------------------------
-- 포지션 마스터 (매장별 커스텀)
-- ---------------------------------------------------------

CREATE TABLE positions (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,           -- 홀, 주방, 오픈, 마감 등
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, name)
);

-- ---------------------------------------------------------
-- 체크리스트 템플릿 (포지션에 연결)
-- 버전 테이블을 분리한 이유: 사장님이 템플릿을 수정해도
-- 이미 진행 중이거나 완료된 체크리스트 기록은 당시 항목 그대로 남아야 함
-- ---------------------------------------------------------

CREATE TABLE checklist_templates (
  id          BIGSERIAL PRIMARY KEY,
  store_id    BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  position_id BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_template_versions (
  id           BIGSERIAL PRIMARY KEY,
  template_id  BIGINT NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  version_no   INTEGER NOT NULL,
  created_by   BIGINT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_no)
);

CREATE TABLE checklist_template_items (
  id                  BIGSERIAL PRIMARY KEY,
  template_version_id BIGINT NOT NULL REFERENCES checklist_template_versions(id) ON DELETE CASCADE,
  content             TEXT NOT NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_required         BOOLEAN NOT NULL DEFAULT true,
  requires_photo      BOOLEAN NOT NULL DEFAULT false,
  requires_memo       BOOLEAN NOT NULL DEFAULT false
);

-- ---------------------------------------------------------
-- 배정: 직원이 특정 날짜에 특정 포지션에 들어감
-- ---------------------------------------------------------

CREATE TABLE staff_assignments (
  id           BIGSERIAL PRIMARY KEY,
  store_id     BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id  BIGINT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  work_date    DATE NOT NULL,
  shift_start  TIME,
  shift_end    TIME,
  assigned_by  BIGINT REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id, position_id, work_date)
);

-- ---------------------------------------------------------
-- 체크리스트 실행 인스턴스: 배정 하나당 그 시점 활성 템플릿 버전을 스냅샷으로 물고 생성
-- ---------------------------------------------------------

CREATE TABLE checklist_runs (
  id                   BIGSERIAL PRIMARY KEY,
  assignment_id        BIGINT NOT NULL REFERENCES staff_assignments(id) ON DELETE CASCADE,
  template_version_id  BIGINT NOT NULL REFERENCES checklist_template_versions(id),
  status               TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  started_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at         TIMESTAMPTZ,
  UNIQUE (assignment_id)
);

CREATE TABLE checklist_run_items (
  id                  BIGSERIAL PRIMARY KEY,
  run_id              BIGINT NOT NULL REFERENCES checklist_runs(id) ON DELETE CASCADE,
  template_item_id    BIGINT NOT NULL REFERENCES checklist_template_items(id),
  is_checked          BOOLEAN NOT NULL DEFAULT false,
  checked_by          BIGINT REFERENCES users(id),
  checked_at          TIMESTAMPTZ,
  photo_url           TEXT,
  memo                TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, template_item_id)
);

-- 체크/해제 이력 (append-only 감사 로그, run_items는 현재 상태만 유지)
CREATE TABLE checklist_check_logs (
  id           BIGSERIAL PRIMARY KEY,
  run_item_id  BIGINT NOT NULL REFERENCES checklist_run_items(id) ON DELETE CASCADE,
  action       TEXT NOT NULL CHECK (action IN ('checked', 'unchecked')),
  actor_id     BIGINT NOT NULL REFERENCES users(id),
  photo_url    TEXT,
  memo         TEXT,
  acted_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- 조회 인덱스
-- ---------------------------------------------------------

CREATE INDEX idx_store_members_user ON store_members(user_id);
CREATE INDEX idx_positions_store ON positions(store_id) WHERE is_active;
CREATE INDEX idx_templates_position ON checklist_templates(position_id) WHERE is_active;
CREATE INDEX idx_assignments_store_date ON staff_assignments(store_id, work_date);
CREATE INDEX idx_assignments_user_date ON staff_assignments(user_id, work_date);
CREATE INDEX idx_run_items_run ON checklist_run_items(run_id);
CREATE INDEX idx_check_logs_run_item ON checklist_check_logs(run_item_id);

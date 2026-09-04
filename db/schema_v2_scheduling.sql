-- =========================================================
-- 알바/직원 관리 앱 — MVP 2단계 스키마 (PostgreSQL)
-- 스케줄 캘린더 + 불가시간 + 대타 요청
-- db/schema.sql (1단계: users, stores, positions, staff_assignments 등) 위에 얹음
-- =========================================================

-- ---------------------------------------------------------
-- 캘린더(월/주뷰, 드래그 배정)는 별도 테이블이 필요 없음.
-- staff_assignments(store_id, user_id, position_id, work_date)를
-- 날짜/직원 축으로 조회만 다르게 하면 그대로 캘린더가 됨.
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 직원 불가시간 (반복형/일회성) — 배정 화면에서 자동 필터링에 사용
-- ---------------------------------------------------------

CREATE TABLE staff_unavailability (
  id            BIGSERIAL PRIMARY KEY,
  store_id      BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('recurring', 'one_time')),

  -- recurring: 요일 기준, 유효 기간(starts_on~ends_on)은 무기한이면 NULL
  day_of_week   SMALLINT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=일요일
  starts_on     DATE,
  ends_on       DATE,

  -- one_time: 특정 날짜 하루
  specific_date DATE,

  -- 공통: 시간대 지정 없으면(NULL) 하루 종일 불가로 간주
  start_time    TIME,
  end_time      TIME,

  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (
    (kind = 'recurring' AND day_of_week IS NOT NULL AND specific_date IS NULL)
    OR
    (kind = 'one_time' AND specific_date IS NOT NULL AND day_of_week IS NULL AND starts_on IS NULL AND ends_on IS NULL)
  )
);

CREATE INDEX idx_unavailability_user ON staff_unavailability(user_id);
CREATE INDEX idx_unavailability_store_recurring ON staff_unavailability(store_id, day_of_week) WHERE kind = 'recurring';
CREATE INDEX idx_unavailability_store_onetime ON staff_unavailability(store_id, specific_date) WHERE kind = 'one_time';

-- ---------------------------------------------------------
-- 대타 요청: 배정 하나를 두고 요청 → 후보들에게 순서대로/동시에 제안 → 첫 수락이 확정
-- ---------------------------------------------------------

CREATE TABLE shift_swap_requests (
  id            BIGSERIAL PRIMARY KEY,
  assignment_id BIGINT NOT NULL REFERENCES staff_assignments(id) ON DELETE CASCADE,
  requested_by  BIGINT NOT NULL REFERENCES users(id),
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

-- 같은 배정에 열린 요청은 동시에 하나만
CREATE UNIQUE INDEX uq_swap_request_open ON shift_swap_requests(assignment_id) WHERE status = 'open';

CREATE TABLE shift_swap_offers (
  id           BIGSERIAL PRIMARY KEY,
  request_id   BIGINT NOT NULL REFERENCES shift_swap_requests(id) ON DELETE CASCADE,
  offered_to   BIGINT NOT NULL REFERENCES users(id),
  sort_order   INTEGER NOT NULL DEFAULT 0,   -- 순차 제안 순서 (거절 시 다음 순번에게)
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  notified_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (request_id, offered_to)
);

-- 대타가 확정되면 staff_assignments.user_id를 교체하고 여기에 이력을 남김
-- (assignment_id, checklist_runs는 그대로 유지 — 체크리스트는 새 담당자가 이어서 봄)
CREATE TABLE assignment_swap_logs (
  id               BIGSERIAL PRIMARY KEY,
  assignment_id    BIGINT NOT NULL REFERENCES staff_assignments(id) ON DELETE CASCADE,
  swap_request_id  BIGINT NOT NULL REFERENCES shift_swap_requests(id),
  previous_user_id BIGINT NOT NULL REFERENCES users(id),
  new_user_id      BIGINT NOT NULL REFERENCES users(id),
  swapped_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_swap_requests_status ON shift_swap_requests(status);
CREATE INDEX idx_swap_offers_request ON shift_swap_offers(request_id);
CREATE INDEX idx_swap_offers_offered_to ON shift_swap_offers(offered_to, status);

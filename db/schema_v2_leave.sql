-- =========================================================
-- 알바/직원 관리 앱 — 2단계 확장: 월차/연차
-- 원래 스펙엔 없었지만 실제 운영 캘린더에 "소희 8, 유진 3, 정민 7.5"처럼
-- 직원별 잔여 휴가 일수를 손으로 적어 관리하고 있어서 스키마에 반영.
-- =========================================================

CREATE TABLE leave_requests (
  id           BIGSERIAL PRIMARY KEY,
  store_id     BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type   TEXT NOT NULL CHECK (leave_type IN ('annual', 'monthly', 'unpaid', 'other')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  day_count    NUMERIC(4,1) NOT NULL, -- 반차 등 0.5 단위 지원
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by   BIGINT REFERENCES users(id),
  decided_at   TIMESTAMPTZ
);

-- 잔여 일수는 컬럼으로 들고 있지 않고 이 원장을 SUM해서 계산.
-- 적립(+)과 사용(-)을 같은 테이블에 쌓아서 "왜 지금 이 숫자인지"가 항상 추적됨.
CREATE TABLE leave_ledger_entries (
  id               BIGSERIAL PRIMARY KEY,
  store_id         BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type       TEXT NOT NULL CHECK (leave_type IN ('annual', 'monthly', 'unpaid', 'other')),
  amount           NUMERIC(4,1) NOT NULL, -- 적립은 +, 사용은 -
  reason           TEXT,
  occurred_on      DATE NOT NULL,
  leave_request_id BIGINT REFERENCES leave_requests(id),
  created_by       BIGINT NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX idx_leave_ledger_user_type ON leave_ledger_entries(user_id, leave_type);

-- 잔여 일수 조회 예시:
-- SELECT leave_type, SUM(amount) AS balance
-- FROM leave_ledger_entries WHERE user_id = ? GROUP BY leave_type;

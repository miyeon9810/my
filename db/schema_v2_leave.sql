-- =========================================================
-- 알바/직원 관리 앱 — 2단계 확장: 월차/연차
-- 원래 스펙엔 없었지만 실제 운영 캘린더에 "소희 8, 유진 3, 정민 7.5"처럼
-- 직원별 잔여 휴가 일수를 손으로 적어 관리하고 있어서 스키마에 반영.
-- 월차 적립은 매달 자동 +1 — 배치 작업이 매장/직원별 정책을 읽어 적립.
-- =========================================================

-- 매장 기본 정책(user_id NULL) + 직원별 예외(user_id 지정)를 같은 테이블에서 관리
CREATE TABLE leave_accrual_policies (
  id               BIGSERIAL PRIMARY KEY,
  store_id         BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id          BIGINT REFERENCES users(id) ON DELETE CASCADE,
  leave_type       TEXT NOT NULL DEFAULT 'monthly' CHECK (leave_type IN ('annual', 'monthly')),
  days_per_period  NUMERIC(4,1) NOT NULL DEFAULT 1,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id, leave_type)
);

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
  source           TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto_accrual', 'leave_request')),
  period_month     DATE, -- source='auto_accrual'일 때만: 이 적립이 몇 월분인지 (매월 1일 기준)
  reason           TEXT,
  occurred_on      DATE NOT NULL,
  leave_request_id BIGINT REFERENCES leave_requests(id),
  created_by       BIGINT REFERENCES users(id), -- 자동 적립은 배치 작업이라 NULL
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 같은 달 적립 배치가 재실행돼도 직원당 월 1회만 쌓이게 보장
CREATE UNIQUE INDEX uq_leave_ledger_auto_accrual
  ON leave_ledger_entries(user_id, leave_type, period_month)
  WHERE source = 'auto_accrual';

CREATE INDEX idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX idx_leave_ledger_user_type ON leave_ledger_entries(user_id, leave_type);

-- 잔여 일수 조회 예시:
-- SELECT leave_type, SUM(amount) AS balance
-- FROM leave_ledger_entries WHERE user_id = ? GROUP BY leave_type;

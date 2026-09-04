-- =========================================================
-- 알바/직원 관리 앱 — MVP 3단계 스키마 (PostgreSQL)
-- 발주 관리: 거래처별 발주주기 + 알바생 요청 → 그룹핑 → 승인 → 발주완료
-- 실제 발주표 기준: 본사(화목 발주→수금 입고), 첫순(월수 발주→화목 입고),
-- 쿠팡/성공(수시 발주) 처럼 거래처마다 주기가 다름
-- =========================================================

CREATE TABLE vendors (
  id             BIGSERIAL PRIMARY KEY,
  store_id       BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name           TEXT NOT NULL, -- 본사, 첫순, 쿠팡, 성공 등
  order_days     SMALLINT[], -- 정기 발주 요일(0=일~6=토), 수시 발주면 NULL
  delivery_days  SMALLINT[],
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, name)
);

-- 거래처별 품목 마스터 (자몽농축액, 12oz 아이스컵 등 발주표의 행 하나하나)
CREATE TABLE vendor_items (
  id          BIGSERIAL PRIMARY KEY,
  vendor_id   BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  spec        TEXT, -- 대/중/소, 16oz 등 규격
  unit        TEXT, -- 병, 박스, 개
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 정기 발주 템플릿: 발주일마다 기본으로 채워둘 수량 (요일 알림 자체는 vendors.order_days로 판단)
CREATE TABLE recurring_order_templates (
  id                BIGSERIAL PRIMARY KEY,
  vendor_item_id    BIGINT NOT NULL UNIQUE REFERENCES vendor_items(id) ON DELETE CASCADE,
  default_quantity  NUMERIC(8,2) NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true
);

-- 알바생이 올리는 개별 요청. 마스터에 없는 품목은 item_name_freetext로.
CREATE TABLE order_requests (
  id                  BIGSERIAL PRIMARY KEY,
  store_id            BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  requested_by        BIGINT NOT NULL REFERENCES users(id),
  vendor_item_id      BIGINT REFERENCES vendor_items(id),
  item_name_freetext  TEXT,
  quantity            NUMERIC(8,2) NOT NULL,
  memo                TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'batched', 'cancelled')),
  batch_item_id       BIGINT, -- 그룹핑되면 세팅 (order_batch_items 정의 후 FK 추가)
  requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (vendor_item_id IS NOT NULL OR item_name_freetext IS NOT NULL)
);

-- 사장님이 승인하는 단위. 거래처 하나에 여러 요청이 모여 묶음 하나가 됨.
CREATE TABLE order_batches (
  id           BIGSERIAL PRIMARY KEY,
  store_id     BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  vendor_id    BIGINT NOT NULL REFERENCES vendors(id),
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'ordered', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by  BIGINT REFERENCES users(id),
  approved_at  TIMESTAMPTZ,
  ordered_at   TIMESTAMPTZ
);

-- 같은 품목 요청이 여기서 하나로 합산됨 (요청 A 2개 + 요청 B 3개 → 5개)
CREATE TABLE order_batch_items (
  id                  BIGSERIAL PRIMARY KEY,
  batch_id            BIGINT NOT NULL REFERENCES order_batches(id) ON DELETE CASCADE,
  vendor_item_id      BIGINT REFERENCES vendor_items(id),
  item_name_freetext  TEXT,
  total_quantity      NUMERIC(8,2) NOT NULL,
  unit                TEXT,
  memo                TEXT,
  CHECK (vendor_item_id IS NOT NULL OR item_name_freetext IS NOT NULL)
);

ALTER TABLE order_requests
  ADD CONSTRAINT fk_order_requests_batch_item
  FOREIGN KEY (batch_item_id) REFERENCES order_batch_items(id);

CREATE INDEX idx_vendor_items_vendor ON vendor_items(vendor_id) WHERE is_active;
CREATE INDEX idx_order_requests_store_status ON order_requests(store_id, status);
CREATE INDEX idx_batch_items_batch ON order_batch_items(batch_id);
CREATE INDEX idx_batches_vendor_status ON order_batches(vendor_id, status);

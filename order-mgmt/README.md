# 오늘의매장 (order-mgmt)

오프라인 매장(카페) 사장님과 직원이 함께 쓰는 재고 발주 체크리스트 서비스.
실제 클립보드 발주표처럼 실무적이고 담백한 톤, 모바일 웹 우선.

- 직원 화면 (`/employee`): 거래처별 품목을 세로로 나열. 숫자형 품목(요거트파우더, 카페시럽 등)은
  숫자 입력, 상태형 품목(초코소스, 건대추 등)은 안내문구 아래 "남음/부족" 버튼으로 입력. 입력은
  포커스를 벗어나거나 버튼을 누르는 즉시 저장되고, 오늘이 정규 발주일인 거래처는 상단에 강조 표시된다.
- 사장님 화면 (`/owner`): 기준 이하로 떨어진 품목만 거래처별로 그룹핑해서 보여준다. 정규 발주일이
  아닌 날 갑자기 발생한 품목은 "긴급" 태그로 별도 강조되고, 품목별로 발주완료 체크가 가능하다.
- 품목/거래처 관리 (`/owner/items`): 거래처 등록(발주·도착 요일, 수시 발주 여부, 주문 특이사항,
  디지털 명함 이미지)과 품목 등록(숫자형/상태형 선택, 기준값 또는 안내문구, 홀/주방 구역)을 한 화면에서.

역할 구분은 로그인 없이 시작 화면에서 "직원 / 사장님"을 선택하는 방식이다 (쿠키에 저장).

## 실행

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init   # 최초 1회, DB 스키마 생성
npm run seed                          # 오산점 거래처(본사/천운/철은/쿠팡/성공) + 예시 품목 채우기
npm run dev
```

http://localhost:3000 접속 후 역할을 선택해서 사용한다.

## 데이터 모델

- `Vendor`: 거래처. `isAdhoc`(수시 발주 여부), `orderDays`/`deliveryDays`(콤마로 구분한 요일 코드,
  예: `"TUE,THU"`), `note`(주문 특이사항 자유 입력), `cardImage`(디지털 명함, data URL)
- `Item`: 품목. 소속 거래처(`vendorId`), 구역(`zone`: HALL/KITCHEN), 입력방식(`inputType`:
  NUMERIC/STATUS). 숫자형은 `safetyStock`/`currentStock`, 상태형은 `statusHint`/`statusValue`(OK/LOW)
- `ItemOrderCheck`: 품목별·날짜별 발주 완료 체크 상태

## 발주 판단 로직

- 기준 이하 판정: 숫자형은 `currentStock <= safetyStock`, 상태형은 `statusValue === "LOW"`
- 정규 발주 거래처는 발주 요일이 아닌 날 기준 이하 품목이 생기면 "긴급" 태그로 표시
- 수시 발주 거래처는 요일 개념이 없어 기준 이하이면 언제든 노출되고 긴급 태그는 붙지 않음

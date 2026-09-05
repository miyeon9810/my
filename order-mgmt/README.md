# 발주 관리 (order-mgmt)

좋은아침페스츄리 오산점용 발주 관리 MVP. 거래처별 품목 재고를 숫자로 체크하고,
발주 요일에 안전재고 이하인 품목을 자동으로 강조해서 보여준다.

- 직원 화면 (`/employee`): 거래처 탭을 골라 품목별 현재 재고 수량을 입력하고 저장
- 사장님 화면 (`/owner`): 오늘이 발주 요일인 거래처(또는 수시 발주 거래처 중 기준 이하 품목이
  있는 곳)의 품목을 보여주고, 안전재고 이하 품목은 빨간색으로 강조. 거래처별로 발주 완료 체크 가능
- 품목/거래처 관리 (`/owner/items`): 거래처 추가, 발주/입고 요일 수정, 품목 추가·안전재고 수정·삭제

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
  예: `"TUE,THU"`)
- `Item`: 품목. 소속 거래처(`vendorId`), 안전재고 기준(`safetyStock`), 현재 재고(`currentStock`)
- `OrderCheck`: 거래처별·날짜별 발주 완료 체크 상태

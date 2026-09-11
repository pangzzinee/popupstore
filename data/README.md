# 데이터 추가하는 법

모든 정보는 `data/popups.json` 한 파일에 들어 있습니다.
`popups` 배열에 항목 하나를 추가하면 사이트에 바로 반영됩니다. (빌드 과정 없음)

## 항목 템플릿

```jsonc
{
  "id": "brand-ip-2026",          // 겹치지 않는 고유 키 (영문·숫자·하이픈)
  "title": "팝업 이름",
  "ip": ["캐릭터 이름"],           // 여러 개면 배열에 나열
  "brand": "협업 브랜드",
  "category": "cafe",             // 아래 '업종 코드' 참고
  "type": "팝업스토어",            // 팝업스토어 / 상품 콜라보 / 전시 / 체험 공간
  "country": "KR",                // 나중에 해외 추가할 때 사용
  "region": "서울 송파",
  "venue": "정확한 장소",
  "startDate": "2026-09-01",      // YYYY-MM-DD, 모르면 null
  "endDate": "2026-09-16",        // YYYY-MM-DD, 모르면 null
  "hours": "10:30 ~ 21:30",
  "reservation": "현장 방문",      // 현장 방문 / 사전 예약 / 회차 예약 / 매장 구매
  "summary": "한두 문장 설명",
  "highlights": ["굿즈나 메뉴 등 볼거리"],
  "note": "확인이 필요한 부분",     // 선택
  "sources": [
    { "title": "출처 제목", "url": "https://..." }
  ]
}
```

## 업종 코드

| 코드 | 라벨 |
|---|---|
| `publish` | 📚 출판·문구 |
| `food` | 🍰 식음료 |
| `cafe` | 🥐 카페·베이커리 |
| `cvs` | 🏪 편의점·유통 |
| `beauty` | 💄 뷰티 |
| `fashion` | 👜 패션·잡화 |
| `sports` | ⚽ 스포츠 |
| `culture` | 🎪 전시·엔터 |

업종을 새로 만들려면 `categories` 배열에 `{ "id", "label", "emoji" }`를 추가하세요.

## 규칙

- **날짜를 모르면 지어내지 말고 `null`로 두세요.** `null`이면 '기간 미정'으로 분류되고
  캘린더에는 표시되지 않지만 목록에서는 검색됩니다.
- `sources`에는 실제로 확인한 기사·공식 공지 링크를 넣습니다.
- 진행 상태(진행 중 / 오픈 예정 / 종료)는 오늘 날짜를 기준으로 **자동 계산**되므로
  직접 적을 필요가 없습니다.
- 수정 후 `meta.updatedAt`을 오늘 날짜로 바꿔주세요.

## 검증

```bash
node -e "const d=require('./data/popups.json'); console.log('항목 수:', d.popups.length)"
```

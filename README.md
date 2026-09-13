# 🎪 팝업 캘린더

캐릭터 IP와 브랜드가 함께 만든 **팝업스토어·콜라보**를 모아 보는 사이트입니다.

민음사 × 오늘의귀여움처럼 출판사가 캐릭터와 책을 만들고, 엔제리너스 × 빵고미처럼
카페가 캐릭터 빵을 파는 — 그런 협업들을 기록합니다.

## 페이지

| 파일 | 화면 | 상태 |
|---|---|---|
| `index.html` | 랜딩 | 완성 |
| `find.html` | 팝업 찾기 (목록·캘린더·필터·내 주변·지도) | 완성 |
| `shop.html` | 팝업 상품 | 준비 중 화면 |
| `booking.html` | 팝업 예약 | 준비 중 화면 |
| `my.html` | 마이페이지 (내 동네·로그인) | 완성 |

상단 네비게이션, 왼쪽 햄버거 서랍, 푸터는 `assets/js/ui.js`가 만들어 넣습니다.
페이지마다 `<body data-page="...">` 값으로 현재 메뉴가 표시됩니다.

## 구조

```
assets/css/base.css     디자인 토큰, 네비, 서랍, 푸터, 버튼, 공통 애니메이션
assets/css/landing.css  랜딩 전용
assets/css/find.css     팝업 찾기 전용
assets/css/page.css     준비 중 / 마이페이지 공용

assets/js/config.js     ← 외부 서비스 키를 넣는 곳
assets/js/ui.js         네비·서랍·스크롤 등장·숫자 카운트업
assets/js/sprite.js     손그림 SVG 일러스트 모음
assets/js/place.js      동네 목록·저장·거리 계산
assets/js/auth.js       Supabase 로그인
assets/js/map.js        카카오맵
assets/js/find.js       팝업 찾기 로직
assets/js/landing.js    랜딩의 실시간 팝업 목록
assets/js/my.js         마이페이지 로직

data/popups.json        ← 팝업 데이터는 전부 여기
data/README.md          항목 추가 방법
```

빌드 도구도 프레임워크도 없습니다. 파일을 고치고 푸시하면 끝입니다.

## 설정 (`assets/js/config.js`)

두 칸을 채우면 기능이 켜집니다. **비워둬도 사이트는 정상 동작합니다.**

### 회원가입 — Supabase

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트 생성
2. Project Settings → API 에서 **Project URL** 과 **anon public** 키 복사
3. `config.js` 의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 에 붙여넣기

별도 테이블은 필요 없습니다. 닉네임과 동네는 Supabase 계정 정보(user_metadata)에 저장합니다.
키가 비어 있으면 마이페이지에 설정 안내가 대신 나옵니다.

### 지도 — 카카오맵

**키가 없어도 '지도에서 보기 / 길찾기' 링크는 동작합니다.** 카카오맵 링크 주소는 키가 필요 없습니다.
키를 넣으면 상세 화면 안에 지도가 직접 뜹니다.

1. [카카오 개발자센터](https://developers.kakao.com) → 내 애플리케이션 → 앱 키 → **JavaScript 키**
2. 플랫폼 → Web 에 배포 도메인 등록 (예: `https://popupstore.vercel.app`)
3. `config.js` 의 `KAKAO_MAP_KEY` 에 붙여넣기

## 내 주변 팝업

마이페이지에서 동네를 고르면 팝업 찾기의 **📍 내 주변** 버튼이 켜집니다.
가까운 순으로 정렬되고 카드마다 거리가 표시됩니다.

- 동네 좌표는 `assets/js/place.js`, 팝업 좌표는 `data/popups.json` 의 `coords`에 있습니다.
- 주소 검색 API를 쓰지 않아 별도 키가 필요 없습니다.
- 전국 단위 상품 콜라보는 좌표가 없어 거리 정렬에서 뒤로 갑니다.
- 위치 정보는 이 브라우저에만 저장되고, 로그인한 경우에만 계정에 함께 저장됩니다.

## 로컬에서 보기

`fetch()`로 JSON을 읽기 때문에 파일을 더블클릭하면 동작하지 않습니다. 정적 서버로 여세요.

```bash
npx serve .
# 또는
python3 -m http.server 8000
```

## 배포 (Vercel)

빌드가 없는 정적 사이트라 설정 없이 올라갑니다. 기본 브랜치에 푸시하면 자동 배포됩니다.
자세한 절차는 [vercel.com](https://vercel.com) → Add New → Project → Import 후 그대로 **Deploy**.

## 데이터에 대하여

운영 기간·시간은 주최 측 사정으로 바뀔 수 있습니다. 방문 전 공식 채널에서 확인하세요.
각 항목에는 확인에 사용한 기사·공지 링크를 `sources`로, 포스터가 있는 공식 페이지를
`official`로 담았습니다. 좌표는 지도 표시를 위한 대략값입니다.

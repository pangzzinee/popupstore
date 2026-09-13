/* ===========================================================
   내 동네 — 목록, 저장, 거리 계산
   주소 검색 API 없이도 동작하도록 동네를 미리 좌표와 함께 담아둔다.
   =========================================================== */
(() => {
  'use strict';

  const AREAS = [
    { id: 'seongsu',  label: '서울 성수·서울숲',  lat: 37.5445, lng: 127.0557 },
    { id: 'hongdae',  label: '서울 홍대·합정',    lat: 37.5563, lng: 126.9236 },
    { id: 'gangnam',  label: '서울 강남·신사',    lat: 37.4979, lng: 127.0276 },
    { id: 'yeouido',  label: '서울 여의도',       lat: 37.5216, lng: 126.9245 },
    { id: 'yongsan',  label: '서울 용산·이태원',  lat: 37.5299, lng: 126.9648 },
    { id: 'jamsil',   label: '서울 잠실·송파',    lat: 37.5133, lng: 127.1028 },
    { id: 'ydp',      label: '서울 영등포',       lat: 37.5157, lng: 126.9074 },
    { id: 'konkuk',   label: '서울 건대·성수동쪽', lat: 37.5403, lng: 127.0695 },
    { id: 'myeongdong', label: '서울 명동·종로',  lat: 37.5680, lng: 126.9810 },
    { id: 'sinchon',  label: '서울 신촌·이대',    lat: 37.5559, lng: 126.9368 },
    { id: 'bundang',  label: '경기 성남·판교',    lat: 37.3948, lng: 127.1112 },
    { id: 'ilsan',    label: '경기 고양·일산',    lat: 37.6584, lng: 126.7700 },
    { id: 'suwon',    label: '경기 수원',         lat: 37.2636, lng: 127.0286 },
    { id: 'incheon',  label: '인천 송도·구월',    lat: 37.3894, lng: 126.6390 },
    { id: 'seomyeon', label: '부산 서면',         lat: 35.1578, lng: 129.0594 },
    { id: 'haeundae', label: '부산 해운대·센텀',  lat: 35.1688, lng: 129.1294 },
    { id: 'daegu',    label: '대구 동성로',       lat: 35.8693, lng: 128.5947 },
    { id: 'daejeon',  label: '대전 둔산',         lat: 36.3515, lng: 127.3784 },
    { id: 'gwangju',  label: '광주 충장로',       lat: 35.1479, lng: 126.9160 },
    { id: 'cheongju', label: '충북 청주',         lat: 36.6424, lng: 127.4890 },
  ];

  const KEY = 'popupcal.place';

  function get() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function set(place) {
    try {
      if (place) localStorage.setItem(KEY, JSON.stringify(place));
      else localStorage.removeItem(KEY);
    } catch { /* 사생활 보호 모드 등에서는 저장을 건너뛴다 */ }
    window.dispatchEvent(new CustomEvent('place:change', { detail: place }));
  }
  const byId = (id) => AREAS.find((a) => a.id === id) || null;

  /* 하버사인 — 두 좌표 사이 거리(km) */
  function distanceKm(a, b) {
    if (!a || !b) return null;
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  const fmtDistance = (km) =>
    km == null ? '' : km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(km < 10 ? 1 : 0)}km`;

  /* 브라우저 위치 → 가장 가까운 동네로 맞춘다 */
  function locate() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('이 브라우저는 위치 기능을 지원하지 않아요.'));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          let best = null;
          let bestKm = Infinity;
          AREAS.forEach((a) => {
            const km = distanceKm(here, a);
            if (km < bestKm) { bestKm = km; best = a; }
          });
          resolve({ ...here, id: best?.id || null, label: best?.label || '현재 위치', exact: true });
        },
        () => reject(new Error('위치를 가져오지 못했어요. 브라우저에서 위치 권한을 허용해주세요.')),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
      );
    });
  }

  window.Place = { AREAS, get, set, byId, distanceKm, fmtDistance, locate };
})();

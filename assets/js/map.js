/* ===========================================================
   카카오맵
   앱 키가 없어도 '지도에서 보기 / 길찾기' 링크는 항상 동작한다.
   (카카오맵 링크 주소는 키가 필요 없다)
   키를 넣으면 상세 화면에 지도를 직접 띄운다.
   =========================================================== */
(() => {
  'use strict';

  const key = (window.APP_CONFIG || {}).KAKAO_MAP_KEY;
  let sdk = null;

  function loadSdk() {
    if (!key) return Promise.reject(new Error('no key'));
    if (sdk) return sdk;
    sdk = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
      s.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
      s.onerror = () => reject(new Error('지도를 불러오지 못했어요.'));
      document.head.append(s);
    });
    return sdk;
  }

  const linkName = (p) => encodeURIComponent(p.coords?.name || p.venue || p.title || '팝업');
  const links = (p) => ({
    view: `https://map.kakao.com/link/map/${linkName(p)},${p.coords.lat},${p.coords.lng}`,
    to:   `https://map.kakao.com/link/to/${linkName(p)},${p.coords.lat},${p.coords.lng}`,
  });

  /* holder 안에 지도를 그린다. 키가 없으면 조용히 넘어간다. */
  async function render(holder, p) {
    if (!p.coords) return false;
    try {
      const kakao = await loadSdk();
      const center = new kakao.maps.LatLng(p.coords.lat, p.coords.lng);
      const map = new kakao.maps.Map(holder, { center, level: 4 });
      new kakao.maps.Marker({ map, position: center });
      map.setZoomable(false);          // 모달 안에서 휠 스크롤을 뺏지 않도록
      return true;
    } catch {
      return false;
    }
  }

  window.MapKit = { available: Boolean(key), render, links };
})();

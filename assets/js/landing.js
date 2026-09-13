/* ===========================================================
   랜딩 — 진행 중인 팝업을 실제 데이터에서 읽어와 보여준다
   =========================================================== */
(() => {
  'use strict';

  const DAY_PARSE = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const today = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };

  function statusOf(p) {
    if (!p.startDate) return 'undated';
    const now = today();
    const s = DAY_PARSE(p.startDate);
    if (now < s) return 'soon';
    if (!p.endDate) return p.openEnded ? 'live' : 'ended';
    return now > DAY_PARSE(p.endDate) ? 'ended' : 'live';
  }

  function hueOf(str) {
    let h = 2166136261;
    for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const hueFor = (str) => (hueOf(str) % 12) * 30 + 14;

  function daysLeft(p) {
    if (!p.endDate) return '종료일 미정';
    const n = Math.round((DAY_PARSE(p.endDate) - today()) / 86400000);
    return n === 0 ? '오늘 마감' : `${n}일 남음`;
  }

  // 같은 업종이 여러 건이면 카드가 똑같아 보인다. IP 이름으로 변종을 나눠 쓴다.
  const ILL_VARIANTS = {
    fashion: ['ill-fashion', 'ill-fashion2'],
    food:    ['ill-food', 'ill-food2'],
    cafe:    ['ill-cafe', 'ill-cafe2'],
  };
  function illFor(p) {
    if (p.ill) return p.ill;
    const list = ILL_VARIANTS[p.category];
    if (!list) return `ill-${p.category}`;
    return list[hueOf((p.ip || [])[0] || p.brand) % list.length];
  }

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function card(p) {
    const a = document.createElement('a');
    a.className = 'lcard reveal';
    a.href = 'find.html';

    const thumb = el('div', 'lcard-thumb');
    thumb.style.setProperty('--h', hueFor((p.ip || [])[0] || p.brand));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${illFor(p)}`);
    svg.append(use);
    thumb.append(svg, el('span', 'lcard-live', '진행 중'));

    const body = el('div', 'lcard-body');
    body.append(
      el('p', 'lcard-ip', (p.ip || []).join(' · ')),
      el('h3', 'lcard-title', p.title),
      el('p', 'lcard-meta', `${daysLeft(p)} · ${p.region || ''}`),
    );

    a.append(thumb, body);
    return a;
  }

  async function init() {
    let data;
    try {
      const res = await fetch('data/popups.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch {
      document.getElementById('liveGrid').innerHTML =
        '<p style="color:var(--ink-3);font-size:14px">지금은 목록을 불러올 수 없어요. 잠시 후 다시 시도해주세요.</p>';
      return;
    }

    const all = data.popups || [];
    const live = all.filter((p) => statusOf(p) === 'live');

    // 히어로 배지와 통계에 실제 숫자를 넣는다
    document.querySelectorAll('[data-live-count]').forEach((n) => { n.textContent = live.length; });
    const proof = document.querySelectorAll('.proof-item b');
    if (proof[0]) proof[0].dataset.count = all.length;
    if (proof[1]) proof[1].dataset.count = new Set(all.map((p) => p.category)).size;
    if (proof[2]) proof[2].dataset.count = new Set(all.flatMap((p) => p.areas || [])).size;
    window.countUpAll?.();

    const grid = document.getElementById('liveGrid');
    grid.textContent = '';
    const picked = live
      .sort((a, b) => (a.endDate || '9999').localeCompare(b.endDate || '9999'))
      .slice(0, 4);

    if (!picked.length) {
      grid.append(el('p', null, '지금은 진행 중인 팝업이 없어요. 곧 열릴 팝업을 확인해보세요!'));
      return;
    }
    picked.forEach((p, i) => {
      const c = card(p);
      c.style.setProperty('--d', `${i * 80}ms`);
      grid.append(c);
    });
    window.revealAll?.(grid);
  }

  init();
})();

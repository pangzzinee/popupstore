(() => {
  'use strict';

  const DAY = 86400000;
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  const ORIGIN = {
    KR:  '🇰🇷 국내',
    JP:  '🇯🇵 일본',
    US:  '🇺🇸 미국',
    FI:  '🇫🇮 핀란드',
    NL:  '🇳🇱 네덜란드',
    MIX: '🌏 국내·해외 혼합',
  };

  const STATUS = {
    live:    { label: '진행 중',   cls: 'live' },
    soon:    { label: '오픈 예정', cls: 'soon' },
    ended:   { label: '종료',      cls: 'done' },
    undated: { label: '기간 미정', cls: 'done' },
  };

  const state = {
    popups: [],
    categories: [],
    catMap: new Map(),
    areas: [],
    status: 'all',
    category: 'all',
    area: 'all',
    query: '',
    sort: 'soonest',
    view: 'list',
    cursor: startOfMonth(new Date()),
  };

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- date helpers (local, no timezone drift) ---------- */
  function parseDate(s) {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function today() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmt(s) {
    const d = parseDate(s);
    if (!d) return '';
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${DOW[d.getDay()]})`;
  }
  function period(p) {
    if (p.periodText) return p.periodText;
    if (!p.startDate) return '기간 미정 · 상시';
    if (!p.endDate) return p.openEnded ? `${fmt(p.startDate)} ~ 종료일 미정` : `${fmt(p.startDate)} 출시`;
    return `${fmt(p.startDate)} ~ ${fmt(p.endDate)}`;
  }

  /* ---------- 썸네일 ---------- */
  // 캐릭터 이름에서 고정된 색을 뽑는다. 같은 IP는 항상 같은 색이 나온다.
  function hueOf(str) {
    // FNV-1a. 단순 누적합은 한글처럼 코드값이 몰린 문자에서 비슷한 색만 나온다.
    let h = 2166136261;
    for (const ch of String(str)) {
      h ^= ch.codePointAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // 색은 30도 간격 12칸으로 스냅한다. 어중간하게 비슷한 색보다
  // 확실히 다르거나 아예 같은 편이 눈에 덜 거슬린다.
  // 겹치더라도 배경 무늬 3종이 달라서 구분이 된다.
  function paletteOf(str) {
    const h = hueOf(str);
    return { hue: (h % 12) * 30 + 14, pattern: Math.floor(h / 12) % 3 };
  }

  // 브랜드 이름에서 머리글자를 뽑는다. 괄호 안 설명은 버린다.
  function initials(name) {
    const head = String(name || '').replace(/[（(].*$/, '').trim();
    const ascii = head.match(/^[A-Za-z]+/);
    if (ascii) {
      const w = ascii[0];
      return (w.length <= 3 ? w : w.slice(0, 2)).toUpperCase();
    }
    return head.slice(0, 1);
  }

  // 브랜드 표식. 머리글자 칩을 항상 먼저 깔고, 공식 파비콘을 가져오면 그 위에 덮는다.
  // 외부 서비스가 막혀 있거나 광고 차단기에 걸려도 표식 자체는 사라지지 않는다.
  function brandMark(p) {
    const mark = el('span', 'brand-badge', initials(p.brand));
    mark.style.setProperty('--h', paletteOf(p.brand).hue);
    if (!p.brandDomain) return mark;

    const tries = [
      `https://www.google.com/s2/favicons?domain=${p.brandDomain}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${p.brandDomain}.ico`,
    ];
    const img = el('img', 'brand-logo');
    img.alt = '';
    img.loading = 'lazy';
    let i = 0;
    img.addEventListener('error', () => {
      i += 1;
      if (i < tries.length) img.src = tries[i];
      else img.remove();          // 머리글자 칩이 그대로 남는다
    });
    img.src = tries[0];
    mark.append(img);
    return mark;
  }

  function pairLine(p, cls) {
    const line = el('p', cls);
    line.append(brandMark(p));
    line.append(document.createTextNode(`${(p.ip || []).join(' · ')} × ${p.brand}`));
    return line;
  }

  // p.image가 있으면 실제 사진, 없으면 자동 생성 카드
  function thumb(p, big) {
    const cat = state.catMap.get(p.category);
    const ipName = (p.ip || [])[0] || p.brand || '';
    const box = el('div', `thumb${big ? ' thumb-lg' : ''}`);
    const { hue, pattern } = paletteOf(ipName);
    box.style.setProperty('--h', hue);
    box.dataset.pat = pattern;

    // 이모지 대신 직접 그린 SVG 일러스트 (index.html의 스프라이트)
    const ill = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ill.setAttribute('class', 'thumb-ill');
    ill.setAttribute('viewBox', '0 0 100 100');
    ill.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#ill-${p.category}`);
    ill.append(use);
    box.append(ill);
    box.append(el('span', 'thumb-ip', (p.ip || []).join(' · ') || p.brand));

    if (p.image) {
      const img = el('img', 'thumb-img');
      img.src = p.image;
      img.alt = `${p.title} 이미지`;
      img.loading = 'lazy';
      // 사진이 깨지면 자동 생성 카드가 그대로 보이도록 숨긴다
      img.addEventListener('error', () => img.remove());
      box.append(img);
      if (p.imageCredit) box.append(el('span', 'thumb-credit', p.imageCredit));
    }
    return box;
  }

  /* ---------- status ---------- */
  function statusOf(p) {
    if (!p.startDate) return 'undated';
    const now = today();
    const s = parseDate(p.startDate);
    if (now < s) return 'soon';
    if (!p.endDate) return p.openEnded ? 'live' : 'ended';
    return now > parseDate(p.endDate) ? 'ended' : 'live';
  }
  function dday(p) {
    const st = statusOf(p);
    const now = today();
    if (st === 'soon') {
      const n = Math.round((parseDate(p.startDate) - now) / DAY);
      return n === 0 ? '오늘 오픈' : `D-${n}`;
    }
    if (st === 'live' && !p.endDate) return '종료일 미정';
    if (st === 'live' && p.endDate) {
      const n = Math.round((parseDate(p.endDate) - now) / DAY);
      return n === 0 ? '오늘 마감' : `${n}일 남음`;
    }
    return '';
  }

  /* ---------- filtering ---------- */
  function matches(p, { status = state.status, category = state.category, area = state.area } = {}) {
    if (status !== 'all' && statusOf(p) !== status) return false;
    if (category !== 'all' && p.category !== category) return false;
    if (area !== 'all' && !(p.areas || []).includes(area)) return false;
    if (state.query) {
      const hay = [p.title, p.brand, p.venue, p.region, p.type, p.summary,
                   ...(p.ip || []), ...(p.areas || []), ORIGIN[p.ipOrigin] || '',
                   state.catMap.get(p.category)?.label || '']
        .join(' ').toLowerCase();
      if (!hay.includes(state.query)) return false;
    }
    return true;
  }
  function visible() { return state.popups.filter((p) => matches(p)); }

  function sortList(list) {
    const now = today();
    const order = { live: 0, soon: 1, undated: 2, ended: 3 };
    const copy = [...list];
    if (state.sort === 'name') {
      copy.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else if (state.sort === 'latest') {
      copy.sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    } else {
      copy.sort((a, b) => {
        const sa = statusOf(a), sb = statusOf(b);
        if (order[sa] !== order[sb]) return order[sa] - order[sb];
        if (sa === 'live') {
          const ea = a.endDate ? parseDate(a.endDate) : now;
          const eb = b.endDate ? parseDate(b.endDate) : now;
          return ea - eb;                    // 먼저 끝나는 것부터
        }
        if (sa === 'soon') return parseDate(a.startDate) - parseDate(b.startDate);
        if (sa === 'ended') return (b.endDate || '').localeCompare(a.endDate || '');
        return a.title.localeCompare(b.title, 'ko');
      });
    }
    return copy;
  }

  /* ---------- render: stats ---------- */
  function renderStats() {
    const box = $('#stats');
    box.textContent = '';
    const counts = { live: 0, soon: 0, ended: 0, undated: 0 };
    state.popups.forEach((p) => counts[statusOf(p)]++);
    const items = [
      { n: counts.live, label: '진행 중', cls: 'live' },
      { n: counts.soon, label: '오픈 예정', cls: 'soon' },
      { n: state.popups.length, label: '전체 기록', cls: '' },
    ];
    items.forEach((it) => {
      const s = el('div', `stat ${it.cls}`.trim());
      s.append(el('div', 'stat-num', String(it.n)), el('div', 'stat-label', it.label));
      box.append(s);
    });
  }

  /* ---------- render: chips ---------- */
  function renderChips() {
    const statusBox = $('#statusChips');
    statusBox.textContent = '';
    const statusDefs = [
      { id: 'all', label: '전체' },
      { id: 'live', label: '진행 중' },
      { id: 'soon', label: '오픈 예정' },
      { id: 'ended', label: '종료' },
      { id: 'undated', label: '기간 미정' },
    ];
    statusDefs.forEach((d) => {
      const n = state.popups.filter((p) =>
        matches(p, { status: d.id })).length;
      statusBox.append(makeChip(d.label, n, state.status === d.id, () => {
        state.status = d.id; render();
      }));
    });

    const catBox = $('#categoryChips');
    catBox.textContent = '';
    const catDefs = [{ id: 'all', label: '전체', emoji: '' }, ...state.categories];
    catDefs.forEach((c) => {
      const n = state.popups.filter((p) => matches(p, { category: c.id })).length;
      if (c.id !== 'all' && n === 0) return;
      const label = c.emoji ? `${c.emoji} ${c.label}` : c.label;
      catBox.append(makeChip(label, n, state.category === c.id, () => {
        state.category = c.id; render();
      }));
    });

    const areaBox = $('#areaChips');
    areaBox.textContent = '';
    [{ id: 'all', label: '전체' }, ...state.areas.map((a) => ({ id: a, label: a }))]
      .forEach((a) => {
        const n = state.popups.filter((p) => matches(p, { area: a.id })).length;
        if (a.id !== 'all' && n === 0) return;
        areaBox.append(makeChip(a.label, n, state.area === a.id, () => {
          state.area = a.id; render();
        }));
      });
  }

  function makeChip(label, count, active, onClick) {
    const b = el('button', `chip${active ? ' is-active' : ''}`);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(active));
    b.append(document.createTextNode(label));
    b.append(el('span', 'count', String(count)));
    b.addEventListener('click', onClick);
    return b;
  }

  /* ---------- render: list ---------- */
  function renderList() {
    const list = sortList(visible());
    const box = $('#cards');
    box.textContent = '';
    $('#empty').hidden = list.length > 0;
    $('#resultCount').innerHTML = `총 <b>${list.length}</b>건`;

    list.forEach((p) => {
      const st = statusOf(p);
      const card = el('button', 'card');
      card.type = 'button';

      const cat = state.catMap.get(p.category);
      const th = thumb(p);
      const badges = el('div', 'thumb-badges');
      badges.append(el('span', `badge ${STATUS[st].cls}`, STATUS[st].label));
      const d = dday(p);
      if (d) badges.append(el('span', 'badge over', d));
      if (p.type && p.type !== '팝업스토어') badges.append(el('span', 'badge over', p.type));
      th.append(badges);
      if (cat) th.append(el('span', 'thumb-cat', `${cat.emoji} ${cat.label}`));

      const meta = el('div', 'card-meta');
      meta.append(
        row('기간', period(p)),
        row('장소', p.venue || p.region || '-'),
      );

      const body = el('div', 'card-body');
      body.append(
        el('h3', 'card-title', p.title),
        pairLine(p, 'card-pair'),
        meta,
        el('p', 'card-more', '자세히 보기 →'),
      );
      card.append(th, body);
      card.addEventListener('click', () => openModal(p));
      box.append(card);
    });
  }

  function row(k, v) {
    const d = el('div');
    d.append(el('span', 'k', k), el('span', 'v', v));
    return d;
  }

  /* ---------- render: calendar ---------- */
  function renderCalendar() {
    const grid = $('#calGrid');
    grid.textContent = '';
    const cur = state.cursor;
    $('#calTitle').textContent = `${cur.getFullYear()}년 ${cur.getMonth() + 1}월`;

    DOW.forEach((d, i) => {
      grid.append(el('div', `cal-dow${i === 0 ? ' sun' : ''}`, d));
    });

    const first = startOfMonth(cur);
    const gridStart = new Date(first);
    gridStart.setDate(1 - first.getDay());
    const dated = visible().filter((p) => p.startDate);
    const now = iso(today());

    // 필요한 주 수만 그린다 (마지막 빈 주 생략)
    const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    const cells = Math.ceil((first.getDay() + daysInMonth) / 7) * 7;

    for (let i = 0; i < cells; i++) {
      const day = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const key = iso(day);
      const out = day.getMonth() !== cur.getMonth();
      const cell = el('div', `cal-cell${out ? ' is-out' : ''}${key === now ? ' is-today' : ''}`);
      cell.append(el('div', 'cal-date', String(day.getDate())));

      const onDay = dated.filter((p) => {
        const s = p.startDate;
        const e = p.endDate || (p.openEnded ? now : p.startDate);
        return key >= s && key <= e;
      });
      onDay.slice(0, 3).forEach((p) => {
        const ev = el('button', `cal-ev${p.startDate === key ? ' is-start' : ''}`, p.title);
        ev.type = 'button';
        ev.title = `${p.title} — ${period(p)}`;
        ev.addEventListener('click', () => openModal(p));
        cell.append(ev);
      });
      if (onDay.length > 3) cell.append(el('div', 'cal-more', `+${onDay.length - 3}`));
      grid.append(cell);
    }
  }

  /* ---------- modal ---------- */
  let lastFocus = null;
  function openModal(p) {
    lastFocus = document.activeElement;
    const body = $('#modalBody');
    body.textContent = '';
    const st = statusOf(p);
    const cat = state.catMap.get(p.category);

    body.append(thumb(p, true));

    const badges = el('div', 'badges');
    badges.append(el('span', `badge ${STATUS[st].cls}`, STATUS[st].label));
    const d = dday(p);
    if (d) badges.append(el('span', 'badge type', d));
    if (p.type) badges.append(el('span', 'badge type', p.type));
    body.append(badges);

    const h = el('h3', 'modal-title', p.title);
    h.id = 'modalTitle';
    body.append(h);
    body.append(pairLine(p, 'modal-pair'));
    if (p.summary) body.append(el('p', 'modal-summary', p.summary));

    if (p.official?.url) {
      const a = el('a', 'official-link');
      a.href = p.official.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.append(el('span', 'official-icon', '📷'));
      const t = el('span', 'official-text');
      t.append(el('strong', null, '공식 페이지에서 포스터·사진 보기'),
               el('small', null, p.official.label));
      a.append(t, el('span', 'official-arrow', '→'));
      body.append(a);
    }

    const info = el('div', 'info-table');
    const rows = [
      ['기간', period(p)],
      ['장소', p.venue || '-'],
      ['지역', p.region || '-'],
      ['동네', (p.areas || []).join(' · ')],
      ['운영시간', p.hours || '-'],
      ['입장', p.reservation || '-'],
      ['업종', cat ? `${cat.emoji} ${cat.label}` : '-'],
      ['캐릭터', ORIGIN[p.ipOrigin] || ''],
    ];
    rows.forEach(([k, v]) => { if (v && v !== '-') info.append(row(k, v)); });
    body.append(section('기본 정보', info));

    if (p.highlights?.length) {
      const ul = el('ul', 'hl-list');
      p.highlights.forEach((t) => ul.append(el('li', null, t)));
      body.append(section('이런 게 있어요', ul));
    }

    if (p.sources?.length) {
      const ul = el('ul', 'src-list');
      p.sources.forEach((s) => {
        const li = el('li');
        const a = el('a', null, s.title);
        a.href = s.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
        li.append(a);
        ul.append(li);
      });
      body.append(section('출처', ul));
    }

    if (p.note) body.append(el('p', 'modal-note', `⚠️ ${p.note}`));

    const m = $('#modal');
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-close').focus();
  }

  function section(title, node) {
    const s = el('div', 'modal-section');
    s.append(el('h4', null, title), node);
    return s;
  }

  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    lastFocus?.focus();
  }

  /* ---------- render root ---------- */
  function render() {
    renderStats();
    renderChips();
    if (state.view === 'list') renderList();
    else renderCalendar();
  }

  /* ---------- events ---------- */
  function bind() {
    $('#search').addEventListener('input', (e) => {
      state.query = e.target.value.trim().toLowerCase();
      render();
    });

    $('#sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderList();
    });

    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.view = btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
        $('#listView').hidden = state.view !== 'list';
        $('#calendarView').hidden = state.view !== 'calendar';
        render();
      });
    });

    $('#prevMonth').addEventListener('click', () => {
      state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() - 1, 1);
      renderCalendar();
    });
    $('#nextMonth').addEventListener('click', () => {
      state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + 1, 1);
      renderCalendar();
    });
    $('#todayBtn').addEventListener('click', () => {
      state.cursor = startOfMonth(new Date());
      renderCalendar();
    });

    document.querySelectorAll('[data-close]').forEach((n) =>
      n.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
    });
  }

  /* ---------- boot ---------- */
  async function init() {
    let data;
    try {
      const res = await fetch('data/popups.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      $('#cards').append(el('p', 'empty',
        '데이터를 불러오지 못했습니다. 로컬에서 열었다면 `npx serve` 같은 정적 서버로 실행해 주세요.'));
      return;
    }

    state.popups = data.popups || [];
    state.categories = data.categories || [];
    state.areas = data.areas || [];
    state.categories.forEach((c) => state.catMap.set(c.id, c));
    $('#updatedAt').textContent = data.meta?.updatedAt || '';
    $('#disclaimer').textContent = data.meta?.disclaimer || '';

    bind();
    render();
  }

  init();
})();

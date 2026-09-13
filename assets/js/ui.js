/* ===========================================================
   공통 UI — 네비게이션, 햄버거 서랍, 푸터, 스크롤 애니메이션
   페이지마다 마크업을 복사하지 않으려고 한 곳에서 만들어 넣는다.
   =========================================================== */
(() => {
  'use strict';

  const PAGES = [
    { id: 'home',    href: 'index.html',   emoji: '🏠', label: '홈' },
    { id: 'find',    href: 'find.html',    emoji: '🔍', label: '팝업 찾기' },
    { id: 'shop',    href: 'shop.html',    emoji: '🎁', label: '팝업 상품',  tag: '준비 중' },
    { id: 'booking', href: 'booking.html', emoji: '🎫', label: '팝업 예약',  tag: '준비 중' },
    { id: 'my',      href: 'my.html',      emoji: '🎀', label: '마이페이지' },
  ];

  const current = document.body.dataset.page || 'home';
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- 네비게이션 ---------- */
  function buildNav() {
    const nav = el('header', 'nav');
    const inner = el('div', 'wrap nav-inner');

    const burger = el('button', 'nav-burger');
    burger.type = 'button';
    burger.setAttribute('aria-label', '메뉴 열기');
    burger.setAttribute('aria-expanded', 'false');
    burger.append(el('span'), el('span'), el('span'));

    const logo = document.createElement('a');
    logo.className = 'nav-logo';
    logo.href = 'index.html';
    logo.append(el('span', 'nav-logo-mark', '🎪'), el('span', 'nav-logo-text', '팝업 캘린더'));

    const links = el('nav', 'nav-links');
    links.setAttribute('aria-label', '주요 메뉴');
    PAGES.filter((p) => p.id !== 'home' && p.id !== 'my').forEach((p) => {
      const a = document.createElement('a');
      a.href = p.href;
      a.textContent = p.label;
      if (p.id === current) a.classList.add('is-current');
      links.append(a);
    });

    const cta = document.createElement('a');
    cta.className = 'btn btn-primary btn-sm nav-cta';
    cta.href = 'my.html';
    cta.textContent = '로그인';
    cta.dataset.authCta = '';

    inner.append(burger, logo, links, cta);
    nav.append(inner);
    return { nav, burger };
  }

  /* ---------- 햄버거 서랍 ---------- */
  function buildDrawer() {
    const drawer = el('div', 'drawer');
    drawer.hidden = true;
    const scrim = el('div', 'drawer-scrim');
    const panel = el('div', 'drawer-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', '전체 메뉴');

    const head = el('div', 'drawer-head');
    const title = el('div', 'nav-logo');
    title.append(el('span', 'nav-logo-mark', '🎪'), el('span', 'nav-logo-text', '팝업 캘린더'));
    const close = el('button', 'drawer-close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', '메뉴 닫기');
    head.append(title, close);

    const menu = el('nav', 'drawer-menu');
    PAGES.forEach((p, i) => {
      const a = document.createElement('a');
      a.href = p.href;
      a.style.setProperty('--i', i);
      if (p.id === current) { a.classList.add('is-current'); a.setAttribute('aria-current', 'page'); }
      a.append(el('span', 'emoji', p.emoji), el('span', null, p.label));
      if (p.tag) a.append(el('span', 'tag', p.tag));
      menu.append(a);
    });

    const foot = el('div', 'drawer-foot');
    foot.append(el('p', null, '캐릭터 × 브랜드 콜라보 팝업을 한곳에서'));

    panel.append(head, menu, foot);
    drawer.append(scrim, panel);
    return { drawer, scrim, close, panel };
  }

  /* ---------- 푸터 ---------- */
  function buildFooter() {
    const foot = el('footer', 'foot');
    const inner = el('div', 'wrap foot-inner');

    const left = el('div');
    const brand = el('div', 'foot-brand');
    brand.append(el('span', null, '🎪'), el('span', null, '팝업 캘린더'));
    left.append(brand, el('p', 'foot-note',
      '운영 기간과 시간은 주최 측 사정으로 바뀔 수 있어요. 방문 전 공식 채널에서 한 번 더 확인해주세요.'));

    const links = el('nav', 'foot-links');
    links.setAttribute('aria-label', '푸터 메뉴');
    PAGES.forEach((p) => {
      const a = document.createElement('a');
      a.href = p.href;
      a.textContent = p.label;
      links.append(a);
    });

    inner.append(left, links);
    foot.append(inner);
    return foot;
  }

  /* ---------- 조립 ---------- */
  const { nav, burger } = buildNav();
  const { drawer, scrim, close, panel } = buildDrawer();
  document.body.prepend(drawer);
  document.body.prepend(nav);
  document.body.append(buildFooter());

  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.drawer-close').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(() => { drawer.hidden = true; }, 400);
    lastFocus?.focus();
  }
  burger.addEventListener('click', openDrawer);
  close.addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  /* 스크롤하면 네비에 경계선을 준다 */
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 스크롤 등장 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });

  window.revealAll = (root = document) => {
    root.querySelectorAll('.reveal:not(.is-in)').forEach((n) => io.observe(n));
  };
  window.revealAll();

  /* ---------- 숫자 카운트업 ---------- */
  const counters = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const node = e.target;
      counters.unobserve(node);
      const target = Number(node.dataset.count || 0);
      const dur = 1100;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        node.textContent = Math.round(target * eased).toLocaleString('ko-KR');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  window.countUpAll = (root = document) => {
    root.querySelectorAll('[data-count]').forEach((n) => counters.observe(n));
  };
  window.countUpAll();
})();

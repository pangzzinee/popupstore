/* ===========================================================
   마이페이지 — 내 동네 설정 + 로그인/회원가입
   =========================================================== */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };

  function toast(box, text, ok = true) {
    box.textContent = text;
    box.className = `auth-msg is-on ${ok ? 'ok' : 'bad'}`;
  }

  /* ---------- 내 동네 ---------- */
  const select = $('#areaSelect');
  const placeMsg = $('#placeMsg');

  Place.AREAS.forEach((a) => {
    const o = document.createElement('option');
    o.value = a.id; o.textContent = a.label;
    select.append(o);
  });

  function paintPlace() {
    const p = Place.get();
    $('#placeNow').textContent = p ? p.label : '아직 없음';
    if (p?.id) select.value = p.id;
  }
  paintPlace();
  window.addEventListener('place:change', paintPlace);

  $('#savePlace').addEventListener('click', async () => {
    const area = Place.byId(select.value);
    if (!area) return toast(placeMsg, '동네를 먼저 골라주세요.', false);
    Place.set({ ...area });
    toast(placeMsg, `${area.label}(으)로 저장했어요! 이제 팝업 찾기에서 ‘내 주변’을 눌러보세요.`);
    if (Auth.user) {
      try { await Auth.saveProfile({ area_id: area.id }); } catch { /* 계정 저장 실패는 조용히 넘어간다 */ }
    }
  });

  $('#locateBtn').addEventListener('click', async () => {
    toast(placeMsg, '위치를 확인하고 있어요…');
    try {
      const found = await Place.locate();
      Place.set(found);
      toast(placeMsg, `가장 가까운 동네를 ${found.label}(으)로 잡았어요.`);
      if (Auth.user && found.id) {
        try { await Auth.saveProfile({ area_id: found.id }); } catch { /* 무시 */ }
      }
    } catch (e) {
      toast(placeMsg, e.message, false);
    }
  });

  $('#clearPlace').addEventListener('click', () => {
    Place.set(null);
    select.value = '';
    toast(placeMsg, '내 동네를 지웠어요.');
  });

  /* ---------- 로그인 / 회원가입 ---------- */
  const area = $('#authArea');

  function setupNotice() {
    const box = el('div', 'setup-note');
    box.append(el('h3', null, '🔑 회원 기능을 켜려면 한 단계가 남았어요'));
    box.append(el('p', null,
      'Supabase 프로젝트를 만들고 키 두 개만 넣으면 바로 회원가입이 열립니다. 지금도 내 동네 설정은 쓸 수 있어요.'));
    const ol = document.createElement('ol');
    [
      'supabase.com 에서 무료 프로젝트를 만듭니다',
      'Project Settings → API 에서 Project URL과 anon public 키를 복사합니다',
      'assets/js/config.js 의 SUPABASE_URL, SUPABASE_ANON_KEY 에 붙여넣습니다',
    ].forEach((t) => ol.append(el('li', null, t)));
    box.append(ol);
    area.append(box);
  }

  function authForm() {
    const wrap = el('div', 'auth-wrap reveal');
    const tabs = el('div', 'auth-tabs');
    const tIn = el('button', 'auth-tab is-on', '로그인');
    const tUp = el('button', 'auth-tab', '회원가입');
    tIn.type = tUp.type = 'button';
    tabs.append(tIn, tUp);

    const form = document.createElement('form');
    const nick = field('nickname', '닉네임', 'text', '팝업덕후');
    nick.hidden = true;
    const mail = field('email', '이메일', 'email', 'hello@example.com');
    const pass = field('password', '비밀번호', 'password', '6자 이상');
    const submit = el('button', 'btn btn-primary auth-submit', '로그인');
    submit.type = 'submit';
    form.append(nick, mail, pass, submit);

    const msg = el('div', 'auth-msg');
    msg.setAttribute('role', 'status');

    let mode = 'in';
    const setMode = (m) => {
      mode = m;
      tIn.classList.toggle('is-on', m === 'in');
      tUp.classList.toggle('is-on', m === 'up');
      nick.hidden = m !== 'up';
      submit.textContent = m === 'in' ? '로그인' : '가입하기';
      msg.className = 'auth-msg';
    };
    tIn.addEventListener('click', () => setMode('in'));
    tUp.addEventListener('click', () => setMode('up'));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('#email').value.trim();
      const password = form.querySelector('#password').value;
      const nickname = form.querySelector('#nickname').value.trim();
      submit.disabled = true;
      submit.textContent = '잠시만요…';
      try {
        if (mode === 'up') {
          await Auth.signUp({ email, password, nickname });
          toast(msg, '가입 메일을 보냈어요! 메일함에서 인증 링크를 눌러주세요. 🎉');
        } else {
          await Auth.signIn({ email, password });
          toast(msg, '반가워요! 잠시 후 화면이 바뀝니다.');
        }
      } catch (err) {
        toast(msg, err.message, false);
      } finally {
        submit.disabled = false;
        setMode(mode);
      }
    });

    wrap.append(tabs, form, msg);
    return wrap;
  }

  function field(id, label, type, placeholder) {
    const f = el('div', 'field');
    const l = document.createElement('label');
    l.htmlFor = id; l.textContent = label;
    const i = document.createElement('input');
    i.id = id; i.name = id; i.type = type; i.placeholder = placeholder;
    i.autocomplete = type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'nickname';
    if (type !== 'text') i.required = true;
    f.append(l, i);
    return f;
  }

  function profileCard(user) {
    const wrap = el('div', 'profile');
    const card = el('section', 'pcard reveal');
    const hello = el('div', 'p-hello');
    hello.append(el('div', 'p-avatar', '🎀'));
    const who = el('div');
    who.append(
      el('b', null, `${user.user_metadata?.nickname || '팝업덕후'}님, 안녕하세요!`),
      el('span', null, user.email || ''),
    );
    hello.append(who);
    const actions = el('div', 'p-actions');
    const out = el('button', 'btn btn-ghost btn-sm', '로그아웃');
    out.type = 'button';
    out.addEventListener('click', () => Auth.signOut());
    const go = document.createElement('a');
    go.className = 'btn btn-primary btn-sm';
    go.href = 'find.html';
    go.textContent = '내 주변 팝업 보기 →';
    actions.append(go, out);

    card.append(hello, actions);
    wrap.append(card);
    return wrap;
  }

  function render() {
    area.textContent = '';
    if (!Auth.configured) { setupNotice(); return; }
    area.append(Auth.user ? profileCard(Auth.user) : authForm());
    window.revealAll?.(area);
  }

  Auth.onChange(render);
  render();
})();

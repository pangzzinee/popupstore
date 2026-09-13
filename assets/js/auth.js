/* ===========================================================
   Supabase 인증
   키가 비어 있으면 SDK를 아예 부르지 않고 "설정 필요" 상태로 둔다.
   프로필(닉네임·동네)은 별도 테이블 없이 user_metadata에 담는다.
   =========================================================== */
(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const configured = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const listeners = new Set();

  const Auth = {
    configured,
    client: null,
    user: null,
    ready: null,
    onChange(fn) { listeners.add(fn); if (Auth.ready) Auth.ready.then(() => fn(Auth.user)); return () => listeners.delete(fn); },
  };
  const emit = () => listeners.forEach((fn) => fn(Auth.user));

  function loadSdk() {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('로그인 모듈을 불러오지 못했어요.'));
      document.head.append(s);
    });
  }

  Auth.ready = (async () => {
    if (!configured) return null;
    try {
      await loadSdk();
      Auth.client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const { data } = await Auth.client.auth.getSession();
      Auth.user = data?.session?.user || null;
      Auth.client.auth.onAuthStateChange((_e, session) => {
        Auth.user = session?.user || null;
        syncPlaceFromUser();
        emit();
      });
      syncPlaceFromUser();
    } catch (err) {
      Auth.error = err.message;
    }
    emit();
    return Auth.user;
  })();

  /* 로그인 계정에 저장된 동네를 이 기기에도 반영한다 */
  function syncPlaceFromUser() {
    const area = Auth.user?.user_metadata?.area_id;
    if (!area || !window.Place) return;
    const local = window.Place.get();
    if (local?.id === area) return;
    const found = window.Place.byId(area);
    if (found) window.Place.set({ ...found });
  }

  const need = () => {
    if (!configured) throw new Error('아직 회원 기능이 연결되지 않았어요.');
    if (!Auth.client) throw new Error(Auth.error || '로그인 모듈을 준비하지 못했어요.');
  };

  Auth.signUp = async ({ email, password, nickname }) => {
    need();
    const { data, error } = await Auth.client.auth.signUp({
      email, password,
      options: { data: { nickname: nickname || email.split('@')[0] } },
    });
    if (error) throw new Error(translate(error.message));
    return data;
  };

  Auth.signIn = async ({ email, password }) => {
    need();
    const { data, error } = await Auth.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translate(error.message));
    return data;
  };

  Auth.signOut = async () => { need(); await Auth.client.auth.signOut(); };

  Auth.saveProfile = async (patch) => {
    need();
    const { error } = await Auth.client.auth.updateUser({ data: patch });
    if (error) throw new Error(translate(error.message));
  };

  /* Supabase 오류 문구는 영어라 자주 보는 것만 우리말로 바꿔준다 */
  function translate(msg = '') {
    const m = msg.toLowerCase();
    if (m.includes('invalid login')) return '이메일 또는 비밀번호가 맞지 않아요.';
    if (m.includes('already registered')) return '이미 가입된 이메일이에요. 로그인해주세요.';
    if (m.includes('password should be')) return '비밀번호는 6자 이상으로 해주세요.';
    if (m.includes('unable to validate email') || m.includes('invalid email')) return '이메일 형식을 확인해주세요.';
    if (m.includes('email not confirmed')) return '메일함에서 인증 링크를 먼저 눌러주세요.';
    if (m.includes('rate limit')) return '잠시 후 다시 시도해주세요.';
    return msg;
  }

  window.Auth = Auth;

  /* 상단 네비 버튼을 로그인 상태에 맞춰 바꾼다 */
  Auth.onChange((user) => {
    document.querySelectorAll('[data-auth-cta]').forEach((a) => {
      const name = user?.user_metadata?.nickname;
      a.textContent = user ? `${name ? name + '님' : '마이페이지'}` : '로그인';
    });
  });
})();

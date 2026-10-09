// =====================================================
//  screens.js - 화면 오가기 (메인 ↔ 설정 ↔ 프로필 / 언어)
//
//  주소 끝(#...)으로 지금 화면을 정해요.
//    (없음)              → 메인 화면
//    #settings           → 설정
//    #settings/profile   → 프로필
//    #settings/language  → 언어
//  이렇게 하면 폰의 "뒤로 가기" 버튼으로도 한 칸씩 돌아올 수 있어요.
//  새 화면을 만들면 SCREENS에 한 줄 더하면 돼요.
// =====================================================

const Screens = {
  // 화면 이름: { 주소, 화면 칸 id, 뒤로 가면 갈 화면 }
  SCREENS: {
    main:     { hash: '',                   el: 'main-view',     parent: null },
    settings: { hash: '#settings',          el: 'settings-view', parent: 'main' },
    profile:  { hash: '#settings/profile',  el: 'profile-view',  parent: 'settings' },
    language: { hash: '#settings/language', el: 'language-view', parent: 'settings' },
    quote:    { hash: '#settings/quote',    el: 'quote-view',    parent: 'settings' },
  },

  onShow: {},   // 화면이 보일 때 할 일 (예: 프로필 화면이 열리면 입력칸 채우기)

  // 지금 주소에 맞는 화면 이름
  current() {
    for (const [name, screen] of Object.entries(this.SCREENS)) {
      if (screen.hash && location.hash === screen.hash) return name;
    }
    return 'main';
  },

  url(name) {
    return this.SCREENS[name].hash || location.pathname + location.search;
  },

  // 다른 화면으로 가기
  go(name) {
    history.pushState({ inApp: true }, '', this.url(name));
    this.show();
  },

  // ← 버튼: 앱 안에서 들어왔으면 "뒤로 가기"와 똑같이, 주소로 바로 열었으면 한 칸 위 화면으로
  back() {
    if (history.state && history.state.inApp) {
      history.back();
    } else {
      const parent = this.SCREENS[this.current()].parent || 'main';
      history.replaceState(null, '', this.url(parent));
      this.show();
    }
  },

  // 지금 화면만 보이고 나머지는 숨기기
  show() {
    const name = this.current();
    for (const [key, screen] of Object.entries(this.SCREENS)) {
      document.getElementById(screen.el).hidden = key !== name;
    }
    window.scrollTo(0, 0);
    if (this.onShow[name]) this.onShow[name]();
  },
};

// 폰/브라우저의 뒤로 가기 버튼을 눌렀을 때
window.addEventListener('popstate', () => Screens.show());

// 화면마다 있는 ← 버튼 (data-back이 붙은 버튼)
document.querySelectorAll('[data-back]').forEach((button) => {
  button.addEventListener('click', () => Screens.back());
});

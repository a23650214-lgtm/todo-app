// =====================================================
//  appearance.js - 🌓 화면 모드 (라이트 / 다크 / 기기 설정)
//  ⚙️ 설정 화면에서 골라요. 고르면 <html data-theme="…">를 바꾸고,
//  style.css가 그에 맞는 색을 써요.
//  (앱을 열 때 밝은 화면이 번쩍이지 않게, index.html 맨 위에서도 한 번 먼저 적용해요)
// =====================================================

const Appearance = {
  MODES: [
    { key: 'light',  label: '☀️ 라이트' },
    { key: 'dark',   label: '🌙 다크' },
    { key: 'system', label: '📱 기기 설정' },
  ],

  groupEl: document.getElementById('appearance-options'),

  // 앱 전체에 적용
  apply(mode) {
    if (mode === 'light' || mode === 'dark') {
      document.documentElement.dataset.theme = mode;
    } else {
      delete document.documentElement.dataset.theme;   // 기기 설정: 폰을 따라가요
    }
  },

  // 처음 한 번: 버튼 세 개 만들기
  setup({ getData, onChange }) {
    for (const mode of this.MODES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'appearance-option';
      button.dataset.mode = mode.key;
      button.textContent = mode.label;
      button.addEventListener('click', () => {
        getData().settings.appearance = mode.key;
        this.apply(mode.key);
        onChange();
      });
      this.groupEl.appendChild(button);
    }
  },

  // 지금 고른 버튼 표시
  render({ data }) {
    const current = data.settings.appearance || 'system';
    for (const button of this.groupEl.children) {
      const on = button.dataset.mode === current;
      button.classList.toggle('current', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  },
};

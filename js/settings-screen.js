// =====================================================
//  settings-screen.js - ⚙️ 설정 화면, 👤 프로필 화면, 🌐 언어 화면
//  (글씨체 고르는 창은 fonts.js, 알림 스위치는 settings-view.js가 그대로 맡아요)
// =====================================================

const SettingsScreen = {
  // 언어 목록: 나중에 다른 언어를 넣을 때 여기에 한 줄씩 더하면 돼요
  //   예) { key: 'en', name: 'English', note: '영어' }
  LANGUAGES: [
    { key: 'ko', name: '한국어', note: 'Korean' },
  ],

  NICKNAME_MAX: 20,

  // 메인 화면 맨 위
  greetingEl: document.getElementById('greeting'),
  // 설정 화면
  profileCurrentEl: document.getElementById('profile-current'),
  languageCurrentEl: document.getElementById('language-current'),
  // 프로필 화면
  profilePreviewEl: document.getElementById('profile-preview'),
  nicknameInput: document.getElementById('nickname-input'),
  savedEl: document.getElementById('profile-saved'),
  // 언어 화면
  languageListEl: document.getElementById('language-list'),

  findLanguage(key) {
    return this.LANGUAGES.find(l => l.key === key) || this.LANGUAGES[0];
  },

  // onChange: 설정이 바뀌었을 때 할 일 (저장하고 다시 그리기)
  setup({ getData, onChange }) {
    // 화면 들어가는 버튼들
    document.getElementById('open-settings').addEventListener('click', () => Screens.go('settings'));
    document.getElementById('open-profile').addEventListener('click', () => Screens.go('profile'));
    document.getElementById('open-language').addEventListener('click', () => Screens.go('language'));

    // 프로필 화면이 열릴 때: 입력칸에 지금 별명 채우기
    Screens.onShow.profile = () => {
      this.nicknameInput.value = getData().profile.nickname;
      this.savedEl.hidden = true;
    };

    // 별명 저장
    document.getElementById('profile-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const nickname = this.nicknameInput.value.trim().slice(0, this.NICKNAME_MAX);
      getData().profile.nickname = nickname;
      this.nicknameInput.value = nickname;
      onChange();
      // "저장했어요"를 잠깐 보여 주기
      this.savedEl.textContent = nickname ? '✅ 저장했어요' : '✅ 별명을 지웠어요';
      this.savedEl.hidden = false;
      clearTimeout(this.savedTimer);
      this.savedTimer = setTimeout(() => { this.savedEl.hidden = true; }, 2500);
    });

    // 언어 목록 버튼 만들기
    for (const language of this.LANGUAGES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'settings-row language-option';
      button.dataset.language = language.key;
      button.innerHTML = '<span class="settings-label"></span><small class="settings-value"></small><span class="language-check">✓</span>';
      button.querySelector('.settings-label').textContent = language.name;
      button.querySelector('.settings-value').textContent = language.note;
      button.addEventListener('click', () => {
        getData().settings.language = language.key;
        onChange();
      });
      this.languageListEl.appendChild(button);
    }
  },

  render({ data }) {
    const nickname = data.profile.nickname;
    const language = this.findLanguage(data.settings.language);

    // 메인 화면 맨 위 인사
    this.greetingEl.textContent = nickname ? `👋 ${nickname}님` : '📅 할 일 달력';

    // 설정 화면 오른쪽 값
    this.profileCurrentEl.textContent = nickname || '설정 안 함';
    this.languageCurrentEl.textContent = language.name;

    // 프로필 화면 미리보기
    this.profilePreviewEl.textContent = nickname ? `${nickname}님` : '별명을 정해 주세요';

    // 언어 화면: 고른 언어에 ✓
    for (const button of this.languageListEl.children) {
      button.classList.toggle('current', button.dataset.language === language.key);
    }
    document.documentElement.lang = language.key;
  },
};

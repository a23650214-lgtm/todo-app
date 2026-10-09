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

  // (메인 화면 맨 위 인사는 아바타와 같이 보여야 해서 profile-view.js가 그려요)
  // 설정 화면
  profileCurrentEl: document.getElementById('profile-current'),
  languageCurrentEl: document.getElementById('language-current'),
  // 프로필 화면
  profilePreviewEl: document.getElementById('profile-preview'),
  nameKindEl: document.getElementById('profile-name-kind'),
  nicknameInput: document.getElementById('nickname-input'),
  savedEl: document.getElementById('profile-saved'),
  // 언어 화면
  languageListEl: document.getElementById('language-list'),
  // 💬 오늘의 문구 화면
  quoteCurrentEl: document.getElementById('quote-current'),
  quoteListEl: document.getElementById('quote-list'),
  quotePreviewLabelEl: document.getElementById('quote-preview-label'),
  quotePreviewTextEl: document.getElementById('quote-preview-text'),
  quotePreviewRefEl: document.getElementById('quote-preview-ref'),

  findLanguage(key) {
    return this.LANGUAGES.find(l => l.key === key) || this.LANGUAGES[0];
  },

  // onChange: 설정이 바뀌었을 때 할 일 (저장하고 다시 그리기)
  setup({ getData, onChange }) {
    // 화면 들어가는 버튼들
    document.getElementById('open-settings').addEventListener('click', () => Screens.go('settings'));
    document.getElementById('open-profile').addEventListener('click', () => Screens.go('profile'));
    document.getElementById('open-language').addEventListener('click', () => Screens.go('language'));
    document.getElementById('open-quote').addEventListener('click', () => Screens.go('quote'));

    // 💬 오늘의 문구 종류 버튼 만들기 (셋 중 하나만 골라요)
    for (const type of Quotes.TYPES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'settings-row language-option';
      button.dataset.quoteType = type.key;
      button.innerHTML = '<span class="settings-label"></span><small class="settings-value"></small><span class="language-check">✓</span>';
      button.querySelector('.settings-label').textContent = `${type.title.split(' ')[0]} ${type.name}`;
      button.querySelector('.settings-value').textContent = type.note;
      button.addEventListener('click', () => {
        getData().settings.quoteType = type.key;
        onChange();
      });
      this.quoteListEl.appendChild(button);
    }

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
      this.showSaved(nickname ? '✅ 저장했어요' : '✅ 직접 쓴 별명을 지웠어요. 랜덤 별명이 보여요');
    });

    // 🎲 랜덤으로 다시 뽑기
    document.getElementById('nickname-random').addEventListener('click', () => {
      const profile = getData().profile;
      if (profile.nickname && !confirm(`직접 정한 별명 '${profile.nickname}' 대신 랜덤 별명을 쓸까요?`)) return;
      profile.nickname = '';
      profile.randomNickname = Nicknames.generate(profile.randomNickname);
      this.nicknameInput.value = '';
      onChange();
      this.showSaved(`🎲 '${profile.randomNickname}'(으)로 정했어요`);
      // 이름이 살짝 통통 튀게
      this.profilePreviewEl.classList.remove('pop');
      void this.profilePreviewEl.offsetWidth;   // (움직임을 처음부터 다시 하려고 한 번 읽어 줘요)
      this.profilePreviewEl.classList.add('pop');
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

  // 아래에 "저장했어요" 같은 글을 잠깐 보여 주기
  showSaved(message) {
    this.savedEl.textContent = message;
    this.savedEl.hidden = false;
    clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => { this.savedEl.hidden = true; }, 2500);
  },

  render({ data }) {
    const name = Nicknames.display(data.profile);   // 직접 쓴 별명이 먼저, 없으면 랜덤 별명
    const language = this.findLanguage(data.settings.language);

    // 설정 화면 오른쪽 값
    this.profileCurrentEl.textContent = name || '설정 안 함';
    this.languageCurrentEl.textContent = language.name;

    // 프로필 화면 미리보기 + 어떤 별명인지
    this.profilePreviewEl.textContent = name ? Nicknames.withHonorific(name) : '별명을 정해 주세요';
    this.nameKindEl.textContent = Nicknames.isCustom(data.profile) ? '✏️ 직접 정한 별명' : '🎲 랜덤 별명';
    this.nicknameInput.placeholder = data.profile.randomNickname ? `예: ${data.profile.randomNickname}` : '예: 봉이';

    // 언어 화면: 고른 언어에 ✓
    for (const button of this.languageListEl.children) {
      button.classList.toggle('current', button.dataset.language === language.key);
    }
    document.documentElement.lang = language.key;

    // 💬 오늘의 문구: 설정 화면 오른쪽 값, 고른 종류에 ✓, 오늘 문구 미리보기
    const quoteType = Quotes.findType(data.settings.quoteType);
    this.quoteCurrentEl.textContent = quoteType.name;
    for (const button of this.quoteListEl.children) {
      button.classList.toggle('current', button.dataset.quoteType === quoteType.key);
    }
    const quote = Quotes.forDate(quoteType.key, DateUtil.todayKey());
    this.quotePreviewLabelEl.textContent = quoteType.title;
    this.quotePreviewTextEl.textContent = quote.text;
    this.quotePreviewRefEl.textContent = quote.ref ? `— ${quote.ref}` : '';
    this.quotePreviewRefEl.hidden = !quote.ref;
  },
};

// =====================================================
//  profile-view.js - 👤 프로필: 아바타(이모지/사진)와 내 테마 색
//  (별명 저장은 settings-screen.js가 그대로 맡아요)
// =====================================================

const ProfileView = {
  // 프로필용 이모지 (얼굴, 동물, 자연, 좋아하는 것들)
  AVATAR_EMOJIS: [
    '😀', '😊', '🥰', '😎', '🤓', '🥳',
    '😴', '🤗', '🐶', '🐱', '🐰', '🐻',
    '🐼', '🦊', '🐯', '🐸', '🐥', '🦄',
    '🐳', '🌸', '🌻', '🍀', '⭐', '🌙',
    '☀️', '🌈', '🍓', '🍑', '🎀', '💜',
    '🧸', '🎧', '⚽', '🎨', '📚', '☕',
  ],

  // 내 테마 색: 버튼 위 흰 글씨가 잘 보이는 진한 색들
  // 새 색을 넣고 싶으면 여기에 한 줄 더하면 돼요
  THEMES: [
    { key: 'blue',     name: '기본 파랑', hex: '#4a6cf7' },
    { key: 'indigo',   name: '남색',      hex: '#3b4cca' },
    { key: 'purple',   name: '보라',      hex: '#8e4ec6' },
    { key: 'lavender', name: '라벤더',    hex: '#7c6cf0' },
    { key: 'pink',     name: '분홍',      hex: '#e0457b' },
    { key: 'coral',    name: '코랄',      hex: '#ec5f59' },
    { key: 'orange',   name: '주황',      hex: '#e8650f' },
    { key: 'green',    name: '초록',      hex: '#2b9a62' },
    { key: 'teal',     name: '청록',      hex: '#11968a' },
    { key: 'brown',    name: '갈색',      hex: '#9a6446' },
  ],

  PHOTO_SIZE: 256,      // 사진은 가로세로 256px 정사각형으로 줄여서 저장해요

  avatarEl: document.getElementById('profile-avatar'),
  resetEl: document.getElementById('avatar-reset'),
  fileEl: document.getElementById('avatar-file'),
  errorEl: document.getElementById('avatar-error'),
  themeGridEl: document.getElementById('theme-grid'),
  headerAvatarEl: document.getElementById('header-avatar'),
  greetingEl: document.getElementById('greeting'),
  rowIconEl: document.getElementById('profile-row-icon'),

  findTheme(key) {
    return this.THEMES.find(t => t.key === key) || this.THEMES[0];
  },

  // ----- 테마 색 적용: 앱의 포인트 색(--포인트)을 바꿔요 -----
  applyTheme(key) {
    const theme = this.findTheme(key);
    document.documentElement.style.setProperty('--포인트', theme.hex);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme.hex;   // 폰 위쪽 상태 표시줄 색
  },

  // ----- 아바타 그리기 (어디든 동그라미 칸에 넣을 수 있어요) -----
  // 없으면 fallback 글자(기본 🙂)
  drawAvatar(el, avatar, fallback = '🙂') {
    el.innerHTML = '';
    el.classList.toggle('has-photo', !!avatar && avatar.type === 'photo');
    if (avatar && avatar.type === 'photo') {
      const img = document.createElement('img');
      img.src = avatar.value;
      img.alt = '프로필 사진';
      el.appendChild(img);
    } else {
      el.textContent = (avatar && avatar.value) || fallback;
    }
  },

  // ----- 사진 줄이기: 가운데를 정사각형으로 잘라 256px로 -----
  async resizePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('사진을 열 수 없어요'));
        image.src = url;
      });
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = this.PHOTO_SIZE;
      canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, this.PHOTO_SIZE, this.PHOTO_SIZE);
      return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
      URL.revokeObjectURL(url);
    }
  },

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.hidden = !message;
  },

  // 처음 한 번: 버튼들 연결하기
  setup({ getData, onChange }) {
    const profile = () => getData().profile;

    // 😀 이모지로 (동그라미 사진을 눌러도 같아요)
    const pickEmoji = () => {
      const now = profile().avatar;
      EmojiPicker.open(now && now.type === 'emoji' ? now.value : null, (emoji) => {
        profile().avatar = emoji ? { type: 'emoji', value: emoji } : null;
        this.showError('');
        onChange();
      }, this.AVATAR_EMOJIS);
    };
    document.getElementById('avatar-emoji').addEventListener('click', pickEmoji);
    this.avatarEl.addEventListener('click', pickEmoji);

    // 📷 사진 올리기 → 폰에서는 앨범/카메라 고르는 창이 떠요
    document.getElementById('avatar-photo').addEventListener('click', () => this.fileEl.click());
    this.fileEl.addEventListener('change', async () => {
      const file = this.fileEl.files[0];
      this.fileEl.value = '';   // 같은 사진을 다시 골라도 되게 비우기
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        this.showError('사진 파일만 올릴 수 있어요.');
        return;
      }
      try {
        const photo = await this.resizePhoto(file);
        profile().avatar = { type: 'photo', value: photo };
        this.showError('');
        onChange();
      } catch (error) {
        console.error(error);
        this.showError('이 사진은 열 수 없어요. 다른 사진으로 해 주세요.');
      }
    });

    // 기본으로 (🙂)
    this.resetEl.addEventListener('click', () => {
      profile().avatar = null;
      this.showError('');
      onChange();
    });

    // 🎨 테마 색 동그라미들
    for (const theme of this.THEMES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-option';
      button.dataset.theme = theme.key;
      button.setAttribute('aria-label', theme.name);
      const swatch = document.createElement('span');
      swatch.className = 'theme-swatch';
      swatch.style.background = theme.hex;
      button.append(swatch, theme.name);
      button.addEventListener('click', () => {
        profile().theme = theme.key;
        this.applyTheme(theme.key);
        onChange();
      });
      this.themeGridEl.appendChild(button);
    }
  },

  render({ data }) {
    const { avatar, theme } = data.profile;
    const nickname = Nicknames.display(data.profile);   // 직접 쓴 별명이 먼저, 없으면 🎲 랜덤 별명

    // 프로필 화면
    this.drawAvatar(this.avatarEl, avatar);
    this.resetEl.hidden = !avatar;
    for (const button of this.themeGridEl.children) {
      button.classList.toggle('current', button.dataset.theme === this.findTheme(theme).key);
    }

    // 메인 화면 맨 위: 아바타가 있으면 동그라미로, 없으면 👋/📅
    this.headerAvatarEl.hidden = !avatar;
    if (avatar) this.drawAvatar(this.headerAvatarEl, avatar);
    if (nickname) {
      const name = Nicknames.withHonorific(nickname);   // "너굴너굴너굴씨"에는 "님"을 안 붙여요
      this.greetingEl.textContent = avatar ? name : `👋 ${name}`;
    } else {
      this.greetingEl.textContent = avatar ? '할 일 달력' : '📅 할 일 달력';
    }

    // 설정 화면 프로필 줄 아이콘
    this.drawAvatar(this.rowIconEl, avatar, '👤');
  },
};

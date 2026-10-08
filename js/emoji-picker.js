// =====================================================
//  emoji-picker.js - 이모지 고르는 창
//  사용법: EmojiPicker.open(지금 이모지, (고른 이모지) => { ... })
//          고른 이모지가 null이면 "이모지 없애기"를 누른 거예요.
// =====================================================

const EmojiPicker = {
  // 자주 쓰는 이모지 (여기에 더하거나 빼면 창에 보이는 이모지가 바뀌어요)
  EMOJIS: [
    '💧', '🥛', '☕', '🍎', '🥗', '💊',
    '🏃', '💪', '🧘', '🚶', '😴', '🦷',
    '📚', '✏️', '💻', '📝', '🔤', '🎹',
    '💼', '📞', '📧', '🛒', '💰', '🧾',
    '🧹', '🧺', '🍳', '🌱', '🐶', '🚗',
    '🏥', '🎂', '🎁', '✈️', '❤️', '⭐',
  ],

  dialogEl: document.getElementById('emoji-dialog'),
  gridEl: document.getElementById('emoji-grid'),
  customEl: document.getElementById('emoji-custom'),
  onPick: null,   // 고르면 실행할 일 (open에서 받아요)

  shownList: null,   // 지금 창에 깔린 이모지 목록

  // 이모지 버튼들 깔기 (목록이 바뀔 때만 다시 만들어요)
  fillGrid(emojis) {
    if (this.shownList === emojis) return;
    this.shownList = emojis;
    this.gridEl.innerHTML = '';
    for (const emoji of emojis) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = emoji;
      button.addEventListener('click', () => this.pick(emoji));
      this.gridEl.appendChild(button);
    }
  },

  // 처음 한 번: 이모지 버튼들 만들고, 버튼마다 할 일 연결하기
  setup() {
    this.fillGrid(this.EMOJIS);

    // 직접 입력 → 적용
    document.getElementById('emoji-custom-apply').addEventListener('click', () => {
      const emoji = this.firstCharacter(this.customEl.value);
      if (emoji) this.pick(emoji);
    });
    this.customEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('emoji-custom-apply').click();
      }
    });

    document.getElementById('emoji-none').addEventListener('click', () => this.pick(null));
    document.getElementById('emoji-cancel').addEventListener('click', () => this.close());

    // 창 바깥(어두운 곳)을 누르면 닫기
    this.dialogEl.addEventListener('click', (event) => {
      if (event.target === this.dialogEl) this.close();
    });
  },

  // 창 열기 (current: 지금 붙어 있는 이모지 → 표시해 줘요)
  // emojis: 보여 줄 이모지 목록 (빼면 할 일용 기본 목록, 프로필은 프로필용 목록을 넘겨요)
  open(current, onPick, emojis = this.EMOJIS) {
    this.fillGrid(emojis);
    this.onPick = onPick;
    this.customEl.value = '';
    for (const button of this.gridEl.children) {
      button.classList.toggle('current', button.textContent === current);
    }
    this.dialogEl.showModal();
  },

  // 이모지를 골랐을 때
  pick(emoji) {
    const onPick = this.onPick;
    this.close();
    if (onPick) onPick(emoji);
  },

  close() {
    this.onPick = null;
    if (this.dialogEl.open) this.dialogEl.close();
  },

  // 글자 중 맨 앞 한 개만 (👨‍👩‍👧 같은 여러 조각짜리 이모지도 한 개로 쳐요)
  firstCharacter(text) {
    const trimmed = text.trim();
    if (trimmed === '') return null;
    if (window.Intl && Intl.Segmenter) {
      const first = new Intl.Segmenter().segment(trimmed)[Symbol.iterator]().next().value;
      return first.segment;
    }
    return Array.from(trimmed)[0];
  },
};

EmojiPicker.setup();

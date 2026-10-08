// =====================================================
//  color-picker.js - 색 목록과 색 고르는 창
//  사용법: ColorPicker.open(지금 색, (고른 색) => { ... })
//          고른 색이 null이면 "색 없애기"를 누른 거예요.
//
//  할 일에는 색 이름(key, 예: 'green')만 저장하고,
//  실제 색 값(hex)은 여기서 찾아 써요. 그래서 여기 색 값만 바꾸면
//  앱 전체의 그 색이 한꺼번에 바뀌어요.
// =====================================================

const ColorPicker = {
  // group: 고르는 창에서 묶어 보여 줄 이름
  COLORS: [
    { key: 'red',    name: '빨강', hex: '#e5484d', group: '기본' },
    { key: 'orange', name: '주황', hex: '#f76b15', group: '기본' },
    { key: 'yellow', name: '노랑', hex: '#f5b300', group: '기본' },
    { key: 'green',  name: '초록', hex: '#30a46c', group: '기본' },
    { key: 'teal',   name: '청록', hex: '#12a594', group: '기본' },
    { key: 'sky',    name: '하늘', hex: '#0ea5e9', group: '기본' },
    { key: 'purple', name: '보라', hex: '#8e4ec6', group: '기본' },
    { key: 'pink',   name: '분홍', hex: '#e93d82', group: '기본' },

    // 파스텔 (원래 연한 색이라 달력 칸에서는 더 진하게 칠해요: calendar.js)
    { key: 'p-cherry',   name: '벚꽃',   hex: '#f7a8c4', group: '파스텔' },
    { key: 'p-apricot',  name: '살구',   hex: '#fbbf8f', group: '파스텔' },
    { key: 'p-lemon',    name: '레몬',   hex: '#f6dc78', group: '파스텔' },
    { key: 'p-mint',     name: '민트',   hex: '#96dcbd', group: '파스텔' },
    { key: 'p-skyblue',  name: '하늘빛', hex: '#9fcff2', group: '파스텔' },
    { key: 'p-lavender', name: '라벤더', hex: '#bfb0f3', group: '파스텔' },
    { key: 'p-lilac',    name: '라일락', hex: '#e2aee5', group: '파스텔' },
    { key: 'p-sand',     name: '모래',   hex: '#dfc8a8', group: '파스텔' },
  ],

  dialogEl: document.getElementById('color-dialog'),
  gridEl: document.getElementById('color-grid'),
  onPick: null,   // 고르면 실행할 일 (open에서 받아요)

  // 색 이름 → 색 값 (예: 'green' → '#30a46c'), 없으면 null
  hex(key) {
    const color = this.COLORS.find(c => c.key === key);
    return color ? color.hex : null;
  },

  // 색 이름 → 한글 이름 (예: 'green' → '초록'), 없으면 null
  name(key) {
    const color = this.COLORS.find(c => c.key === key);
    return color ? color.name : null;
  },

  // 파스텔 색인가요?
  isPastel(key) {
    const color = this.COLORS.find(c => c.key === key);
    return !!color && color.group === '파스텔';
  },

  // 처음 한 번: 색 버튼들 만들고, 버튼마다 할 일 연결하기
  setup() {
    let lastGroup = null;
    for (const color of this.COLORS) {
      // 묶음이 바뀌면 "기본", "파스텔" 제목 넣기
      if (color.group !== lastGroup) {
        const label = document.createElement('div');
        label.className = 'color-group';
        label.textContent = color.group;
        this.gridEl.appendChild(label);
        lastGroup = color.group;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-option';
      button.dataset.color = color.key;

      const swatch = document.createElement('span');
      swatch.className = 'swatch';
      swatch.style.background = color.hex;

      button.append(swatch, color.name);
      button.addEventListener('click', () => this.pick(color.key));
      this.gridEl.appendChild(button);
    }

    document.getElementById('color-none').addEventListener('click', () => this.pick(null));
    document.getElementById('color-cancel').addEventListener('click', () => this.close());

    // 창 바깥(어두운 곳)을 누르면 닫기
    this.dialogEl.addEventListener('click', (event) => {
      if (event.target === this.dialogEl) this.close();
    });
  },

  // 창 열기 (current: 지금 붙어 있는 색 → 표시해 줘요)
  open(current, onPick) {
    this.onPick = onPick;
    for (const button of this.gridEl.querySelectorAll('.color-option')) {
      button.classList.toggle('current', button.dataset.color === current);
    }
    this.dialogEl.showModal();
  },

  // 색을 골랐을 때
  pick(key) {
    const onPick = this.onPick;
    this.close();
    if (onPick) onPick(key);
  },

  close() {
    this.onPick = null;
    if (this.dialogEl.open) this.dialogEl.close();
  },
};

ColorPicker.setup();

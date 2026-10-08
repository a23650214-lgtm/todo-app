// =====================================================
//  fonts.js - ✏️ 글씨체 고르기
//
//  글씨체 파일은 구글 폰트(무료)에서 받아와요.
//  고른 글씨체만 통째로 받고, 고르는 창의 미리보기는
//  보여 줄 글자만 조금씩 받아서 빠르게 떠요.
//  한 번 받은 글씨체는 sw.js가 보관해 둬서 오프라인에서도 보여요.
// =====================================================

const Fonts = {
  // 글씨체를 고르지 않았을 때 (원래 앱 글씨체)
  DEFAULT_STACK: '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',

  // google: 구글 폰트 이름 (굵기가 여러 개면 ":wght@400;700")
  // kind: 고르는 창에 붙는 작은 표시
  // scale: 글자를 작게 그리는 글씨체는 이만큼 키워서 보여 줘요 (없으면 1배)
  FONTS: [
    { key: 'default',        name: '기본',          kind: '깔끔',   google: null },
    { key: 'gowun-dodum',    name: '고운돋움',      kind: '깔끔',   google: 'Gowun Dodum' },
    { key: 'nanum-myeongjo', name: '나눔명조',      kind: '깔끔',   google: 'Nanum Myeongjo:wght@400;700' },
    { key: 'jua',            name: '주아',          kind: '귀여움', google: 'Jua' },
    { key: 'gaegu',          name: '개구',          kind: '손글씨', google: 'Gaegu:wght@400;700', scale: 1.1 },
    { key: 'nanum-pen',      name: '나눔손글씨 펜', kind: '손글씨', google: 'Nanum Pen Script',   scale: 1.3 },
    { key: 'gamja-flower',   name: '감자꽃',        kind: '손글씨', google: 'Gamja Flower' },
    { key: 'hi-melody',      name: '하이멜로디',    kind: '손글씨', google: 'Hi Melody',          scale: 1.15 },
    { key: 'poor-story',     name: '푸어스토리',    kind: '손글씨', google: 'Poor Story' },
    { key: 'single-day',     name: '싱글데이',      kind: '손글씨', google: 'Single Day' },
  ],

  SAMPLE: '오늘도 힘내자! 물 2L 먹기 10월 8일',

  find(key) {
    return this.FONTS.find(f => f.key === key) || this.FONTS[0];
  },

  // 구글 폰트 이름에서 글씨체 이름만 (예: "Gaegu:wght@400;700" → "Gaegu")
  family(font) {
    return font.google ? font.google.split(':')[0] : null;
  },

  // CSS에 쓸 글씨체 목록 (못 받으면 기본 글씨체로)
  stack(font) {
    const family = this.family(font);
    return family ? `"${family}", ${this.DEFAULT_STACK}` : this.DEFAULT_STACK;
  },

  // 구글 폰트 주소 붙이기 (같은 걸 두 번 붙이지 않아요)
  addLink(id, url) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  },

  // 앱 전체에 글씨체 적용 (style.css의 --app-font)
  apply(key) {
    const font = this.find(key);
    if (font.google) {
      this.addLink(`font-${font.key}`, `https://fonts.googleapis.com/css2?family=${font.google.replace(/ /g, '+')}&display=swap`);
    }
    document.documentElement.style.setProperty('--app-font', this.stack(font));
    document.documentElement.style.setProperty('--font-scale', font.scale || 1);
  },

  // 고르는 창 미리보기용: 보여 줄 글자만 조금씩 받기 (빠르고 가벼워요)
  loadPreviews() {
    const families = this.FONTS.filter(f => f.google).map(f => `family=${this.family(f).replace(/ /g, '+')}`).join('&');
    const text = encodeURIComponent(this.SAMPLE + this.FONTS.map(f => f.name).join(''));
    this.addLink('font-previews', `https://fonts.googleapis.com/css2?${families}&text=${text}&display=swap`);
  },
};


// =====================================================
//  ✏️ 꾸미기 칸과 글씨체 고르는 창
// =====================================================

const FontPicker = {
  currentEl: document.getElementById('font-current'),
  dialogEl: document.getElementById('font-dialog'),
  listEl: document.getElementById('font-list'),

  // onChange: 글씨체를 바꿨을 때 할 일 (저장하고 다시 그리기)
  setup({ getData, onChange }) {
    document.getElementById('open-font').addEventListener('click', () => this.open(getData(), onChange));
    document.getElementById('font-cancel').addEventListener('click', () => this.dialogEl.close());
    this.dialogEl.addEventListener('click', (event) => {
      if (event.target === this.dialogEl) this.dialogEl.close();   // 바깥을 누르면 닫기
    });
  },

  // 꾸미기 칸: "글씨체: 개구 ›"
  render({ data }) {
    const font = Fonts.find(data.settings.font);
    this.currentEl.textContent = font.name;
  },

  open(data, onChange) {
    Fonts.loadPreviews();
    this.listEl.innerHTML = '';

    for (const font of Fonts.FONTS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'font-option';
      if (font.key === data.settings.font) button.classList.add('current');
      button.style.fontFamily = Fonts.stack(font);   // 이 버튼은 그 글씨체로 보여 주기
      button.style.setProperty('--font-scale', font.scale || 1);   // 크기 배율도 그 글씨체 것으로

      const head = document.createElement('span');
      head.className = 'font-head';
      const name = document.createElement('span');
      name.className = 'font-name';
      name.textContent = font.name;
      const kind = document.createElement('small');
      kind.className = 'font-kind';
      kind.textContent = font.kind;
      head.append(name, kind);

      const sample = document.createElement('span');
      sample.className = 'font-sample';
      sample.textContent = Fonts.SAMPLE;

      button.append(head, sample);
      button.addEventListener('click', () => {
        data.settings.font = font.key;
        Fonts.apply(font.key);
        this.dialogEl.close();
        onChange();
      });
      this.listEl.appendChild(button);
    }

    this.dialogEl.showModal();
  },
};

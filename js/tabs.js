// =====================================================
//  tabs.js - 아래 탭 (🏠 홈 / ✅ To Do / 🌱 Habit)
//
//  페이지 3개는 옆으로 나란히 붙어 있어요 (#pages).
//  - 탭을 누르면: 그 페이지로 부드럽게 넘어가요
//  - 손가락으로 좌우로 밀면: 브라우저가 한 페이지씩 딱딱 맞춰 넘겨 주고 (style.css의 scroll-snap),
//    여기서는 지금 몇 번째 페이지인지 보고 탭 색을 바꿔 줘요
// =====================================================

const Tabs = {
  pagesEl: document.getElementById('pages'),
  tabEls: [...document.querySelectorAll('#tab-bar .tab')],
  current: 0,

  setup() {
    this.tabEls.forEach((tab) => {
      tab.addEventListener('click', () => this.go(Number(tab.dataset.page)));
    });

    // 밀어서 넘길 때: 멈추면 몇 번째 페이지인지 확인
    this.pagesEl.addEventListener('scroll', () => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.sync(), 80);
    }, { passive: true });

    // 화면 크기가 바뀌면 (폰을 가로로 돌리는 등) 지금 페이지에 다시 맞추기
    window.addEventListener('resize', () => this.go(this.current, false));

    this.mark(0);
  },

  // index번째 페이지로 가기 (0: 홈, 1: To Do, 2: Habit)
  go(index, smooth = true) {
    this.pagesEl.scrollTo({ left: index * this.pagesEl.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    this.mark(index);
  },

  // 지금 보이는 페이지 알아내기
  sync() {
    const width = this.pagesEl.clientWidth;
    if (!width) return;
    const index = Math.round(this.pagesEl.scrollLeft / width);
    if (index !== this.current) this.mark(index);
  },

  // 탭 색 바꾸기
  mark(index) {
    this.current = index;
    this.tabEls.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
      tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
  },
};

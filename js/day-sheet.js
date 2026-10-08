// =====================================================
//  day-sheet.js - 📅 그날 할 일 팝업 (아래에서 올라와요)
//  달력에서 날짜를 누르면 열려요. 안에 있는 할 일 목록·입력칸·기간 목표는
//  원래 쓰던 day-view.js, goal-view.js, main.js가 그대로 움직여요.
// =====================================================

const DaySheet = {
  el: document.getElementById('day-sheet'),

  setup() {
    document.getElementById('day-sheet-close').addEventListener('click', () => this.close());

    // 팝업 바깥(어두운 곳)을 누르면 닫기
    // (팝업 안쪽 여백을 누른 건 닫지 않도록, 누른 위치가 팝업 네모 밖인지 확인해요)
    this.el.addEventListener('click', (event) => {
      if (event.target !== this.el) return;
      const r = this.el.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right &&
                     event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) this.close();
    });
  },

  isOpen() {
    return this.el.open;
  },

  open() {
    if (!this.el.open) this.el.showModal();
    this.el.scrollTop = 0;   // 늘 맨 위(날짜 제목, 입력칸)부터 보이게
  },

  close() {
    if (this.el.open) this.el.close();
  },
};

DaySheet.setup();

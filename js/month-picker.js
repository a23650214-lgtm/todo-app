// =====================================================
//  month-picker.js - 📅 연도와 월 고르는 창
//  달력 제목("2026년 10월")을 누르면 떠요.
//  사용법: MonthPicker.open({ data, year, month, onPick: (year, month) => { ... } })
//          (month는 1월이 0, 12월이 11)
// =====================================================

const MonthPicker = {
  MIN_YEAR: 1900,
  MAX_YEAR: 2100,

  dialogEl: document.getElementById('month-picker'),
  yearEl: document.getElementById('picker-year'),
  gridEl: document.getElementById('month-grid'),

  year: null,        // 창에서 보고 있는 해
  viewing: null,     // 달력에서 지금 보고 있는 달 { year, month }
  records: null,     // 기록이 있는 달들 ("2026-10" 모양)
  onPick: null,

  setup() {
    // 1월~12월 버튼 만들기
    for (let month = 0; month < 12; month++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'month-option';
      button.dataset.month = month;
      button.textContent = `${month + 1}월`;
      button.addEventListener('click', () => this.pick(this.year, month));
      this.gridEl.appendChild(button);
    }

    // 연도 넘기기
    document.getElementById('year-prev10').addEventListener('click', () => this.moveYear(-10));
    document.getElementById('year-prev').addEventListener('click', () => this.moveYear(-1));
    document.getElementById('year-next').addEventListener('click', () => this.moveYear(+1));
    document.getElementById('year-next10').addEventListener('click', () => this.moveYear(+10));

    // 이번 달로
    document.getElementById('month-picker-today').addEventListener('click', () => {
      const now = DateUtil.fromKey(DateUtil.todayKey());
      this.pick(now.getFullYear(), now.getMonth());
    });

    document.getElementById('month-picker-cancel').addEventListener('click', () => this.dialogEl.close());

    // 창 바깥(어두운 곳)을 누르면 닫기 (창 안쪽 여백은 빼고)
    this.dialogEl.addEventListener('click', (event) => {
      if (event.target !== this.dialogEl) return;
      const r = this.dialogEl.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right &&
                     event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) this.dialogEl.close();
    });
  },

  open({ data, year, month, onPick }) {
    this.year = year;
    this.viewing = { year, month };
    this.records = this.monthsWithRecords(data);
    this.onPick = onPick;
    this.draw();
    this.dialogEl.showModal();
  },

  // 연도 옮기기 (1900년 ~ 2100년 안에서)
  moveYear(step) {
    this.year = Math.min(this.MAX_YEAR, Math.max(this.MIN_YEAR, this.year + step));
    this.draw();
  },

  // 달을 골랐을 때: 창 닫고 그 달로
  pick(year, month) {
    this.dialogEl.close();
    if (this.onPick) this.onPick(year, month);
  },

  // 창 다시 그리기
  draw() {
    this.yearEl.textContent = `${this.year}년`;
    document.getElementById('year-prev10').disabled = this.year <= this.MIN_YEAR;
    document.getElementById('year-prev').disabled = this.year <= this.MIN_YEAR;
    document.getElementById('year-next').disabled = this.year >= this.MAX_YEAR;
    document.getElementById('year-next10').disabled = this.year >= this.MAX_YEAR;

    const today = DateUtil.fromKey(DateUtil.todayKey());
    for (const button of this.gridEl.children) {
      const month = Number(button.dataset.month);
      const key = `${this.year}-${String(month + 1).padStart(2, '0')}`;
      button.classList.toggle('viewing', this.year === this.viewing.year && month === this.viewing.month);
      button.classList.toggle('this-month', this.year === today.getFullYear() && month === today.getMonth());
      button.classList.toggle('has-records', this.records.has(key));
    }
  },

  // 기록이 있는 달 모으기: 할 일·일정 날짜, 체크한 날, 매일 반복·기간 목표가 이어진 달, 목표 진행 기록
  monthsWithRecords(data) {
    const months = new Set();
    const addKey = (key) => months.add(key.slice(0, 7));
    // 시작 날부터 끝 날까지 걸친 달 모두
    const addRange = (startKey, endKey) => {
      if (!startKey) return;
      let key = DateUtil.monthStart(startKey);
      const last = endKey && endKey >= startKey ? endKey : startKey;
      for (let i = 0; i < 1200 && key <= last; i++) {   // (혹시 모를 무한 반복 막기: 최대 100년)
        addKey(key);
        key = DateUtil.nextMonthStart(key);
      }
    };

    for (const task of data.tasks) {
      if (task.type === 'once' || task.type === 'event') addKey(task.date);
      if (task.type === 'daily') addRange(task.startDate, task.endDate ? DateUtil.addDays(task.endDate, -1) : task.startDate);
      if (task.type === 'goal') addRange(task.startDate, task.endDate);
    }
    Object.keys(data.completions).forEach(addKey);
    for (const logs of Object.values(data.progress)) Object.keys(logs).forEach(addKey);
    return months;
  },
};

MonthPicker.setup();

// =====================================================
//  month-goals.js - 🌟 이 달의 목표 (To Do 페이지, 달력 위)
//  MonthGoals     : 규칙 (달마다 따로 저장, 추가·체크·고치기·삭제)
//  MonthGoalsView : 화면
//
//  달력에 보이는 달을 따라가요. 달력을 11월로 넘기면 11월 목표가 보여요.
//  버킷리스트(올해 목표), 🎯 기간 목표와는 따로 저장돼요.
// =====================================================

const MonthGoals = {
  TITLE_MAX: 60,

  // 달 이름표: 2026년 10월 → "2026-10" (month는 1월이 0)
  monthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  },

  list(data, key) {
    return data.monthGoals[key] || [];
  },

  add(data, key, title) {
    if (!data.monthGoals[key]) data.monthGoals[key] = [];
    data.monthGoals[key].push({ id: makeId(), title, done: false, doneDate: null, createdAt: new Date().toISOString() });
  },

  find(data, key, id) {
    return this.list(data, key).find(goal => goal.id === id);
  },

  setDone(data, key, id, done) {
    const goal = this.find(data, key, id);
    if (!goal) return;
    goal.done = done;
    goal.doneDate = done ? DateUtil.todayKey() : null;
  },

  rename(data, key, id, title) {
    const goal = this.find(data, key, id);
    if (goal) goal.title = title;
  },

  remove(data, key, id) {
    data.monthGoals[key] = this.list(data, key).filter(goal => goal.id !== id);
    if (data.monthGoals[key].length === 0) delete data.monthGoals[key];   // 빈 달은 정리
  },
};


const MonthGoalsView = {
  titleEl: document.getElementById('month-goals-title'),
  countEl: document.getElementById('month-goals-count'),
  fillEl: document.getElementById('month-goals-fill'),
  bodyEl: document.getElementById('month-goals-body'),
  listEl: document.getElementById('month-goals-list'),
  emptyEl: document.getElementById('month-goals-empty'),
  inputEl: document.getElementById('month-goals-input'),
  toggleEl: document.getElementById('month-goals-toggle'),

  collapsed: false,   // 접어 뒀나요?
  getData: null,
  getMonth: null,     // 지금 달력의 달 { year, month }
  onChange: null,

  setup({ getData, getMonth, onChange }) {
    this.getData = getData;
    this.getMonth = getMonth;
    this.onChange = onChange;

    // 추가
    document.getElementById('month-goals-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const title = this.inputEl.value.trim().slice(0, MonthGoals.TITLE_MAX);
      if (!title) return;
      MonthGoals.add(getData(), this.key(), title);
      this.inputEl.value = '';
      onChange();
    });

    // 접기 / 펼치기
    this.toggleEl.addEventListener('click', () => {
      this.collapsed = !this.collapsed;
      this.showCollapsed();
    });
  },

  key() {
    const { year, month } = this.getMonth();
    return MonthGoals.monthKey(year, month);
  },

  showCollapsed() {
    this.bodyEl.hidden = this.collapsed;
    this.toggleEl.textContent = this.collapsed ? '▾' : '▴';
    this.toggleEl.setAttribute('aria-label', this.collapsed ? '펼치기' : '접기');
  },

  render({ data, year, month }) {
    const key = MonthGoals.monthKey(year, month);
    const goals = MonthGoals.list(data, key);
    const done = goals.filter(goal => goal.done).length;

    // 올해가 아닌 달이면 연도도 붙여요 (예: 🌟 2027년 1월의 목표)
    const thisYear = DateUtil.fromKey(DateUtil.todayKey()).getFullYear();
    this.titleEl.textContent = year === thisYear ? `🌟 ${month + 1}월의 목표` : `🌟 ${year}년 ${month + 1}월의 목표`;
    this.countEl.textContent = goals.length === 0 ? '' : (done === goals.length ? `🎉 ${done}/${goals.length} 다 이룸!` : `${done}/${goals.length} 이룸`);
    this.fillEl.style.width = goals.length ? `${Math.round((done / goals.length) * 100)}%` : '0%';
    this.fillEl.parentElement.hidden = goals.length === 0;
    this.emptyEl.hidden = goals.length > 0;
    this.inputEl.placeholder = `${month + 1}월에 이루고 싶은 것`;
    this.showCollapsed();

    this.listEl.innerHTML = '';
    for (const goal of goals) {
      const li = document.createElement('li');
      if (goal.done) li.classList.add('done');

      // 체크 상자
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = goal.done;
      checkbox.setAttribute('aria-label', '이뤘어요');
      checkbox.addEventListener('change', () => {
        MonthGoals.setDone(data, key, goal.id, checkbox.checked);
        this.onChange();
      });

      // 목표 글자 (누르면 그 자리에서 고치기)
      const title = document.createElement('span');
      title.className = 'month-goal-title';
      title.textContent = goal.title;
      title.addEventListener('click', () => this.startEdit(li, title, data, key, goal));

      // 삭제 ✕
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'month-goal-delete';
      remove.textContent = '✕';
      remove.setAttribute('aria-label', '목표 지우기');
      remove.addEventListener('click', () => {
        if (!confirm(`'${goal.title}' 목표를 지울까요?`)) return;
        MonthGoals.remove(data, key, goal.id);
        this.onChange();
      });

      li.append(checkbox, title, remove);
      this.listEl.appendChild(li);
    }
  },

  // 그 자리에서 고치기: 글자 → 입력칸 (엔터·다른 곳 누르기 = 저장, Esc = 취소)
  startEdit(li, titleEl, data, key, goal) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'month-goal-edit';
    input.value = goal.title;
    input.maxLength = MonthGoals.TITLE_MAX;
    let finished = false;
    const finish = (save) => {
      if (finished) return;
      finished = true;
      const title = input.value.trim().slice(0, MonthGoals.TITLE_MAX);
      if (save && title && title !== goal.title) MonthGoals.rename(data, key, goal.id, title);
      this.onChange();   // 저장하든 안 하든 다시 그리면 원래 모양으로 돌아와요
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); finish(true); }
      if (event.key === 'Escape') { event.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
    li.replaceChild(input, titleEl);
    input.focus();
    input.select();
  },
};

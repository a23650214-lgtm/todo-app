// =====================================================
//  habit-list.js - 🌱 내 습관 (Habit 페이지)
//  예전에 따로 있던 🔥 연속 기록과 📊 습관 기록을 습관마다 한 카드로 합쳤어요.
//
//   ┌ 💧 물 2L 먹기                  🔥 10일 ┐
//   │ ▓▓▓▓▓▓▓░░░░░  19/31일                 │  ← 달력에 보이는 달의 달성 현황
//   └ 오늘도 해냈어요! 🎉        🏆 최고 21일 ┘  ← 오늘 기준 연속 기록
//
//  카드를 누르면 고치기 창이 떠서 아이콘·색·이름을 바꿀 수 있어요.
//  (연속 기록 세는 규칙은 streaks.js, 달성 현황 세는 규칙은 tasks.js의 monthStats)
// =====================================================

const HabitListView = {
  sectionEl: document.getElementById('stats'),
  titleEl: document.getElementById('stats-title'),
  listEl: document.getElementById('stats-list'),

  // year, month: 달력에 보이는 달
  // onChange: 고치기 창에서 바꿨을 때 할 일
  render({ data, year, month, onChange }) {
    const todayKey = DateUtil.todayKey();
    const stats = Tasks.monthStats(data, year, month);   // [{ task, planned, done }]
    this.sectionEl.hidden = stats.length === 0;
    this.titleEl.textContent = `🌱 ${month + 1}월 내 습관`;
    this.listEl.innerHTML = '';

    // 습관 묶음(다음 달로 이어간 것끼리) 찾기 → 연속 기록은 묶음 전체로 세요
    const chains = Streaks.chains(data);
    const chainOf = (taskId) => chains.find(chain => chain.tasks.some(t => t.id === taskId));

    for (const { task, planned, done } of stats) {
      const chain = chainOf(task.id);
      const activeToday = !!chain && chain.tasks.some(t => Tasks.isScheduledOn(t, todayKey));
      const streak = chain ? Streaks.forChain(data, chain, todayKey) : { current: 0, best: 0, todayDone: false };
      const isRecord = activeToday && streak.current >= 3 && streak.current === streak.best;

      const li = document.createElement('li');
      const hex = ColorPicker.hex(task.color);
      if (hex) {
        li.style.setProperty('--task-color', hex);
        li.style.setProperty('--habit-color', hex);
      }
      if (activeToday && streak.current === 0) li.classList.add('cold');
      if (isRecord) li.classList.add('record');
      if (!activeToday) li.classList.add('ended');

      // 윗줄: 아이콘·이름 ........ 🔥 10일
      const top = this.make('div', 'hl-top');
      const name = this.make('span', 'streak-name', task.emoji ? `${task.emoji} ${task.title}` : task.title);
      const now = this.make('strong', 'streak-now', activeToday ? `🔥 ${streak.current}일` : '끝남');
      top.append(name, now);

      // 가운데: 이번 달 달성 막대 + 19/31일
      const middle = this.make('div', 'hl-bar');
      const bar = this.make('div', 'stats-bar');
      const fill = this.make('div', 'stats-fill');
      fill.style.width = `${Math.round((done / planned) * 100)}%`;
      bar.appendChild(fill);
      middle.append(bar, this.make('span', 'stats-count', `${done}/${planned}일`));

      // 아랫줄: 한마디 ........ 🏆 최고 21일
      const bottom = this.make('div', 'hl-bottom');
      let note;
      if (!activeToday) note = '이 달에 끝난 습관이에요';
      else if (streak.todayDone) note = '오늘도 해냈어요! 🎉';
      else if (streak.current > 0) note = `오늘 체크하면 ${streak.current + 1}일 연속!`;
      else note = '오늘부터 다시 시작해요 💪';
      bottom.append(
        this.make('small', 'streak-note', note),
        this.make('small', 'streak-best', isRecord ? '🏆 최고 기록 중!' : `🏆 최고 ${streak.best}일`)
      );

      li.append(top, middle, bottom);
      // 누르면 고치기 창 (아이콘·색·이름)
      if (onChange) {
        li.classList.add('editable');
        li.addEventListener('click', () => HabitEdit.open(data, task, onChange));
      }
      this.listEl.appendChild(li);
    }
  },

  make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  },
};


// 습관 고치기 창 열기 (고치기 창 task-edit.js를 그대로 써요)
// 날짜는 오늘 (오늘 안 하는 습관이면 그 습관의 첫날)
const HabitEdit = {
  open(data, task, onChange) {
    const todayKey = DateUtil.todayKey();
    const dateKey = Tasks.isScheduledOn(task, todayKey) ? todayKey : task.startDate;
    TaskEdit.open({ data, task, dateKey, onChange });
  },
};

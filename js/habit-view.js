// =====================================================
//  habit-view.js - 🌱 Habit 페이지의 습관 달력
//  날짜 칸마다 그날의 습관(매일 반복)을 보여 줘요.
//    아이콘이 있는 습관: 💧 습관 색 동그라미 안에 아이콘 (지킴 = 또렷, 못 지킴 = 흑백·점선, 앞날 = 아주 흐림)
//    아이콘이 없는 습관: ● 색칠된 점 = 지킴, ○ 빈 점 = 못 지킴
//  그날 습관을 다 지키면 칸이 초록이 되고 ✓가 붙어요.
//  (아래 "이번 달 기록" 막대는 stats-view.js가 그대로 그려요)
// =====================================================

const HabitView = {
  titleEl: document.getElementById('habit-title'),
  daysEl: document.getElementById('habit-days'),
  emptyEl: document.getElementById('habit-empty'),

  MAX_DOTS: 4,   // 칸 하나에 표시 최대 개수 (넘치면 "+2"). 아이콘이 들어가서 4개까지만

  // year, month: 보여 줄 달 (To Do 달력과 같은 달을 함께 봐요)
  // onSelect: 날짜를 눌렀을 때 할 일 (그날 팝업 열기)
  render({ data, year, month, selectedKey, onSelect }) {
    this.titleEl.textContent = `${year}년 ${month + 1}월`;
    this.daysEl.innerHTML = '';
    this.emptyEl.hidden = data.tasks.some(task => task.type === 'daily');

    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const todayKey = DateUtil.todayKey();

    for (let i = 0; i < firstWeekday; i++) {
      this.daysEl.appendChild(document.createElement('div'));
    }

    for (let date = 1; date <= lastDate; date++) {
      const key = DateUtil.toKey(new Date(year, month, date));
      const weekday = (firstWeekday + date - 1) % 7;
      const habits = Tasks.forDate(data, key).filter(task => task.type === 'daily');
      const isFuture = key > todayKey;
      const doneCount = habits.filter(task => Tasks.isDone(data, task.id, key)).length;
      const allDone = !isFuture && habits.length > 0 && doneCount === habits.length;

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day habit-day';
      if (weekday === 0) cell.classList.add('sun');
      if (weekday === 6) cell.classList.add('sat');
      if (key === todayKey) cell.classList.add('today');
      if (key === selectedKey) cell.classList.add('selected');
      if (allDone) cell.classList.add('complete');

      // 맨 윗줄: 날짜 숫자 (+ 다 지킨 날 ✓)
      const head = document.createElement('span');
      head.className = 'day-head';
      const number = document.createElement('span');
      number.className = 'day-number';
      number.textContent = date;
      const mark = document.createElement('span');
      mark.className = 'mark';
      if (allDone) mark.textContent = '✓';
      head.append(number, mark);

      // 습관 표시들: 아이콘(이모지)이 있으면 습관 색 동그라미 안에 아이콘, 없으면 색 점
      const marks = document.createElement('span');
      marks.className = 'habit-marks';
      for (const habit of habits.slice(0, this.MAX_DOTS)) {
        const dot = document.createElement('span');
        dot.className = habit.emoji ? 'habit-dot habit-icon' : 'habit-dot';
        if (habit.emoji) dot.textContent = habit.emoji;
        const hex = ColorPicker.hex(habit.color);
        if (hex) dot.style.setProperty('--dot-color', hex);
        if (isFuture) dot.classList.add('future');
        else if (Tasks.isDone(data, habit.id, key)) dot.classList.add('done');
        dot.title = habit.title;
        marks.appendChild(dot);
      }
      if (habits.length > this.MAX_DOTS) {
        const more = document.createElement('span');
        more.className = 'habit-more';
        more.textContent = `+${habits.length - this.MAX_DOTS}`;
        marks.appendChild(more);
      }

      cell.append(head, marks);
      cell.addEventListener('click', () => onSelect(key));
      this.daysEl.appendChild(cell);
    }
  },
};

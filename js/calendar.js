// =====================================================
//  calendar.js - ✅ To Do 페이지의 할 일 달력
//  날짜 칸마다: 맨 위 날짜 숫자(+ 다 끝낸 날은 ✓), 그 아래 할 일 한 줄씩
//  예)  8 ✓
//       💼회의       ← 설정한 색 바탕
//       🥛우유사기
//  할 일 중심이라 하루짜리 할 일·시간 일정·기간 일정(띠처럼 이어져요)만 보여요.
//  매일 반복(습관)은 🌱 Habit 페이지의 달력(habit-view.js)에 보여요.
// =====================================================

const CalendarView = {
  titleEl: document.getElementById('month-title'),
  daysEl: document.getElementById('days'),

  MAX_LINES: 3,   // 칸 하나에 들어가는 줄 수 (넘치면 "+N개"가 한 줄을 써요)

  // year, month: 보여 줄 해와 달 (주의: month는 1월이 0, 12월이 11)
  // onSelect: 날짜를 눌렀을 때 할 일
  render({ data, year, month, selectedKey, onSelect }) {
    this.titleEl.textContent = `${year}년 ${month + 1}월`;
    this.daysEl.innerHTML = '';   // 원래 있던 날짜 칸 지우기

    const firstWeekday = new Date(year, month, 1).getDay();   // 1일이 무슨 요일인지 (일=0)
    const lastDate = new Date(year, month + 1, 0).getDate();  // 이번 달이 며칠까지 있는지
    const todayKey = DateUtil.todayKey();

    // 1일 앞의 빈칸 (예: 1일이 수요일이면 일·월·화 3칸 비우기)
    for (let i = 0; i < firstWeekday; i++) {
      this.daysEl.appendChild(document.createElement('div'));
    }

    // 📆 기간 일정은 달마다 정해진 줄(lane)에 그려서, 옆 칸과 띠처럼 이어지게 해요
    const lanes = this.rangeLanes(data, year, month);

    for (let date = 1; date <= lastDate; date++) {
      const key = DateUtil.toKey(new Date(year, month, date));
      const weekday = (firstWeekday + date - 1) % 7;
      // 매일 반복(습관)은 빼고, 할 일만
      const items = Tasks.calendarItems(data, key).filter(item => item.task.type !== 'daily');
      // 그날 할 일을 다 끝냈나요? ('empty' 할 일 없음 / 'pending' 남음 / 'complete' 다 끝냄)
      const status = items.length === 0 ? 'empty' : (items.every(item => item.done) ? 'complete' : 'pending');

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day';
      if (weekday === 0) cell.classList.add('sun');
      if (weekday === 6) cell.classList.add('sat');
      if (key === todayKey) cell.classList.add('today');
      if (key === selectedKey) cell.classList.add('selected');
      if (status === 'complete') cell.classList.add('complete');

      // 맨 윗줄: 날짜 숫자 + (다 끝낸 날이면) ✓
      const head = document.createElement('span');
      head.className = 'day-head';
      const number = document.createElement('span');
      number.className = 'day-number';
      number.textContent = date;
      const mark = document.createElement('span');
      mark.className = 'mark';
      if (status === 'complete') mark.textContent = '✓';
      head.append(number, mark);

      // 그 아래: 할 일 한 줄씩
      const chips = document.createElement('span');
      chips.className = 'day-chips';
      // 줄 목록: 기간 일정은 자기 줄 번호 자리에 (그 자리가 비면 빈 줄), 그 아래 나머지 할 일
      const lines = [];
      for (const item of items) {
        if (item.task.type !== 'range') continue;
        const lane = lanes.get(item.task.id);
        while (lines.length < lane) lines.push(null);
        lines[lane] = item;
      }
      for (const item of items) {
        if (item.task.type !== 'range') lines.push(item);
      }

      // 줄 수를 넘으면 마지막 한 줄은 "+N개"에 양보
      const shown = lines.length > this.MAX_LINES ? lines.slice(0, this.MAX_LINES - 1) : lines;
      for (const item of shown) {
        if (!item) {
          chips.appendChild(this.makeSpacer());
        } else if (item.task.type === 'range') {
          chips.appendChild(this.makeRangeChip(item.task, item.done, key, weekday));
        } else {
          chips.appendChild(this.makeChip(item.task, item.done));
        }
      }
      const hiddenCount = items.length - shown.filter(item => item).length;
      if (hiddenCount > 0) {
        const more = document.createElement('span');
        more.className = 'chip-more';
        more.textContent = `+${hiddenCount}개`;
        chips.appendChild(more);
      }

      cell.append(head, chips);
      cell.addEventListener('click', () => onSelect(key));
      this.daysEl.appendChild(cell);
    }
  },

  // 그 달에 보이는 기간 일정마다 줄 번호 정하기: Map { 일정 id → 0, 1, 2 ... }
  // 먼저 시작하는(같으면 더 긴) 일정부터, 겹치지 않는 가장 위 줄에 넣어요
  rangeLanes(data, year, month) {
    const first = DateUtil.toKey(new Date(year, month, 1));
    const last = DateUtil.toKey(new Date(year, month + 1, 0));
    const ranges = data.tasks
      .filter(task => task.type === 'range' && task.startDate <= last && task.endDate >= first)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate));

    const laneEnds = [];   // 줄마다 마지막 일정이 끝나는 날
    const lanes = new Map();
    for (const task of ranges) {
      let lane = laneEnds.findIndex(end => end < task.startDate);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = task.endDate;
      lanes.set(task.id, lane);
    }
    return lanes;
  },

  // 기간 일정 한 칸 조각: 이어지는 쪽은 모서리 없이 옆 칸까지 붙여서 띠처럼 보여요
  // 이름은 시작하는 날, 그리고 줄이 바뀌는 일요일·1일에만 써요
  makeRangeChip(task, done, key, weekday) {
    const chip = this.makeChip(task, done);
    chip.classList.add('range-chip');
    const isFirst = key === task.startDate;
    const isLast = key === task.endDate;
    const isMonthFirst = key.endsWith('-01');
    const isMonthLast = DateUtil.addDays(key, 1).endsWith('-01');
    if (!isFirst && weekday !== 0 && !isMonthFirst) chip.classList.add('joins-left');
    if (!isLast && weekday !== 6 && !isMonthLast) chip.classList.add('joins-right');
    if (!isFirst) chip.classList.add('continued');   // 시작 날이 아니면 왼쪽 진한 띠 없이
    const showTitle = isFirst || weekday === 0 || isMonthFirst;
    if (!showTitle) {
      chip.textContent = ' ';   // 빈칸 (높이는 그대로)
      return chip;
    }

    // 이름이 한 칸에서 잘리지 않게, 이 줄(주)에서 띠가 이어지는 칸 수만큼 넓게 써요
    let span = 1;
    let next = key;
    while (next < task.endDate && weekday + span <= 6 && !DateUtil.addDays(next, 1).endsWith('-01')) {
      next = DateUtil.addDays(next, 1);
      span++;
    }
    const title = document.createElement('span');
    title.className = 'range-title';
    title.append(...chip.childNodes);
    chip.appendChild(title);
    chip.classList.add('has-title');
    chip.style.setProperty('--span', span);
    return chip;
  },

  // 빈 줄 (위 줄의 기간 일정이 이 날엔 없을 때, 아래 띠가 옆 칸과 줄이 맞도록)
  makeSpacer() {
    const spacer = document.createElement('span');
    spacer.className = 'chip-spacer';
    return spacer;
  },

  // 할 일 한 줄 만들기: "💧물먹기" (설정한 색 바탕, 끝냈으면 줄 긋기)
  makeChip(task, done) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    if (done) chip.classList.add('done');

    const hex = ColorPicker.hex(task.color);
    if (hex) chip.style.setProperty('--chip-color', hex);   // 색이 없으면 기본 파란색 (style.css)
    if (ColorPicker.isPastel(task.color)) chip.classList.add('pastel');   // 파스텔은 더 진하게 칠하기

    if (task.emoji) {
      const emoji = document.createElement('span');
      emoji.className = 'chip-emoji';
      emoji.textContent = task.emoji;
      chip.appendChild(emoji);
    }
    chip.append(task.title);
    return chip;
  },
};

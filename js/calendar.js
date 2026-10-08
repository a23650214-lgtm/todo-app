// =====================================================
//  calendar.js - 달력 그리기
//  날짜 칸마다: 맨 위 날짜 숫자(+ 다 끝낸 날은 ✓), 그 아래 할 일 한 줄씩
//  예)  8 ✓
//       💧물먹기     ← 설정한 색 바탕
//       🥛우유사기
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

    for (let date = 1; date <= lastDate; date++) {
      const key = DateUtil.toKey(new Date(year, month, date));
      const weekday = (firstWeekday + date - 1) % 7;
      const status = Tasks.dayStatus(data, key);

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
      const items = Tasks.calendarItems(data, key);
      // 줄 수를 넘으면 마지막 한 줄은 "+N개"에 양보
      const shown = items.length > this.MAX_LINES ? items.slice(0, this.MAX_LINES - 1) : items;
      for (const { task, done } of shown) {
        chips.appendChild(this.makeChip(task, done));
      }
      if (items.length > shown.length) {
        const more = document.createElement('span');
        more.className = 'chip-more';
        more.textContent = `+${items.length - shown.length}개`;
        chips.appendChild(more);
      }

      cell.append(head, chips);
      cell.addEventListener('click', () => onSelect(key));
      this.daysEl.appendChild(cell);
    }
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

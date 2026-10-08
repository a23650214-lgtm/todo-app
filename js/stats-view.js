// =====================================================
//  stats-view.js - 이번 달 반복 기록 그리기
//  예) 물 2L 먹기   20/31일  [■■■■■■□□□□]
// =====================================================

const StatsView = {
  sectionEl: document.getElementById('stats'),
  titleEl: document.getElementById('stats-title'),
  listEl: document.getElementById('stats-list'),

  // year, month: 달력에 보이는 해와 달
  render({ data, year, month }) {
    const stats = Tasks.monthStats(data, year, month);
    this.sectionEl.hidden = stats.length === 0;   // 보여 줄 기록이 없으면 숨기기
    this.titleEl.textContent = `📊 ${month + 1}월 습관 기록`;
    this.listEl.innerHTML = '';

    for (const { task, planned, done } of stats) {
      const item = document.createElement('li');

      // 윗줄: 이름과 숫자
      const head = document.createElement('div');
      head.className = 'stats-head';
      const name = document.createElement('span');
      name.textContent = task.emoji ? `${task.title} ${task.emoji}` : task.title;
      const count = document.createElement('span');
      count.className = 'stats-count';
      count.textContent = `${done}/${planned}일`;
      head.append(name, count);

      // 아랫줄: 막대
      const bar = document.createElement('div');
      bar.className = 'stats-bar';
      const fill = document.createElement('div');
      fill.className = 'stats-fill';
      fill.style.width = `${Math.round((done / planned) * 100)}%`;
      bar.appendChild(fill);

      item.append(head, bar);
      this.listEl.appendChild(item);
    }
  },
};

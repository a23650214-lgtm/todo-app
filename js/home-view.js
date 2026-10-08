// =====================================================
//  home-view.js - 🏠 홈 페이지
//  📖 오늘의 말씀 + 📝 오늘 일정 (버킷리스트는 bucket-view.js가 그대로 그려요)
// =====================================================

const HomeView = {
  verseTextEl: document.getElementById('verse-text'),
  verseRefEl: document.getElementById('verse-ref'),
  todayTitleEl: document.getElementById('today-title'),
  todayCountEl: document.getElementById('today-count'),
  todayListEl: document.getElementById('today-list'),
  todayEmptyEl: document.getElementById('today-empty'),

  // onChange: 체크하거나 고쳐서 데이터가 바뀌었을 때 할 일
  render({ data, onChange }) {
    const todayKey = DateUtil.todayKey();

    // 📖 오늘의 말씀
    const verse = Verses.forDate(todayKey);
    this.verseTextEl.textContent = verse.text;
    this.verseRefEl.textContent = `— ${verse.ref}`;

    // 📝 오늘 일정: 제목에 날짜, 오른쪽에 "2/5 완료"
    this.todayTitleEl.textContent = `📝 오늘 일정 · ${DateUtil.shortLabel(todayKey)}`;
    const tasks = Tasks.forDate(data, todayKey);
    const doneCount = tasks.filter(task => Tasks.isDone(data, task.id, todayKey)).length;
    this.todayCountEl.textContent = tasks.length ? `${doneCount}/${tasks.length} 완료` : '';
    this.todayEmptyEl.hidden = tasks.length > 0;
    this.todayListEl.innerHTML = '';

    for (const task of tasks) {
      const done = Tasks.isDone(data, task.id, todayKey);
      const li = document.createElement('li');
      if (done) li.classList.add('done');
      const hex = ColorPicker.hex(task.color);
      if (hex) li.style.setProperty('--task-color', hex);

      // 체크 상자
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = done;
      checkbox.addEventListener('change', () => {
        Tasks.setDone(data, task.id, todayKey, checkbox.checked);
        onChange();
      });

      // 이름 (누르면 고치기 창)
      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'today-title';
      if (task.type === 'event') {
        const time = document.createElement('small');
        time.className = 'today-time';
        time.textContent = DateUtil.timeLabel(task.time);
        title.appendChild(time);
      }
      if (task.type === 'daily') {
        const badge = document.createElement('small');
        badge.className = 'today-badge';
        badge.textContent = '🌱 습관';
        title.appendChild(badge);
      }
      title.append(task.emoji ? `${task.emoji} ${task.title}` : task.title);
      title.addEventListener('click', () => TaskEdit.open({ data, task, dateKey: todayKey, onChange }));

      li.append(checkbox, title);
      this.todayListEl.appendChild(li);
    }
  },
};

// =====================================================
//  home-view.js - 🏠 홈 페이지
//  📖 오늘의 말씀 + 📝 일정 (◀ ▶로 다른 날도 볼 수 있어요)
//  (버킷리스트는 bucket-view.js가 그대로 그려요)
// =====================================================

const HomeView = {
  verseTextEl: document.getElementById('verse-text'),
  verseRefEl: document.getElementById('verse-ref'),
  todayTitleEl: document.getElementById('today-title'),
  todayCountEl: document.getElementById('today-count'),
  todayDateEl: document.getElementById('today-date'),
  todayBackEl: document.getElementById('today-back'),
  todayAddEl: document.getElementById('today-add'),
  todayListEl: document.getElementById('today-list'),
  todayEmptyEl: document.getElementById('today-empty'),

  shownKey: null,   // 일정에서 보고 있는 날 (null이면 늘 오늘)

  // 지금 일정에서 보고 있는 날짜
  dateKey() {
    return this.shownKey || DateUtil.todayKey();
  },

  // 처음 한 번: ◀ ▶, 오늘로 돌아가기 연결
  // rerender: 날짜를 바꾼 뒤 화면 다시 그리기
  setup({ rerender }) {
    const move = (step) => {
      const next = DateUtil.addDays(this.dateKey(), step);
      this.shownKey = next === DateUtil.todayKey() ? null : next;   // 오늘로 오면 다시 "늘 오늘"로
      rerender();
    };
    document.getElementById('today-prev').addEventListener('click', () => move(-1));
    document.getElementById('today-next').addEventListener('click', () => move(+1));
    this.todayBackEl.addEventListener('click', () => {
      this.shownKey = null;
      rerender();
    });
  },

  // "10월 9일 금요일 · 내일"
  dateText(key, todayKey) {
    const date = DateUtil.fromKey(key);
    let text = `${date.getMonth() + 1}월 ${date.getDate()}일 ${DateUtil.WEEKDAYS[date.getDay()]}요일`;
    const diff = DateUtil.daysBetween(todayKey, key);
    if (diff === 0) text += ' · 오늘';
    if (diff === 1) text += ' · 내일';
    if (diff === -1) text += ' · 어제';
    return text;
  },

  // onChange: 체크하거나 고쳐서 데이터가 바뀌었을 때 할 일
  render({ data, onChange }) {
    const todayKey = DateUtil.todayKey();
    const dateKey = this.dateKey();
    const isToday = dateKey === todayKey;

    // 📖 오늘의 말씀 (늘 오늘 것)
    const verse = Verses.forDate(todayKey);
    this.verseTextEl.textContent = verse.text;
    this.verseRefEl.textContent = `— ${verse.ref}`;

    // 📝 제목·날짜·버튼
    this.todayTitleEl.textContent = isToday ? '📝 오늘 일정' : '📝 일정';
    this.todayDateEl.textContent = this.dateText(dateKey, todayKey);
    this.todayDateEl.classList.toggle('not-today', !isToday);
    this.todayBackEl.hidden = isToday;
    this.todayAddEl.textContent = isToday ? '+ 오늘 할 일 추가' : `+ ${DateUtil.shortLabel(dateKey)} 할 일 추가`;

    // 그날 할 일들: 오른쪽에 "2/5 완료"
    const tasks = Tasks.forDate(data, dateKey);
    const doneCount = tasks.filter(task => Tasks.isDone(data, task.id, dateKey)).length;
    this.todayCountEl.textContent = tasks.length ? `${doneCount}/${tasks.length} 완료` : '';
    this.todayEmptyEl.textContent = isToday ? '오늘은 아직 할 일이 없어요' : '이 날은 할 일이 없어요';
    this.todayEmptyEl.hidden = tasks.length > 0;
    this.todayListEl.innerHTML = '';

    for (const task of tasks) {
      const done = Tasks.isDone(data, task.id, dateKey);
      const li = document.createElement('li');
      if (done) li.classList.add('done');
      const hex = ColorPicker.hex(task.color);
      if (hex) li.style.setProperty('--task-color', hex);

      // 체크 상자
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = done;
      checkbox.addEventListener('change', () => {
        Tasks.setDone(data, task.id, dateKey, checkbox.checked);
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
      title.addEventListener('click', () => TaskEdit.open({ data, task, dateKey, onChange }));

      li.append(checkbox, title);
      this.todayListEl.appendChild(li);
    }
  },
};

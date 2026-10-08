// =====================================================
//  goal-view.js - 기간 목표 그리기
//  예) 영어단어 외우기                       삭제
//      10월 8일 ~ 10월 14일 · D-6 (6일 남음)
//      [■■■□□□□□□□]
//      120/500개 (24%)        하루 55개씩 하면 돼요
//      [오늘 한 만큼    ] [더하기]
// =====================================================

const GoalView = {
  listEl: document.getElementById('goal-list'),
  emptyEl: document.getElementById('goal-empty'),
  hintEl: document.getElementById('goal-hint'),

  // dateKey: 고른 날짜 (더하기를 누르면 이 날 기록에 더해져요)
  render({ data, dateKey, onChange }) {
    this.listEl.innerHTML = '';
    const goals = Tasks.goalsOn(data, dateKey);
    this.emptyEl.hidden = goals.length > 0;
    this.hintEl.hidden = goals.length === 0;

    const todayKey = DateUtil.todayKey();
    const dayName = dateKey === todayKey ? '오늘' : DateUtil.shortLabel(dateKey);

    for (const goal of goals) {
      const total = Tasks.goalTotal(data, goal.id);
      const remaining = roundNumber(Math.max(0, goal.target - total));
      const percent = Math.min(100, Math.round((total / goal.target) * 100));
      const achieved = total >= goal.target;
      const daysLeft = DateUtil.daysBetween(todayKey, goal.endDate);  // 오늘부터 마감까지

      const item = this.make('li', 'goal');
      if (achieved) item.classList.add('achieved');

      // 1) 이름 + 삭제 버튼
      const head = this.make('div', 'goal-head');
      const title = this.make('span', 'goal-title', goal.title);
      const deleteButton = this.make('button', 'goal-delete', '삭제');
      deleteButton.type = 'button';
      deleteButton.addEventListener('click', () => {
        if (!confirm(`'${goal.title}' 목표를 지울까요?\n지금까지의 기록도 같이 지워져요.`)) return;
        Tasks.remove(data, goal.id);
        onChange();
      });
      head.append(title, deleteButton);

      // 2) 기간 + 남은 날
      const meta = this.make('div', 'goal-meta',
        `${DateUtil.shortLabel(goal.startDate)} ~ ${DateUtil.shortLabel(goal.endDate)} · `);
      meta.appendChild(this.make('strong', 'goal-dday', this.dDayText(daysLeft)));

      // 3) 진행 막대
      const bar = this.make('div', 'stats-bar');
      const fill = this.make('div', 'goal-fill');
      fill.style.width = `${percent}%`;
      bar.appendChild(fill);

      // 4) 숫자 + 페이스 안내
      const numbers = this.make('div', 'goal-numbers');
      numbers.append(
        this.make('span', 'goal-count', `${total}/${goal.target}${goal.unit} (${percent}%)`),
        this.make('span', 'goal-pace', this.paceText(goal, remaining, daysLeft, achieved, todayKey))
      );

      // 5) 조금씩 입력하기
      const logForm = this.make('form', 'goal-log');
      const amountInput = this.make('input');
      amountInput.type = 'number';
      amountInput.step = 'any';
      amountInput.inputMode = 'decimal';
      amountInput.placeholder = `${dayName} 한 만큼 (${goal.unit})`;
      const addButton = this.make('button', null, '더하기');
      addButton.type = 'submit';
      logForm.append(amountInput, addButton);
      logForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const amount = Number(amountInput.value);
        if (!amount) return;   // 비었거나 0이면 무시
        Tasks.addProgress(data, goal.id, dateKey, amount);
        onChange();
      });

      item.append(head, meta, bar, numbers, logForm);

      // 6) 그날 한 만큼 (있을 때만)
      const dayAmount = Tasks.goalAmountOn(data, goal.id, dateKey);
      if (dayAmount > 0) {
        item.appendChild(this.make('div', 'goal-day-note', `${dayName} +${dayAmount}${goal.unit} 했어요`));
      }

      this.listEl.appendChild(item);
    }
  },

  // 마감까지 남은 날 글자
  dDayText(daysLeft) {
    if (daysLeft > 0) return `D-${daysLeft} (${daysLeft}일 남음)`;
    if (daysLeft === 0) return 'D-day (오늘 마감)';
    return '마감 지남';
  },

  // 페이스 안내 글자
  paceText(goal, remaining, daysLeft, achieved, todayKey) {
    if (achieved) return '🎉 목표 달성!';
    if (daysLeft < 0) return `${remaining}${goal.unit} 남기고 끝났어요`;
    if (todayKey < goal.startDate) return `${DateUtil.shortLabel(goal.startDate)} 시작`;
    // 오늘을 포함해서 마감일까지 남은 날 수로 나누기
    const perDay = Math.ceil(remaining / (daysLeft + 1));
    return `하루 ${perDay}${goal.unit}씩 하면 돼요`;
  },

  // 태그 만들기 도우미: make('span', '이름표', '글자')
  make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  },
};

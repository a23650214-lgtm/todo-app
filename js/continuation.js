// =====================================================
//  continuation.js - 매일 반복 "다음 달 이어가기"
//
//  매일 반복 할 일은 그 달에만 적용돼요.
//  새 달에 처음 앱을 열면, 지난달로 끝난 매일 반복 할 일들을 보여 주고
//  "이번 달에도 이어서 할까요?" 하고 물어봐요.
//    이어가기 → 이번 달 1일 ~ 말일짜리 매일 반복을 새로 만들어요
//               (지난달 할 일과 기록은 그대로 두고, 따로 만들어요)
//    그만     → 이번 달엔 안 떠요
//  대답한 할 일에는 continueDecision('yes'/'no')이 남아서 다시 묻지 않아요.
// =====================================================

const Continuation = {

  // 예전에 만든 "끝없는" 매일 반복을 이번 달 말일까지로 맞추기
  // (이 기능 전에 만든 할 일만 해당돼요. 바뀐 게 있으면 true)
  capOpenEnded(data) {
    const todayKey = DateUtil.todayKey();
    let changed = false;

    for (const task of data.tasks) {
      if (task.type !== 'daily' || task.endDate) continue;
      // 앞으로 시작할 할 일이면 그 시작 달 말일까지
      const base = task.startDate > todayKey ? task.startDate : todayKey;
      task.endDate = DateUtil.nextMonthStart(base);
      task.monthEnd = true;
      changed = true;
    }
    return changed;
  },

  // 이어갈지 물어볼 할 일들:
  // 달이 끝나서 멈췄고(monthEnd), 이번 달 1일 전에 끝났고, 아직 대답하지 않은 것
  candidates(data) {
    const monthStart = DateUtil.monthStart(DateUtil.todayKey());
    return data.tasks.filter(task =>
      task.type === 'daily' &&
      task.monthEnd === true &&
      !task.continueDecision &&
      task.endDate <= monthStart
    );
  },

  // 대답 반영하기. answers: { 할 일 id: true(이어가기) / false(그만) }
  apply(data, answers) {
    const monthStart = DateUtil.monthStart(DateUtil.todayKey());

    for (const task of this.candidates(data)) {
      const yes = answers[task.id] === true;
      task.continueDecision = yes ? 'yes' : 'no';
      if (!yes) continue;

      // 이번 달용 매일 반복을 새로 만들기 (이모지, 색도 그대로)
      data.tasks.push({
        id: makeId(),
        type: 'daily',
        startDate: monthStart,
        endDate: DateUtil.nextMonthStart(monthStart),
        monthEnd: true,
        title: task.title,
        emoji: task.emoji || null,
        color: task.color || null,
        continuedFrom: task.id,   // 어느 할 일에서 이어졌는지
        createdAt: new Date().toISOString(),
      });
    }
  },

  // 그 할 일의 마지막 달 기록: { month: 10, done: 25, planned: 31 }
  lastMonthRecord(data, task) {
    const lastDay = DateUtil.fromKey(DateUtil.addDays(task.endDate, -1));
    const year = lastDay.getFullYear();
    const month = lastDay.getMonth();
    const stat = Tasks.monthStats(data, year, month).find(s => s.task.id === task.id);
    return { month: month + 1, done: stat ? stat.done : 0, planned: stat ? stat.planned : 0 };
  },
};


// =====================================================
//  "이번 달에도 이어서 할까요?" 창
// =====================================================

const ContinueDialog = {
  dialogEl: document.getElementById('continue-dialog'),
  titleEl: document.getElementById('continue-title'),
  listEl: document.getElementById('continue-list'),
  confirmEl: document.getElementById('continue-confirm'),
  answers: {},     // { 할 일 id: true / false }
  onDone: null,

  setup() {
    // Esc 키 등으로 그냥 닫히지 않게 (꼭 대답하고 "확인"을 누르게)
    this.dialogEl.addEventListener('cancel', (event) => event.preventDefault());

    this.confirmEl.addEventListener('click', () => {
      const answers = this.answers;
      const onDone = this.onDone;
      this.dialogEl.close();
      if (onDone) onDone(answers);
    });
  },

  isOpen() {
    return this.dialogEl.open;
  },

  // tasks: 물어볼 할 일들, onDone: 확인을 눌렀을 때 (answers를 받아요)
  open(data, tasks, onDone) {
    this.onDone = onDone;
    this.answers = {};
    const thisMonth = DateUtil.fromKey(DateUtil.todayKey()).getMonth() + 1;
    this.titleEl.textContent = `🔁 ${thisMonth}월에도 이어서 할까요?`;
    this.listEl.innerHTML = '';

    for (const task of tasks) {
      this.answers[task.id] = true;   // 처음엔 "이어가기"로 골라 두기

      const item = document.createElement('li');

      // 왼쪽: 이름 + 지난달 기록
      const info = document.createElement('div');
      info.className = 'continue-info';
      const name = document.createElement('span');
      name.className = 'continue-name';
      const colorHex = ColorPicker.hex(task.color);
      if (colorHex) {
        const dot = document.createElement('span');
        dot.className = 'continue-dot';
        dot.style.background = colorHex;
        name.appendChild(dot);
      }
      name.append(task.emoji ? `${task.title} ${task.emoji}` : task.title);
      const record = Continuation.lastMonthRecord(data, task);
      const recordEl = document.createElement('small');
      recordEl.textContent = `${record.month}월 ${record.done}/${record.planned}일 지킴`;
      info.append(name, recordEl);

      // 오른쪽: [이어가기] [그만]
      const choice = document.createElement('div');
      choice.className = 'continue-choice';
      const yesButton = document.createElement('button');
      yesButton.type = 'button';
      yesButton.textContent = '이어가기';
      const noButton = document.createElement('button');
      noButton.type = 'button';
      noButton.textContent = '그만';

      const show = () => {
        yesButton.classList.toggle('picked', this.answers[task.id] === true);
        noButton.classList.toggle('picked', this.answers[task.id] === false);
        item.classList.toggle('no', this.answers[task.id] === false);
      };
      yesButton.addEventListener('click', () => { this.answers[task.id] = true; show(); });
      noButton.addEventListener('click', () => { this.answers[task.id] = false; show(); });
      show();

      choice.append(yesButton, noButton);
      item.append(info, choice);
      this.listEl.appendChild(item);
    }

    this.dialogEl.showModal();
  },
};

ContinueDialog.setup();

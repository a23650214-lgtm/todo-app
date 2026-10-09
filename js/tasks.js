// =====================================================
//  tasks.js - 할 일 규칙
//  "어느 날에 어떤 할 일이 보이는지", "완료했는지"를 정해요.
//  화면은 신경 쓰지 않고, 데이터만 다뤄요.
//
//  할 일 종류(type):
//    'once'  : 정해진 하루에만 하는 할 일
//              { type: 'once', date: '2026-10-08', ... }
//    'daily' : 매일 반복하는 할 일
//              { type: 'daily', startDate: '2026-10-08', endDate: '2026-11-01', monthEnd: true, ... }
//              endDate 날부터는 안 보여요. 그 달에만 적용돼서, 처음엔 다음 달 1일이에요.
//              monthEnd: true  → 달이 끝나서 멈춘 것 (다음 달에 "이어서 할까요?" 물어봐요)
//              monthEnd: false → 직접 그만한 것 (물어보지 않아요)
//              continueDecision: 'yes' / 'no' → 이어갈지 이미 대답함 (continuation.js 참고)
//    'goal'  : 기간 목표 (예: 일주일에 500개)
//              { type: 'goal', startDate, endDate, target: 500, unit: '개', ... }
//              체크 상자가 아니라서 그날 목록에는 안 나오고, 따로 보여요 (goalsOn)
//    'event' : 시간이 있는 당일 일정
//              { type: 'event', date: '2026-10-08', time: '14:00', ... }
//              체크하는 방법은 'once'와 같아요
//    'range' : 여러 날에 걸친 기간 일정 (예: 대전여행 10월 1일~2일)
//              { type: 'range', startDate: '2026-10-01', endDate: '2026-10-02', ... }
//              endDate 날까지 보여요 (그날 포함). 체크는 날마다 따로 해요.
// =====================================================

const Tasks = {

  // 그날 목록에 보이는 순서: 매일 반복 → 기간 일정 → 시간 있는 일정 → 시간 없는 할 일
  TYPE_ORDER: { daily: 0, range: 1, event: 2, once: 3 },

  // 이 할 일이 그 날짜에 보여야 하나요?
  // 새 종류를 추가할 때는 여기에 한 줄씩 더하면 돼요.
  // (날짜 키는 "2026-10-08" 모양이라 글자끼리 크기 비교를 하면 날짜 순서와 같아요)
  isScheduledOn(task, dateKey) {
    switch (task.type) {
      case 'once':
        return task.date === dateKey;
      case 'daily':
        return dateKey >= task.startDate && (!task.endDate || dateKey < task.endDate);
      case 'event':
        return task.date === dateKey;
      case 'range':
        return task.startDate <= dateKey && dateKey <= task.endDate;
      default:
        return false;
    }
  },

  // 그 날짜에 보여야 하는 할 일들
  // 기본 순서: TYPE_ORDER 순서로, 일정끼리는 이른 시간부터
  // 그날 순서를 직접 바꿨으면(드래그) 그 순서대로. 그 뒤에 추가한 할 일은 맨 아래에.
  forDate(data, dateKey) {
    const tasks = data.tasks
      .filter(task => this.isScheduledOn(task, dateKey))
      .sort((a, b) => {
        const byType = this.TYPE_ORDER[a.type] - this.TYPE_ORDER[b.type];
        if (byType !== 0) return byType;
        if (a.type === 'event') return a.time.localeCompare(b.time);  // "09:30" < "14:00"
        return 0;   // 나머지는 추가한 순서 그대로
      });

    const order = this.customOrder(data, dateKey);
    if (!order) return tasks;
    const position = (id) => {
      const index = order.indexOf(id);
      return index === -1 ? Infinity : index;   // 순서 목록에 없으면 (새로 추가) 맨 아래
    };
    return tasks.sort((a, b) => {
      const pa = position(a.id);
      const pb = position(b.id);
      if (pa === pb) return 0;
      return pa < pb ? -1 : 1;
    });
  },

  // 그날 직접 바꾼 순서 (없으면 null)
  customOrder(data, dateKey) {
    return (data.order && data.order[dateKey]) || null;
  },

  // 그날 순서 저장하기 (ids: 위에서부터 할 일 id 목록)
  setOrder(data, dateKey, ids) {
    if (!data.order) data.order = {};
    data.order[dateKey] = ids;
  },

  // emoji: "💧" 같은 이모지 하나 (없으면 null). 빼고 불러도 돼요.
  // color: "green" 같은 색 이름 (color-picker.js의 COLORS 참고, 없으면 null). 빼고 불러도 돼요.

  // 하루짜리 할 일 추가하기
  addOnce(data, dateKey, title, emoji, color) {
    data.tasks.push({
      id: makeId(),
      type: 'once',
      date: dateKey,
      title: title,
      emoji: emoji || null,
      color: color || null,
      createdAt: new Date().toISOString(),
    });
  },

  // 시간 있는 일정 추가하기 (time: "14:00" 모양)
  addEvent(data, dateKey, time, title, emoji, color) {
    data.tasks.push({
      id: makeId(),
      type: 'event',
      date: dateKey,
      time: time,
      title: title,
      emoji: emoji || null,
      color: color || null,
      createdAt: new Date().toISOString(),
    });
  },

  // 기간 일정 추가하기 (startKey ~ endKey, 두 날 모두 포함)
  addRange(data, startKey, endKey, title, emoji, color) {
    data.tasks.push({
      id: makeId(),
      type: 'range',
      startDate: startKey,
      endDate: endKey,
      title: title,
      emoji: emoji || null,
      color: color || null,
      createdAt: new Date().toISOString(),
    });
  },

  // 기간 일정의 기간 글자: "10/1 ~ 10/2"
  rangeLabel(task) {
    const short = (key) => {
      const date = DateUtil.fromKey(key);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    };
    return `${short(task.startDate)} ~ ${short(task.endDate)}`;
  },

  // 매일 반복 할 일 추가하기 (고른 날부터 시작)
  addDaily(data, startKey, title, emoji, color) {
    data.tasks.push({
      id: makeId(),
      type: 'daily',
      startDate: startKey,
      endDate: DateUtil.nextMonthStart(startKey),   // 그 달 말일까지 (다음 달 1일부터 안 보여요)
      monthEnd: true,
      title: title,
      emoji: emoji || null,
      color: color || null,
      createdAt: new Date().toISOString(),
    });
  },

  // 이모지 바꾸기 (null이면 없애기)
  setEmoji(data, taskId, emoji) {
    const task = data.tasks.find(t => t.id === taskId);
    if (task) task.emoji = emoji || null;
  },

  // 할 일 고치기: changes = { title, emoji, color, date, time, endDate }
  //  - 이름·이모지·색: 모든 할 일
  //  - 날짜·시간: 하루짜리(once)·시간 일정(event)·기간 일정(range)만
  //      종료일(endDate)이 날짜보다 뒤면 기간 일정(range)이 돼요 (시간은 없어져요)
  //      시간을 넣으면 시간 일정(event), 지우면 일반 할 일(once)이 돼요
  //      다른 날로 옮기면 체크해 둔 것도 같이 옮겨요
  updateTask(data, taskId, changes) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (changes.title) task.title = changes.title;
    task.emoji = changes.emoji || null;
    task.color = changes.color || null;

    if (task.type !== 'once' && task.type !== 'event' && task.type !== 'range') return;   // 매일 반복은 여기까지

    // 📆 기간 일정이 되거나, 이미 기간 일정이면 (changes.endDate: 종료일, 없으면 하루짜리)
    const startDate = changes.date || (task.type === 'range' ? task.startDate : task.date);
    const endDate = changes.endDate && changes.endDate > startDate ? changes.endDate : null;
    if (endDate || task.type === 'range') {
      this.updateRange(data, task, startDate, endDate, changes.time);
      return;
    }

    const oldDate = task.date;
    const newDate = changes.date || oldDate;
    if (newDate !== oldDate) {
      const wasDone = this.isDone(data, taskId, oldDate);
      this.setDone(data, taskId, oldDate, false);
      if (wasDone) this.setDone(data, taskId, newDate, true);
      // 옛 날짜의 순서 목록에서 빼기 (새 날짜에서는 맨 아래로)
      if (data.order && data.order[oldDate]) {
        data.order[oldDate] = data.order[oldDate].filter(id => id !== taskId);
        if (data.order[oldDate].length === 0) delete data.order[oldDate];
      }
      task.date = newDate;
    }

    if (changes.time) {
      task.type = 'event';
      task.time = changes.time;
    } else {
      task.type = 'once';
      delete task.time;
    }
  },

  // 달력에서 끌어서 옮기기: days일만큼 앞(-)이나 뒤(+)로 (기간 일정은 길이 그대로, 체크도 같이)
  moveBy(data, taskId, days) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task || days === 0) return;
    if (task.type === 'range') {
      this.updateRange(data, task, DateUtil.addDays(task.startDate, days), DateUtil.addDays(task.endDate, days), null);
    } else if (task.type === 'once' || task.type === 'event') {
      this.updateTask(data, taskId, {
        title: task.title,
        emoji: task.emoji,
        color: task.color,
        date: DateUtil.addDays(task.date, days),
        time: task.time || '',
      });
    }
  },

  // 기간 바꾸기 (updateTask가 불러요)
  //  - endDate가 있으면 기간 일정 (startDate ~ endDate)
  //  - endDate가 없으면 기간을 그만두고 startDate 하루짜리로 (time이 있으면 시간 일정)
  //  체크해 둔 기록·순서는 새 기간 안에 있는 날 것만 남겨요
  updateRange(data, task, startDate, endDate, time) {
    // 기간 일정을 통째로 옮기면 (예: 1~2일 → 3~4일) 체크해 둔 것도 같은 만큼 같이 옮겨요
    if (task.type === 'range' && endDate && startDate !== task.startDate) {
      const shift = DateUtil.daysBetween(task.startDate, startDate);
      const doneKeys = Object.keys(data.completions).filter(key =>
        this.isScheduledOn(task, key) && this.isDone(data, task.id, key));
      for (const key of doneKeys) this.setDone(data, task.id, key, false);
      for (const key of doneKeys) {
        const moved = DateUtil.addDays(key, shift);
        if (startDate <= moved && moved <= endDate) this.setDone(data, task.id, moved, true);
      }
    }

    delete task.date;
    delete task.time;
    delete task.startDate;
    delete task.endDate;
    if (endDate) {
      task.type = 'range';
      task.startDate = startDate;
      task.endDate = endDate;
    } else {
      task.type = time ? 'event' : 'once';
      task.date = startDate;
      if (time) task.time = time;
    }

    for (const key of Object.keys(data.completions)) {
      if (!this.isScheduledOn(task, key)) this.setDone(data, task.id, key, false);
    }
    for (const key of Object.keys(data.order || {})) {
      if (this.isScheduledOn(task, key)) continue;
      data.order[key] = data.order[key].filter(id => id !== task.id);
      if (data.order[key].length === 0) delete data.order[key];
    }
  },

  // 색 바꾸기 (null이면 없애기)
  setColor(data, taskId, color) {
    const task = data.tasks.find(t => t.id === taskId);
    if (task) task.color = color || null;
  },

  // 반복 할 일을 이 날부터 그만하기 (지난 기록은 남겨요)
  stopFrom(data, taskId, dateKey) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;

    // 시작한 날(또는 그 전)에 그만하면 아예 지우기
    if (dateKey <= task.startDate) {
      this.remove(data, taskId);
      return;
    }

    task.endDate = dateKey;
    task.monthEnd = false;   // 직접 그만했으니 다음 달에 "이어서 할까요?" 묻지 않기
    // 그만한 날 이후에 미리 해 둔 체크는 정리
    for (const key of Object.keys(data.completions)) {
      if (key >= dateKey) this.setDone(data, taskId, key, false);
    }
  },

  // 할 일 지우기 (완료 기록, 진행 기록도 같이 지워요)
  remove(data, taskId) {
    data.tasks = data.tasks.filter(task => task.id !== taskId);
    for (const dateKey of Object.keys(data.completions)) {
      this.setDone(data, taskId, dateKey, false);
    }
    delete data.progress[taskId];
    // 순서 목록에서도 빼기 (빈 날짜는 정리)
    for (const dateKey of Object.keys(data.order || {})) {
      data.order[dateKey] = data.order[dateKey].filter(id => id !== taskId);
      if (data.order[dateKey].length === 0) delete data.order[dateKey];
    }
  },

  // ----- 기간 목표 -----

  // 기간 목표 추가하기
  addGoal(data, { title, target, unit, startDate, endDate }) {
    data.tasks.push({
      id: makeId(),
      type: 'goal',
      title: title,
      target: target,
      unit: unit,
      startDate: startDate,
      endDate: endDate,
      createdAt: new Date().toISOString(),
    });
  },

  // 그 날짜가 기간 안에 있는 목표들
  goalsOn(data, dateKey) {
    return data.tasks.filter(task =>
      task.type === 'goal' && task.startDate <= dateKey && dateKey <= task.endDate
    );
  },

  // 지금까지 한 전체 양
  goalTotal(data, goalId) {
    const logs = data.progress[goalId] || {};
    return roundNumber(Object.values(logs).reduce((sum, amount) => sum + amount, 0));
  },

  // 그날 한 양
  goalAmountOn(data, goalId, dateKey) {
    return (data.progress[goalId] || {})[dateKey] || 0;
  },

  // 그날 기록에 더하기 (빼기도 돼요: -10). 하루 기록은 0 밑으로 내려가지 않아요.
  addProgress(data, goalId, dateKey, amount) {
    const logs = data.progress[goalId] || {};
    const next = roundNumber(Math.max(0, (logs[dateKey] || 0) + amount));

    if (next > 0) {
      logs[dateKey] = next;
    } else {
      delete logs[dateKey];
    }
    data.progress[goalId] = logs;
  },

  // 그날 완료했나요?
  isDone(data, taskId, dateKey) {
    const doneIds = data.completions[dateKey] || [];
    return doneIds.includes(taskId);
  },

  // 완료 체크하기 / 풀기
  setDone(data, taskId, dateKey, done) {
    const doneIds = (data.completions[dateKey] || []).filter(id => id !== taskId);
    if (done) doneIds.push(taskId);

    if (doneIds.length > 0) {
      data.completions[dateKey] = doneIds;
    } else {
      delete data.completions[dateKey];   // 빈 날짜는 정리
    }
  },

  // 달력 표시에 쓰는 그날 할 일
  // 앞으로 올 날에는 반복 할 일을 빼고 봐요 (안 그러면 모든 날에 점이 찍혀요)
  forCalendar(data, dateKey) {
    const dayTasks = this.forDate(data, dateKey);
    if (dateKey > DateUtil.todayKey()) {
      return dayTasks.filter(task => task.type !== 'daily');
    }
    return dayTasks;
  },

  // 달력 칸 안에 보여 줄 할 일들 (매일 반복도 앞으로 올 날까지 다 포함)
  // 순서: 아직 안 한 것 먼저, 그 안에서는
  //   - 그날 순서를 직접 바꿨으면 → 목록과 같은 순서
  //   - 안 바꿨으면 → 시간 일정(시간 순) → 하루짜리 → 매일 반복
  // 결과 예: [ { task: {...}, done: false }, ... ]
  calendarItems(data, dateKey) {
    const ORDER = { range: -1, event: 0, once: 1, daily: 2 };
    let tasks = this.forDate(data, dateKey);
    if (!this.customOrder(data, dateKey)) {
      tasks = tasks.sort((a, b) => ORDER[a.type] - ORDER[b.type]);
    }
    return tasks
      .map(task => ({ task, done: this.isDone(data, task.id, dateKey) }))
      .sort((a, b) => a.done - b.done);
  },

  // 그날의 상태: 'empty'(할 일 없음) / 'pending'(남음) / 'complete'(다 끝냄)
  dayStatus(data, dateKey) {
    const dayTasks = this.forCalendar(data, dateKey);
    if (dayTasks.length === 0) return 'empty';
    const allDone = dayTasks.every(task => this.isDone(data, task.id, dateKey));
    return allDone ? 'complete' : 'pending';
  },

  // 그 달의 반복 할 일 기록: 이번 달에 해야 하는 날 중 며칠 지켰는지
  // 결과 예: [ { task: {...}, planned: 31, done: 20 } ]  → "20/31일"
  monthStats(data, year, month) {
    const lastDate = new Date(year, month + 1, 0).getDate();
    const stats = [];

    // 아직 오지 않은 달은 기록을 보여 주지 않아요
    if (DateUtil.toKey(new Date(year, month, 1)) > DateUtil.todayKey()) return stats;

    for (const task of data.tasks) {
      if (task.type !== 'daily') continue;

      let planned = 0;
      let done = 0;
      for (let date = 1; date <= lastDate; date++) {
        const key = DateUtil.toKey(new Date(year, month, date));
        if (!this.isScheduledOn(task, key)) continue;  // 시작 전, 그만둔 뒤는 안 세기
        planned++;
        if (this.isDone(data, task.id, key)) done++;
      }

      if (planned > 0) stats.push({ task, planned, done });
    }
    return stats;
  },
};

// 할 일마다 붙일 고유 번호 만들기 (예: "mgh3k2ab")
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 소수 계산 오차 없애기 (예: 0.1 + 0.2 = 0.30000000000000004 → 0.3)
function roundNumber(n) {
  return Math.round(n * 100) / 100;
}

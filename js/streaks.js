// =====================================================
//  streaks.js - 🔥 습관 연속 기록 (스트릭)
//
//  Streaks : 세는 규칙 (화면은 habit-list.js의 🌱 내 습관 카드에서 보여 줘요)
//
//  규칙
//  - 지금 연속: 오늘부터 거꾸로, 하루도 안 빠지고 체크한 날 수
//      오늘 아직 안 했으면 끊긴 게 아니라 어제까지 센 수를 보여 줘요 (오늘이 지나야 끊겨요)
//  - 최고 기록: 시작한 날부터 오늘까지 가장 길게 이어진 날 수
//  - "다음 달 이어가기"로 이어진 습관(continuedFrom)은 하나의 습관으로 쳐서 달이 바뀌어도 이어져요
// =====================================================

const Streaks = {
  MAX_DAYS: 3660,   // 혹시 모를 무한 반복 막기 (최대 10년 정도까지 세요)

  // 매일 반복 할 일들을 "같은 습관"끼리 묶기 (다음 달로 이어간 것끼리)
  // 결과: [ { id: 맨 처음 할 일 id, tasks: [ ... ] }, ... ]
  chains(data) {
    const dailies = data.tasks.filter(task => task.type === 'daily');
    const byId = new Map(dailies.map(task => [task.id, task]));
    const rootOf = (task) => {
      let current = task;
      for (let i = 0; i < 200 && current.continuedFrom && byId.has(current.continuedFrom); i++) {
        current = byId.get(current.continuedFrom);
      }
      return current.id;
    };
    const groups = new Map();
    for (const task of dailies) {
      const root = rootOf(task);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(task);
    }
    return [...groups].map(([id, tasks]) => ({ id, tasks }));
  },

  // 그 날: 해야 하는 날이었나요? 했나요?
  dayState(data, chain, dateKey) {
    const scheduled = chain.tasks.filter(task => Tasks.isScheduledOn(task, dateKey));
    return {
      scheduled: scheduled.length > 0,
      done: scheduled.some(task => Tasks.isDone(data, task.id, dateKey)),
    };
  },

  // 한 습관의 기록: { current: 지금 연속, best: 최고, todayDone: 오늘 했나요 }
  forChain(data, chain, todayKey) {
    const start = chain.tasks.map(task => task.startDate).sort()[0];
    let run = 0;
    let best = 0;
    let key = start;
    for (let i = 0; i < this.MAX_DAYS && key <= todayKey; i++) {
      if (this.dayState(data, chain, key).done) {
        run++;
        best = Math.max(best, run);
      } else if (key !== todayKey) {
        run = 0;   // 빠진 날 → 다시 0부터 (오늘은 아직 하루가 안 끝났으니 빼고)
      }
      key = DateUtil.addDays(key, 1);
    }
    return { current: run, best, todayDone: this.dayState(data, chain, todayKey).done };
  },

  // 오늘 할 습관들의 기록 (이름·이모지·색은 오늘 날짜의 할 일 것으로)
  today(data, todayKey) {
    const result = [];
    for (const chain of this.chains(data)) {
      const task = chain.tasks.find(t => Tasks.isScheduledOn(t, todayKey));
      if (!task) continue;   // 오늘은 안 하는 습관 (그만뒀거나 아직 시작 전)
      result.push({ task, ...this.forChain(data, chain, todayKey) });
    }
    // 지금 연속이 긴 순서로
    return result.sort((a, b) => b.current - a.current);
  },
};

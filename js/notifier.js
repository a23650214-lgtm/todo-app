// =====================================================
//  notifier.js - 알림 보내기
//
//  서버 없이 하는 방식이에요: 앱이 15초마다 시계를 보고,
//  시간이 된 일정이나 아침 요약이 있으면 알림을 띄워요.
//  그래서 앱이 열려 있을 때 가장 정확하고,
//  앱이 닫혀 있으면 알림이 늦거나 안 올 수 있어요.
// =====================================================

const Notifier = {
  CHECK_EVERY: 15 * 1000,   // 15초마다 확인
  LATE_LIMIT: 15,           // 일정 시간이 지나고 15분 안이면 늦게라도 알려 줘요

  getData: null,            // 데이터 가져오기 (start에서 받아요)
  save: null,               // 저장하기 (start에서 받아요)

  // 앱이 시작될 때 한 번 불러요
  start({ getData, save }) {
    this.getData = getData;
    this.save = save;
    this.check();
    setInterval(() => this.check(), this.CHECK_EVERY);
    // 앱으로 다시 돌아왔을 때도 바로 확인 (예: 그날 처음 앱을 연 순간 아침 요약)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.check();
    });
  },

  // 지금 시각 (검사할 때 바꿔 끼울 수 있게 따로 뺐어요)
  now() {
    return new Date();
  },

  // ----- 이 폰(브라우저)에서 알림을 쓸 수 있나요? -----

  isSupported() {
    return 'Notification' in window && window.isSecureContext;
  },

  // 'granted'(허용) / 'denied'(막힘) / 'default'(아직 안 물어봄) / 'unsupported'(지원 안 함)
  permission() {
    return this.isSupported() ? Notification.permission : 'unsupported';
  },

  isIOS() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);   // 아이패드
  },

  // 홈 화면에 추가한 앱으로 열었나요?
  isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  },

  // 알림이 실제로 켜져 있나요? (설정에서 켰고 + 폰에서도 허용했고)
  isActive(data) {
    return data.settings.notify.enabled && this.permission() === 'granted';
  },

  // ----- 확인하기: 보낼 알림이 있나요? -----

  check() {
    if (!this.getData) return;
    const data = this.getData();
    if (!this.isActive(data)) return;

    const settings = data.settings.notify;
    const log = data.notifyLog;
    const now = this.now();
    const todayKey = DateUtil.toKey(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let changed = false;

    // 지난 날의 알림 기록은 정리
    const before = log.sent.length;
    log.sent = log.sent.filter(key => key.split('|')[1] === todayKey);
    if (log.sent.length !== before) changed = true;

    // 1) 시간 있는 일정
    if (settings.events && this.checkEvents(data, now, todayKey, nowMinutes)) changed = true;

    // 2) 아침 요약 (요약 시간이 지났고, 오늘 아직 안 보냈으면)
    if (settings.summary && nowMinutes >= DateUtil.toMinutes(settings.summaryTime) && log.summaryDate !== todayKey) {
      log.summaryDate = todayKey;
      changed = true;
      this.send(`☀️ ${DateUtil.label(todayKey)} 오늘 할 일`, this.summaryText(data, todayKey), `summary-${todayKey}`);
    }

    if (changed) this.save();
  },

  // 시간이 된 일정 알리기 (기록이 바뀌었으면 true)
  checkEvents(data, now, todayKey, nowMinutes) {
    let changed = false;

    for (const task of Tasks.forDate(data, todayKey)) {
      if (task.type !== 'event') continue;

      const key = `${task.id}|${todayKey}|${task.time}`;   // 시간을 바꾸면 다시 알리도록 시간도 넣어요
      if (data.notifyLog.sent.includes(key)) continue;     // 이미 알림

      const eventMinutes = DateUtil.toMinutes(task.time);
      if (nowMinutes < eventMinutes) continue;             // 아직 시간이 안 됨

      data.notifyLog.sent.push(key);
      changed = true;

      // 알리지 않고 넘어가는 경우
      const late = nowMinutes - eventMinutes;
      const eventTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, eventMinutes);
      const addedAfter = task.createdAt && new Date(task.createdAt) > eventTime;   // 시간이 지난 뒤에 등록함
      if (Tasks.isDone(data, task.id, todayKey)) continue;   // 이미 체크함
      if (late > this.LATE_LIMIT || addedAfter) continue;    // 너무 늦음

      const title = `⏰ ${DateUtil.timeLabel(task.time)} ${task.title}${task.emoji ? ' ' + task.emoji : ''}`;
      const body = late === 0 ? '일정 시간이 됐어요' : `${late}분 전에 시작한 일정이에요`;
      this.send(title, body, key);
    }
    return changed;
  },

  // 아침 요약 글: 남은 할 일, 일정, 기간 목표
  summaryText(data, todayKey) {
    const tasks = Tasks.forDate(data, todayKey).filter(task => !Tasks.isDone(data, task.id, todayKey));
    const goals = Tasks.goalsOn(data, todayKey).filter(goal => Tasks.goalTotal(data, goal.id) < goal.target);

    if (tasks.length === 0 && goals.length === 0) {
      return '남은 할 일이 없어요. 좋은 하루 보내세요! 🎉';
    }

    const lines = tasks.map(task => {
      const time = task.type === 'event' ? `${DateUtil.timeLabel(task.time)} ` : '';
      return `• ${time}${task.title}${task.emoji ? ' ' + task.emoji : ''}`;
    });
    for (const goal of goals) {
      const daysLeft = DateUtil.daysBetween(todayKey, goal.endDate);
      lines.push(`🎯 ${goal.title} ${Tasks.goalTotal(data, goal.id)}/${goal.target}${goal.unit} · ${GoalView.dDayText(daysLeft)}`);
    }

    // 너무 길면 6줄까지만
    const MAX_LINES = 6;
    const shown = lines.slice(0, MAX_LINES);
    if (lines.length > MAX_LINES) shown.push(`…외 ${lines.length - MAX_LINES}개`);

    let header = `할 일 ${tasks.length}개`;
    if (goals.length > 0) header += ` · 목표 ${goals.length}개`;
    return `${header}\n${shown.join('\n')}`;
  },

  // 아침 요약 시간이 이미 지났으면 오늘 요약은 보낸 걸로 치기 (알림을 막 켰을 때)
  skipPastSummary(data) {
    const now = this.now();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes >= DateUtil.toMinutes(data.settings.notify.summaryTime)) {
      data.notifyLog.summaryDate = DateUtil.toKey(now);
    }
  },

  // ----- 알림 띄우기 -----

  async send(title, body, tag) {
    Toast.show(title, body);   // 앱을 보고 있으면 화면 위에도 띄우기
    if (this.permission() !== 'granted') return;

    const options = { body: body, tag: tag, icon: 'icons/icon-192.png' };
    // 폰에서는 오프라인 도우미(sw.js)를 통해 띄워야 해요
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(title, options);
          return;
        }
      }
    } catch (error) {
      console.error('알림 실패 (도우미):', error);
    }
    // 오프라인 도우미가 없으면 (PC 등) 바로 띄우기
    try {
      new Notification(title, options);
    } catch (error) {
      console.error('알림 실패:', error);
    }
  },
};


// =====================================================
//  화면 위 알림 띠 (앱을 보고 있을 때)
// =====================================================

const Toast = {
  el: document.getElementById('toast'),
  titleEl: document.getElementById('toast-title'),
  bodyEl: document.getElementById('toast-body'),
  timer: null,

  show(title, body) {
    if (document.visibilityState !== 'visible') return;
    this.titleEl.textContent = title;
    this.bodyEl.textContent = body;
    this.el.hidden = false;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.hide(), 8000);   // 8초 뒤 저절로 사라짐
  },

  hide() {
    this.el.hidden = true;
  },
};

Toast.el.addEventListener('click', () => Toast.hide());   // 누르면 닫기

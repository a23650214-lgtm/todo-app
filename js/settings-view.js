// =====================================================
//  settings-view.js - 🔔 알림 설정 칸
// =====================================================

const SettingsView = {
  statusEl: document.getElementById('notify-status'),
  enabledEl: document.getElementById('notify-enabled'),
  optionsEl: document.getElementById('notify-options'),
  eventsEl: document.getElementById('notify-events'),
  summaryEl: document.getElementById('notify-summary'),
  summaryTimeEl: document.getElementById('notify-summary-time'),
  testEl: document.getElementById('notify-test'),

  // 처음 한 번: 스위치마다 할 일 연결하기
  // onChange: 설정이 바뀌었을 때 할 일 (저장하고 다시 그리기)
  setup({ getData, onChange }) {
    const settings = () => getData().settings.notify;

    // 알림 켜기 / 끄기
    this.enabledEl.addEventListener('change', async () => {
      if (!this.enabledEl.checked) {
        settings().enabled = false;
        onChange();
        return;
      }
      if (!Notifier.isSupported()) {
        onChange();   // 다시 그리면서 스위치를 꺼진 상태로 되돌려요
        return;
      }

      // 처음 켤 때 폰(브라우저)이 "알림을 허용할까요?" 하고 물어봐요
      let permission = Notification.permission;
      if (permission === 'default') permission = await Notification.requestPermission();

      settings().enabled = permission === 'granted';
      if (settings().enabled) Notifier.skipPastSummary(getData());   // 켜자마자 지난 요약이 오지 않게
      onChange();
      if (settings().enabled) Notifier.check();
    });

    this.eventsEl.addEventListener('change', () => {
      settings().events = this.eventsEl.checked;
      onChange();
    });

    this.summaryEl.addEventListener('change', () => {
      settings().summary = this.summaryEl.checked;
      onChange();
    });

    this.summaryTimeEl.addEventListener('change', () => {
      settings().summaryTime = this.summaryTimeEl.value || '09:00';
      onChange();
    });

    this.testEl.addEventListener('click', () => {
      Notifier.send('🔔 테스트 알림', '알림이 잘 와요! 이렇게 보여요.', 'test');
    });
  },

  render({ data }) {
    const settings = data.settings.notify;
    const permission = Notifier.permission();
    const active = Notifier.isActive(data);

    this.enabledEl.checked = active;
    this.enabledEl.disabled = permission === 'unsupported' || permission === 'denied';

    // 알림이 꺼져 있으면 아래 설정은 흐리게
    this.optionsEl.classList.toggle('off', !active);
    for (const el of [this.eventsEl, this.summaryEl, this.summaryTimeEl, this.testEl]) {
      el.disabled = !active;
    }
    this.eventsEl.checked = settings.events;
    this.summaryEl.checked = settings.summary;
    this.summaryTimeEl.value = settings.summaryTime;

    this.statusEl.textContent = this.statusText(active, permission);
  },

  // 지금 상태 설명
  statusText(active, permission) {
    if (permission === 'unsupported') {
      if (Notifier.isIOS() && !Notifier.isStandalone()) {
        return '아이폰은 홈 화면에 추가한 앱에서만 알림을 쓸 수 있어요. 아래 방법을 참고해 주세요.';
      }
      if (!window.isSecureContext) {
        return '파일을 더블클릭해서 열면 알림이 안 돼요. Live Server나 https:// 주소로 열어 주세요.';
      }
      return '이 브라우저는 알림을 지원하지 않아요.';
    }
    if (permission === 'denied') {
      return '알림이 막혀 있어요. 폰(브라우저) 설정에서 이 앱의 알림을 허용한 뒤 앱을 다시 열어 주세요.';
    }
    if (active) return '✅ 알림이 켜져 있어요.';
    return '알림이 꺼져 있어요.';
  },
};

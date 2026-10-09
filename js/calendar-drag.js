// =====================================================
//  calendar-drag.js - ✅ To Do 달력에서 일정을 꾹 눌러 끌어서 다른 날로 옮기기
//
//  - 일정 줄을 꾹 누르고(0.45초) 있으면 끌기가 시작돼요 (폰은 살짝 진동)
//    짧게 누르면 원래처럼 그날 팝업이 열려요
//  - 끄는 동안: 놓일 날 칸들이 색 테두리로 보이고, 손가락 옆에 "10/3 ~ 10/4"가 떠요
//  - 놓으면 그만큼 날짜가 옮겨져요 (기간 일정은 길이 그대로, 체크도 같이 → Tasks.moveBy)
//    기간 일정의 둘째 날을 잡고 4일에 놓으면 → 둘째 날이 4일이 되게 옮겨요
//
//  폰에서 꾹 누르기 전에 손가락이 움직이면 그냥 스크롤(탭 넘기기)로 봐요.
//  끌기가 시작된 뒤에는 화면이 스크롤되지 않게 막아요.
//  사용법: CalendarDrag.setup({ getData, onChange })
// =====================================================

const CalendarDrag = {
  HOLD_MS: 450,   // 이만큼 꾹 누르면 끌기 시작
  SLOP: 10,       // 꾹 누르는 동안 이만큼(px) 넘게 움직이면 끌기 취소 (스크롤로 봐요)

  daysEl: document.getElementById('days'),

  getData: null,
  onChange: null,

  press: null,         // 누르고 있는 중: { chip, taskId, grabKey, x, y, timer }
  drag: null,          // 끄는 중: { task, grabKey, dropKey, ghost }
  suppressClick: false,
  lastTouch: 0,        // 터치 뒤에 따라오는 가짜 마우스 이벤트를 무시하려고

  setup({ getData, onChange }) {
    this.getData = getData;
    this.onChange = onChange;
    const el = this.daysEl;

    // 👆 손가락
    el.addEventListener('touchstart', (event) => {
      this.lastTouch = Date.now();
      if (event.touches.length !== 1) { this.cancel(); return; }
      const t = event.touches[0];
      this.startPress(event.target, t.clientX, t.clientY);
    }, { passive: true });
    el.addEventListener('touchmove', (event) => {
      const t = event.touches[0];
      if (this.drag) {
        event.preventDefault();   // 끄는 중에는 스크롤·탭 넘기기 막기
        this.moveDrag(t.clientX, t.clientY);
      } else {
        this.checkSlop(t.clientX, t.clientY);
      }
    }, { passive: false });
    el.addEventListener('touchend', (event) => {
      this.lastTouch = Date.now();
      if (this.drag) {
        event.preventDefault();   // 놓은 뒤 날짜 칸이 눌린 걸로 처리되지 않게
        this.drop();
      } else {
        this.cancel();
      }
    });
    el.addEventListener('touchcancel', () => this.cancel());

    // 🖱️ 마우스 (컴퓨터에서 확인할 때)
    el.addEventListener('mousedown', (event) => {
      if (event.button !== 0 || Date.now() - this.lastTouch < 800) return;
      this.startPress(event.target, event.clientX, event.clientY);
    });
    window.addEventListener('mousemove', (event) => {
      if (Date.now() - this.lastTouch < 800) return;
      if (this.drag) this.moveDrag(event.clientX, event.clientY);
      else this.checkSlop(event.clientX, event.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (Date.now() - this.lastTouch < 800) return;
      if (this.drag) this.drop();
      else this.cancel();
    });

    // 꾹 누를 때 뜨는 메뉴(복사·저장 등) 막기
    el.addEventListener('contextmenu', (event) => {
      if (this.press || this.drag) event.preventDefault();
    });

    // 끌어서 놓은 직후의 클릭은 무시 (그날 팝업이 열리지 않게)
    el.addEventListener('click', (event) => {
      if (!this.suppressClick) return;
      event.stopPropagation();
      event.preventDefault();
      this.suppressClick = false;
    }, true);
  },

  // 일정 줄 위에서 누르기 시작
  startPress(target, x, y) {
    this.cancel();
    const chip = target.closest && target.closest('.chip[data-id]');
    const cell = chip && chip.closest('.day[data-key]');
    if (!chip || !cell) return;
    this.press = {
      chip,
      taskId: chip.dataset.id,
      grabKey: cell.dataset.key,
      x, y,
      timer: setTimeout(() => this.startDrag(), this.HOLD_MS),
    };
    chip.classList.add('pressing');
  },

  // 꾹 누르는 동안 손가락이 많이 움직이면 → 스크롤하려는 거라 취소
  checkSlop(x, y) {
    if (!this.press) return;
    if (Math.hypot(x - this.press.x, y - this.press.y) > this.SLOP) this.cancel();
  },

  // 꾹 눌렀어요 → 끌기 시작
  startDrag() {
    const press = this.press;
    if (!press) return;
    press.chip.classList.remove('pressing');
    const task = this.getData().tasks.find(t => t.id === press.taskId);
    if (!task) { this.cancel(); return; }

    // 손가락을 따라다니는 이름표
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    const hex = ColorPicker.hex(task.color);
    if (hex) ghost.style.setProperty('--chip-color', hex);
    document.body.appendChild(ghost);

    this.drag = { task, grabKey: press.grabKey, dropKey: press.grabKey, ghost };
    this.press = null;
    document.body.classList.add('drag-active');
    // 옮기는 일정은 원래 자리에서 흐리게
    this.daysEl.querySelectorAll(`.chip[data-id="${task.id}"]`).forEach(c => c.classList.add('drag-source'));
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (error) { /* 진동 없는 폰 */ }
    this.moveDrag(press.x, press.y);
  },

  // 끄는 중: 손가락 밑의 날짜 칸 찾기 → 놓일 칸들 표시
  moveDrag(x, y) {
    const drag = this.drag;
    if (!drag) return;
    drag.ghost.style.left = `${x}px`;
    drag.ghost.style.top = `${y}px`;

    const under = document.elementFromPoint(x, y);
    const cell = under && under.closest('#days .day[data-key]');
    if (cell) drag.dropKey = cell.dataset.key;   // 달력 밖이면 마지막 칸 그대로

    const shift = DateUtil.daysBetween(drag.grabKey, drag.dropKey);
    const { start, end } = this.span(drag.task, shift);
    this.daysEl.querySelectorAll('.day[data-key]').forEach((day) => {
      const key = day.dataset.key;
      const inside = start <= key && key <= end;
      day.classList.toggle('drop-target', inside);
    });

    const label = (key) => { const d = DateUtil.fromKey(key); return `${d.getMonth() + 1}/${d.getDate()}`; };
    const when = start === end ? label(start) : `${label(start)} ~ ${label(end)}`;
    const name = drag.task.emoji ? `${drag.task.emoji} ${drag.task.title}` : drag.task.title;
    drag.ghost.textContent = shift === 0 ? `${name}  ·  ${when}` : `${name}  →  ${when}`;
    drag.ghost.classList.toggle('moved', shift !== 0);
  },

  // shift일 옮겼을 때 일정이 차지하는 날 (처음 ~ 끝)
  span(task, shift) {
    if (task.type === 'range') {
      return { start: DateUtil.addDays(task.startDate, shift), end: DateUtil.addDays(task.endDate, shift) };
    }
    const key = DateUtil.addDays(task.date, shift);
    return { start: key, end: key };
  },

  // 놓기
  drop() {
    const drag = this.drag;
    const shift = DateUtil.daysBetween(drag.grabKey, drag.dropKey);
    this.cleanup();
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 500);
    if (shift === 0) return;   // 제자리에 놓으면 그대로
    Tasks.moveBy(this.getData(), drag.task.id, shift);
    this.onChange();
  },

  // 누르기·끌기 그만 (아무것도 안 바꿔요)
  cancel() {
    if (this.drag) this.cleanup();
    if (this.press) {
      clearTimeout(this.press.timer);
      this.press.chip.classList.remove('pressing');
      this.press = null;
    }
  },

  cleanup() {
    if (this.drag) this.drag.ghost.remove();
    this.drag = null;
    document.body.classList.remove('drag-active');
    this.daysEl.querySelectorAll('.drag-source').forEach(c => c.classList.remove('drag-source'));
    this.daysEl.querySelectorAll('.drop-target').forEach(day => day.classList.remove('drop-target'));
  },
};

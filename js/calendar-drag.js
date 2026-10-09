// =====================================================
//  calendar-drag.js - ✅ To Do 달력에서 일정을 꾹 눌러 끌어서 다른 날로 옮기기
//
//  끌기는 검증된 라이브러리 SortableJS(js/vendor/Sortable.min.js)가 해요.
//  손가락(터치)과 마우스 둘 다 돼요.
//
//  - 날짜 칸마다 일정 줄 상자(.day-chips)가 하나의 "목록"이고,
//    모든 칸이 같은 그룹이라 한 칸의 일정을 다른 칸으로 옮길 수 있어요
//  - 꾹 누르기(0.4초) 뒤에만 끌려요. 짧게 누르면 원래처럼 그날 팝업이 열려요
//  - 놓으면 Tasks.moveBy로 날짜를 옮기고 달력을 다시 그려요
//    (기간 일정은 길이 그대로, 잡은 날이 놓은 날로 가요)
//
//  사용법: main.js에서 CalendarDrag.setup({ getData, onChange }) 한 번,
//          달력을 다시 그릴 때마다 CalendarDrag.attach()
// =====================================================

const CalendarDrag = {
  HOLD_MS: 400,   // 이만큼 꾹 누르면 끌기 시작

  daysEl: document.getElementById('days'),
  getData: null,
  onChange: null,
  sortables: [],          // 지금 달력 칸마다 붙어 있는 SortableJS
  suppressClick: false,   // 놓은 직후 날짜 칸 클릭(팝업 열림) 막기

  setup({ getData, onChange }) {
    this.getData = getData;
    this.onChange = onChange;

    // 놓은 직후의 클릭은 무시 (그날 팝업이 열리지 않게)
    this.daysEl.addEventListener('click', (event) => {
      if (!this.suppressClick) return;
      event.stopPropagation();
      event.preventDefault();
    }, true);

    // 꾹 누를 때 뜨는 메뉴(복사·저장 등) 막기
    this.daysEl.addEventListener('contextmenu', (event) => {
      if (event.target.closest('.chip[data-id]')) event.preventDefault();
    });
  },

  // 달력을 새로 그린 뒤: 날짜 칸마다 SortableJS 붙이기
  attach() {
    if (typeof Sortable === 'undefined') {
      console.error('SortableJS를 못 불러왔어요 (js/vendor/Sortable.min.js)');
      return;
    }
    this.sortables.forEach(s => s.destroy());
    this.sortables = [];

    this.daysEl.querySelectorAll('.day[data-key] .day-chips').forEach((list) => {
      this.sortables.push(new Sortable(list, {
        group: 'calendar-days',       // 모든 날짜 칸이 한 그룹 → 칸끼리 옮기기
        sort: false,                  // 같은 칸 안에서 순서 바꾸기는 안 해요
        draggable: '.chip[data-id]',  // 일정 줄만 (빈 줄, "+2개"는 안 끌려요)
        delay: this.HOLD_MS,          // 꾹 누르기
        delayOnTouchOnly: false,      // 마우스도 꾹 눌러야 해요
        touchStartThreshold: 8,       // 꾹 누르는 중 8px 넘게 움직이면 → 스크롤로 봐요
        forceFallback: true,          // 터치·마우스 모두 같은 방식으로 끌기
        fallbackOnBody: true,
        fallbackTolerance: 3,
        supportPointer: false,        // 폰에서는 터치 이벤트로 (끄는 중 화면이 스크롤되지 않게)
        animation: 120,
        chosenClass: 'chip-chosen',   // 꾹 눌러서 잡힌 일정
        ghostClass: 'chip-drop-preview',   // 놓일 칸에 미리 보이는 자리
        dragClass: 'chip-dragging',   // 손가락을 따라다니는 일정

        onStart: () => {
          document.body.classList.add('drag-active');
          try { if (navigator.vibrate) navigator.vibrate(30); } catch (error) { /* 진동 없는 폰 */ }
        },

        // 끄는 중: 지금 놓일 날짜 칸 표시
        onMove: (event) => {
          this.markTarget(event.to.closest('.day'));
        },

        onEnd: (event) => {
          document.body.classList.remove('drag-active');
          this.markTarget(null);
          this.suppressClick = true;
          setTimeout(() => { this.suppressClick = false; }, 400);

          const fromDay = event.from.closest('.day[data-key]');
          const toDay = event.to.closest('.day[data-key]');
          const taskId = event.item.dataset.id;
          const shift = (fromDay && toDay) ? DateUtil.daysBetween(fromDay.dataset.key, toDay.dataset.key) : 0;
          if (shift !== 0) Tasks.moveBy(this.getData(), taskId, shift);
          // 옮겼든 안 옮겼든 달력을 깨끗하게 다시 그려요
          // (SortableJS가 끌기 정리를 마친 뒤에 하려고 살짝 미뤄요)
          setTimeout(() => this.onChange(), 0);
        },
      }));
    });
  },

  // 놓일 날짜 칸 하나만 테두리 표시 (null이면 모두 지우기)
  markTarget(day) {
    this.daysEl.querySelectorAll('.day.drop-target').forEach(d => { if (d !== day) d.classList.remove('drop-target'); });
    if (day) day.classList.add('drop-target');
  },
};

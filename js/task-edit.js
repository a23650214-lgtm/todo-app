// =====================================================
//  task-edit.js - ✏️ 할 일 고치기 창
//  날짜 팝업의 할 일 목록에서 이름을 누르면 떠요.
//  사용법: TaskEdit.open({ data, task, dateKey, onChange })
//  창 안에서 고른 이모지·색은 "저장"을 눌러야 바뀌어요 (취소하면 그대로).
// =====================================================

const TaskEdit = {
  TITLE_MAX: 100,

  dialogEl: document.getElementById('task-edit-dialog'),
  formEl: document.getElementById('task-edit-form'),
  emojiEl: document.getElementById('edit-emoji'),
  titleInput: document.getElementById('edit-title'),
  colorEl: document.getElementById('edit-color'),
  colorDotEl: document.querySelector('#edit-color .color-dot'),
  colorNameEl: document.getElementById('edit-color-name'),
  dateRowEl: document.getElementById('edit-date-row'),
  dateInput: document.getElementById('edit-date'),
  timeRowEl: document.getElementById('edit-time-row'),
  timeInput: document.getElementById('edit-time'),
  timeClearEl: document.getElementById('edit-time-clear'),
  dailyNoteEl: document.getElementById('edit-daily-note'),

  // 지금 고치는 중인 것
  data: null,
  task: null,
  dateKey: null,      // 어느 날짜 목록에서 열었는지 (매일 반복 삭제할 때 필요해요)
  onChange: null,
  emoji: null,        // 창 안에서 고른 이모지 (저장 전)
  color: null,        // 창 안에서 고른 색 (저장 전)

  setup() {
    // 이모지·색 고르기 (저장 전까지는 창 안에서만 바뀌어요)
    this.emojiEl.addEventListener('click', () => {
      EmojiPicker.open(this.emoji, (emoji) => { this.emoji = emoji; this.showChoices(); });
    });
    this.colorEl.addEventListener('click', () => {
      ColorPicker.open(this.color, (color) => { this.color = color; this.showChoices(); });
    });

    // 시간 지우기 ✕
    this.timeInput.addEventListener('input', () => this.showTimeClear());
    this.timeInput.addEventListener('change', () => this.showTimeClear());
    this.timeClearEl.addEventListener('click', () => {
      this.timeInput.value = '';
      this.showTimeClear();
    });

    document.getElementById('edit-cancel').addEventListener('click', () => this.close());

    // 저장
    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = this.titleInput.value.trim().slice(0, this.TITLE_MAX);
      if (!title) {
        this.titleInput.focus();
        return;
      }
      Tasks.updateTask(this.data, this.task.id, {
        title: title,
        emoji: this.emoji,
        color: this.color,
        date: this.dateInput.value,
        time: this.timeInput.value,
      });
      const onChange = this.onChange;
      this.close();
      onChange();
    });

    // 삭제 (목록의 삭제 버튼과 똑같이)
    document.getElementById('edit-delete').addEventListener('click', () => {
      const task = this.task;
      if (task.type === 'daily') {
        const ok = confirm(`'${task.title}'을(를) ${DateUtil.label(this.dateKey)}부터 그만할까요?\n지난 기록은 그대로 남아요.`);
        if (!ok) return;
        Tasks.stopFrom(this.data, task.id, this.dateKey);
      } else {
        if (!confirm(`'${task.title}'을(를) 지울까요?`)) return;
        Tasks.remove(this.data, task.id);
      }
      const onChange = this.onChange;
      this.close();
      onChange();
    });

    // 창 바깥(어두운 곳)을 누르면 닫기 (창 안쪽 여백은 빼고)
    this.dialogEl.addEventListener('click', (event) => {
      if (event.target !== this.dialogEl) return;
      const r = this.dialogEl.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right &&
                     event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) this.close();
    });
  },

  open({ data, task, dateKey, onChange }) {
    this.data = data;
    this.task = task;
    this.dateKey = dateKey;
    this.onChange = onChange;
    this.emoji = task.emoji || null;
    this.color = task.color || null;

    this.titleInput.value = task.title;
    const isDaily = task.type === 'daily';
    // 날짜·시간은 하루짜리·시간 일정만
    this.dateRowEl.hidden = isDaily;
    this.timeRowEl.hidden = isDaily;
    this.dailyNoteEl.hidden = !isDaily;
    this.dateInput.value = isDaily ? '' : task.date;
    this.timeInput.value = task.type === 'event' ? task.time : '';

    this.showChoices();
    this.showTimeClear();
    this.dialogEl.showModal();
  },

  close() {
    if (this.dialogEl.open) this.dialogEl.close();
  },

  // 창 안의 이모지·색 버튼 모양
  showChoices() {
    this.emojiEl.textContent = this.emoji || '🙂';
    this.emojiEl.classList.toggle('empty', !this.emoji);
    const hex = ColorPicker.hex(this.color);
    this.colorDotEl.style.background = hex || '';
    this.colorDotEl.classList.toggle('empty', !hex);
    this.colorNameEl.textContent = ColorPicker.name(this.color) || '색 없음';
  },

  showTimeClear() {
    this.timeClearEl.hidden = this.timeInput.value === '';
  },
};

TaskEdit.setup();

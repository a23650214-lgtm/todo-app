// =====================================================
//  day-view.js - 고른 날의 할 일 목록 그리기
// =====================================================

const DayView = {
  titleEl: document.getElementById('selected-title'),
  listEl: document.getElementById('todo-list'),
  emptyEl: document.getElementById('empty-message'),

  // onChange: 체크하거나 지워서 데이터가 바뀌었을 때 할 일
  render({ data, dateKey, onChange }) {
    this.titleEl.textContent = DateUtil.label(dateKey);   // "10월 8일 (목)"
    this.listEl.innerHTML = '';

    const dayTasks = Tasks.forDate(data, dateKey);
    this.emptyEl.hidden = dayTasks.length > 0;   // 할 일이 있으면 "없어요" 문구 숨기기

    for (const task of dayTasks) {
      const done = Tasks.isDone(data, task.id, dateKey);

      const item = document.createElement('li');
      item.dataset.id = task.id;   // 순서를 바꿀 때 어떤 할 일인지 알아보려고
      if (done) item.classList.add('done');

      // 맨 왼쪽 손잡이 ⠿ : 누른 채로 위아래로 끌면 순서가 바뀌어요
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '⠿';
      handle.setAttribute('aria-label', '끌어서 순서 바꾸기');
      DragSort.attach(handle, item, this.listEl, (ids) => {
        Tasks.setOrder(data, dateKey, ids);
        onChange();
      });

      // 색이 있으면 카드 왼쪽 띠와 체크 상자를 그 색으로 (style.css의 --task-color)
      const colorHex = ColorPicker.hex(task.color);
      if (colorHex) {
        item.classList.add('has-color');
        item.style.setProperty('--task-color', colorHex);
      }

      // 체크 상자
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = done;
      checkbox.addEventListener('change', () => {
        Tasks.setDone(data, task.id, dateKey, checkbox.checked);
        onChange();
      });

      // 할 일 글자 (매일 반복이면 앞에 "매일", 일정이면 "오후 2:00" 표시)
      const title = document.createElement('span');
      title.className = 'task-title';

      // 이름 부분을 누르면 고치기 창 (안에 있는 이모지·색 동그라미는 원래대로 각자 동작)
      title.addEventListener('click', (event) => {
        if (event.target.closest('button')) return;
        TaskEdit.open({ data, task, dateKey, onChange });
      });

      // 이름 앞 색 동그라미 (누르면 바꾸기, 없으면 점선 동그라미)
      const colorButton = document.createElement('button');
      colorButton.type = 'button';
      colorButton.className = 'color-button';
      colorButton.setAttribute('aria-label', `색 바꾸기 (지금: ${ColorPicker.name(task.color) || '없음'})`);
      if (colorHex) {
        colorButton.style.background = colorHex;
      } else {
        colorButton.classList.add('empty');
      }
      colorButton.addEventListener('click', () => {
        ColorPicker.open(task.color, (color) => {
          Tasks.setColor(data, task.id, color);
          onChange();
        });
      });
      title.appendChild(colorButton);

      if (task.type === 'daily') {
        const badge = document.createElement('small');
        badge.className = 'badge';
        badge.textContent = '매일';
        title.appendChild(badge);
      }
      if (task.type === 'event') {
        const badge = document.createElement('small');
        badge.className = 'badge time-badge';
        badge.textContent = DateUtil.timeLabel(task.time);
        title.appendChild(badge);
      }
      title.append(task.title);

      // 이름 뒤 이모지 (누르면 바꾸기, 없으면 흐린 🙂)
      const emojiButton = document.createElement('button');
      emojiButton.type = 'button';
      emojiButton.className = 'emoji-button';
      emojiButton.setAttribute('aria-label', '이모지 바꾸기');
      emojiButton.textContent = task.emoji || '🙂';
      if (!task.emoji) emojiButton.classList.add('empty');
      emojiButton.addEventListener('click', () => {
        EmojiPicker.open(task.emoji, (emoji) => {
          Tasks.setEmoji(data, task.id, emoji);
          onChange();
        });
      });
      title.appendChild(emojiButton);

      // 삭제 버튼
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = '삭제';
      deleteButton.addEventListener('click', () => {
        if (task.type === 'daily') {
          // 반복 할 일은 "이 날부터 그만하기" (지난 기록은 남아요)
          const ok = confirm(`'${task.title}'을(를) ${DateUtil.label(dateKey)}부터 그만할까요?\n지난 기록은 그대로 남아요.`);
          if (!ok) return;
          Tasks.stopFrom(data, task.id, dateKey);
        } else {
          Tasks.remove(data, task.id);
        }
        onChange();
      });

      item.append(handle, checkbox, title, deleteButton);
      this.listEl.appendChild(item);
    }
  },
};

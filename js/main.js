// =====================================================
//  main.js - 전부 연결하고 앱 시작하기
// =====================================================

// ----- 앱이 기억하고 있는 것들 -----
const today = new Date();
const state = {
  data: Store.load(),             // 저장된 할 일과 완료 기록
  year: today.getFullYear(),      // 달력에 보이는 해
  month: today.getMonth(),        // 달력에 보이는 달 (1월이 0)
  selectedKey: DateUtil.todayKey(), // 고른 날짜 (처음엔 오늘)
};

// 데이터가 바뀌면: 저장하고 → 다시 그리기
function update() {
  Store.save(state.data);
  render();
}

// 달력과 목록을 다시 그리기
function render() {
  CalendarView.render({
    data: state.data,
    year: state.year,
    month: state.month,
    selectedKey: state.selectedKey,
    // 날짜를 누르면: 그 날을 고르고 → 그날 할 일 팝업 열기
    onSelect: (key) => {
      state.selectedKey = key;
      render();
      DaySheet.open();
    },
  });

  DayView.render({
    data: state.data,
    dateKey: state.selectedKey,
    onChange: update,
  });

  GoalView.render({
    data: state.data,
    dateKey: state.selectedKey,
    onChange: update,
  });

  StatsView.render({
    data: state.data,
    year: state.year,
    month: state.month,
  });

  FontPicker.render({
    data: state.data,
  });

  SettingsScreen.render({
    data: state.data,
  });

  SettingsView.render({
    data: state.data,
  });

  BucketView.render({
    data: state.data,
    year: new Date().getFullYear(),   // 올해
    onChange: update,
  });
}

// 고른 날짜로 옮기기 (달력도 그 달로)
function selectDate(key) {
  const date = DateUtil.fromKey(key);
  state.year = date.getFullYear();
  state.month = date.getMonth();
  state.selectedKey = key;
}

// 달 옮기기 (-1: 이전 달, +1: 다음 달)
function moveMonth(step) {
  const moved = new Date(state.year, state.month + step, 1);
  state.year = moved.getFullYear();
  state.month = moved.getMonth();
  render();
}


// ----- 버튼들이 눌렸을 때 -----

// 할 일 추가 (추가 버튼이나 키보드 엔터)
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const repeatInput = document.getElementById('repeat-input');
const timeInput = document.getElementById('time-input');
const timeClear = document.getElementById('time-clear');

// "매일 반복"과 "시간"은 둘 중 하나만: 하나를 고르면 다른 하나는 못 고르게
function syncOptions() {
  repeatInput.disabled = timeInput.value !== '';
  timeInput.disabled = repeatInput.checked;
  timeClear.hidden = timeInput.value === '';   // 시간을 골랐을 때만 ✕ 보이기
}
repeatInput.addEventListener('change', syncOptions);
timeInput.addEventListener('input', syncOptions);
timeInput.addEventListener('change', syncOptions);
timeClear.addEventListener('click', () => {
  timeInput.value = '';
  syncOptions();
});

// 입력칸 왼쪽 이모지 버튼: 새 할 일에 붙일 이모지 고르기
const newEmojiButton = document.getElementById('new-emoji');
let newEmoji = null;

function showNewEmoji() {
  newEmojiButton.textContent = newEmoji || '🙂';
  newEmojiButton.classList.toggle('empty', !newEmoji);   // 안 골랐으면 흐리게
}
newEmojiButton.addEventListener('click', () => {
  EmojiPicker.open(newEmoji, (emoji) => {
    newEmoji = emoji;
    showNewEmoji();
  });
});

// 입력칸 아래 "● 색" 버튼: 새 할 일에 붙일 색 고르기
const newColorButton = document.getElementById('new-color');
const newColorDot = newColorButton.querySelector('.color-dot');
let newColor = null;

function showNewColor() {
  newColorDot.style.background = ColorPicker.hex(newColor) || '';
  newColorDot.classList.toggle('empty', !newColor);   // 안 골랐으면 점선 동그라미
}
newColorButton.addEventListener('click', () => {
  ColorPicker.open(newColor, (color) => {
    newColor = color;
    showNewColor();
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();             // 페이지가 새로고침되지 않게 막기
  const title = input.value.trim();   // 앞뒤 빈칸 없애기
  if (title === '') return;           // 빈 글자는 추가하지 않기

  if (repeatInput.checked) {
    Tasks.addDaily(state.data, state.selectedKey, title, newEmoji, newColor);                   // 고른 날부터 매일
  } else if (timeInput.value !== '') {
    Tasks.addEvent(state.data, state.selectedKey, timeInput.value, title, newEmoji, newColor);  // 고른 날, 정한 시간에
  } else {
    Tasks.addOnce(state.data, state.selectedKey, title, newEmoji, newColor);                    // 고른 날 하루만
  }
  input.value = '';
  repeatInput.checked = false;
  timeInput.value = '';
  newEmoji = null;
  showNewEmoji();
  newColor = null;
  showNewColor();
  syncOptions();
  update();
});

document.getElementById('prev-month').addEventListener('click', () => moveMonth(-1));
document.getElementById('next-month').addEventListener('click', () => moveMonth(+1));

document.getElementById('go-today').addEventListener('click', () => {
  selectDate(DateUtil.todayKey());
  render();
});


// ----- 기간 목표 만들기 -----
const goalDetails = document.getElementById('goal-add');
const goalForm = document.getElementById('goal-form');
const goalTitle = document.getElementById('goal-title');
const goalTarget = document.getElementById('goal-target');
const goalUnit = document.getElementById('goal-unit');
const goalStart = document.getElementById('goal-start');
const goalEnd = document.getElementById('goal-end');

// 만들기 칸을 열면 날짜를 "고른 날 ~ 일주일"로 미리 채워 두기
goalDetails.addEventListener('toggle', () => {
  if (!goalDetails.open) return;
  goalStart.value = state.selectedKey;
  goalEnd.value = DateUtil.addDays(state.selectedKey, 6);
});

// 날짜를 고치면 "마감일이 이상해요" 경고 지우기
goalStart.addEventListener('input', () => goalEnd.setCustomValidity(''));
goalEnd.addEventListener('input', () => goalEnd.setCustomValidity(''));

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = goalTitle.value.trim();
  if (title === '') return;

  if (goalEnd.value < goalStart.value) {
    goalEnd.setCustomValidity('마감일은 시작일과 같거나 뒤여야 해요');
    goalEnd.reportValidity();
    return;
  }

  Tasks.addGoal(state.data, {
    title: title,
    target: Number(goalTarget.value),
    unit: goalUnit.value.trim(),
    startDate: goalStart.value,
    endDate: goalEnd.value,
  });

  // 고른 날이 목표 기간 밖이면, 시작일로 옮겨서 바로 보이게
  if (state.selectedKey < goalStart.value || state.selectedKey > goalEnd.value) {
    selectDate(goalStart.value);
  }

  goalForm.reset();
  goalDetails.open = false;
  update();
});


// ----- ⚙️ 설정 화면 (프로필, 언어, 화면 오가기) -----
SettingsScreen.setup({
  getData: () => state.data,
  onChange: update,
});


// ----- ✏️ 글씨체 (설정 화면 안) -----
FontPicker.setup({
  getData: () => state.data,
  onChange: update,
});


// ----- 🔔 알림 설정 -----
SettingsView.setup({
  getData: () => state.data,
  onChange: update,
});


// ----- 🪣 버킷리스트 목표 추가 (메인 화면, 달력 아래) -----
const bucketForm = document.getElementById('bucket-form');
const bucketInput = document.getElementById('bucket-input');

bucketForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = bucketInput.value.trim();
  if (title === '') return;
  Bucket.add(state.data, new Date().getFullYear(), title);
  bucketInput.value = '';
  update();
});


// ----- 🔁 매일 반복 다음 달 이어가기 -----
// 새 달에 처음 앱을 열면, 지난달로 끝난 매일 반복을 이어갈지 물어봐요.
function askContinuation() {
  if (ContinueDialog.isOpen()) return;
  const tasks = Continuation.candidates(state.data);
  if (tasks.length === 0) return;   // 물어볼 게 없으면 (이미 대답했거나 아직 달이 안 바뀜) 안 띄워요
  ContinueDialog.open(state.data, tasks, (answers) => {
    Continuation.apply(state.data, answers);
    update();
  });
}
// 앱을 켜 둔 채로 달이 바뀐 경우: 앱으로 돌아올 때 확인
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') askContinuation();
});


// ----- 앱 시작 -----
// 이 기능 전에 만든 매일 반복은 이번 달 말일까지로 맞추기 (한 번만 바뀌어요)
if (Continuation.capOpenEnded(state.data)) Store.save(state.data);
Fonts.apply(state.data.settings.font);   // 저장해 둔 글씨체로
render();
Screens.show();   // 주소에 맞는 화면 보여 주기 (보통은 메인 화면)
askContinuation();

// 알림 담당 시작 (15초마다 보낼 알림이 있는지 확인)
Notifier.start({
  getData: () => state.data,
  save: () => Store.save(state.data),
});

// 오프라인 도우미(sw.js) 등록
// 파일을 더블클릭해서 연 경우(file://)에는 동작하지 않아서 건너뛰어요.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((error) => {
    console.error('오프라인 도우미 등록 실패:', error);
  });
}

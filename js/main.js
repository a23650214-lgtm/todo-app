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

// 날짜를 누르면: 그 날을 고르고 → 그날 할 일 팝업 열기 (To Do 달력, Habit 달력 둘 다)
function openDay(key) {
  state.selectedKey = key;
  render();
  DaySheet.open();
}

// 화면 전체 다시 그리기
function render() {
  // 🏠 홈: 오늘의 말씀 + 오늘 일정
  HomeView.render({
    data: state.data,
    onChange: update,
  });

  // ✅ To Do: 🌟 이 달의 목표 (달력과 같은 달)
  MonthGoalsView.render({
    data: state.data,
    year: state.year,
    month: state.month,
  });

  // ✅ To Do: 할 일 달력
  CalendarView.render({
    data: state.data,
    year: state.year,
    month: state.month,
    selectedKey: state.selectedKey,
    onSelect: openDay,
  });

  // 🌱 Habit: 내 습관 (🔥 연속 기록 + 이번 달 달성 현황을 습관마다 한 카드로)
  HabitListView.render({
    data: state.data,
    year: state.year,
    month: state.month,
    onChange: update,   // 카드를 누르면 아이콘·색 고치기
  });

  // 🌱 Habit: 습관 달력 (To Do와 같은 달)
  HabitView.render({
    data: state.data,
    year: state.year,
    month: state.month,
    selectedKey: state.selectedKey,
    onSelect: openDay,
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

  FontPicker.render({
    data: state.data,
  });

  Appearance.render({
    data: state.data,
  });

  SettingsScreen.render({
    data: state.data,
  });

  ProfileView.render({
    data: state.data,
  });

  DdayView.render({
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

// 달력 제목("2026년 10월")을 누르면: 연도와 월을 골라 그 달로 바로 가기
function openMonthPicker() {
  MonthPicker.open({
    data: state.data,
    year: state.year,
    month: state.month,
    onPick: (year, month) => {
      state.year = year;
      state.month = month;
      render();
    },
  });
}

// ✅ To Do 달력의 제목·화살표
document.getElementById('month-title').addEventListener('click', openMonthPicker);
document.getElementById('prev-month').addEventListener('click', () => moveMonth(-1));
document.getElementById('next-month').addEventListener('click', () => moveMonth(+1));

// 🌱 Habit 달력의 제목·화살표 (To Do 달력과 같은 달을 함께 움직여요)
document.getElementById('habit-title').addEventListener('click', openMonthPicker);
document.getElementById('habit-prev').addEventListener('click', () => moveMonth(-1));
document.getElementById('habit-next').addEventListener('click', () => moveMonth(+1));

document.getElementById('go-today').addEventListener('click', () => {
  selectDate(DateUtil.todayKey());
  render();
});

// 오늘 날짜 팝업을 열고 입력칸 준비하기 (habit: 매일 반복으로 미리 체크)
// 그 날짜 팝업을 열고 입력칸 준비하기 (habit: 매일 반복으로 미리 체크)
function openDayToAdd(key, habit) {
  selectDate(key);
  render();
  DaySheet.open();
  repeatInput.checked = habit;
  timeInput.value = '';
  syncOptions();
}

// 🏠 홈 "+ 오늘 할 일 추가" (다른 날을 보고 있으면 그 날로)
document.getElementById('today-add').addEventListener('click', () => openDayToAdd(HomeView.dateKey(), false));
// 🌱 Habit "+ 새 습관 추가" (오늘부터, 매일 반복이 미리 체크돼요)
document.getElementById('habit-add').addEventListener('click', () => openDayToAdd(DateUtil.todayKey(), true));

// 🏠 홈 일정의 ◀ ▶ / 오늘로 돌아가기
HomeView.setup({ rerender: render });

// 아래 탭 (🏠 홈 / ✅ To Do / 🌱 Habit)
Tabs.setup();


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


// ----- 🌟 이 달의 목표 (To Do 페이지, 달력 위) -----
MonthGoalsView.setup({
  getData: () => state.data,
  getMonth: () => ({ year: state.year, month: state.month }),
  onChange: update,
});


// ----- 📌 디데이 (메인 화면 위쪽) -----
DdayView.setup({
  getData: () => state.data,
  onChange: update,
});


// ----- ⚙️ 설정 화면 (프로필, 언어, 화면 오가기) -----
SettingsScreen.setup({
  getData: () => state.data,
  onChange: update,
});


// ----- 👤 프로필 사진 · 🎨 테마 색 (프로필 화면 안) -----
ProfileView.setup({
  getData: () => state.data,
  onChange: update,
});


// ----- 🌓 화면 모드 (설정 화면 안) -----
Appearance.setup({
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
  if (document.visibilityState !== 'visible') return;
  render();             // 날짜가 바뀌었을 수 있으니 다시 그리기 (디데이 숫자, 오늘 표시)
  askContinuation();
});


// ----- 앱 시작 -----
// 이 기능 전에 만든 매일 반복은 이번 달 말일까지로 맞추기 (한 번만 바뀌어요)
if (Continuation.capOpenEnded(state.data)) Store.save(state.data);
// 🎲 랜덤 별명이 아직 없으면 하나 정해 두기 (처음 한 번만)
if (!state.data.profile.randomNickname) {
  state.data.profile.randomNickname = Nicknames.generate();
  Store.save(state.data);
}
Appearance.apply(state.data.settings.appearance);   // 저장해 둔 화면 모드로
Fonts.apply(state.data.settings.font);   // 저장해 둔 글씨체로
ProfileView.applyTheme(state.data.profile.theme);   // 저장해 둔 테마 색으로
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

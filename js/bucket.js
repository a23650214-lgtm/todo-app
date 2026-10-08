// =====================================================
//  bucket.js - 버킷리스트 규칙
//  달력의 할 일과는 따로, 그 해에 이루고 싶은 큰 목표를 모아 둬요.
//  화면은 신경 쓰지 않고, 데이터만 다뤄요.
//
//  목표 하나: { id, year: 2026, title: '제주도 한 달 살기',
//              done: false, doneDate: null, createdAt }
// =====================================================

const Bucket = {

  // 그 해의 목표들 (추가한 순서대로)
  forYear(data, year) {
    return data.bucket.filter(item => item.year === year);
  },

  // 목표 추가하기
  add(data, year, title) {
    data.bucket.push({
      id: makeId(),
      year: year,
      title: title,
      done: false,
      doneDate: null,
      createdAt: new Date().toISOString(),
    });
  },

  // 이뤘어요 체크하기 / 풀기 (이룬 날짜도 같이 기록)
  setDone(data, itemId, done) {
    const item = data.bucket.find(i => i.id === itemId);
    if (!item) return;
    item.done = done;
    item.doneDate = done ? DateUtil.todayKey() : null;
  },

  // 목표 지우기
  remove(data, itemId) {
    data.bucket = data.bucket.filter(i => i.id !== itemId);
  },

  // 몇 개 중 몇 개 이뤘는지: { total: 10, done: 3 }
  stats(data, year) {
    const items = this.forYear(data, year);
    return { total: items.length, done: items.filter(i => i.done).length };
  },
};

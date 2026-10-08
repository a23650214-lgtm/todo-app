// =====================================================
//  dates.js - 날짜 계산 도우미
//  날짜는 앱 안에서 "2026-10-08" 같은 글자(날짜 키)로 다뤄요.
// =====================================================

const DateUtil = {
  WEEKDAYS: ['일', '월', '화', '수', '목', '금', '토'],

  // 날짜 → "2026-10-08"
  toKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // "2026-10-08" → 날짜
  fromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  },

  // 오늘의 날짜 키
  todayKey() {
    return this.toKey(new Date());
  },

  // "2026-10-08" → "10월 8일 (목)"
  label(key) {
    const date = this.fromKey(key);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${this.WEEKDAYS[date.getDay()]})`;
  },

  // "2026-10-08" → "10월 8일"
  shortLabel(key) {
    const date = this.fromKey(key);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  },

  // "14:00" → "오후 2:00", "09:30" → "오전 9:30"
  timeLabel(time) {
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour < 12 ? '오전' : '오후';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${ampm} ${hour12}:${String(minute).padStart(2, '0')}`;
  },

  // "14:00" → 840 (자정부터 몇 분째인지)
  toMinutes(time) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  },

  // 그 달 1일 (예: "2026-10-08" → "2026-10-01")
  monthStart(key) {
    return key.slice(0, 8) + '01';
  },

  // 다음 달 1일 (예: "2026-10-08" → "2026-11-01", "2026-12-15" → "2027-01-01")
  nextMonthStart(key) {
    const date = this.fromKey(key);
    return this.toKey(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  },

  // n일 뒤의 날짜 키 (예: addDays("2026-10-08", 6) → "2026-10-14")
  addDays(key, n) {
    const date = this.fromKey(key);
    date.setDate(date.getDate() + n);
    return this.toKey(date);
  },

  // from에서 to까지 며칠인지 (to가 뒤면 양수, 앞이면 음수)
  daysBetween(fromKey, toKey) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((this.fromKey(toKey) - this.fromKey(fromKey)) / oneDay);
  },
};

// =====================================================
//  storage.js - 저장하고 불러오기
//  지금은 브라우저 안의 메모 공간(localStorage)을 써요.
//  나중에 앱스토어용으로 포장할 때는 이 파일만 바꾸면 돼요.
// =====================================================

const Store = {
  KEY: 'todo-calendar-data',

  // 처음 쓸 때의 빈 데이터
  empty() {
    return {
      version: 1,       // 데이터 모양의 버전 (모양이 바뀌면 숫자를 올려요)
      tasks: [],        // 할 일 목록
      completions: {},  // 완료 기록: { "2026-10-08": [할 일 id, ...] }
      progress: {},     // 기간 목표 진행 기록: { 목표 id: { "2026-10-08": 120, ... } }
      bucket: [],       // 버킷리스트: [ { id, year: 2026, title, done, doneDate }, ... ]
      order: {},        // 직접 바꾼 할 일 순서 (날짜마다): { "2026-10-08": [할 일 id, ...] }
      ddays: [],        // 디데이: [ { id, title: '토익 시험', date: '2026-11-07' }, ... ]
      monthGoals: {},   // 🌟 이 달의 목표 (달마다): { "2026-10": [ { id, title, done, doneDate }, ... ] }

      // 프로필 (앞으로 칸이 더 생길 거예요)
      profile: {
        nickname: '',            // 직접 쓴 별명 (있으면 이게 먼저 보여요)
        randomNickname: '',      // 🎲 자동으로 정해진 랜덤 별명 (nicknames.js)
        avatar: null,            // 프로필 사진: null(기본 🙂) / { type: 'emoji', value: '🐶' } / { type: 'photo', value: '사진 글자 데이터' }
        theme: 'blue',           // 내 테마 색 (profile-view.js의 THEMES 참고)
      },

      // 설정 (알림, 글씨체, 언어)
      settings: {
        font: 'default',         // 글씨체 (fonts.js의 FONTS 참고)
        language: 'ko',          // 언어 (settings-screen.js의 LANGUAGES 참고)
        appearance: 'system',    // 화면 모드: 'light' / 'dark' / 'system'(기기 설정) (appearance.js)
        notify: {
          enabled: false,        // 알림 켜기
          events: true,          // 일정 시간이 되면 알림
          summary: true,         // 아침 요약
          summaryTime: '09:00',  // 아침 요약 시간
        },
      },
      // 이미 보낸 알림 기록 (같은 알림을 두 번 보내지 않으려고)
      notifyLog: {
        summaryDate: null,       // 아침 요약을 마지막으로 보낸 날
        sent: [],                // 오늘 알린 일정: "할일id|2026-10-08|14:00"
      },
    };
  },

  load() {
    try {
      const saved = localStorage.getItem(this.KEY);
      if (saved) {
        const empty = this.empty();
        const parsed = JSON.parse(saved);
        const data = { ...empty, ...parsed };
        // 설정은 안쪽 칸까지 채워 주기 (새 설정이 생겨도 기본값이 들어가게)
        data.settings = {
          ...empty.settings,
          ...parsed.settings,
          notify: { ...empty.settings.notify, ...(parsed.settings && parsed.settings.notify) },
        };
        data.notifyLog = { ...empty.notifyLog, ...parsed.notifyLog };
        data.profile = { ...empty.profile, ...parsed.profile };
        return data;
      }
    } catch (error) {
      console.error('불러오기 실패:', error);
    }
    return this.empty();
  },

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (error) {
      console.error('저장 실패:', error);
    }
  },
};

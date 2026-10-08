// =====================================================
//  nicknames.js - 🎲 랜덤 별명 만들기
//  별명을 직접 안 정한 사람에게 귀여운 별명을 자동으로 붙여 줘요.
//  아래 낱말 목록에 마음에 드는 말을 더하면 별명 종류가 늘어나요.
// =====================================================

const Nicknames = {
  // ① 반복해서 쓰는 귀여운 말 → "너굴너굴너굴씨"
  REPEAT: ['너굴', '몽글', '말랑', '꼬물', '쫀득', '보들', '폭신', '데굴', '뽀짝', '깡총',
           '뒤뚱', '토닥', '꼬순', '몽실', '동글', '뽀송', '사부작', '꼼질'],
  ENDINGS: ['씨', '님', '이', '군', '양'],

  // ② 꾸미는 말 + 귀여운 것 → "졸린 감자"
  ADJECTIVES: ['졸린', '배고픈', '용감한', '수줍은', '신난', '느긋한', '반짝이는', '말랑한',
               '동그란', '부지런한', '엉뚱한', '포근한', '씩씩한', '새침한', '해맑은', '꿈꾸는'],
  THINGS: ['감자', '고구마', '판다', '펭귄', '햄스터', '수달', '다람쥐', '고양이', '강아지',
           '토끼', '오리', '두부', '찹쌀떡', '만두', '붕어빵', '구름', '도토리', '호떡'],

  // ③ 맛 + 동물 → "딸기토끼"
  FLAVORS: ['딸기', '바닐라', '초코', '복숭아', '레몬', '꿀', '우유', '말차', '솜사탕', '푸딩'],
  ANIMALS: ['곰', '토끼', '냥이', '멍멍이', '펭귄', '오리', '다람쥐', '햄찌', '수달', '판다'],

  pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  },

  // 별명 하나 만들기 (세 가지 모양 중 하나를 골라요)
  make() {
    const kind = Math.floor(Math.random() * 3);
    if (kind === 0) {
      const word = this.pick(this.REPEAT);
      const times = 2 + Math.floor(Math.random() * 2);   // 2번 또는 3번 반복
      return word.repeat(times) + this.pick(this.ENDINGS);
    }
    if (kind === 1) return `${this.pick(this.ADJECTIVES)} ${this.pick(this.THINGS)}`;
    return this.pick(this.FLAVORS) + this.pick(this.ANIMALS);
  },

  // 새 별명 (except와 같은 건 다시 안 나오게)
  generate(except) {
    for (let i = 0; i < 20; i++) {
      const name = this.make();
      if (name !== except) return name;
    }
    return this.make();
  },

  // 화면에 보여 줄 별명: 직접 쓴 별명이 먼저, 없으면 랜덤 별명
  display(profile) {
    return profile.nickname || profile.randomNickname || '';
  },

  // 직접 정한 별명인가요?
  isCustom(profile) {
    return !!profile.nickname;
  },

  // 인사에 붙일 이름: 이미 부르는 말(씨·님·군·양)로 끝나면 "님"을 더 붙이지 않아요
  // 예) 너굴너굴너굴씨 → 너굴너굴너굴씨 / 깡총깡총양 → 깡총깡총양 / 졸린 감자 → 졸린 감자님
  withHonorific(name) {
    return /(씨|님|군|양)$/.test(name) ? name : `${name}님`;
  },
};

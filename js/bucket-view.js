// =====================================================
//  bucket-view.js - 🪣 버킷리스트 화면 그리기
//  메인 화면 위의 들어가는 카드도 여기서 그려요.
// =====================================================

const BucketView = {
  // 메인 화면 카드
  entryYearEl: document.getElementById('bucket-entry-year'),
  entryCountEl: document.getElementById('bucket-entry-count'),

  // 버킷리스트 화면
  titleEl: document.getElementById('bucket-title'),
  countEl: document.getElementById('bucket-count'),
  fillEl: document.getElementById('bucket-fill'),
  listEl: document.getElementById('bucket-list'),
  emptyEl: document.getElementById('bucket-empty'),

  // year: 보여 줄 해 (올해)
  // onChange: 체크하거나 지워서 데이터가 바뀌었을 때 할 일
  render({ data, year, onChange }) {
    const { total, done } = Bucket.stats(data, year);

    // 메인 화면 카드: "🪣 2026 버킷리스트  3/10 ›"
    this.entryYearEl.textContent = year;
    this.entryCountEl.textContent = total > 0 ? `${done}/${total}` : '시작하기';

    // 제목과 진행 상황
    this.titleEl.textContent = `🪣 ${year} 버킷리스트`;
    if (total === 0) {
      this.countEl.textContent = '아직 목표가 없어요';
    } else if (done === total) {
      this.countEl.textContent = `🎉 ${total}개 모두 이뤘어요!`;
    } else {
      this.countEl.textContent = `${total}개 중 ${done}개 이뤘어요`;
    }
    this.fillEl.style.width = total > 0 ? `${Math.round((done / total) * 100)}%` : '0%';

    // 목록
    this.listEl.innerHTML = '';
    const items = Bucket.forYear(data, year);
    this.emptyEl.hidden = items.length > 0;

    for (const item of items) {
      const li = document.createElement('li');
      if (item.done) li.classList.add('done');

      // 체크 상자
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = item.done;
      checkbox.addEventListener('change', () => {
        Bucket.setDone(data, item.id, checkbox.checked);
        onChange();
      });

      // 목표 이름 + 이룬 날
      const text = document.createElement('div');
      text.className = 'bucket-text';
      const title = document.createElement('span');
      title.className = 'bucket-item-title';
      title.textContent = item.title;
      text.appendChild(title);
      if (item.done && item.doneDate) {
        const doneDate = document.createElement('small');
        doneDate.className = 'bucket-done-date';
        doneDate.textContent = `🏆 ${DateUtil.shortLabel(item.doneDate)} 이룸`;
        text.appendChild(doneDate);
      }

      // 삭제 버튼 (실수로 지우지 않게 한 번 물어봐요)
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = '삭제';
      deleteButton.addEventListener('click', () => {
        if (!confirm(`'${item.title}'을(를) 버킷리스트에서 지울까요?`)) return;
        Bucket.remove(data, item.id);
        onChange();
      });

      li.append(checkbox, text, deleteButton);
      this.listEl.appendChild(li);
    }
  },
};

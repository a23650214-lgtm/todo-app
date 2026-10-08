// =====================================================
//  bucket-view.js - 🪣 버킷리스트 칸 그리기 (메인 화면, 달력 아래)
// =====================================================

const BucketView = {
  titleEl: document.getElementById('bucket-title'),
  countEl: document.getElementById('bucket-count'),
  fillEl: document.getElementById('bucket-fill'),
  listEl: document.getElementById('bucket-list'),
  moreEl: document.getElementById('bucket-more'),
  emptyEl: document.getElementById('bucket-empty'),

  SHOW_FIRST: 5,      // 목표가 많으면 처음엔 이만큼만 보여요
  expanded: false,    // "더 보기"로 펼쳤나요?

  // year: 보여 줄 해 (올해)
  // onChange: 체크하거나 지워서 데이터가 바뀌었을 때 할 일
  render({ data, year, onChange }) {
    const { total, done } = Bucket.stats(data, year);

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

    // 목록 (많으면 처음 몇 개만)
    this.listEl.innerHTML = '';
    const items = Bucket.forYear(data, year);
    this.emptyEl.hidden = items.length > 0;
    const shown = this.expanded ? items : items.slice(0, this.SHOW_FIRST);

    for (const item of shown) {
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

    // "더 보기 (+3개)" / "접기"
    const hiddenCount = items.length - this.SHOW_FIRST;
    this.moreEl.hidden = hiddenCount <= 0;
    this.moreEl.textContent = this.expanded ? '접기 ▲' : `더 보기 (+${hiddenCount}개) ▼`;
    this.moreEl.onclick = () => {
      this.expanded = !this.expanded;
      this.render({ data, year, onChange });
    };
  },
};

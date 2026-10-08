// =====================================================
//  dday.js - 📌 디데이
//  Ddays    : 디데이 규칙 (추가·수정·삭제, 며칠 남았는지)
//  DdayView : 메인 화면 위쪽 카드 + 관리 창
// =====================================================

const Ddays = {
  TITLE_MAX: 30,

  add(data, title, date) {
    data.ddays.push({ id: makeId(), title, date, createdAt: new Date().toISOString() });
  },

  update(data, id, title, date) {
    const dday = data.ddays.find(d => d.id === id);
    if (dday) Object.assign(dday, { title, date });
  },

  remove(data, id) {
    data.ddays = data.ddays.filter(d => d.id !== id);
  },

  // 날짜가 가까운 순서
  sorted(data) {
    return [...data.ddays].sort((a, b) => a.date.localeCompare(b.date));
  },

  // 아직 안 지난 것 (오늘 포함) → 메인 화면에 보여요
  upcoming(data, todayKey) {
    return this.sorted(data).filter(d => d.date >= todayKey);
  },

  // "D-30" / "D-DAY" / "D+5"(지남)
  label(dateKey, todayKey) {
    const diff = DateUtil.daysBetween(todayKey, dateKey);
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return 'D-DAY';
    return `D+${-diff}`;
  },
};


const DdayView = {
  stripEl: document.getElementById('dday-strip'),
  dialogEl: document.getElementById('dday-dialog'),
  listModeEl: document.getElementById('dday-list-mode'),
  listEl: document.getElementById('dday-list'),
  listEmptyEl: document.getElementById('dday-list-empty'),
  formEl: document.getElementById('dday-form'),
  formTitleEl: document.getElementById('dday-form-title'),
  titleInput: document.getElementById('dday-title'),
  dateInput: document.getElementById('dday-date'),
  previewEl: document.getElementById('dday-preview'),
  deleteEl: document.getElementById('dday-delete'),

  editingId: null,      // 고치는 중인 디데이 (새로 만들면 null)
  backToList: false,    // 저장·취소 뒤에 목록으로 돌아갈까요? (목록에서 들어왔으면)
  getData: null,
  onChange: null,

  setup({ getData, onChange }) {
    this.getData = getData;
    this.onChange = onChange;

    document.getElementById('dday-new').addEventListener('click', () => this.openForm(null, true));
    document.getElementById('dday-close').addEventListener('click', () => this.dialogEl.close());
    document.getElementById('dday-cancel').addEventListener('click', () => this.afterForm());

    // 날짜를 고르는 동안 "D-30" 미리 보기
    this.dateInput.addEventListener('input', () => this.showPreview());
    this.dateInput.addEventListener('change', () => this.showPreview());

    // 저장
    this.formEl.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = this.titleInput.value.trim().slice(0, Ddays.TITLE_MAX);
      const date = this.dateInput.value;
      if (!title || !date) return;
      if (this.editingId) {
        Ddays.update(this.getData(), this.editingId, title, date);
      } else {
        Ddays.add(this.getData(), title, date);
      }
      this.onChange();
      this.afterForm();
    });

    // 삭제
    this.deleteEl.addEventListener('click', () => {
      const dday = this.getData().ddays.find(d => d.id === this.editingId);
      if (!dday || !confirm(`'${dday.title}' 디데이를 지울까요?`)) return;
      Ddays.remove(this.getData(), dday.id);
      this.onChange();
      this.afterForm();
    });

    // 창 바깥(어두운 곳)을 누르면 닫기 (창 안쪽 여백은 빼고)
    this.dialogEl.addEventListener('click', (event) => {
      if (event.target !== this.dialogEl) return;
      const r = this.dialogEl.getBoundingClientRect();
      const inside = event.clientX >= r.left && event.clientX <= r.right &&
                     event.clientY >= r.top && event.clientY <= r.bottom;
      if (!inside) this.dialogEl.close();
    });
  },

  // ----- 메인 화면 위쪽 카드들 -----
  render({ data }) {
    const todayKey = DateUtil.todayKey();
    const items = Ddays.upcoming(data, todayKey);
    this.stripEl.innerHTML = '';

    if (items.length === 0) {
      // 하나도 없으면 (또는 다 지났으면): 작은 추가 버튼
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'dday-add-empty';
      const pastCount = data.ddays.length;
      add.textContent = pastCount > 0 ? `📌 디데이 추가하기 · 지난 디데이 ${pastCount}개` : '📌 디데이 추가하기';
      add.addEventListener('click', () => (pastCount > 0 ? this.openList() : this.openForm(null, false)));
      this.stripEl.appendChild(add);
    } else {
      for (const dday of items) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'dday-card';
        card.dataset.id = dday.id;
        const label = Ddays.label(dday.date, todayKey);
        if (label === 'D-DAY') card.classList.add('is-today');

        const count = document.createElement('span');
        count.className = 'dday-count';
        count.textContent = label;
        const name = document.createElement('span');
        name.className = 'dday-name';
        name.textContent = dday.title;
        const date = document.createElement('small');
        date.className = 'dday-date';
        date.textContent = label === 'D-DAY' ? '오늘이에요 🎉' : DateUtil.label(dday.date);

        card.append(count, name, date);
        card.addEventListener('click', () => this.openForm(dday, false));   // 누르면 고치기
        this.stripEl.appendChild(card);
      }
      // 끝에 [＋ 관리]
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'dday-manage';
      more.innerHTML = '<span>＋</span><small>관리</small>';
      more.addEventListener('click', () => this.openList());
      this.stripEl.appendChild(more);
    }

    if (this.dialogEl.open && !this.listModeEl.hidden) this.drawList();
  },

  // ----- 관리 창: 전체 목록 (지난 것도) -----
  openList() {
    this.listModeEl.hidden = false;
    this.formEl.hidden = true;
    this.drawList();
    if (!this.dialogEl.open) this.dialogEl.showModal();
  },

  drawList() {
    const data = this.getData();
    const todayKey = DateUtil.todayKey();
    const all = Ddays.sorted(data);
    const upcoming = all.filter(d => d.date >= todayKey);
    const past = all.filter(d => d.date < todayKey).reverse();   // 지난 건 최근 것부터
    this.listEl.innerHTML = '';
    this.listEmptyEl.hidden = all.length > 0;

    for (const dday of [...upcoming, ...past]) {
      const isPast = dday.date < todayKey;
      const li = document.createElement('li');
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'dday-row';
      if (isPast) row.classList.add('past');
      row.innerHTML = '<span class="dday-row-text"><span class="dday-row-name"></span><small></small></span><strong></strong>';
      row.querySelector('.dday-row-name').textContent = dday.title;
      row.querySelector('small').textContent = DateUtil.label(dday.date) + (isPast ? ' · 지남' : '');
      row.querySelector('strong').textContent = Ddays.label(dday.date, todayKey);
      row.addEventListener('click', () => this.openForm(dday, true));
      li.appendChild(row);
      this.listEl.appendChild(li);
    }
  },

  // ----- 추가·고치기 칸 -----
  // dday: 고칠 디데이 (새로 만들면 null), fromList: 목록에서 들어왔나요?
  openForm(dday, fromList) {
    this.editingId = dday ? dday.id : null;
    this.backToList = fromList;
    this.formTitleEl.textContent = dday ? '디데이 고치기' : '새 디데이';
    this.titleInput.value = dday ? dday.title : '';
    this.dateInput.value = dday ? dday.date : '';
    this.deleteEl.hidden = !dday;
    this.showPreview();
    this.listModeEl.hidden = true;
    this.formEl.hidden = false;
    if (!this.dialogEl.open) this.dialogEl.showModal();
  },

  // 저장·취소·삭제 뒤: 목록에서 왔으면 목록으로, 아니면 창 닫기
  afterForm() {
    if (this.backToList) this.openList();
    else this.dialogEl.close();
  },

  showPreview() {
    const date = this.dateInput.value;
    this.previewEl.classList.toggle('hint', !date);   // 안내 문구일 때는 작은 글씨
    if (!date) {
      this.previewEl.textContent = '날짜를 고르면 며칠 남았는지 보여 드려요';
      return;
    }
    const label = Ddays.label(date, DateUtil.todayKey());
    this.previewEl.textContent = label.startsWith('D+') ? `${label} (이미 지난 날짜예요)` : label;
  },
};

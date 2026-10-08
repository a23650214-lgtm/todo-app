// =====================================================
//  drag-sort.js - 손잡이(⠿)를 끌어서 목록 순서 바꾸기
//
//  손가락(터치)과 마우스를 똑같이 다루는 "포인터 이벤트"를 써요.
//  사용법: DragSort.attach(손잡이, 끌릴 줄, 목록, (새 순서 id 목록) => { ... })
//  줄마다 data-id가 있어야 해요 (예: <li data-id="abc">).
//
//  폰에서 스크롤과 헷갈리지 않게, 손잡이에서만 끌 수 있어요.
//  (style.css에서 손잡이에 touch-action: none 을 줘서, 손잡이를 누르면 화면이 스크롤되지 않아요)
// =====================================================

const DragSort = {
  EDGE: 70,   // 화면 위아래 끝에서 이만큼(px) 안쪽으로 들어오면 저절로 스크롤

  attach(handle, item, listEl, onDrop) {
    handle.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;   // 마우스는 왼쪽 버튼만
      event.preventDefault();
      this.start(event, handle, item, listEl, onDrop);
    });
  },

  // 목록의 지금 순서 (위에서부터 id)
  ids(listEl) {
    return [...listEl.children].map(el => el.dataset.id);
  },

  start(event, handle, item, listEl, onDrop) {
    const before = this.ids(listEl).join(',');
    const grabOffset = event.clientY - item.getBoundingClientRect().top;   // 줄의 어디를 잡았는지
    const startY = event.clientY;
    let pointerY = event.clientY;
    let moved = false;   // 조금이라도 끌었나요? (잡기만 했을 땐 저절로 스크롤 안 하게)
    let frame = null;

    try { handle.setPointerCapture(event.pointerId); } catch (error) { /* 괜찮아요 */ }
    item.classList.add('dragging');
    document.body.classList.add('drag-active');
    try { if (navigator.vibrate) navigator.vibrate(10); } catch (error) { /* 진동 없는 폰 */ }

    // 손가락 위치에 맞춰 줄을 옮기고, 지나친 줄과 자리 바꾸기
    const place = () => {
      item.style.transform = '';
      const desiredTop = pointerY - grabOffset;
      const center = desiredTop + item.offsetHeight / 2;
      const middle = (el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };

      let prev = item.previousElementSibling;
      while (prev && center < middle(prev)) {          // 위 줄의 가운데보다 올라가면 → 위로
        listEl.insertBefore(item, prev);
        prev = item.previousElementSibling;
      }
      let next = item.nextElementSibling;
      while (next && center > middle(next)) {          // 아래 줄의 가운데보다 내려가면 → 아래로
        listEl.insertBefore(item, next.nextElementSibling);
        next = item.nextElementSibling;
      }

      // 바뀐 자리에서 손가락 위치까지 살짝 띄워서 따라오게
      const naturalTop = item.getBoundingClientRect().top;
      item.style.transform = `translateY(${desiredTop - naturalTop}px)`;
    };

    // 화면 끝 근처에서는 저절로 스크롤 (실제로 끌기 시작한 뒤에만)
    const tick = () => {
      let dy = 0;
      if (!moved) {
        // 아직 잡기만 한 상태: 스크롤하지 않기
      } else if (pointerY < this.EDGE) {
        dy = -Math.ceil((this.EDGE - pointerY) / 5);
      } else if (pointerY > window.innerHeight - this.EDGE) {
        dy = Math.ceil((pointerY - (window.innerHeight - this.EDGE)) / 5);
      }
      if (dy !== 0) {
        window.scrollBy(0, dy);
        place();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const onMove = (moveEvent) => {
      moveEvent.preventDefault();
      pointerY = moveEvent.clientY;
      if (Math.abs(pointerY - startY) > 8) moved = true;
      place();
    };

    const onEnd = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      item.style.transform = '';
      item.classList.remove('dragging');
      document.body.classList.remove('drag-active');

      const after = this.ids(listEl);
      if (after.join(',') !== before) onDrop(after);   // 순서가 바뀌었을 때만
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
  },
};

'use strict';
(() => {
  document.querySelectorAll('.enhanced').forEach(node => { node.hidden = false; });
  const key = 'course-library-media-reading-v1';
  let state = { size: 18, read: {} }, available = true;
  function latest() {
    if (!available) return state;
    try {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      return {
        size: Number.isFinite(raw?.size) ? Math.max(16, Math.min(22, raw.size)) : 18,
        read: raw?.read && typeof raw.read === 'object' && !Array.isArray(raw.read) ? raw.read : {}
      };
    } catch (_) { available = false; return state; }
  }
  state = latest();
  const feedback = document.getElementById('reading-feedback');
  function change(update) {
    // Read immediately before a change so another tab's settings are retained.
    state = latest();
    update(state);
    try { if (available) localStorage.setItem(key, JSON.stringify(state)); }
    catch (_) { available = false; }
    render();
    if (feedback && !available) feedback.textContent = '浏览器存储不可用，本次设置仅在当前页面生效。';
  }
  function size() {
    document.querySelector('.prose')?.style.setProperty('--reading-size', state.size + 'px');
    const smaller = document.getElementById('font-smaller'), larger = document.getElementById('font-larger');
    if (smaller) smaller.disabled = state.size <= 16;
    if (larger) larger.disabled = state.size >= 22;
  }
  for (const [id, delta] of [['font-smaller', -1], ['font-larger', 1]]) {
    document.getElementById(id)?.addEventListener('click', () => change(current => { current.size = Math.max(16, Math.min(22, current.size + delta)); }));
  }
  const article = document.querySelector('[data-reading-id]'), mark = document.getElementById('mark-read');
  function readState() {
    if (!article || !mark) return;
    const read = state.read[article.dataset.readingId] === true;
    mark.setAttribute('aria-pressed', String(read)); mark.textContent = read ? '已读完 · 点击撤销' : '标记读完';
  }
  mark?.addEventListener('click', () => change(current => { const id = article.dataset.readingId; current.read[id] = current.read[id] !== true; }));
  function render() {
    size();
    readState();
    document.querySelectorAll('[data-lesson]').forEach(link => {
      link.querySelector('.read-badge')?.remove();
      if (state.read[link.dataset.lesson] === true) { const badge = document.createElement('span'); badge.className = 'read-badge'; badge.textContent = '已读'; link.append(badge); }
    });
  }
  render();
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) { state = latest(); render(); }
  });
  const input = document.getElementById('reading-search'), counter = document.getElementById('search-count');
  const cards = Array.from(document.querySelectorAll('[data-search]'));
  const starters = document.querySelector('#reading .reading-grid');
  input?.addEventListener('input', () => {
    const term = input.value.trim().toLocaleLowerCase();
    if (starters) starters.hidden = Boolean(term);
    if (term) document.getElementById('all-readings')?.setAttribute('open', '');
    let count = 0;
    cards.forEach(card => { const show = card.dataset.search.toLocaleLowerCase().includes(term); card.hidden = !show; if (show) count++; });
    counter.textContent = term ? (count ? `找到 ${count} 篇可读文章` : '没有匹配的文章，试试其他关键词。') : '';
  });
  if (matchMedia('(max-width: 760px)').matches) document.querySelector('.contents')?.removeAttribute('open');
  if (feedback && !available) feedback.textContent = '浏览器存储不可用，本次设置仅在当前页面生效。';
})();

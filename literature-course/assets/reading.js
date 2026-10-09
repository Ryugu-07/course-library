'use strict';
// All text, notes, comparisons and questions remain readable without JavaScript.
document.querySelectorAll('.enhanced').forEach(node => { node.hidden = false; });
for (const phrase of document.querySelectorAll('span.phrase[data-note]')) {
  const note = document.getElementById(phrase.dataset.note);
  if (!note) continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'phrase';
  button.append(...phrase.childNodes);
  button.setAttribute('aria-controls', note.id);
  button.setAttribute('aria-expanded', String(note.open));
  button.setAttribute('aria-label', `${button.textContent}：展开或收起中文旁注`);
  button.addEventListener('click', () => {
    note.open = !note.open;
    button.setAttribute('aria-expanded', String(note.open));
    if (note.open) {
      const bounds = note.getBoundingClientRect();
      if (bounds.bottom > innerHeight || bounds.top < 0) note.scrollIntoView({block:'nearest'});
    }
  });
  note.addEventListener('toggle', () => button.setAttribute('aria-expanded', String(note.open)));
  phrase.replaceWith(button);
}

const prose = document.querySelector('.prose');
const smaller = document.getElementById('font-smaller');
const larger = document.getElementById('font-larger');
if (prose && smaller && larger) {
  const key = 'course-library-world-literature-font-v1';
  let size = 19;
  try {
    const saved = Number(localStorage.getItem(key));
    if (Number.isFinite(saved) && saved >= 17 && saved <= 23) size = saved;
  } catch { /* Reading remains available when browser storage is blocked. */ }
  const apply = () => {
    prose.style.setProperty('--reading-size', `${size}px`);
    smaller.disabled = size <= 17;
    larger.disabled = size >= 23;
  };
  const change = delta => {
    size = Math.min(23, Math.max(17, size + delta));
    apply();
    try { localStorage.setItem(key, String(size)); }
    catch { document.getElementById('reading-feedback').textContent = '字号已调整；此浏览器无法保存设置。'; }
  };
  smaller.addEventListener('click', () => change(-1));
  larger.addEventListener('click', () => change(1));
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    const value = Number(event.newValue);
    size = value >= 17 && value <= 23 ? value : 19;
    apply();
  });
  apply();
}
// Keep the desktop outline visible; respect a reader's later open/close choice.
const contents = document.querySelector('.contents');
if (contents && matchMedia('(min-width: 761px)').matches) contents.open = true;

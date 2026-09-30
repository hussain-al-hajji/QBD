// ---------------------------------------------------------------------
// البحث في الصفحة الرئيسية: المحاور (الاسم + الفرعي) والتمارين والأنشطة وتقييم الختام
// تطبيع عربي، كل الكلمات مطلوبة (AND)، ترتيب: تطابق كامل > يبدأ بـ > يحتوي، والمحاور قبل التمارين
// ---------------------------------------------------------------------
const SEARCH_MAX = 6;
const Search = {
  // تطبيع حرف واحد: '' للتشكيل والتطويل، ' ' للرموز
  nc(c) {
    if (/[ً-ٰٟۖ-ۭـ]/.test(c)) return '';
    if (/[أإآٱ]/.test(c)) return 'ا'; if (c === 'ى') return 'ي'; if (c === 'ة') return 'ه'; if (c === 'ؤ') return 'و'; if (c === 'ئ') return 'ي';
    const k = c.charCodeAt(0); if (k >= 0x660 && k <= 0x669) return String(k - 0x660); if (k >= 0x6F0 && k <= 0x6F9) return String(k - 0x6F0);
    return /[\p{L}\p{N}]/u.test(c) ? c.toLowerCase() : ' ';
  },
  // النص المطبَّع + خريطة من كل موضع فيه إلى موضعه في الأصل (للتظليل)
  mapped(s) { s = String(s || ''); let n = ''; const map = []; for (let i = 0; i < s.length; i++) { const c = Search.nc(s[i]); for (const x of c) { n += x; map.push(i); } } return { n, map }; },
  norm(s) { return Search.mapped(s).n.replace(/\s+/g, ' ').trim(); },
  tokens(q) { return Search.norm(q).split(' ').filter(Boolean); },
  // 3 تطابق كامل، 2 يبدأ بـ، 1 يحتوي كل الكلمات، 0 لا تطابق
  rank(text, q) {
    const t = Search.norm(text), nq = Search.norm(q), toks = nq.split(' ').filter(Boolean);
    if (!toks.length || !toks.every(w => t.indexOf(w) > -1)) return 0;
    return t === nq ? 3 : t.indexOf(nq) === 0 ? 2 : 1;
  },
  mark(text, q) {
    const s = String(text || ''); const { n, map } = Search.mapped(s); const on = new Array(s.length).fill(false);
    Search.tokens(q).forEach(w => { let i = n.indexOf(w); while (i > -1) { for (let j = i; j < i + w.length; j++) on[map[j]] = true; i = n.indexOf(w, i + w.length); } });
    // التشكيل داخل الكلمة المظللة يتبعها
    for (let i = 1; i < s.length; i++) if (!on[i] && on[i - 1] && Search.nc(s[i]) === '') on[i] = true;
    let out = '', open = false; for (let i = 0; i < s.length; i++) { if (on[i] !== open) { out += on[i] ? '<mark>' : '</mark>'; open = on[i]; } out += h(s[i]); } return out + (open ? '</mark>' : '');
  },
  // الفهرس: لا يشمل المخفي ولا المحاور المعطلة
  index() {
    const axes = [], exs = [];
    Content.eligibleAxes().forEach(a => {
      axes.push({ kind: 'axis', id: a.id, title: a.title, sub: a.classic || '', meta: 'محور' + (Content.unitName(a.unit) ? ' · ' + Content.unitName(a.unit) : ''), icon: a.icon });
      Content.exercisesOf(a.id).forEach(e => exs.push({ kind: 'ex', id: e.id, title: e.title, meta: 'تمرين · ' + a.title, badge: (e.mode === 'group' ? 'جماعي' : 'فردي') + ' · ' + (FORMATS[e.format] || '') }));
    });
    Content.activities().forEach(e => exs.push({ kind: 'ex', id: e.id, title: e.title, meta: 'نشاط', badge: 'فردي · ' + (FORMATS[e.format] || '') }));
    const sv = Content.survey(); if (sv) exs.push({ kind: 'ex', id: sv.id, title: sv.title, meta: 'تقييم الختام', badge: 'تقييم' });
    return { axes, exs };
  },
  results(q) {
    const I = Search.index(); const pick = (list, f) => list.map((x, i) => ({ x, i, r: f(x) })).filter(o => o.r).sort((a, b) => b.r - a.r || a.i - b.i).map(o => o.x);
    // المحور: الاسم أو الفرعي (ترتيب الأفضل منهما)؛ التمرين: باسمه وحده
    return { axes: pick(I.axes, a => Math.max(Search.rank(a.title, q), Search.rank(a.title + ' ' + a.sub, q) ? 1 : 0, Search.rank(a.sub, q))), exs: pick(I.exs, e => Search.rank(e.title, q)) };
  },
  itemHtml(x, q, k) {
    return '<button class="sr-item" role="option" id="sr-' + k + '" data-go="' + (x.kind === 'axis' ? 'axis' : 'ex') + '" data-id="' + h(x.id) + '"><span class="sr-ico">' + (x.kind === 'axis' ? iconSvg(x.icon || 'star', 18) : '✍️') + '</span><span class="sr-txt"><b>' + Search.mark(x.title, q) + '</b><small>' + h(x.meta) + (x.kind === 'axis' && x.sub ? ' — ' + Search.mark(x.sub, q) : '') + '</small></span>' + (x.badge ? '<span class="sr-badge">' + h(x.badge) + '</span>' : '') + '</button>';
  },
  resultsHtml(q) {
    if (!Search.tokens(q).length) return '';
    const r = Search.results(q); let k = 0;
    const grp = (title, list) => { if (!list.length) return ''; const more = list.length - SEARCH_MAX; return '<div class="sr-group"><div class="sr-head">' + title + ' <span class="num">' + list.length + '</span></div>' + list.slice(0, SEARCH_MAX).map(x => Search.itemHtml(x, q, k++)).join('') + (more > 0 ? '<div class="sr-more">و <span class="num">' + more + '</span> أخرى — أضف كلمة لتضييق البحث</div>' : '') + '</div>'; };
    const body = grp('المحاور', r.axes) + grp('التمارين والأنشطة', r.exs);
    return body || '<div class="sr-empty">لا نتائج لـ «' + h(q) + '» — جرّب كلمة أخرى.</div>';
  },
  html() {
    const q = UIState.search || ''; Search.active = -1;
    return '<section class="home-search" role="search"><div class="hs-box">' + iconSvg('search', 18) + '<input id="homeSearch" data-keep="home-search" type="search" autocomplete="off" placeholder="ابحث في المحاور والتمارين والأنشطة…" aria-label="بحث في المحاور والتمارين" aria-controls="searchResults" value="' + h(q) + '">' +
      '<button class="hs-clear" data-act="search-clear" aria-label="مسح البحث" title="مسح (Esc)" ' + (q ? '' : 'hidden') + '>✕</button></div><div id="searchResults" class="search-results" role="listbox">' + Search.resultsHtml(q) + '</div></section>';
  },
  update(q) { UIState.search = q; Search.active = -1; const box = document.getElementById('searchResults'); if (box) box.innerHTML = Search.resultsHtml(q); const x = document.querySelector('.hs-clear'); if (x) x.hidden = !q; },
  move(d) { const items = $$('#searchResults .sr-item'); if (!items.length) return; Search.active = ((Search.active == null ? -1 : Search.active) + d + items.length) % items.length; items.forEach((el, i) => el.classList.toggle('active', i === Search.active)); items[Search.active].scrollIntoView({ block: 'nearest' }); const inp = document.getElementById('homeSearch'); if (inp) inp.setAttribute('aria-activedescendant', items[Search.active].id); },
  clear() { Search.update(''); const inp = document.getElementById('homeSearch'); if (inp) { inp.value = ''; inp.focus(); } }
};
document.addEventListener('input', ev => { if (ev.target && ev.target.id === 'homeSearch') Search.update(ev.target.value); });
document.addEventListener('keydown', ev => {
  if (!ev.target || ev.target.id !== 'homeSearch') return;
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); Search.move(ev.key === 'ArrowDown' ? 1 : -1); }
  else if (ev.key === 'Enter') { ev.preventDefault(); const items = $$('#searchResults .sr-item'); const it = items[Search.active > -1 ? Search.active : 0]; if (it) it.click(); }
  else if (ev.key === 'Escape') { ev.preventDefault(); Search.clear(); }
});

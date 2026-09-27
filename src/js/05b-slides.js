// ---------------------------------------------------------------------
// أنماط الشرائح الإبداعية: افتتاحية بالأرقام، خرافة أم حقيقة، موقف وقرار، أرقام تهمّك،
// إطار عمل، قائمة تحقق، قبل وبعد، ومسار رحلة — مع تفاعلات تُحفظ حالتها في UIState
// صيغة العناصر في ملفات المحتوى: سطر لكل عنصر وأجزاؤه مفصولة بـ ::
// ---------------------------------------------------------------------
const SLIDE_ICONS = { opening: '🎬', principle: '🧠', examples: '🔎', mistakes: '⚠️', tools: '🧰', summary: '🎯', hook: '⚡', myth: '🃏', scenario: '🧭', numbers: '📊', framework: '🧩', checklist: '✅', versus: '🔁', journey: '🛤️' };
const SlideKit = {
  ui(key) { return (UIState.slideUI = UIState.slideUI || {})[key]; },
  set(key, v) { (UIState.slideUI = UIState.slideUI || {})[key] = v; },
  parts(it) { return String(it || '').split('::').map(x => x.trim()); },
  sid(s, a, i) { return (s.id || (a.id + 's' + (i + 1))); },
  checks(sid) { try { return JSON.parse(SafeLS.get('ec_chk_' + sid) || '{}') || {}; } catch (e) { return {}; } },
  // ---- كل نمط يعيد HTML محتوى الشريحة كاملًا (بعد العنوان) ----
  hook(s, a, i, col) {
    const big = String(s.big || '').trim();
    return '<div class="sk-hook"><div class="sk-hook-num"><div class="sk-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg" style="--p:' + (/%/.test(big) && parseFloat(big) ? Math.min(100, parseFloat(big)) : 100) + '"/></svg><b class="num">' + h(big) + '</b></div>' + (s.label ? '<div class="sk-hook-lbl">' + h(s.label) + '</div>' : '') + (s.src ? '<div class="sk-src">المصدر: ' + h(s.src) + '</div>' : '') + '</div>' +
      '<div class="sk-hook-txt"><div class="slide-text">' + withLede(richHtml(s.text)) + '</div>' + (s.rule ? '<div class="sk-ask"><span>🎤 سؤال للقاعة</span>' + richHtml(s.rule) + '</div>' : '') + '</div></div>';
  },
  myth(s, a, i) {
    const sid = SlideKit.sid(s, a, i);
    return (s.intro ? '<div class="slide-text">' + richHtml(s.intro) + '</div>' : '') + '<div class="sk-myths">' + arr(s.items).map((it, k) => { const [m, f] = SlideKit.parts(it); const on = SlideKit.ui(sid + ':m' + k);
      return '<button class="sk-flip ' + (on ? 'on' : '') + '" data-act="sk-flip" data-k="' + h(sid + ':m' + k) + '" aria-pressed="' + (on ? 'true' : 'false') + '"><span class="sk-face front"><em>خرافة شائعة</em><b>«' + h(m) + '»</b><small>اضغط لتكشف الحقيقة ↻</small></span><span class="sk-face back"><em>الحقيقة</em><b>' + h(f || '') + '</b></span></button>'; }).join('') + '</div>' + SlideKit.rule(s);
  },
  scenario(s, a, i) {
    const sid = SlideKit.sid(s, a, i); const pick = SlideKit.ui(sid + ':pick');
    const opts = arr(s.items).map(it => { let t = String(it); const best = t.trim().startsWith('*'); if (best) t = t.trim().slice(1); const [o, fb] = SlideKit.parts(t); return { o, fb, best }; });
    return '<div class="sk-scn"><div class="sk-scn-case"><span class="sk-tag">📍 الموقف</span>' + richHtml(s.text) + '</div><div class="sk-scn-q">ماذا تفعل؟ اختر قرارك:</div><div class="sk-opts">' +
      opts.map((x, k) => { const chosen = pick === k; const cls = pick == null ? '' : (x.best ? 'best' : chosen ? 'wrong' : 'dim');
        return '<button class="sk-opt ' + cls + (chosen ? ' chosen' : '') + '" data-act="sk-pick" data-k="' + h(sid) + '" data-i="' + k + '"><span class="sk-l">' + LETTERS[k] + '</span><span class="grow"><b>' + h(x.o) + '</b>' + (pick != null && (chosen || x.best) && x.fb ? '<small>' + (x.best ? '✅ ' : '⚠️ ') + h(x.fb) + '</small>' : '') + '</span></button>'; }).join('') + '</div>' +
      (pick != null ? SlideKit.rule(s) + '<button class="btn btn-ghost btn-xs" data-act="sk-pick" data-k="' + h(sid) + '" data-i="-1">↺ جرّب مرة أخرى</button>' : '') + '</div>';
  },
  numbers(s) {
    const its = arr(s.items).map(SlideKit.parts);
    return (s.intro ? '<div class="slide-text">' + richHtml(s.intro) + '</div>' : '') + '<div class="sk-nums">' + its.map((p, k) => '<div class="sk-num" style="--i:' + k + '"><b class="num' + (String(p[0]).length > 6 ? ' long' : '') + '">' + h(p[0]) + '</b><span>' + h(p[1] || '') + '</span>' + (p[2] ? '<small>' + h(p[2]) + '</small>' : '') + '</div>').join('') + '</div>' + (s.src ? '<div class="sk-src">المصادر: ' + h(s.src) + '</div>' : '') + SlideKit.rule(s);
  },
  framework(s) {
    const its = arr(s.items).map(SlideKit.parts);
    return (s.big ? '<div class="sk-fw-name notranslate" translate="no">' + h(s.big) + '</div>' : '') + (s.intro ? '<div class="slide-text">' + richHtml(s.intro) + '</div>' : '') +
      '<div class="sk-fw" style="--n:' + its.length + '">' + its.map((p, k) => '<div class="sk-fw-col" style="--i:' + k + '"><span class="sk-fw-l notranslate" translate="no">' + h(p[0]) + '</span><b>' + h(p[1] || '') + '</b><p>' + h(p[2] || '') + '</p></div>').join('') + '</div>' + SlideKit.rule(s);
  },
  checklist(s, a, i) {
    const sid = SlideKit.sid(s, a, i); const st = SlideKit.checks(sid); const its = arr(s.items).map(SlideKit.parts); const done = its.filter((_, k) => st[k]).length; const pct = its.length ? Math.round(done / its.length * 100) : 0;
    return '<div class="sk-chk-head">' + (s.intro ? '<div class="slide-text grow">' + richHtml(s.intro) + '</div>' : '<span class="grow"></span>') + '<div class="sk-chk-ring" data-chk-ring="' + h(sid) + '" style="--p:' + pct + '"><b class="num">' + done + '/' + its.length + '</b><small>جاهزية متجرك</small></div></div>' +
      '<div class="sk-chk">' + its.map((p, k) => '<label class="sk-chk-it ' + (st[k] ? 'on' : '') + '"><input type="checkbox" data-chk="' + h(sid) + '" data-i="' + k + '" ' + (st[k] ? 'checked' : '') + '><span class="box"></span><span class="grow"><b>' + h(p[0]) + '</b>' + (p[1] ? '<small>' + h(p[1]) + '</small>' : '') + '</span></label>').join('') + '</div>' + SlideKit.rule(s);
  },
  versus(s, a, i) {
    const sid = SlideKit.sid(s, a, i); const after = !!SlideKit.ui(sid + ':vs'); const its = arr(s.items).map(SlideKit.parts);
    return (s.intro ? '<div class="slide-text">' + richHtml(s.intro) + '</div>' : '') + '<div class="sk-vs ' + (after ? 'after' : '') + '" data-vs="' + h(sid) + '"><div class="sk-vs-sw"><button data-act="sk-vs" data-k="' + h(sid) + '" data-v="0" class="' + (after ? '' : 'on') + '">😐 قبل</button><button data-act="sk-vs" data-k="' + h(sid) + '" data-v="1" class="' + (after ? 'on' : '') + '">🚀 بعد التحسين</button></div>' +
      its.map(p => '<div class="sk-vs-row"><span class="sk-vs-k">' + h(p[0]) + '</span><span class="sk-vs-v"><span class="b4">' + h(p[1] || '') + '</span><span class="af">' + h(p[2] || '') + '</span></span></div>').join('') + '</div>' + SlideKit.rule(s);
  },
  journey(s) {
    const its = arr(s.items).map(SlideKit.parts);
    return (s.intro ? '<div class="slide-text">' + richHtml(s.intro) + '</div>' : '') + '<div class="sk-jr">' + its.map((p, k) => '<div class="sk-jr-st" style="--i:' + k + '"><span class="sk-jr-dot">' + h(p[0]) + '</span><span class="sk-jr-n num">' + String(k + 1).padStart(2, '0') + '</span><b>' + h(p[1] || '') + '</b><p>' + h(p[2] || '') + '</p></div>').join('') + '</div>' + SlideKit.rule(s);
  },
  rule(s) { return s.rule ? '<div class="rule-box"><span class="lbl">💡 الفكرة الذهبية</span>' + richHtml(s.rule) + '</div>' : ''; }
};
const SK_TYPES = ['hook', 'myth', 'scenario', 'numbers', 'framework', 'checklist', 'versus', 'journey'];

// تفاعلات الشرائح دون إعادة رسم الصفحة (حتى لا تتحرك الشريحة الحالية)
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act^="sk-"]'); if (!t) return;
  const act = t.getAttribute('data-act'); const k = t.getAttribute('data-k');
  const slide = t.closest('.slide'); const deck = t.closest('[data-deck]');
  const rerender = () => { if (!slide || !deck) return; const a = Content.axis(deck.getAttribute('data-deck')); const idx = $$('.slide', deck).indexOf(slide); if (!a || idx < 0) return; const tmp = document.createElement('div'); tmp.innerHTML = renderSlide(a.slides[idx], a, idx, a.slides.length, true); slide.replaceWith(tmp.firstChild); Deck.fitHeight(a.id); };
  if (act === 'sk-flip') { const v = !SlideKit.ui(k); SlideKit.set(k, v); t.classList.toggle('on', v); t.setAttribute('aria-pressed', v ? 'true' : 'false'); }
  else if (act === 'sk-pick') { const i = +t.getAttribute('data-i'); SlideKit.set(k + ':pick', i < 0 ? null : i); rerender(); }
  else if (act === 'sk-vs') { const v = t.getAttribute('data-v') === '1'; SlideKit.set(k + ':vs', v); const box = t.closest('.sk-vs'); box.classList.toggle('after', v); $$('.sk-vs-sw button', box).forEach(b => b.classList.toggle('on', (b.getAttribute('data-v') === '1') === v)); }
});
document.addEventListener('change', ev => {
  const cb = ev.target.closest('[data-chk]'); if (!cb) return;
  const sid = cb.getAttribute('data-chk'); const st = SlideKit.checks(sid); st[cb.getAttribute('data-i')] = cb.checked; SafeLS.set('ec_chk_' + sid, JSON.stringify(st));
  cb.closest('.sk-chk-it').classList.toggle('on', cb.checked);
  const all = $$('[data-chk="' + CSS.escape(sid) + '"]'); const done = all.filter(x => x.checked).length; const ring = $('[data-chk-ring="' + CSS.escape(sid) + '"]');
  if (ring) { ring.style.setProperty('--p', Math.round(done / all.length * 100)); $('b', ring).textContent = done + '/' + all.length; }
  if (done === all.length && all.length) UI.toast('🎉 أحسنت! أكملت القائمة كاملة');
});

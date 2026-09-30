// ---------------------------------------------------------------------
// وضع العرض للمدرب: شاشة القاعة الكبيرة (رمز QR للانضمام، نتائج التصويت الحية، سحابة الكلمات، أفضل مشاركة، العدادات)
// ما يُعرض يُحفظ في settings/present ليتحكم فيه المدرب من جواله بينما الشاشة الكبيرة تتبعه.
// ---------------------------------------------------------------------
const QR_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
const AR_STOP = new Set(('في من على إلى الى عن مع هذا هذه ذلك تلك التي الذي الذين أن ان إن او أو ثم كل قد لا ما لم لن هو هي هم نحن أنا انا كان كانت يكون تكون بعد قبل عند حتى إذا اذا كما لكن بل أي اي بين ايضا أيضا جدا جدًا فقط وهو وهي وفي ومن وعلى والى وان به بها له لها لهم منه منها عليه عليها فيه فيها عبر خلال حول دون غير أكثر اكثر أقل اقل كيف لماذا متى أين اين هل نعم يعني مثل ذات عدة بعض لدى لدي لديه لديها كذلك وأن وإن وكل فإن لأن لان حيث التي وهذا وهذه يمكن تم ليس ليست إلى').split(' '));
function wordFreq(texts) {
  const c = {};
  texts.forEach(t => String(t || '').replace(/[،؛؟«»٪٫٬]/g, ' ').replace(/[ً-ْـ]/g, '').replace(/[^؀-ۿa-zA-Z0-9\s]/g, ' ').split(/\s+/).forEach(w => {
    w = w.trim(); if (w.length < 3 || AR_STOP.has(w) || /^\d+$/.test(w)) return; const k = w.replace(/^(وال|بال|فال|كال|لل)/, 'ال'); c[k] = (c[k] || 0) + 1; }));
  return Object.keys(c).map(k => ({ w: k, n: c[k] })).sort((a, b) => b.n - a.n).slice(0, 45);
}
function wordCloudHtml(texts) {
  const list = wordFreq(texts); if (!list.length) return '<div class="pr-empty">تظهر سحابة الكلمات مع أول الإجابات…</div>';
  const mx = list[0].n, mn = list[list.length - 1].n; const cols = ['#FF8FA3', '#8FF0C8', '#FFD98A', '#9CC8FF', '#FFB38A', '#C9A7FF', '#7FE0E0', '#F5F5F5'];
  const shuffled = list.map((x, i) => Object.assign({ o: seededOrder(list.length, 'wc')[i] }, x)).sort((a, b) => a.o - b.o);
  return '<div class="wcloud">' + shuffled.map((x, i) => { const s = mx === mn ? 1 : (x.n - mn) / (mx - mn); return '<span style="font-size:' + (18 + s * 46).toFixed(0) + 'px;color:' + cols[i % cols.length] + ';opacity:' + (.65 + s * .35).toFixed(2) + '">' + h(x.w) + '</span>'; }).join('') + '</div>';
}
function topPostOf(e) {
  const ps = Store.posts[e.id] || {}; let best = null, bl = -1;
  Object.keys(ps).forEach(k => { const p = ps[k]; if (!p) return; const l = Object.keys(p.likes || {}).length; if (l > bl || (l === bl && (p.ts || 0) > (best.ts || 0))) { bl = l; best = Object.assign({ k }, p); } });
  return best ? { p: best, likes: bl } : null;
}
const Present = {
  cfg() { return Object.assign({ ex: 'join', q: 0 }, Store.presentCfg || {}); },
  options() {
    const o = [['join', '📲 رمز الانضمام والعدادات'], ['leaderboard', '🏆 لوحة الصدارة'], ['assess', '📋 نتائج التقييم القبلي والبعدي']];
    Content.activities().forEach(e => o.push([e.id, '⚡ ' + e.title]));
    Content.eligibleAxes().forEach(a => Content.exercisesOf(a.id).forEach(e => o.push([e.id, (e.icon || '✍️') + ' ' + a.title.slice(0, 22) + ' — ' + e.title])));
    const sv = Content.survey(); if (sv) o.push([sv.id, '💬 ' + sv.title]); return o;
  },
  panel(c) {
    const users = Object.keys(Store.users || {}).length;
    if (c.ex === 'join') {
      const today = Attend.openDays()[0]; const cd = today ? Attend.cfg().codes['d' + today] : null;
      return '<div class="pr-join"><div class="pr-qr" id="prQr"><div class="pr-empty">…</div></div><div><div class="pr-big">انضم الآن من جوالك</div><div class="pr-url num">' + h(location.host + location.pathname) + '</div><div class="pr-counters"><div><b class="num">' + users + '</b><span>مسجّل</span></div><div><b class="num">' + (today ? Object.keys(Store.users || {}).filter(u => Attend.hoursOf(u, today) > 0).length : '—') + '</b><span>حاضر اليوم</span></div>' + (cd ? '<div class="code"><b class="num notranslate" translate="no">' + h(cd.code) + '</b><span>رمز حضور اليوم ' + today + '</span></div>' : '') + '</div></div></div>';
    }
    if (c.ex === 'leaderboard') return '<div class="pr-title">🏆 لوحة الصدارة</div>' + leaderboardHtml(8);
    if (c.ex === 'assess') { const A = Content.assess(); const pq = Assess.perQuestion('pre'), qq = Assess.perQuestion('post'); const pa = Assess.avg('pre'), qa = Assess.avg('post');
      return '<div class="pr-title">📋 التقييم القبلي والبعدي</div><div class="pr-counters"><div><b class="num">' + (pa == null ? '—' : Math.round(pa) + '%') + '</b><span>متوسط القبلي · ' + Assess.list('pre').length + '</span></div><div><b class="num">' + (qa == null ? '—' : Math.round(qa) + '%') + '</b><span>متوسط البعدي · ' + Assess.list('post').length + '</span></div></div><div class="pr-bars">' + A.items.map((it, i) => '<div class="pr-qbar"><span class="num">' + (i + 1) + '</span><i><em class="pre" style="width:' + (pq[i] || 0) + '%"></em><em class="post" style="width:' + (qq[i] || 0) + '%"></em></i><b class="num">' + (pq[i] == null ? '—' : pq[i] + '%') + ' → ' + (qq[i] == null ? '—' : qq[i] + '%') + '</b></div>').join('') + '</div>'; }
    const e = Content.ex(c.ex); if (!e) return '<div class="pr-empty">اختر ما تريد عرضه من القائمة.</div>';
    const ps = Store.posts[e.id] || {}; const cnt = Object.keys(ps).filter(k => ps[k]).length;
    let body = '';
    if (e.format === 'mcq') {
      const st = mcqStats(e); const qi = Math.max(0, Math.min(e.items.length - 1, +c.q || 0)); const it = e.items[qi]; const s = st[qi]; const rv = isRevealed(e);
      body = '<div class="pr-q"><span class="num">' + (qi + 1) + '/' + e.items.length + '</span> ' + h(it.q) + '</div><div class="pr-poll">' + it.options.map((o, k) => { const pct = s.total ? Math.round(s.counts[k] / s.total * 100) : 0; return '<div class="pr-opt ' + (rv && k === +it.answer ? 'right' : '') + '"><em style="width:' + pct + '%"></em><span><b>' + LETTERS[k] + ')</b> ' + h(o) + '</span><b class="num">' + pct + '%</b></div>'; }).join('') + '</div><div class="pr-foot">👥 <span class="num">' + s.total + '</span> صوت على هذا السؤال' + (rv ? ' · 🔓 الإجابة الصحيحة: ' + LETTERS[it.answer] : '') + '</div>' +
        '<div class="pr-nav"><button class="btn btn-ghost" data-act="pr-q" data-d="-1" ' + (qi === 0 ? 'disabled' : '') + '>→ السابق</button><button class="btn btn-mint" data-act="reveal" data-id="' + h(e.id) + '">' + (rv ? '🔒 إخفاء الإجابة' : '🔓 كشف الإجابة') + '</button><button class="btn btn-ghost" data-act="pr-q" data-d="1" ' + (qi >= e.items.length - 1 ? 'disabled' : '') + '>التالي ←</button></div>';
    } else if (e.kind === 'survey') { const sv = SurveyStats.of(ps, e); body = '<div class="pr-counters"><div><b class="num">' + (sv.overall ? sv.overall.toFixed(1) : '—') + '</b><span>الرضا من 5</span></div><div><b class="num">' + (sv.nps == null ? '—' : sv.nps) + '</b><span>NPS</span></div></div>' + wordCloudHtml(sv.texts.map(p => p.text)); }
    else if (e.format === 'sim') body = Sims.feed(e, { public: true });
    else if (e.format === 'text') body = wordCloudHtml(Object.keys(ps).map(k => ps[k] && ps[k].text));
    else { const rv = isRevealed(e); body = '<div class="pr-bars">' + e.items.map((it, i) => { let ok = 0, tot = 0; Object.keys(ps).forEach(k => { const a = ansList(ps[k] && ps[k].answers, e.items.length)[i]; if (a == null || a === '') return; tot++; if (e.format === 'truefalse' ? ((a === true || a === 'true') === !!it.answer) : a === it.answer) ok++; }); const pct = tot ? Math.round(ok / tot * 100) : 0; return '<div class="pr-qbar"><span class="num">' + (i + 1) + '</span><i><em class="post" style="width:' + (rv ? pct : tot ? 100 : 0) + '%;' + (rv ? '' : 'background:#9AA4B8') + '"></em></i><b class="num">' + (rv ? pct + '% صحيح' : tot + ' إجابة') + '</b></div>'; }).join('') + '</div><div class="pr-nav"><button class="btn btn-mint" data-act="reveal" data-id="' + h(e.id) + '">' + (rv ? '🔒 إخفاء الإجابات' : '🔓 كشف نسبة الصحيح') + '</button></div>'; }
    const top = e.format === 'text' || e.kind === 'survey' ? topPostOf(e) : null;
    return '<div class="pr-title">' + h(e.icon || '') + ' ' + h(e.title) + ' <span class="pr-count">👥 <span class="num">' + cnt + '</span> ' + (e.mode === 'group' ? 'مجموعة' : 'مشاركة') + '</span></div>' + body +
      (top && top.p.text ? '<div class="pr-top"><div class="lbl">⭐ الأكثر إعجابًا · 👍 <span class="num">' + top.likes + '</span></div><div class="txt">«' + h(clip(top.p.text, 260)) + '»</div><div class="who">— ' + h(top.p.k.charAt(0) === 'g' && e.mode === 'group' ? Groups.label(+top.p.k.slice(1)) : (top.p.name || '')) + '</div></div>' : '');
  },
  html() {
    const c = Present.cfg();
    return '<div class="present"><div class="pr-bar"><div class="pr-brand">' + iconSvg('store', 22, '#fff') + ' <b>' + h(Content.courseTitle()) + '</b></div><select id="prSel" class="pr-sel">' + Present.options().map(([k, l]) => '<option value="' + h(k) + '" ' + (k === c.ex ? 'selected' : '') + '>' + h(l) + '</option>').join('') + '</select><button class="btn btn-ghost btn-sm" data-act="pr-full">⛶ ملء الشاشة</button><button class="btn btn-ghost btn-sm" data-go="admin">↩ اللوحة</button></div><div class="pr-body">' + Present.panel(c) + '</div></div>';
  },
  after(root) {
    const sel = $('#prSel', root); if (sel) sel.addEventListener('change', () => DB.set('settings/present', { ex: sel.value, q: 0 }));
    const box = $('#prQr', root); if (box) loadScript(QR_LIB).then(() => { try { const q = window.qrcode(0, 'M'); q.addData(location.origin + location.pathname); q.make(); box.innerHTML = q.createSvgTag({ cellSize: 8, margin: 2, scalable: true }); } catch (e) { box.innerHTML = '<div class="pr-empty">تعذر إنشاء QR</div>'; } }).catch(() => { box.innerHTML = '<div class="pr-empty">QR غير متاح دون اتصال</div>'; });
  }
};
Views.present = Present;

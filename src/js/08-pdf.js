// ---------------------------------------------------------------------
// محرّك PDF موحّد (html2canvas + jsPDF) — يُحمَّل عند الحاجة فقط
// يُعاد استخدامه لكل المستندات: المحتوى A5، تهنئة الإنجاز A4 أفقي، مشاركات المتدرب A5
// ---------------------------------------------------------------------
const CDN = {
  h2c: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
};
const PDF_CSS = `
.pp{position:relative;overflow:hidden;background:#fff;font-size:14px;font-family:'Noto Sans Arabic','IBM Plex Sans Arabic',sans-serif;color:#1C2340;direction:rtl;box-sizing:border-box}
.pp *{box-sizing:border-box}
.pp h1,.pp h2,.pp h3{font-family:'Cairo',sans-serif;margin:0;line-height:1.35}
.pp .j{text-align:justify;text-justify:inter-word}
.pp .fit{position:absolute;overflow:hidden}
.pp .num{direction:ltr;unicode-bidi:isolate}
.pp .nl{display:flex;flex-direction:column;gap:7px;margin-top:8px}
.pp .nl .it{display:flex;gap:9px;align-items:flex-start}
.pp .nl .b{width:24px;height:24px;border-radius:8px;color:#fff;font-family:Arial,sans-serif;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none;margin-top:3px}
.pp .pair{border-radius:12px;overflow:hidden;margin-top:8px;border:1px solid #E1E9EC}
.pp .pair .h{padding:6px 12px;font-weight:700;font-family:'IBM Plex Sans Arabic',sans-serif}
.pp .pair .b{padding:7px 12px;background:#fff}
.pp .rule{margin-top:12px;padding:10px 12px;border-radius:12px;font-weight:600}
.pp .foot{position:absolute;bottom:14px;left:28px;right:28px;display:flex;justify-content:space-between;font-family:'IBM Plex Sans Arabic',sans-serif;font-size:10.5px;color:#7D879C}
.pp p{margin:0 0 6px}
.pp ul,.pp ol{margin:4px 0;padding-right:18px}
`;
const PDFE = {
  async libs(zip) {
    await loadScript(CDN.h2c); await loadScript(CDN.jspdf); if (zip) await loadScript(CDN.jszip);
    if (!window.html2canvas || !window.jspdf) throw new Error('تعذر تحميل مكتبات PDF');
  },
  host() { let h0 = document.getElementById('pdfHost'); if (!h0) { h0 = document.createElement('div'); h0.id = 'pdfHost'; h0.style.cssText = 'position:fixed;left:-20000px;top:0;z-index:-1;pointer-events:none'; h0.innerHTML = '<style>' + PDF_CSS + '</style>'; document.body.appendChild(h0); } return h0; },
  fit(page) { // تصغير تدريجي لحجم خط الحاوية حتى يتسع المحتوى داخل صفحة واحدة
    $$('.fit', page).forEach(box => { let pct = 100; box.style.fontSize = pct + '%'; while (box.scrollHeight > box.clientHeight + 1 && pct > 58) { pct -= 4; box.style.fontSize = pct + '%'; } });
  },
  // pages: مصفوفة HTML لكل صفحة — size: {w,h (px), mmW, mmH, orientation, format}
  async build(pages, size, progress) {
    await PDFE.libs(); const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: size.format, orientation: size.orientation, compress: true });
    const host = PDFE.host();
    for (let i = 0; i < pages.length; i++) {
      const el = document.createElement('div'); el.className = 'pp'; el.style.width = size.w + 'px'; el.style.height = size.h + 'px';
      el.innerHTML = pages[i]; host.appendChild(el); PDFE.fit(el);
      await document.fonts.ready; // ضروري قبل كل استدعاء لـ html2canvas لتفادي تشوّه الحروف العربية
      const canvas = await window.html2canvas(el, { scale: 1.6, backgroundColor: '#ffffff', useCORS: true, logging: false, ignoreElements: n => n.id === 'app' || (n.classList && n.classList.contains('modal-back')) });
      const img = canvas.toDataURL('image/jpeg', 0.84);
      if (i > 0) doc.addPage(size.format, size.orientation);
      doc.addImage(img, 'JPEG', 0, 0, size.mmW, size.mmH);
      el.remove(); if (progress) progress(i + 1, pages.length);
    }
    return doc;
  }
};
const A5 = { w: 559, h: 794, mmW: 148, mmH: 210, format: 'a5', orientation: 'portrait' };
const A4L = { w: 1123, h: 794, mmW: 297, mmH: 210, format: 'a4', orientation: 'landscape' };
function progressModal(title) {
  const m = UI.modal('<h3>' + h(title) + '</h3><p class="muted" data-pm-txt>جارٍ التحضير…</p><div class="progress" style="margin-top:10px"><i data-pm-bar style="width:2%"></i></div>', { sticky: true });
  return { set(i, n, txt) { const b = $('[data-pm-bar]', m.el); if (b) b.style.width = Math.round(i / n * 100) + '%'; const t = $('[data-pm-txt]', m.el); if (t) t.textContent = txt || ('صفحة ' + i + ' من ' + n); }, close: m.close };
}

// ---------- قطع تصميم مشتركة لصفحات PDF ----------
const PP = {
  multiBg() { return '<div style="position:absolute;inset:0;background:#F8FBFC"></div><div style="position:absolute;inset:0;background:radial-gradient(circle at 12% 10%,rgba(138,21,56,.20),transparent 38%),radial-gradient(circle at 90% 18%,rgba(19,138,94,.20),transparent 36%),radial-gradient(circle at 85% 88%,rgba(217,166,46,.18),transparent 40%),radial-gradient(circle at 10% 90%,rgba(200,112,42,.18),transparent 40%),radial-gradient(circle at 50% 55%,rgba(31,58,95,.10),transparent 45%)"></div>'; },
  scatter(axes, variant) {
    const spots = variant ? [[30, 60], [470, 40], [20, 330], [490, 300], [60, 680], [440, 700], [250, 30], [240, 730]] : [[40, 40], [480, 70], [30, 400], [480, 420], [90, 700], [420, 690], [260, 740], [250, 20]];
    return spots.map((p, i) => { const a = axes[i % Math.max(1, axes.length)]; if (!a) return ''; const col = Content.color(a); const sz = 34 + (i % 3) * 8; return '<div style="position:absolute;left:' + p[0] + 'px;top:' + p[1] + 'px;width:' + (sz + 16) + 'px;height:' + (sz + 16) + 'px;border-radius:' + (i % 2 ? '50%' : '16px') + ';background:' + tint(col, .14) + ';display:flex;align-items:center;justify-content:center;transform:rotate(' + ((i * 17) % 30 - 15) + 'deg)">' + iconSvg(a.icon || 'star', sz, col, 2) + '</div>'; }).join('');
  },
  decor(seed, op = .14) { return '<div style="position:absolute;inset:0">' + decorShapes(seed, op) + '</div>'; },
  numbered(list, col) { return '<div class="nl">' + list.map((t, i) => '<div class="it"><span class="b" style="background:' + col + '">' + (i + 1) + '</span><div class="j" style="flex:1">' + t + '</div></div>').join('') + '</div>'; },
  foot(left, n) { return '<div class="foot"><span>' + h(left) + '</span><span class="num">' + n + '</span></div>'; }
};
function frontCover(title, sub, axes, extraLine) {
  return PP.multiBg() + PP.scatter(axes, 0) +
    '<div style="position:absolute;left:52px;right:52px;top:210px;background:#fff;border-radius:28px;box-shadow:0 20px 50px rgba(20,40,70,.16);padding:38px 30px;text-align:center">' +
    '<div style="width:74px;height:74px;margin:0 auto 14px;border-radius:22px;background:linear-gradient(120deg,#8A1538,#138A5E 45%,#C8702A 75%,#D9A62E);display:flex;align-items:center;justify-content:center">' + iconSvg('store', 38, '#fff', 2) + '</div>' +
    '<h1 style="font-size:30px;font-weight:800">' + h(title) + '</h1>' + (extraLine ? '<div style="margin-top:10px;font-family:Cairo;font-weight:800;font-size:22px;color:#8A1538">' + h(extraLine) + '</div>' : '') +
    '<p style="margin-top:12px;color:#4A5470;font-size:15px">' + h(sub) + '</p><div style="margin-top:16px;font-family:IBM Plex Sans Arabic;font-size:12px;color:#7D879C" class="num">' + fmtDate(Date.now()) + '</div></div>';
}
function backCover(axes) {
  const p = Content.pdf();
  return PP.multiBg() + PP.scatter(axes.slice().reverse(), 1) +
    '<div style="position:absolute;left:60px;right:60px;top:250px;background:#fff;border-radius:28px;box-shadow:0 20px 50px rgba(20,40,70,.16);padding:34px 28px;text-align:center">' +
    '<div style="font-family:IBM Plex Sans Arabic;font-size:12px;font-weight:700;color:#C8702A;letter-spacing:.5px">المدرّب</div>' +
    '<h1 style="font-size:28px;font-weight:800;margin-top:6px">' + h(p.trainerName) + '</h1><div style="margin-top:6px;color:#8A1538;font-weight:700;font-family:IBM Plex Sans Arabic">' + h(p.trainerRole) + '</div>' +
    '<p class="j" style="margin-top:14px;color:#4A5470;font-size:14px">' + h(p.trainerBio) + '</p>' + (p.trainerContact ? '<div style="margin-top:12px;font-family:IBM Plex Sans Arabic;font-weight:700;color:#1C2340;direction:ltr">' + h(p.trainerContact) + '</div>' : '') + '</div>';
}
function tocPages(axes, title) { // توزيع متساوٍ للمحاور على صفحات الفهرس دون قطع أي بطاقة
  const MAX = 5; const pagesN = Math.max(1, Math.ceil(axes.length / MAX)); const base = Math.floor(axes.length / pagesN), extra = axes.length % pagesN;
  const out = []; let k = 0;
  for (let p = 0; p < pagesN; p++) {
    const cnt = base + (p < extra ? 1 : 0); const list = axes.slice(k, k + cnt); k += cnt;
    out.push('<div style="position:absolute;inset:0;background:#F8FBFC"></div><div style="position:absolute;top:34px;right:34px;left:34px"><div style="font-family:IBM Plex Sans Arabic;font-size:12px;font-weight:700;color:#8A1538">' + h(title) + '</div><h2 style="font-size:24px;font-weight:800">فهرس المحتوى' + (pagesN > 1 ? ' <span class="num" style="font-size:14px;color:#7D879C">(' + (p + 1) + '/' + pagesN + ')</span>' : '') + '</h2></div>' +
      '<div style="position:absolute;top:104px;right:34px;left:34px;display:flex;flex-direction:column;gap:12px">' + list.map(a => { const col = Content.color(a); return '<div style="display:flex;gap:12px;align-items:flex-start;background:' + tint(col, .08) + ';border-radius:18px;padding:12px 14px;border-right:6px solid ' + col + '"><div style="width:48px;height:48px;border-radius:14px;background:' + col + ';display:flex;align-items:center;justify-content:center;flex:none">' + iconSvg(a.icon || 'star', 26, '#fff') + '</div><div style="flex:1"><div style="font-family:Cairo;font-weight:800;font-size:15.5px">' + h(a.title) + '</div>' + (a.classic ? '<div style="font-family:IBM Plex Sans Arabic;font-size:11.5px;color:#7D879C">' + h(a.classic) + '</div>' : '') + '<div class="j" style="font-size:11.5px;color:#4A5470;margin-top:3px;max-height:54px;overflow:hidden">' + h(stripHtml(a.desc)) + '</div></div></div>'; }).join('') + '</div>');
  }
  return out;
}
function axisCover(a, sub) {
  const col = Content.color(a);
  return '<div style="position:absolute;inset:0;background:linear-gradient(150deg,' + shade(col, .1) + ',' + shade(col, -.45) + ')"></div>' + PP.decor(a.id + 'pdf', .16) +
    '<div style="position:absolute;top:210px;left:40px;right:40px;text-align:center;color:#fff">' +
    '<div style="width:110px;height:110px;margin:0 auto 20px;border-radius:32px;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.45);display:flex;align-items:center;justify-content:center">' + iconSvg(a.icon || 'star', 60, '#fff', 1.7) + '</div>' +
    '<div style="font-family:IBM Plex Sans Arabic;font-weight:700;font-size:13px;opacity:.9">' + h(sub || Content.unitName(a.unit) || '') + '</div>' +
    '<h1 style="color:#fff;font-size:30px;font-weight:800;margin-top:6px">' + h(a.title) + '</h1>' + (a.classic ? '<div style="margin-top:8px;font-family:IBM Plex Sans Arabic;font-size:14px;opacity:.92">' + h(a.classic) + '</div>' : '') +
    '<p class="j" style="margin-top:18px;font-size:13.5px;line-height:1.9;opacity:.95">' + h(stripHtml(a.desc)) + '</p></div>';
}
function pageHeader(a, label) {
  const col = Content.color(a);
  return '<div style="position:absolute;top:0;left:0;right:0;height:92px;background:linear-gradient(120deg,' + col + ',' + shade(col, -.4) + ');overflow:hidden">' + PP.decor(a.id + 'hd', .14) +
    '<div style="position:absolute;top:22px;right:26px;left:26px;display:flex;gap:12px;align-items:center;color:#fff"><div style="width:46px;height:46px;border-radius:14px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;flex:none">' + iconSvg(a.icon || 'star', 26, '#fff') + '</div><div style="flex:1;min-width:0"><div style="font-family:Cairo;font-weight:800;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + h(a.title) + '</div><div style="font-family:IBM Plex Sans Arabic;font-size:11px;opacity:.9">' + label + '</div></div></div></div>';
}
function slidePage(a, s, i, n, pageNo) {
  const col = Content.color(a); const t = SLIDE_TYPES[s.type] ? s.type : 'principle';
  let body = '<div style="display:inline-block;padding:3px 12px;border-radius:999px;background:' + tint(col, .14) + ';color:' + shade(col, -.3) + ';font-family:IBM Plex Sans Arabic;font-weight:700;font-size:11.5px">' + h(SLIDE_TYPES[t]) + '</div>' +
    (s.image ? '<img src="' + s.image + '" style="width:100%;max-height:190px;object-fit:cover;border-radius:14px;margin-top:10px;display:block">' : '') +
    '<h2 style="font-size:1.45em;font-weight:800;margin:10px 0 8px">' + h(s.title) + '</h2>';
  const rule = s.rule ? '<div class="rule j" style="background:' + tint(col, .1) + ';border-right:4px solid ' + col + '">' + sanitize(richHtml(s.rule)) + '</div>' : '';
  if (t === 'opening' || t === 'summary') body += '<div class="j">' + withLede(richHtml(s.text)) + '</div>' + rule;
  else if (t === 'principle') body += '<div class="j">' + richHtml(s.intro) + '</div>' + (s.points && s.points.length ? PP.numbered(s.points.map(p => boldTerm(p)), col) : '') + rule;
  else body += (s.items || []).map(it => { const k = String(it).indexOf('::'); const hd = k > -1 ? it.slice(0, k) : it, bd = k > -1 ? it.slice(k + 2) : ''; return '<div class="pair"><div class="h" style="background:' + (t === 'mistakes' ? '#FDECEC;color:#A12A2E' : tint(col, .12)) + '">' + h(hd.trim()) + '</div>' + (bd ? '<div class="b j" style="' + (t === 'mistakes' ? 'background:#EEFAF3;color:#146B40' : '') + '">' + (t === 'mistakes' ? '<b>✓ التصحيح: </b>' : '') + h(bd.trim()) + '</div>' : '') + '</div>'; }).join('') + rule;
  return pageHeader(a, 'الشريحة <span class="num">' + (i + 1) + ' / ' + n + '</span>') + '<div class="fit" style="top:110px;bottom:44px;right:30px;left:30px;line-height:1.85">' + body + '</div>' + PP.foot(Content.courseTitle(), pageNo);
}

// ---------- ملف المحتوى ----------
async function buildContentPdf() {
  const pm = progressModal('📄 استخراج المحتوى');
  try {
    const p = Content.pdf(); const axes = Content.eligibleAxes(); const title = p.coverTitle || Content.courseTitle();
    const pages = [frontCover(title, p.coverSub, axes)];
    tocPages(axes, title).forEach(x => pages.push(x));
    axes.forEach(a => { pages.push(axisCover(a)); a.slides.forEach((s, i) => pages.push(slidePage(a, s, i, a.slides.length, pages.length + 1))); });
    pages.push(backCover(axes));
    const doc = await PDFE.build(pages, A5, (i, n) => pm.set(i, n));
    doc.save((title || 'content').replace(/[\\/:*?"<>|]/g, '') + '.pdf'); pm.close(); UI.toast('✅ تم إنشاء ملف المحتوى');
  } catch (e) { pm.close(); UI.alert('تعذر إنشاء الملف: ' + h(e.message || e)); }
}

// ---------- تهنئة الإنجاز: صفحة A4 أفقية مستقلة تمامًا ----------
async function buildCongratsPdf(name, kind = 'congrats') {
  const pm = progressModal(kind === 'cert' ? '🎓 شهادة المشاركة' : '🏆 تهنئة الإنجاز');
  try {
    const c = Content.doc(kind); const rep = s => String(s || '').replace(/\{\{name\}\}/g, name).replace(/\{\{courseTitle\}\}/g, Content.courseTitle()).replace(/\{\{date\}\}/g, fmtDate(Date.now()));
    const axes = Content.eligibleAxes();
    const page = PP.multiBg() + '<div style="position:absolute;inset:26px;border-radius:30px;border:3px solid rgba(138,21,56,.25)"></div>' +
      axes.slice(0, 8).map((a, i) => { const pos = [[60, 60], [1010, 60], [60, 660], [1010, 660], [300, 40], [770, 690], [40, 360], [1030, 360]][i]; const col = Content.color(a); return '<div style="position:absolute;left:' + pos[0] + 'px;top:' + pos[1] + 'px;width:56px;height:56px;border-radius:18px;background:' + tint(col, .15) + ';display:flex;align-items:center;justify-content:center">' + iconSvg(a.icon, 30, col) + '</div>'; }).join('') +
      '<div style="position:absolute;left:150px;right:150px;top:100px;bottom:100px;background:#fff;border-radius:30px;box-shadow:0 24px 60px rgba(20,40,70,.16);padding:40px 60px;text-align:center">' +
      '<div style="font-size:60px;line-height:1.1">' + h(c.emoji) + '</div><h1 style="font-size:34px;font-weight:800;margin-top:6px">' + h(rep(c.title)) + '</h1>' +
      '<div style="font-family:Cairo;font-size:42px;font-weight:800;color:#8A1538;margin:14px 0 6px">' + h(name) + '</div>' +
      c.paragraphs.map(p => '<p style="font-size:18px;color:#4A5470;margin-top:8px;line-height:1.8">' + h(rep(p)) + '</p>').join('') +
      '<div style="position:absolute;bottom:28px;left:60px;right:60px;display:flex;justify-content:space-between;font-family:IBM Plex Sans Arabic;font-size:15px;color:#4A5470"><span>' + h(rep(c.footerRight)) + '</span><span>' + h(rep(c.footerLeft)) + '</span></div></div>';
    const doc = await PDFE.build([page], A4L, (i, n) => pm.set(i, n));
    doc.save((kind === 'cert' ? 'شهادة مشاركة - ' : 'تهنئة إنجاز - ') + name + '.pdf'); pm.close();
  } catch (e) { pm.close(); UI.alert('تعذر إنشاء الملف: ' + h(e.message || e)); }
}

// ---------- مشاركات متدرب محدد ----------
function exCorrectness(e, answers) { const a = ansList(answers, e.items.length); let sc = 0; e.items.forEach((it, i) => { const v = a[i]; if (v == null || v === '') return; if (e.format === 'mcq' ? +v === +it.answer : e.format === 'truefalse' ? ((v === true || v === 'true') === !!it.answer) : v === it.answer) sc++; }); return sc; }
function participationOf(uid) {
  const g = Groups.assignedOf(uid); const sections = [];
  const pick = e => { const ps = Store.posts[e.id] || {}; if (e.mode === 'group') { if (!g) return null; const p = ps['g' + g]; return p ? { p, group: g } : null; } const p = ps[uid]; return p ? { p } : null; };
  Content.eligibleAxes().forEach(a => { const list = Content.exercisesOf(a.id).map(e => ({ e, r: pick(e) })).filter(x => x.r); if (list.length) sections.push({ a, list }); });
  const acts = Content.activities().map(e => ({ e, r: pick(e) })).filter(x => x.r); if (acts.length) sections.push({ a: { id: 'acts', title: 'الأنشطة العامة', classic: '', desc: '', icon: 'bolt', color: 2 }, list: acts, sub: 'أنشطة' });
  const sv = Content.survey(); if (sv) { const r = pick(sv); if (r) sections.push({ a: { id: 'sv', title: 'ختام البرنامج', classic: '', desc: '', icon: 'trophy', color: 3 }, list: [{ e: sv, r }], sub: 'الاستطلاع الختامي' }); }
  return sections;
}
function answerPdfHtml(e, p) {
  if (e.format === 'sim') return '<div class="j" style="background:#F7FAFB;border:1px solid #E1E9EC;border-radius:12px;padding:10px 12px">🎮 ' + h(p.summary || '') + '</div>';
  if (e.format === 'text') return '<div class="j" style="white-space:pre-wrap;background:#F7FAFB;border:1px solid #E1E9EC;border-radius:12px;padding:10px 12px">' + h(p.text || '') + '</div>';
  const a = ansList(p.answers, e.items.length);
  return '<div class="nl">' + e.items.map((it, i) => {
    const v = a[i]; let q = '', ans = '', ok = false, corr = '';
    if (e.format === 'mcq') { q = it.q; ans = v != null ? LETTERS[v] + ') ' + (it.options[v] || '') : '—'; ok = v != null && +v === +it.answer; corr = LETTERS[it.answer] + ') ' + it.options[it.answer]; }
    else if (e.format === 'truefalse') { q = it.q; ans = v == null ? '—' : ((v === true || v === 'true') ? 'صح' : 'خطأ'); ok = v != null && ((v === true || v === 'true') === !!it.answer); corr = it.answer ? 'صح' : 'خطأ'; }
    else if (e.format === 'fillblank') { q = it.text.replace('___', '____'); ans = v || '—'; ok = v === it.answer; corr = it.answer; }
    else { q = '(أ) ' + it.a + ' — (ب) ' + it.b; ans = v ? '(' + (v === 'a' ? 'أ' : 'ب') + ') ' + it[v] : '—'; ok = v === it.answer; corr = '(' + (it.answer === 'a' ? 'أ' : 'ب') + ') ' + it[it.answer]; }
    return '<div class="it"><span class="b" style="background:' + (ok ? '#138A5E' : '#E5484D') + '">' + (i + 1) + '</span><div style="flex:1"><div style="font-size:.92em;color:#4A5470">' + h(q) + '</div><div style="font-weight:700;color:' + (ok ? '#10573A' : '#A12A2E') + '">' + (ok ? '✓ ' : '✗ ') + h(ans) + (ok ? '' : ' <span style="font-weight:500;color:#10573A">— الصحيح: ' + h(corr) + '</span>') + '</div></div></div>';
  }).join('') + '</div><div style="margin-top:8px;font-family:IBM Plex Sans Arabic;font-weight:700">النتيجة: ' + exCorrectness(e, a) + ' من ' + e.items.length + '</div>';
}
function personPages(uid) {
  const u = Store.users[uid] || {}; const axes = Content.eligibleAxes(); const secs = participationOf(uid);
  const pages = [frontCover(Content.courseTitle(), 'سجل مشاركات المتدرب في تمارين وأنشطة البرنامج', axes, (u.name || '') + ' · سجل مشاركات')];
  if (!secs.length) { pages.push(PP.multiBg() + '<div style="position:absolute;left:50px;right:50px;top:280px;background:#fff;border-radius:24px;padding:30px;text-align:center;box-shadow:0 16px 40px rgba(20,40,70,.12)"><div style="font-size:40px">🗒️</div><h2 style="margin-top:8px">لا توجد مشاركات مسجلة</h2><p style="margin-top:8px;color:#4A5470">لم يشارك ' + h(u.name || 'هذا المتدرب') + ' في أي تمرين أو نشاط حتى تاريخ إنشاء هذا الملف (' + fmtDate(Date.now()) + ').</p></div>'); return pages; }
  secs.forEach(sec => {
    pages.push(axisCover(sec.a, sec.sub));
    sec.list.forEach(({ e, r }) => {
      const col = Content.color(sec.a);
      const body = '<div style="display:flex;gap:10px;align-items:center"><span style="font-size:26px">' + h(e.icon || '✍️') + '</span><h2 style="font-size:1.35em;font-weight:800">' + h(e.title) + '</h2></div>' +
        '<div style="margin-top:6px;font-family:IBM Plex Sans Arabic;font-size:11.5px;color:#7D879C">' + (e.mode === 'group' ? '👥 جماعي' : '👤 فردي') + ' · ' + h(FORMATS[e.format] || '') + ' · ' + fmtDate(r.p.ts) + '</div>' +
        (e.scenario ? '<div class="j" style="margin-top:10px;padding:10px 12px;border-radius:12px;background:#FFFBF4;border:1px solid #F2E4D3;font-size:.95em"><b>الموقف: </b>' + stripHtml(e.scenario) + '</div>' : '') +
        (e.task && e.format === 'text' ? '<div class="j" style="margin-top:8px;font-size:.95em"><b>المطلوب: </b>' + h(stripHtml(e.task)) + '</div>' : '') +
        (r.group ? '<div style="margin-top:10px;display:inline-block;padding:2px 10px;border-radius:999px;background:' + tint(col, .14) + ';font-family:IBM Plex Sans Arabic;font-size:11.5px;font-weight:700">(ضمن ' + h(Groups.label(r.group)) + ')</div>' : '') +
        '<div style="margin-top:10px;font-family:Cairo;font-weight:700;color:' + col + '">إجابة المتدرب</div>' + answerPdfHtml(e, r.p);
      pages.push(pageHeader(sec.a, h(u.name || '') + ' · سجل مشاركات') + '<div class="fit" style="top:110px;bottom:44px;right:30px;left:30px;line-height:1.8">' + body + '</div>' + PP.foot(Content.courseTitle(), pages.length + 1));
    });
  });
  pages.push(backCover(axes));
  return pages;
}
async function personPdfDoc(uid, pm) { return PDFE.build(personPages(uid), A5, pm ? (i, n) => pm.set(i, n) : null); }
function safeName(s) { return String(s || 'متدرب').replace(/[\\/:*?"<>|]/g, '').trim() || 'متدرب'; }

// ---------- CSV ----------
function csvEsc(v) { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function csvBlob(rows) { return new Blob(['﻿' + rows.map(r => r.map(csvEsc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }); }
function answerText(e, p) {
  if (e.format === 'text') return p.text || '';
  if (e.format === 'sim') return p.summary || '';
  const a = ansList(p.answers, e.items.length);
  return e.items.map((it, i) => { const v = a[i]; let t = '—'; if (v != null && v !== '') { if (e.format === 'mcq') t = LETTERS[v] + ') ' + (it.options[v] || ''); else if (e.format === 'truefalse') t = (v === true || v === 'true') ? 'صح' : 'خطأ'; else if (e.format === 'fillblank') t = v; else t = '(' + (v === 'a' ? 'أ' : 'ب') + ') ' + it[v]; } return (i + 1) + ': ' + t; }).join(' | ');
}
function exportAllCsv() {
  const rows = [['القسم', 'التمرين', 'النموذج', 'النوع', 'المشارك / المجموعة', 'المسمى', 'الإجابة', 'النتيجة', 'الإعجابات', 'التاريخ']];
  Content.allExercises().forEach(({ e, section }) => {
    const ps = Store.posts[e.id] || {};
    Object.keys(ps).forEach(k => { const p = ps[k]; if (!p) return; const isG = k.charAt(0) === 'g' && e.mode === 'group';
      rows.push([section, e.title, FORMATS[e.format] || '', e.mode === 'group' ? 'جماعي' : 'فردي', isG ? Groups.label(+k.slice(1)) + ' (' + (p.name || '') + ')' : (p.name || ''), isG ? '' : (p.role || ''), answerText(e, p), e.format === 'text' ? '' : e.format === 'sim' ? (p.metric != null ? p.metric : '') : exCorrectness(e, p.answers) + ' من ' + e.items.length, Object.keys(p.likes || {}).length, p.ts ? fmtTime(p.ts) : '']); });
  });
  Object.keys(Store.labAnswers || {}).forEach(g => { const ga = Store.labAnswers[g] || {}; Content.lab().stages.forEach((s, i) => { const a = ga['s' + i]; if (a) rows.push(['المختبر الختامي', (i + 1) + '. ' + s.title, 'نصية حرة', 'جماعي', Groups.label(+g.slice(1)) + ' (' + (a.name || '') + ')', '', a.text || '', '', Object.keys(a.likes || {}).length, a.ts ? fmtTime(a.ts) : '']); }); });
  const A = Content.assess(); ['pre', 'post'].forEach(ph => Assess.list(ph).forEach(x => rows.push([ph === 'pre' ? 'التقييم القبلي' : 'التقييم البعدي', A.title || '', 'اختيار من متعدد', 'فردي', x.name || '', x.role || '', answerText(A, x), x.score + ' من ' + A.items.length, '', x.ts ? fmtTime(x.ts) : ''])));
  downloadBlob(csvBlob(rows), 'مشاركات البرنامج.csv'); UI.toast('✅ تم تصدير ' + (rows.length - 1) + ' مشاركة');
}
function personCsvBlob(uid) {
  const u = Store.users[uid] || {}; const rows = [['المتدرب', 'القسم', 'التمرين', 'النموذج', 'السياق', 'الإجابة', 'النتيجة', 'التاريخ']];
  participationOf(uid).forEach(sec => sec.list.forEach(({ e, r }) => rows.push([u.name || '', sec.a.title, e.title, FORMATS[e.format] || '', r.group ? 'ضمن ' + Groups.label(r.group) : 'فردي', answerText(e, r.p), e.format === 'text' || e.format === 'sim' ? '' : exCorrectness(e, r.p.answers) + ' من ' + e.items.length, r.p.ts ? fmtTime(r.p.ts) : ''])));
  if (rows.length === 1) rows.push([u.name || '', '—', '—', '—', '—', 'لا توجد مشاركات مسجلة لهذا المتدرب حتى الآن', '', fmtDate(Date.now())]);
  return csvBlob(rows);
}
async function exportAllPersons(kind) {
  const uids = Object.keys(Store.users || {}); if (!uids.length) { UI.alert('لا يوجد مسجّلون.'); return; }
  const pm = progressModal(kind === 'pdf' ? '📦 تصدير كل الملفات PDF' : '📦 تصدير كل الملفات CSV');
  try {
    await PDFE.libs(true); const zip = new window.JSZip(); const used = {};
    for (let i = 0; i < uids.length; i++) {
      const u = Store.users[uids[i]]; let nm = safeName(u.name); if (used[nm]) nm += ' (' + (++used[nm]) + ')'; else used[nm] = 1;
      pm.set(i, uids.length, 'المتدرب ' + (i + 1) + ' من ' + uids.length + ': ' + (u.name || ''));
      if (kind === 'pdf') { const doc = await personPdfDoc(uids[i]); zip.file(nm + '.pdf', doc.output('blob')); }
      else zip.file(nm + '.csv', personCsvBlob(uids[i]));
    }
    pm.set(1, 1, 'جارٍ ضغط الملفات…');
    const blob = await zip.generateAsync({ type: 'blob' }); downloadBlob(blob, kind === 'pdf' ? 'مشاركات المتدربين PDF.zip' : 'مشاركات المتدربين CSV.zip'); pm.close();
  } catch (e) { pm.close(); UI.alert('تعذر التصدير: ' + h(e.message || e)); }
}

// ---------- بطاقة رقم العضوية PNG ----------
async function saveMemberCard(me) {
  try {
    await document.fonts.ready;
    const W = 1000, H = 600; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#8A1538'); g.addColorStop(.5, '#138A5E'); g.addColorStop(.78, '#C8702A'); g.addColorStop(1, '#D9A62E');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.12)'; [[880, 90, 150], [120, 540, 190], [540, 20, 80]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = '#fff'; const rr = (x, y, w, hh, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    rr(60, 70, W - 120, H - 140, 36); c.fill();
    c.direction = 'rtl'; c.textAlign = 'right'; c.fillStyle = '#8A1538'; c.font = '700 26px "IBM Plex Sans Arabic", sans-serif'; c.fillText(Content.courseTitle(), W - 110, 140);
    c.fillStyle = '#1C2340'; c.font = '800 54px Cairo, sans-serif'; c.fillText(me.name, W - 110, 250);
    c.fillStyle = '#4A5470'; c.font = '500 28px "IBM Plex Sans Arabic", sans-serif'; c.fillText(me.role || '', W - 110, 305);
    c.fillStyle = '#7D879C'; c.font = '700 22px "IBM Plex Sans Arabic", sans-serif'; c.fillText('رقم العضوية', W - 110, 400);
    c.direction = 'ltr'; c.textAlign = 'right'; c.fillStyle = '#1C2340'; c.font = '800 76px Cairo, sans-serif'; c.fillText(pad4(me.member || 0), W - 110, 480);
    c.textAlign = 'left'; c.direction = 'rtl'; c.fillStyle = '#7D879C'; c.font = '500 20px "IBM Plex Sans Arabic", sans-serif'; c.fillText('ادخل به من أي جهاز: «مسجّل مسبقًا؟ الدخول برقم العضوية»', 110, 480);
    await new Promise(res => cv.toBlob(b => { downloadBlob(b, 'رقم العضوية ' + pad4(me.member || 0) + '.png'); res(); }, 'image/png'));
    UI.toast('✅ تم حفظ بطاقة رقم العضوية على جهازك');
  } catch (e) { UI.alert('تعذر حفظ البطاقة: ' + h(e.message || e)); }
}


// ---------- سجل الحضور CSV ----------
function exportAttendanceCsv() {
  const users = Store.users || {}; const c = Attend.cfg();
  const rows = [['المتدرب', 'المسمى', 'المشروع', 'رقم العضوية'].concat(Attend.days().map(d => 'اليوم ' + d + ' (ساعات)')).concat(['نسبة الحضور', 'مستحق للشهادة'])];
  Object.keys(users).sort((a, b) => (users[a].name || '').localeCompare(users[b].name || '', 'ar')).forEach(u => rows.push([users[u].name || '', users[u].role || '', users[u].org || '', pad4(users[u].member || 0)].concat(Attend.days().map(d => Attend.hoursOf(u, d))).concat([Attend.pct(u) + '%', Attend.eligible(u) ? 'نعم' : 'لا'])));
  downloadBlob(csvBlob(rows), 'سجل الحضور.csv'); UI.toast('✅ تم التصدير (الحد المطلوب ' + c.threshold + '%)');
}

// ---------- دليل المدرب (A4 عمودي) ----------
async function buildGuidePdf() {
  const pm = progressModal('📘 دليل المدرب');
  try {
    const g = Content.guide(); const C = '#8A1538'; const T = Content.courseTitle(); const axes = Content.eligibleAxes(); const pages = [];
    const head = (t, sub) => '<div style="position:absolute;top:0;left:0;right:0;height:98px;background:linear-gradient(120deg,#1F3A5F,#8A1538)"><div style="position:absolute;top:14px;right:34px;left:34px;color:#fff"><div style="font-family:IBM Plex Sans Arabic;font-size:12px;opacity:.85">' + h(T) + ' · دليل المدرب</div><div style="font-family:Cairo;font-weight:800;font-size:21px">' + h(t) + '</div>' + (sub ? '<div style="font-family:IBM Plex Sans Arabic;font-size:11.5px;opacity:.9">' + h(sub) + '</div>' : '') + '</div></div>';
    const page = (t, body, sub) => pages.push('<div style="position:absolute;inset:0;background:#FBFAF9"></div>' + head(t, sub) + '<div class="fit" style="top:116px;bottom:46px;right:34px;left:34px;line-height:1.8">' + body + '</div>' + PP.foot(T + ' — دليل المدرب', pages.length + 1));
    const tbl = (heads, rows, w) => '<table style="width:100%;border-collapse:collapse;font-size:12.5px"><tr>' + heads.map((x, i) => '<th style="background:' + C + ';color:#fff;padding:7px;text-align:right;' + (w && w[i] ? 'width:' + w[i] : '') + '">' + x + '</th>').join('') + '</tr>' + rows.map((r, i) => '<tr>' + r.map(c => '<td style="padding:6px 7px;border-bottom:1px solid #EADDE1;vertical-align:top;background:' + (i % 2 ? '#fff' : '#F8EEF1') + '">' + c + '</td>').join('') + '</tr>').join('') + '</table>';
    const box = (t, inner) => '<div style="background:#fff;border:1px solid #EADDE1;border-radius:14px;padding:12px 14px;margin-bottom:12px"><div style="font-family:Cairo;font-weight:800;color:' + C + ';margin-bottom:4px">' + t + '</div>' + inner + '</div>';
    // الغلاف
    pages.push(PP.multiBg() + PP.scatter(axes, 0).replace(/left:(\d+)px/g, (m, x) => 'left:' + Math.round(x * 1.35) + 'px').replace(/top:(\d+)px/g, (m, y) => 'top:' + Math.round(y * 1.4) + 'px') +
      '<div style="position:absolute;left:80px;right:80px;top:330px;background:#fff;border-radius:30px;box-shadow:0 20px 50px rgba(20,40,70,.16);padding:44px 36px;text-align:center"><div style="width:84px;height:84px;margin:0 auto 16px;border-radius:24px;background:linear-gradient(120deg,#1F3A5F,#8A1538);display:flex;align-items:center;justify-content:center">' + iconSvg('file', 44, '#fff', 2) + '</div>' +
      '<div style="font-family:IBM Plex Sans Arabic;font-weight:700;color:' + C + ';font-size:16px">دليل المدرب</div><h1 style="font-size:32px;font-weight:800;margin-top:6px">' + h(T) + '</h1><p style="margin-top:14px;color:#4A5470;font-size:16px">يومان تدريبيان · <span class="num">4</span> ساعات يوميًا · <span class="num">' + axes.length + '</span> محورًا</p><p style="color:#4A5470;font-size:14px">الأهداف · المنهجية · الجدول الزمني · ملاحظات كل شريحة · مفتاح التقييم</p><div class="num" style="margin-top:14px;font-size:12px;color:#7D879C">' + fmtDate(Date.now()) + '</div></div>');
    // الأهداف والمنهجية والفئة المستهدفة
    page('نظرة عامة على البرنامج', box('أهداف التعلم', PP.numbered(g.objectives.map(h), C)) + box('المنهجية', PP.numbered(g.methodology.map(h), '#1F3A5F')) +
      box('الفئة المستهدفة', '<ul style="margin:0">' + ['أصحاب المشاريع الصغيرة والمتوسطة ورواد الأعمال الراغبون في التوسع في البيع عبر الإنترنت', 'مؤسسو المشاريع القائمة على المنتجات أو الخدمات', 'رواد الأعمال المستعدون لإطلاق متاجرهم الرقمية', 'فرق التحول الرقمي والتسويق والعمليات'].map(x => '<li>' + x + '</li>').join('') + '</ul>') +
      box('التقييم والشهادة', '<ul style="margin:0"><li>تقييم قبلي وبعدي من <span class="num">' + Content.assess().items.length + '</span> أسئلة اختيار من متعدد تطبيقية، بترتيب مختلف لكل متدرب.</li><li>شهادة مشاركة لمن يحضر <span class="num">' + Attend.cfg().threshold + '%</span> على الأقل من مدة البرنامج (تسجيل حضور برمز يومي).</li><li>تقييم البرنامج بعد التدريب بالنجوم ومؤشر صافي التوصية، وتقرير ختام آلي من لوحة الإدارة.</li></ul>'));
    // جدولا اليومين
    g.days.forEach((d, i) => { if (!d.length) return; page('جدول اليوم ' + (i + 1), tbl(['الوقت', 'الدقائق', 'الفقرة', 'ملاحظات التنفيذ'], d.map(x => ['<span class="num">' + h(x.t) + '</span>', '<span class="num">' + x.min + '</span>', h(x.act), h(x.note)]), ['60px', '56px', '', '34%']) + '<div style="margin-top:8px;font-family:IBM Plex Sans Arabic;font-size:12px;color:#7D879C">المجموع: <span class="num">' + d.reduce((a, b) => a + (+b.min || 0), 0) + '</span> دقيقة</div>'); });
    // المحاور
    axes.forEach(a => {
      const exs = Content.exercisesOf(a.id);
      page(a.title, (a.outcome ? '<div style="background:#EEF7F2;border-right:4px solid #138A5E;border-radius:10px;padding:8px 12px;margin-bottom:10px;font-size:13px"><b>🎯 مخرج التعلم: </b>' + h(a.outcome) + '</div>' : '') +
        tbl(['#', 'الشريحة', 'ملاحظات المدرب'], a.slides.map((sl, k) => ['<span class="num">' + (k + 1) + '</span>', '<b>' + h(sl.title) + '</b><div style="font-size:11px;color:#7D879C">' + h(SLIDE_TYPES[sl.type] || '') + '</div>', h(sl.note || '—')]), ['26px', '36%', '']) +
        (exs.length ? '<div style="margin-top:10px;font-family:Cairo;font-weight:800;color:' + C + '">التمارين</div>' + tbl(['التمرين', 'النموذج', 'النوع'], exs.map(e => [h((e.icon || '') + ' ' + e.title), h(FORMATS[e.format] || '') + (e.format === 'sim' ? ' — ' + h(SIM_TYPES[e.sim] || '') : ''), e.mode === 'group' ? 'جماعي' : 'فردي'])) : ''),
        (Content.unitKicker(a.unit) ? Content.unitKicker(a.unit) + ' — ' + Content.unitName(a.unit) : '') + (a.duration ? ' · ' + a.duration : ''));
    });
    // الملاحق: مفتاح التقييم، المختبر، التقييم
    const A = Content.assess();
    page('ملحق: مفتاح إجابات التقييم القبلي والبعدي', '<div style="font-size:12px;color:#A12A2E;margin-bottom:8px">سري — للمدرب فقط. ترتيب الأسئلة والخيارات يختلف على أجهزة المتدربين.</div>' + tbl(['#', 'السؤال', 'الإجابة الصحيحة'], A.items.map((it, i) => ['<span class="num">' + (i + 1) + '</span>', h(it.q), '<b style="color:#138A5E">' + h(it.options[it.answer] || '') + '</b>']), ['26px', '', '34%']));
    const L = Content.lab(); const sv = Content.survey({ all: true });
    page('ملحق: المختبر الختامي وتقييم البرنامج', box(h(L.title) + ' · <span class="num">' + L.stages.length + '</span> مراحل × <span class="num">' + L.minutes + '</span> دقائق', '<div class="j" style="font-size:12.5px">' + h(stripHtml(L.intro)) + '</div>' + PP.numbered(L.stages.map(x => '<b>' + h(x.icon + ' ' + x.title) + ':</b> ' + h(x.task)), C)) +
      (sv ? box('بنود تقييم البرنامج', '<ul style="margin:0">' + sv.rates.map(r => '<li>' + h(r) + ' (1–5 نجوم)</li>').join('') + (sv.nps ? '<li>' + h(sv.nps) + ' (0–10)</li>' : '') + '<li>' + h(stripHtml(sv.task)) + '</li></ul>') : ''));
    const doc = await PDFE.build(pages, A4P, (i, n) => pm.set(i, n));
    doc.save('دليل المدرب - ' + safeName(T) + '.pdf'); pm.close();
  } catch (e) { pm.close(); UI.alert('تعذر إنشاء الدليل: ' + h(e.message || e)); }
}

// ---------- المسجّلون CSV (كل حقول التسجيل + الموافقات + الحضور) ----------
function exportUsersCsv() {
  const users = Store.users || {}; const fs = RegFields.all();
  const rows = [['رقم العضوية'].concat(fs.map(f => f.label)).concat(['تاريخ التسجيل', 'موافقة الخصوصية', 'موافقة المتابعة', 'نسبة الحضور', 'التقييم القبلي', 'التقييم البعدي', 'نسبة الإنجاز'])];
  const n = Content.assess().items.length;
  Object.keys(users).sort((a, b) => (users[a].member || 0) - (users[b].member || 0)).forEach(u => { const x = users[u]; const pre = Assess.rec('pre', u), post = Assess.rec('post', u);
    rows.push([pad4(x.member || 0)].concat(fs.map(f => RegFields.val(x, f.key))).concat([x.ts ? fmtTime(x.ts) : '', x.consent && x.consent.privacy ? 'نعم' : '—', x.consent && x.consent.followup ? 'نعم' : 'لا', Attend.pct(u) + '%', pre && pre.done ? Assess.score(pre.answers) + '/' + n : '', post && post.done ? Assess.score(post.answers) + '/' + n : '', Math.round(Progress.forUser(u).pct * 100) + '%'])); });
  downloadBlob(csvBlob(rows), 'المسجلون.csv');
}

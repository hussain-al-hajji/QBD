// ---------------------------------------------------------------------
// تقرير ختام البرنامج بمستوى مؤسسي (عربي / إنجليزي) + بيانات لوحة المشرف ومقارنة الدفعات
// كل الأرقام تُحسب مرة واحدة في reportData() من البيانات الحالية أو من لقطة دفعة مؤرشفة.
// ---------------------------------------------------------------------
const A4P = { w: 794, h: 1123, mmW: 210, mmH: 297, format: 'a4', orientation: 'portrait' };
const SNAP_KEYS = { users: 'users', posts: 'posts', assess: 'assess', attendance: 'attendance', labAnswers: 'lab', leads: 'leads', followups: 'followups' };
// حساب المؤشرات على لقطة بيانات (دفعة مؤرشفة) بتبديل مؤقت لحالة Store ثم استعادتها
function withSnapshot(snap, fn) {
  if (!snap) return fn();
  const saved = {}; Object.keys(SNAP_KEYS).forEach(k => { saved[k] = Store[k]; });
  try { Store.users = snap.users || {}; Store.posts = snap.posts || {}; Store.assess = snap.assess || {}; Store.attendance = snap.attendance || {}; Store.labAnswers = (snap.lab && snap.lab.answers) || {}; Store.leads = snap.leads || {}; Store.followups = snap.followups || {}; return fn(); }
  finally { Object.keys(saved).forEach(k => { Store[k] = saved[k]; }); }
}
function distOf(uids, key) { const c = {}; uids.forEach(u => { const v = RegFields.val(Store.users[u], key); if (v) c[v] = (c[v] || 0) + 1; }); return c; }
function reportData(snap) {
  return withSnapshot(snap, () => {
    const users = Store.users || {}; const uids = Object.keys(users); const A = Content.assess(); const n = A.items.length || 1;
    const pre = Assess.list('pre'), post = Assess.list('post'); const preM = {}; pre.forEach(x => { preM[x.uid] = x; });
    const paired = post.filter(x => preM[x.uid]); const gain = paired.length ? paired.reduce((s, x) => s + (x.score - preM[x.uid].score), 0) / paired.length / n * 100 : null;
    const axes = Content.eligibleAxes().map(a => { const exs = Content.exercisesOf(a.id); let posts = 0; const people = new Set(); exs.forEach(e => { const ps = Store.posts[e.id] || {}; Object.keys(ps).forEach(k => { const p = ps[k]; if (!p) return; posts++; if (e.mode === 'group') Object.keys(p.members || {}).forEach(m => people.add(m)); else people.add(k); }); }); return { a, exs: exs.length, posts, people: people.size, rate: uids.length ? people.size / uids.length : 0 }; });
    const sv = Content.survey({ all: true }); const survey = SurveyStats.of(sv ? Store.posts[sv.id] : {}, sv);
    const cfg = Attend.cfg(); const attAvg = uids.length ? Math.round(uids.reduce((s, u) => s + Attend.pct(u), 0) / uids.length) : 0;
    const perDay = Attend.days().map(d => uids.filter(u => Attend.hoursOf(u, d) > 0).length);
    const leads = Leads.list(); const byProg = Leads.byProgram(leads);
    const budget = (() => { const e = Content.allExercises().map(x => x.e).find(e => e && e.sim === 'budget'); if (!e) return []; const ps = Store.posts[e.id] || {}; return Object.keys(ps).filter(k => ps[k] && ps[k].state).map(k => ({ g: +k.slice(1), r: BudgetSim.calc(ps[k].state) })).sort((a, b) => b.r.score - a.r.score); })();
    const fu = {}; ['30', '60', '90'].forEach(k => { fu[k] = Object.keys((Store.followups || {})['d' + k] || {}).length; });
    const d = { cohort: Cohort.cur(), uids, n: A.items.length, A, pre, post, paired, gain, preAvg: Assess.avg('pre'), postAvg: Assess.avg('post'), pq: Assess.perQuestion('pre'), qq: Assess.perQuestion('post'), axes, survey, attAvg, perDay, cfg,
      certs: Attend.holders().length, achievers: Progress.achievers().length, labGroups: Object.keys(Store.labAnswers || {}).length, leads, byProg, budget, fu,
      sector: distOf(uids, 'sector'), stage: distOf(uids, 'stage'), hasStore: distOf(uids, 'hasStore'), onlineSales: distOf(uids, 'onlineSales') };
    d.recs = recommendations(d); return d;
  });
}
// توصيات آلية مبنية على القواعد (عربي + إنجليزي)
function recommendations(d) {
  const R = []; const add = (ar, en) => R.push({ ar, en });
  if (d.qq.some(x => x != null)) {
    const weak = d.qq.map((v, i) => ({ v, i })).filter(x => x.v != null).sort((a, b) => a.v - b.v).slice(0, 2).filter(x => x.v < 70);
    weak.forEach(x => { const ax = Content.axis(ASSESS_AXIS[x.i]); add('تعزيز محور «' + (ax ? ax.title : '') + '»: نسبة الإجابة الصحيحة على السؤال ' + (x.i + 1) + ' في التقييم البعدي ' + x.v + '% فقط؛ يُقترح زيادة وقت التطبيق العملي عليه في الدفعات القادمة.', 'Strengthen "' + (EN.axes[ASSESS_AXIS[x.i]] || '') + '": only ' + x.v + '% answered post-test Q' + (x.i + 1) + ' correctly; add more hands-on practice in future cohorts.'); });
  }
  if (d.survey.avgs.some(x => x != null)) { const lo = d.survey.avgs.map((v, i) => ({ v, i })).filter(x => x.v != null).sort((a, b) => a.v - b.v)[0]; if (lo && lo.v < 4.3) add('أقل بنود الرضا تقييمًا: «' + d.survey.rates[lo.i] + '» (' + lo.v.toFixed(1) + ' من 5)؛ يُوصى بمراجعته.', 'Lowest-rated satisfaction item: "' + (EN.rates[lo.i] || d.survey.rates[lo.i]) + '" (' + lo.v.toFixed(1) + '/5); review for the next cohort.'); }
  const lowAx = d.axes.filter(x => x.exs).sort((a, b) => a.rate - b.rate)[0]; if (lowAx && d.uids.length && lowAx.rate < 0.5) add('أقل المحاور مشاركة: «' + lowAx.a.title + '» (' + Math.round(lowAx.rate * 100) + '% من المسجلين)؛ يُقترح تخصيص وقت داخل الجلسة لتمارينه.', 'Lowest engagement: "' + (EN.axes[lowAx.a.id] || lowAx.a.title) + '" (' + Math.round(lowAx.rate * 100) + '% of participants); allocate in-session time to its exercises.');
  const below = d.uids.filter(u => !Attend.eligible(u)).length; if (d.uids.length && below) add(below + ' مشاركًا لم يبلغوا نسبة الحضور المطلوبة للشهادة (' + d.cfg.threshold + '%)؛ يُقترح تذكير مسبق بالمواعيد وتسجيل الحضور في بداية كل جلسة.', below + ' participant(s) did not reach the ' + d.cfg.threshold + '% attendance required for certification; send reminders and take attendance at the start of each session.');
  if (d.survey.nps != null) add(d.survey.nps >= 50 ? 'مؤشر صافي التوصية ممتاز (' + d.survey.nps + ')؛ يمكن الاستفادة من المشاركين كسفراء للدفعات القادمة.' : 'مؤشر صافي التوصية ' + d.survey.nps + '؛ يُوصى بمراجعة آراء المشاركين النصية لتحديد أولويات التحسين.', d.survey.nps >= 50 ? 'Excellent Net Promoter Score (' + d.survey.nps + '); participants can act as ambassadors for future cohorts.' : 'NPS of ' + d.survey.nps + '; review qualitative feedback to prioritise improvements.');
  if (d.leads.length) { const top = Object.keys(d.byProg).sort((a, b) => d.byProg[b] - d.byProg[a])[0]; add(d.leads.length + ' مشروعًا أبدى اهتمامًا ببرامج البنك، وأكثرها طلبًا: «' + top + '»؛ يُوصى بتواصل الفريق المختص خلال أسبوعين من انتهاء البرنامج.', d.leads.length + ' businesses expressed interest in QDB programmes (most requested: "' + (EN.programs[DEFAULT_LEADS.programs.indexOf(top)] || top) + '"); recommend follow-up by the relevant QDB team within two weeks.'); }
  const topSector = Object.keys(d.sector).sort((a, b) => d.sector[b] - d.sector[a])[0]; if (topSector) add('القطاع الأكثر تمثيلًا: «' + topSector + '»؛ يُقترح إضافة أمثلة ودراسات حالة من هذا القطاع في الدفعات القادمة.', 'Most represented sector: "' + enOpt(topSector) + '"; add sector-specific cases in future cohorts.');
  if (d.gain != null && d.gain > 0) add('تحسّن متوسط المعرفة بمقدار ' + Math.round(d.gain) + ' نقطة مئوية بين التقييمين القبلي والبعدي؛ يُوصى بقياس التطبيق الفعلي عبر متابعات 30 و60 و90 يومًا.', 'Average knowledge improved by ' + Math.round(d.gain) + ' percentage points (pre vs post); measure real-world application through the 30/60/90-day follow-ups.');
  return R;
}
// ---------- مخطط أعمدة HTML لصفحات PDF ----------
function pdfBars(items, o = {}) {
  const max = o.max || Math.max(1, ...items.map(x => +x.v || 0)); const C = o.color || '#8A1538';
  return '<div style="display:flex;flex-direction:column;gap:7px">' + items.map(x => '<div style="display:grid;grid-template-columns:' + (o.lw || '38%') + ' 1fr 56px;gap:8px;align-items:center;font-size:12px"><span>' + h(x.l) + '</span><div style="height:13px;background:#F1E7EA;border-radius:7px;overflow:hidden"><div style="height:100%;width:' + Math.max(0, Math.min(100, (+x.v || 0) / max * 100)) + '%;background:' + (x.c || C) + ';border-radius:7px"></div></div><b class="num" style="font-size:12px">' + (x.t != null ? h(x.t) : (x.v == null ? '—' : x.v)) + '</b></div>').join('') + '</div>';
}
function logoHtml(size) {
  const lg = (Store.site || {}).brandLogo;
  if (lg) return '<img src="' + lg + '" style="max-height:' + size + 'px;max-width:' + (size * 4) + 'px;object-fit:contain">';
  return '<div style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.2"><span style="font-family:Cairo;font-weight:800;font-size:' + Math.round(size * .42) + 'px;color:#8A1538">بنك قطر للتنمية</span><span style="font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;font-size:' + Math.round(size * .26) + 'px;color:#1F3A5F">QATAR DEVELOPMENT BANK</span></div>';
}
async function buildReportPdf(lang = 'ar', snap, cohortName) {
  const pm = progressModal(lang === 'en' ? '📑 Closing report' : '📑 تقرير ختام البرنامج');
  try {
    const d = reportData(snap); const E = lang === 'en'; const C = '#8A1538'; const dir = E ? 'ltr' : 'rtl'; const al = E ? 'left' : 'right';
    const T = E ? EN.course : Content.courseTitle(); const coh = cohortName || d.cohort.name; const pct = v => v == null ? '—' : Math.round(v) + '%';
    const L = (ar, en) => E ? en : ar; const pages = [];
    const head = t => '<div style="position:absolute;top:0;left:0;right:0;height:92px;background:linear-gradient(120deg,#8A1538,#1F3A5F)"></div><div style="position:absolute;top:20px;left:34px;right:34px;display:flex;justify-content:space-between;align-items:center;color:#fff;direction:' + dir + '"><div><div style="font-family:IBM Plex Sans Arabic,Arial;font-size:12px;opacity:.85">' + h(T) + ' · ' + h(coh) + '</div><div style="font-family:Cairo,Arial;font-weight:800;font-size:21px">' + h(t) + '</div></div><div style="background:#fff;border-radius:12px;padding:6px 10px">' + logoHtml(40) + '</div></div>';
    const page = (t, body) => pages.push('<div style="position:absolute;inset:0;background:#FBF8F7"></div>' + head(t) + '<div class="fit" style="top:112px;bottom:50px;right:34px;left:34px;direction:' + dir + ';text-align:' + al + ';line-height:1.75">' + body + '</div>' + '<div class="foot" style="direction:' + dir + '"><span>' + h(T) + ' — ' + L('تقرير ختام البرنامج', 'Programme closing report') + '</span><span class="num">' + (pages.length + 1) + '</span></div>');
    const card = (lbl, v, sub) => '<div style="flex:1 1 30%;min-width:190px;background:#fff;border:1px solid #EADDE1;border-radius:16px;padding:12px 14px"><div style="font-size:12px;color:#7D879C">' + lbl + '</div><div class="num" style="font-family:Cairo,Arial;font-weight:800;font-size:28px;color:' + C + '">' + v + '</div>' + (sub ? '<div style="font-size:11px;color:#7D879C">' + sub + '</div>' : '') + '</div>';
    const box = (t, inner) => '<div style="background:#fff;border:1px solid #EADDE1;border-radius:14px;padding:12px 14px;margin-bottom:12px"><div style="font-family:Cairo,Arial;font-weight:800;color:' + C + ';margin-bottom:6px">' + t + '</div>' + inner + '</div>';
    const distBars = (obj, key) => { const ks = Object.keys(obj).sort((a, b) => obj[b] - obj[a]); return ks.length ? pdfBars(ks.map(k => ({ l: E ? enOpt(k) : k, v: obj[k] })), { color: '#1F3A5F' }) : '<div style="color:#7D879C;font-size:12px">' + L('لا توجد بيانات', 'No data') + '</div>'; };
    // 1) الغلاف
    pages.push(PP.multiBg() + '<div style="position:absolute;left:70px;right:70px;top:200px;background:#fff;border-radius:30px;box-shadow:0 20px 50px rgba(20,40,70,.16);padding:44px 36px;text-align:center;direction:' + dir + '"><div style="margin-bottom:22px">' + logoHtml(70) + '</div>' +
      '<div style="font-family:IBM Plex Sans Arabic,Arial;font-weight:700;color:' + C + ';font-size:15px">' + L('تقرير ختام البرنامج', 'Programme Closing Report') + '</div><h1 style="font-size:30px;font-weight:800;margin-top:8px;font-family:Cairo,Arial">' + h(T) + '</h1>' +
      '<p style="margin-top:12px;color:#4A5470;font-size:15px">' + h(coh) + (d.cohort.start ? ' · <span class="num">' + h(d.cohort.start) + (d.cohort.end ? ' — ' + h(d.cohort.end) : '') + '</span>' : '') + '</p>' +
      '<p style="color:#4A5470;font-size:13.5px">' + L('إدارة تنمية ريادة الأعمال · برنامج تدريبي تفاعلي (يومان × 4 ساعات)', 'Entrepreneurship Development · Interactive training programme (2 days × 4 hours)') + '</p><div class="num" style="margin-top:16px;font-size:12px;color:#7D879C">' + L('تاريخ الإصدار', 'Issued') + ': ' + fmtDate(Date.now()) + '</div></div>');
    // 2) الملخص التنفيذي
    const summ = E ? [d.uids.length + ' participants registered; average attendance ' + d.attAvg + '% and ' + d.certs + ' qualified for the participation certificate (≥ ' + d.cfg.threshold + '% attendance).',
      d.preAvg != null || d.postAvg != null ? 'Knowledge assessment: pre-test average ' + pct(d.preAvg) + ' vs post-test ' + pct(d.postAvg) + (d.gain != null ? ' — an average gain of ' + Math.round(d.gain) + ' points for participants who completed both.' : '.') : 'Knowledge assessment results are not yet available.',
      d.survey.n ? 'Satisfaction: ' + (d.survey.overall ? d.survey.overall.toFixed(1) : '—') + '/5 across ' + d.survey.n + ' evaluations; Net Promoter Score ' + (d.survey.nps == null ? '—' : d.survey.nps) + '.' : 'Post-training evaluation responses are pending.',
      d.leads.length + ' businesses requested follow-up on QDB programmes; ' + d.labGroups + ' groups completed the capstone lab.']
      : [d.uids.length + ' مشاركًا مسجّلًا، بمتوسط حضور ' + d.attAvg + '%، واستحق ' + d.certs + ' منهم شهادة المشاركة (حضور ≥ ' + d.cfg.threshold + '%).',
      d.preAvg != null || d.postAvg != null ? 'التقييم المعرفي: متوسط القبلي ' + pct(d.preAvg) + ' مقابل البعدي ' + pct(d.postAvg) + (d.gain != null ? '، بتحسن متوسط ' + Math.round(d.gain) + ' نقطة مئوية لمن أجاب التقييمين.' : '.') : 'نتائج التقييم المعرفي غير متاحة بعد.',
      d.survey.n ? 'الرضا العام ' + (d.survey.overall ? d.survey.overall.toFixed(1) : '—') + ' من 5 من ' + d.survey.n + ' تقييمًا، ومؤشر صافي التوصية ' + (d.survey.nps == null ? '—' : d.survey.nps) + '.' : 'تقييمات ما بعد التدريب لم تكتمل بعد.',
      d.leads.length + ' مشروعًا طلب التواصل بخصوص برامج البنك، وأنجزت ' + d.labGroups + ' مجموعات المختبر الختامي.'];
    page(L('الملخص التنفيذي', 'Executive summary'), '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px">' + card(L('المسجّلون', 'Participants'), d.uids.length) + card(L('متوسط الحضور', 'Avg. attendance'), d.attAvg + '%') + card(L('مستحقو الشهادة', 'Certified'), d.certs, '≥ ' + d.cfg.threshold + '%') + card(L('التقييم القبلي', 'Pre-test avg.'), pct(d.preAvg), d.pre.length + ' ' + L('مشارك', 'resp.')) + card(L('التقييم البعدي', 'Post-test avg.'), pct(d.postAvg), d.post.length + ' ' + L('مشارك', 'resp.')) + card(L('متوسط التحسن', 'Avg. gain (pts)'), d.gain == null ? '—' : (d.gain >= 0 ? '+' : '') + Math.round(d.gain)) + card(L('الرضا العام', 'Satisfaction'), d.survey.overall ? d.survey.overall.toFixed(1) + '/5' : '—') + card('NPS', d.survey.nps == null ? '—' : d.survey.nps) + card(L('مهتمون ببرامج البنك', 'QDB leads'), d.leads.length) + '</div>' +
      box(L('أبرز النتائج', 'Key findings'), PP.numbered(summ.map(h), C)) + box(L('التوصيات', 'Recommendations'), d.recs.length ? PP.numbered(d.recs.map(r => h(E ? r.en : r.ar)), '#138A5E') : L('لا توجد بيانات كافية بعد لتوليد توصيات.', 'Not enough data yet to generate recommendations.')));
    // 3) ملف المشاركين والحضور
    page(L('ملف المشاركين', 'Participant profile'), box(E ? EN.fields.sector : 'قطاع المشروع', distBars(d.sector)) + box(E ? EN.fields.stage : 'مرحلة المشروع', distBars(d.stage)));
    page(L('الجاهزية الرقمية والحضور', 'Digital readiness & attendance'), box(E ? EN.fields.hasStore : 'قناة البيع الإلكترونية', distBars(d.hasStore)) + box(E ? EN.fields.onlineSales : 'نسبة المبيعات الإلكترونية', distBars(d.onlineSales)) +
      box(L('الحضور حسب اليوم', 'Attendance by day'), pdfBars(d.perDay.map((v, i) => ({ l: L('اليوم ', 'Day ') + (i + 1), v, t: v + ' / ' + d.uids.length })), { max: Math.max(1, d.uids.length), color: '#0E7C7B' })));
    // 4) نتائج التقييم
    const qRows = d.A.items.map((it, i) => ({ i, l: (i + 1) + '. ' + (E ? (EN.assess[i] || 'Q' + (i + 1)) : clip(it.q, 70)) }));
    page(L('نتائج التعلم: التقييم القبلي والبعدي', 'Learning outcomes: pre vs post assessment'), box(L('المتوسط العام', 'Overall average'), pdfBars([{ l: L('قبلي', 'Pre-test'), v: d.preAvg == null ? 0 : Math.round(d.preAvg), t: pct(d.preAvg), c: '#C98A9C' }, { l: L('بعدي', 'Post-test'), v: d.postAvg == null ? 0 : Math.round(d.postAvg), t: pct(d.postAvg) }], { max: 100, lw: '22%' })) +
      box(L('نسبة الإجابة الصحيحة لكل سؤال (قبلي ثم بعدي)', 'Correct answers per question (pre, then post)'), qRows.slice(0, 5).map(r => '<div style="margin-bottom:8px"><div style="font-size:12px;font-weight:700;margin-bottom:3px">' + h(r.l) + '</div>' + pdfBars([{ l: L('قبلي', 'Pre'), v: d.pq[r.i] || 0, t: pct(d.pq[r.i]), c: '#C98A9C' }, { l: L('بعدي', 'Post'), v: d.qq[r.i] || 0, t: pct(d.qq[r.i]) }], { max: 100, lw: '14%' }) + '</div>').join('')));
    if (qRows.length > 5) page(L('نتائج التعلم (تابع)', 'Learning outcomes (continued)'), box(L('نسبة الإجابة الصحيحة لكل سؤال (قبلي ثم بعدي)', 'Correct answers per question (pre, then post)'), qRows.slice(5).map(r => '<div style="margin-bottom:8px"><div style="font-size:12px;font-weight:700;margin-bottom:3px">' + h(r.l) + '</div>' + pdfBars([{ l: L('قبلي', 'Pre'), v: d.pq[r.i] || 0, t: pct(d.pq[r.i]), c: '#C98A9C' }, { l: L('بعدي', 'Post'), v: d.qq[r.i] || 0, t: pct(d.qq[r.i]) }], { max: 100, lw: '14%' }) + '</div>').join('')));
    // 5) المشاركة في المحاور والمحاكاة
    page(L('التفاعل والمشاركة', 'Engagement'), box(L('نسبة المشاركين في تمارين كل محور', 'Share of participants engaging with each module'), pdfBars(d.axes.map(x => ({ l: E ? (EN.axes[x.a.id] || x.a.title) : x.a.title, v: Math.round(x.rate * 100), t: Math.round(x.rate * 100) + '%' })), { max: 100, color: '#1F3A5F', lw: '46%' })) +
      box(L('مؤشرات إضافية', 'Other indicators'), '<div style="display:flex;flex-wrap:wrap;gap:8px">' + card(L('إجمالي المشاركات', 'Total submissions'), d.axes.reduce((s, x) => s + x.posts, 0)) + card(L('أنجزوا 80% من التمارين', 'Completed ≥ 80%'), d.achievers) + card(L('مجموعات المختبر', 'Lab groups'), d.labGroups) + '</div>') +
      (d.budget.length ? box(L('لعبة ميزانية التسويق: ترتيب المجموعات', 'Marketing budget simulation: group ranking'), pdfBars(d.budget.map(x => ({ l: Groups.label(x.g), v: Math.max(0, Math.round(x.r.score)), t: QAR(x.r.score) + ' · ROAS ' + x.r.roas.toFixed(1) })), { color: '#D07A32' })) : ''));
    // 6) الرضا
    const sv = d.survey;
    page(L('تقييم المشاركين للبرنامج', 'Participant satisfaction'), box(L('متوسط كل بند (من 5)', 'Average rating per item (out of 5)'), sv.rates.length ? pdfBars(sv.rates.map((r, i) => ({ l: E ? (EN.rates[i] || r) : r, v: sv.avgs[i] || 0, t: sv.avgs[i] ? sv.avgs[i].toFixed(2) : '—' })), { max: 5, color: '#E0A526', lw: '46%' }) : '—') +
      box(L('مؤشر صافي التوصية', 'Net Promoter Score'), '<div style="display:flex;gap:10px;flex-wrap:wrap">' + card('NPS', sv.nps == null ? '—' : sv.nps) + card(L('مروّجون (9–10)', 'Promoters (9–10)'), sv.prom) + card(L('محايدون (7–8)', 'Passives (7–8)'), sv.pass) + card(L('منتقدون (0–6)', 'Detractors (0–6)'), sv.det) + '</div>') +
      box(L('من آراء المشاركين', 'Selected participant comments') + (E ? ' <span style="font-weight:400;font-size:11px;color:#7D879C">(quoted in original language)</span>' : ''), sv.texts.length ? sv.texts.slice(0, 8).map(p => '<div style="border-' + (E ? 'left' : 'right') + ':3px solid ' + C + ';padding:4px 10px;margin-bottom:6px;font-size:12.5px;direction:rtl;text-align:right">«' + h(clip(p.text, 220)) + '» — ' + h(p.name || '') + '</div>').join('') : L('لا توجد آراء بعد.', 'No comments yet.')));
    // 7) الاهتمام ببرامج البنك والمتابعة
    page(L('الربط ببرامج بنك قطر للتنمية وقياس الأثر', 'Link to QDB programmes & impact follow-up'), box(L('الاهتمام حسب البرنامج', 'Interest by programme'), Object.keys(d.byProg).length ? pdfBars(Object.keys(d.byProg).sort((a, b) => d.byProg[b] - d.byProg[a]).map(p => ({ l: E ? (EN.programs[DEFAULT_LEADS.programs.indexOf(p)] || p) : p, v: d.byProg[p] })), { color: '#138A5E', lw: '50%' }) : L('لا توجد طلبات اهتمام بعد.', 'No interest requests yet.')) +
      (d.leads.length ? box(L('المشاريع المهتمة', 'Interested businesses'), '<table style="width:100%;border-collapse:collapse;font-size:11.5px"><tr style="background:' + C + ';color:#fff"><th style="padding:6px;text-align:' + al + '">' + L('الاسم', 'Name') + '</th><th style="text-align:' + al + '">' + L('المشروع', 'Business') + '</th><th style="text-align:' + al + '">' + L('البرامج', 'Programmes') + '</th></tr>' + d.leads.slice(0, 18).map((l, i) => { const u = Store.users[l.uid] || {}; return '<tr style="background:' + (i % 2 ? '#fff' : '#F8EEF1') + '"><td style="padding:5px 6px">' + h(l.name || u.name || '') + '</td><td>' + h(l.org || RegFields.val(u, 'org') || '') + '</td><td>' + h(l.programs.map(p => E ? (EN.programs[DEFAULT_LEADS.programs.indexOf(p)] || p) : p).join(' · ')) + '</td></tr>'; }).join('') + '</table>' + (d.leads.length > 18 ? '<div style="font-size:11px;color:#7D879C">+' + (d.leads.length - 18) + ' ' + L('آخرون (القائمة كاملة في ملف CSV)', 'more (full list in CSV)') + '</div>' : '')) : '') +
      box(L('متابعة الأثر بعد البرنامج', 'Post-programme impact follow-up'), pdfBars(['30', '60', '90'].map(k => ({ l: L('بعد ' + k + ' يومًا', 'Day ' + k), v: d.fu[k], t: d.fu[k] + ' / ' + d.uids.length })), { max: Math.max(1, d.uids.length), color: '#5B3A8A', lw: '24%' })));
    const doc = await PDFE.build(pages, A4P, (i, n) => pm.set(i, n));
    doc.save((E ? 'Closing report - ' : 'تقرير ختام البرنامج - ') + safeName(coh) + ' - ' + fmtDate(Date.now()).replace(/\//g, '-') + '.pdf'); pm.close();
  } catch (e) { pm.close(); UI.alert('تعذر إنشاء التقرير: ' + h(e.message || e)); }
}
function exportReportCsv(snap, cohortName) {
  const d = reportData(snap); const r = v => v == null ? '—' : Math.round(v) + '%';
  const rows = [['البند', 'القيمة'], ['البرنامج', Content.courseTitle()], ['الدفعة', cohortName || d.cohort.name], ['تاريخ التقرير', fmtDate(Date.now())], ['عدد المسجّلين', d.uids.length], ['متوسط نسبة الحضور', d.attAvg + '%'], ['المستحقون لشهادة المشاركة', d.certs], ['المنجزون لـ 80% من التمارين', d.achievers],
    ['متوسط التقييم القبلي', r(d.preAvg)], ['متوسط التقييم البعدي', r(d.postAvg)], ['متوسط التحسن (نقطة مئوية)', d.gain == null ? '—' : Math.round(d.gain)], ['الرضا العام من 5', d.survey.overall ? d.survey.overall.toFixed(2) : '—'], ['مؤشر صافي التوصية', d.survey.nps == null ? '—' : d.survey.nps], ['المهتمون ببرامج البنك', d.leads.length], ['مجموعات المختبر', d.labGroups], [],
    ['السؤال', 'صحيح قبلي', 'صحيح بعدي']];
  d.A.items.forEach((it, i) => rows.push([(i + 1) + '. ' + it.q, r(d.pq[i]), r(d.qq[i])]));
  rows.push([], ['بند الرضا', 'المتوسط من 5']); d.survey.rates.forEach((x, i) => rows.push([x, d.survey.avgs[i] ? d.survey.avgs[i].toFixed(2) : '—']));
  rows.push([], ['المحور', 'التمارين', 'المشاركات', 'المشاركون', 'نسبة المشاركين']); d.axes.forEach(x => rows.push([x.a.title, x.exs, x.posts, x.people, Math.round(x.rate * 100) + '%']));
  rows.push([], ['التوصيات']); d.recs.forEach(x => rows.push([x.ar]));
  rows.push([], ['آراء المشاركين', '']); d.survey.texts.forEach(p => rows.push([p.name || '', p.text || '']));
  downloadBlob(csvBlob(rows), 'تقرير ختام البرنامج - ' + safeName(cohortName || d.cohort.name) + '.csv');
}
function exportLeadsCsv() {
  const rows = [['الاسم', 'المسمى', 'المشروع', 'القطاع', 'المرحلة', 'البرامج', 'الاحتياج', 'وسيلة التواصل', 'بيانات التواصل', 'التاريخ']];
  Leads.list().forEach(l => { const u = Store.users[l.uid] || {}; rows.push([l.name || u.name || '', u.role || '', RegFields.val(u, 'org'), RegFields.val(u, 'sector'), RegFields.val(u, 'stage'), l.programs.join(' | '), l.need || '', l.method || '', l.contact || '', l.ts ? fmtTime(l.ts) : '']); });
  downloadBlob(csvBlob(rows), 'المهتمون ببرامج بنك قطر للتنمية.csv');
}

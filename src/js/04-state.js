// ---------------------------------------------------------------------
// الحالة الحية من قاعدة البيانات + دمج المحتوى (الافتراضي في الكود + التراكب من Firebase)
// المصفوفة الأصلية COURSE لا تُعدَّل أبدًا؛ كل تعديل يُحفظ كتراكب منفصل.
// ---------------------------------------------------------------------
const Store = {
  contentAxes: {}, contentEx: {}, addedAxes: {}, addedEx: {}, visibility: {}, enabled: {}, order: [],
  site: {}, groupCount: DEFAULT_GROUPS, groupsOff: false, groupNames: {}, assign: {}, users: {}, posts: {}, reveal: {}, presence: {}, presenceDenied: false, invite: null, removedAxes: {}, removedEx: {},
  labTimers: {}, labAnswers: {}, broadcast: null, resetStamp: 0, registered: 0, ready: false,
  contentLab: null, contentAssess: null, contentStories: {}, addedStories: {}, storyOrder: [], storyLikes: {}, exOrder: {}, assess: {}, assessCfg: {}, attendance: {}, attCfg: {}
};
const DEFAULT_SITE = {
  headerTitle: 'تسريع التجارة الإلكترونية للمشاريع الصغيرة والمتوسطة',
  headerSub: 'برنامج تدريبي تفاعلي · إدارة تنمية ريادة الأعمال',
  heroTitle: 'تسريع التجارة الإلكترونية للمشاريع الصغيرة والمتوسطة',
  heroDesc: 'برنامج تطبيقي من ست وحدات مترابطة يأخذك من اختيار المنصة المناسبة، إلى الدفع الآمن، والتوصيل داخل قطر وخارجها، والتسويق المبني على البيانات، وأتمتة العمليات، ثم قراءة الأرقام وبناء خطة نمو مدعومة بمنظومة بنك قطر للتنمية — مع شرائح تفاعلية وتمارين حية تشارك فيها من جوالك.',
  heroImage: '',
  footerName: 'حسين الحاجي',
  footerBio: 'مدرب التجارة الإلكترونية والعمل الحر عبر الإنترنت، متخصص في العمل مع رواد الأعمال والمشاريع الصغيرة والمتوسطة',
  footerUrl: 'www.hussain-al-hajji.com',
  linkedin: '', x: '', instagram: '', whatsapp: '', email: ''
};
const DEFAULT_CONGRATS = {
  emoji: '🏆',
  title: 'تهنئة إنجاز',
  paragraphs: ['نبارك لـ {{name}} إنجازه المتميز في برنامج «{{courseTitle}}».', 'لقد أتممت رحلة التعلّم بجدية ومشاركة فاعلة، من اختيار المنصة المناسبة حتى بناء خطة نمو لمتجرك الإلكتروني.', 'نتمنى لك تطبيقًا موفقًا لما تعلمته في عملك القادم.'],
  footerRight: 'التاريخ: {{date}}',
  footerLeft: 'حسين الحاجي — مدرب البرنامج',
  notice: 'تنبيه: ستختفي هذه التهنئة مع الأوسمة بعد ' + CONGRATS_DAYS_DEFAULT + ' أيام من انتهاء البرنامج. حمّلها الآن أو أرسلها إلى بريدك.'
};
const DEFAULT_CERT = {
  emoji: '🎓',
  title: 'شهادة مشاركة',
  paragraphs: ['يُشهد بأن {{name}} قد شارك في البرنامج التدريبي «{{courseTitle}}».', 'وقد استوفى متطلبات الحضور المعتمدة للبرنامج (يومان تدريبيان بواقع 4 ساعات يوميًا)، متمنين له التوفيق في تطبيق ما اكتسبه من معارف ومهارات.'],
  footerRight: 'التاريخ: {{date}}',
  footerLeft: 'مدرب البرنامج: حسين الحاجي',
  notice: 'تُمنح شهادة المشاركة لمن يحضر 90% على الأقل من مدة البرنامج. حمّلها الآن واحتفظ بنسخة منها.'
};
const DEFAULT_PDF = { enabled: true, coverTitle: '', coverSub: 'الملف المرجعي لشرائح البرنامج', trainerName: 'حسين الحاجي', trainerRole: 'مدرب التجارة الإلكترونية والعمل الحر عبر الإنترنت', trainerBio: 'يقدّم برامج تطبيقية في التجارة الإلكترونية والتحول الرقمي للأعمال، ويعمل مع رواد الأعمال والمشاريع الصغيرة والمتوسطة على بناء متاجر إلكترونية قابلة للنمو.', trainerContact: 'www.hussain-al-hajji.com' };

const DEF_AXIS = {}; COURSE.axes.forEach(a => { DEF_AXIS[a.id] = a; });
const DEF_EX = {}; COURSE.axes.forEach(a => a.exercises.forEach(e => { DEF_EX[e.id] = e; })); COURSE.activities.forEach(e => { DEF_EX[e.id] = e; }); DEF_EX[COURSE.survey.id] = COURSE.survey;
const SURVEY_ID = COURSE.survey.id;
const DEF_SLIDE_CHART = {}; COURSE.axes.forEach(a => a.slides.forEach(s => { if (s.chart) DEF_SLIDE_CHART[s.id] = s.chart; }));

const Content = {
  site() { return Object.assign({}, DEFAULT_SITE, Store.site.home || {}); },
  congrats() { const c = Object.assign({}, DEFAULT_CONGRATS, Store.site.congrats || {}); c.paragraphs = arr(c.paragraphs); return c; },
  cert() { const c = Object.assign({}, DEFAULT_CERT, Store.site.cert || {}); c.paragraphs = arr(c.paragraphs); return c; },
  doc(kind) { return kind === 'cert' ? Content.cert() : Content.congrats(); },
  guide() { const g = Object.assign({}, COURSE.guide || { objectives: [], methodology: [], days: [[], []] }, (Store.site && Store.site.guide) || {}); g.objectives = arr(g.objectives); g.methodology = arr(g.methodology); g.days = arr(g.days).map(arr); while (g.days.length < 2) g.days.push([]); return g; },
  unitName(n) { const u = (Store.site.units || {})[n]; return (u && u.name) || UNIT_NAMES[n] || ''; },
  unitKicker(n) { const u = (Store.site.units || {})[n]; return (u && u.kicker) || UNIT_KICKERS[n] || ''; },
  // قصص النجاح: الافتراضي في الكود + تراكب + إضافات + ترتيب + إظهار
  storyIds() {
    const all = COURSE.stories.map(x => x.id).concat(Object.keys(Store.addedStories || {}).sort((x, y) => (Store.addedStories[x].ts || 0) - (Store.addedStories[y].ts || 0)));
    const saved = arr(Store.storyOrder).filter(id => all.indexOf(id) > -1); return saved.concat(all.filter(id => saved.indexOf(id) === -1));
  },
  story(id) {
    const def = COURSE.stories.find(x => x.id === id), added = (Store.addedStories || {})[id]; if (!def && !added) return null;
    const ov = def ? (Store.contentStories || {})[id] : null;
    const st = Object.assign({ numbers: [], lessons: [], sources: [], color: 0, scene: 'idea' }, def || {}, ov || {}, added || {}, { id, _added: !def, _modified: !!ov });
    st.numbers = arr(st.numbers); st.lessons = arr(st.lessons); st.sources = arr(st.sources); st._hidden = Content.isHidden(id); return st;
  },
  stories(o = {}) { return Content.storyIds().map(Content.story).filter(x => x && (o.all || !x._hidden)); },
  lab() {
    const ov = Store.contentLab || {}; const L = Object.assign({}, COURSE.lab, ov);
    L.stages = arr(L.stages).map(x => Object.assign({ icon: '📌', title: '', task: '' }, x));
    L.minutes = Math.max(1, parseInt(L.minutes, 10) || 10); L._modified = !!Store.contentLab; return L;
  },
  assess() {
    const ov = Store.contentAssess || {}; const A = Object.assign({}, COURSE.assessment, ov);
    A.items = arr(A.items).map(it => Object.assign({}, it, { options: arr(it.options) })); A.format = 'mcq'; A.id = 'assess'; A._modified = !!Store.contentAssess; return A;
  },
  // أقسام الصفحة الرئيسية: أقسام مدمجة + أقسام مخصّصة يضيفها الأدمن — بترتيب وإظهار مستقلين
  homeSections(o = {}) {
    const custom = (Store.site && Store.site.sections) || {};
    const all = HOME_BUILTINS.map(b => b.key).concat(Object.keys(custom).sort((x, y) => (custom[x].ts || 0) - (custom[y].ts || 0)));
    const saved = arr(Store.site && Store.site.homeOrder).filter(k => all.indexOf(k) > -1);
    const ids = saved.concat(all.filter(k => saved.indexOf(k) === -1));
    return ids.map(k => {
      const b = HOME_BUILTINS.find(x => x.key === k); const lab = ((Store.site && Store.site.labels) || {})[k] || {};
      const sec = b ? Object.assign({}, b, { builtin: true }, lab) : Object.assign({ type: 'text' }, custom[k], { key: k, builtin: false });
      sec._hidden = Content.isHidden('home_' + k); return sec;
    }).filter(x => o.all || !x._hidden);
  },
  privacy() { return Object.assign({}, DEFAULT_PRIVACY, (Store.site && Store.site.privacy) || {}); },
  pdf() { return Object.assign({}, DEFAULT_PDF, Store.site.pdf || {}); },
  courseTitle() { const el = document.getElementById('brandTitle'); return (el && el.textContent.trim()) || Content.site().headerTitle; },
  isHidden(id) { return Store.visibility && Store.visibility[id] === false; },
  isEnabled(id) { return !(Store.enabled && Store.enabled[id] === false); },
  color(a) { return AXIS_COLORS[((a && a.color) || 0) % AXIS_COLORS.length]; },
  mergeAxis(id) {
    const def = DEF_AXIS[id], added = Store.addedAxes[id];
    if (!def && !added) return null;
    if (def && (Store.removedAxes || {})[id]) return null; // محور أصلي في سلة المحذوفات
    let a;
    if (def) {
      const ov = Store.contentAxes[id];
      a = Object.assign({}, def, ov || {}, { id, _modified: !!ov, _added: false });
      a.exercises = undefined;
    } else {
      a = Object.assign({ unit: 0, color: 0, icon: 'star', slides: [], highlights: [] }, added, { id, _added: true, _modified: false });
    }
    a.highlights = arr(a.highlights);
    a.slides = arr(a.slides).map((s, i) => { const o = Object.assign({}, s); o.points = arr(o.points); o.items = arr(o.items); if (!o.id) o.id = id + 'x' + i; if (DEF_SLIDE_CHART[o.id]) o.chart = DEF_SLIDE_CHART[o.id]; return o; });
    a._hidden = Content.isHidden(id); a._disabled = !Content.isEnabled(id);
    return a;
  },
  axisIds() {
    const all = COURSE.axes.map(a => a.id).concat(Object.keys(Store.addedAxes || {}).sort((x, y) => ((Store.addedAxes[x].ts || 0) - (Store.addedAxes[y].ts || 0))));
    const saved = arr(Store.order).filter(id => all.indexOf(id) > -1);
    return saved.concat(all.filter(id => saved.indexOf(id) === -1)); // أي محور جديد يُلحق بالنهاية تلقائيًا
  },
  axes(o = {}) { return Content.axisIds().map(Content.mergeAxis).filter(a => a && (o.all || !a._hidden)); },
  eligibleAxes() { return Content.axes().filter(a => !a._disabled); },
  axis(id) { return Content.mergeAxis(id); },
  mergeEx(id) {
    const def = DEF_EX[id], added = Store.addedEx[id];
    if (!def && !added) return null;
    if ((Store.removedEx || {})[id]) return null; // تمرين أصلي في سلة المحذوفات
    const ax = Content.axisOfEx(id); if (ax && DEF_AXIS[ax] && (Store.removedAxes || {})[ax]) return null; // تمارين المحور المحذوف تختفي معه
    let e;
    if (def) { const ov = Store.contentEx[id]; e = Object.assign({}, def, ov || {}, { id, _modified: !!ov, _added: false }); }
    else e = Object.assign({ format: 'text', mode: 'individual', steps: [] }, added, { id, _added: true, _modified: false });
    e.steps = arr(e.steps); e.rates = arr(e.rates); e.items = arr(e.items).map(it => Object.assign({}, it, it.options ? { options: arr(it.options) } : {}));
    if (FORMAT_MODE[e.format]) e.mode = FORMAT_MODE[e.format];
    e._mode0 = e.mode; // النوع المخزَّن (للمحرر)؛ عند تعطيل المجموعات يُعامل الجماعي كفردي دون تغيير المخزَّن
    if (e.mode === 'group' && !Groups.on()) e.mode = 'individual';
    e._hidden = Content.isHidden(id);
    return e;
  },
  ex(id) { return Content.mergeEx(id); },
  exIdsOf(axisId) {
    const def = DEF_AXIS[axisId] ? DEF_AXIS[axisId].exercises.map(e => e.id) : [];
    const added = Object.keys(Store.addedEx || {}).filter(k => Store.addedEx[k].axis === axisId).sort((x, y) => (Store.addedEx[x].ts || 0) - (Store.addedEx[y].ts || 0));
    return Content.applyOrder(def.concat(added), axisId);
  },
  applyOrder(ids, key) { const saved = arr((Store.exOrder || {})[key]).filter(id => ids.indexOf(id) > -1); return saved.concat(ids.filter(id => saved.indexOf(id) === -1)); },
  exercisesOf(axisId, o = {}) { return Content.exIdsOf(axisId).map(Content.mergeEx).filter(e => e && (o.all || !e._hidden)); },
  activities(o = {}) {
    const ids = COURSE.activities.map(a => a.id).concat(Object.keys(Store.addedEx || {}).filter(k => Store.addedEx[k].kind === 'activity').sort((x, y) => (Store.addedEx[x].ts || 0) - (Store.addedEx[y].ts || 0)));
    return Content.applyOrder(ids, '_acts').map(Content.mergeEx).filter(e => e && (o.all || !e._hidden));
  },
  survey(o = {}) { const s = Content.mergeEx(SURVEY_ID); return s && (o.all || !s._hidden) ? s : null; },
  axisOfEx(id) { const e = DEF_EX[id]; if (e && e.axis) return e.axis; const a = Store.addedEx[id]; return a && a.axis ? a.axis : null; },
  allExercises() { // كل التمارين في مكان واحد (للتصدير والإشعارات)
    const list = [];
    Content.axes({ all: true }).forEach(a => Content.exercisesOf(a.id, { all: true }).forEach(e => list.push({ e, a, section: a.title })));
    Content.activities({ all: true }).forEach(e => list.push({ e, a: null, section: 'أنشطة' }));
    const sv = Content.survey({ all: true }); if (sv) list.push({ e: sv, a: null, section: 'ختام البرنامج' });
    return list;
  },
  exTitle(id) { const e = Content.ex(id); return e ? e.title : id; }
};

const HOME_BUILTINS = [
  { key: 'stories', icon: '🌟', kicker: 'من الواقع القطري والخليجي', title: '🌟 قصص نجاح ملهمة' },
  { key: 'assess', icon: '📋', kicker: 'قياس المعرفة', title: '📋 التقييم القبلي والبعدي' },
  { key: 'activities', icon: '⚡', kicker: 'قبل أن نبدأ', title: '⚡ أنشطة' },
  { key: 'axes', icon: '🗺️', kicker: 'خارطة البرنامج', title: '🗺️ محاور البرنامج' },
  { key: 'lab', icon: '🧪', kicker: 'مشروع تطبيقي شامل', title: '' },
  { key: 'survey', icon: '🎓', kicker: 'نهاية الرحلة', title: '🎓 ختام البرنامج' },
  { key: 'leaderboard', icon: '🏆', kicker: 'التحفيز', title: '🏆 لوحة الصدارة' },
  { key: 'tools', icon: '🧰', kicker: 'تبقى معك بعد البرنامج', title: '🧰 صندوق أدوات المتجر ومكتبة القوالب' }
];
const SECTION_TYPES = { text: 'نص منسّق', video: 'فيديو', image: 'صورة وإعلان', cta: 'بطاقة رابط / زر' };

// ---------- تقييم البرنامج بعد التدريب (نجوم + مؤشر صافي التوصية) ----------
const SurveyStats = {
  of(posts, e) {
    e = e || Content.survey({ all: true }); const rates = (e && e.rates) || []; const list = Object.keys(posts || {}).filter(k => k !== ADMIN_ID).map(k => posts[k]).filter(Boolean); // تقييم المتدربين فقط
    const avgs = rates.map((_, i) => { const v = list.map(p => +((p.ratings || {})[i])).filter(x => x >= 1 && x <= 5); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; });
    const np = list.map(p => p.nps).filter(x => x !== undefined && x !== null && x !== '').map(Number);
    const prom = np.filter(x => x >= 9).length, det = np.filter(x => x <= 6).length;
    const all = avgs.filter(x => x != null); const overall = all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
    return { n: list.length, rates, avgs, overall, npsN: np.length, prom, pass: np.length - prom - det, det, nps: np.length ? Math.round((prom - det) / np.length * 100) : null, texts: list.filter(p => p.text) };
  }
};

// ---------- التقييم القبلي والبعدي ----------
const Assess = {
  cfg() { return Object.assign({ pre: 'open', post: 'closed', reveal: false }, Store.assessCfg || {}); },
  isOpen(ph) { return Assess.cfg()[ph] === 'open'; },
  rec(ph, uid) { return ((Store.assess || {})[ph] || {})[uid] || null; },
  score(answers) { const A = Content.assess(); const a = ansList(answers, A.items.length); return A.items.reduce((n, it, i) => n + (a[i] != null && +a[i] === +it.answer ? 1 : 0), 0); },
  list(ph) { const o = (Store.assess || {})[ph] || {}; return Object.keys(o).filter(u => u !== ADMIN_ID && o[u] && o[u].done).map(u => Object.assign({ uid: u }, o[u], { score: Assess.score(o[u].answers) })); },
  avg(ph) { const l = Assess.list(ph); const n = Content.assess().items.length || 1; return l.length ? l.reduce((s, x) => s + x.score, 0) / l.length / n * 100 : null; },
  perQuestion(ph) { const A = Content.assess(); const l = Assess.list(ph); return A.items.map((it, i) => { const ans = l.filter(x => { const a = ansList(x.answers, A.items.length); return a[i] != null; }); const ok = ans.filter(x => +ansList(x.answers, A.items.length)[i] === +it.answer).length; return l.length ? Math.round(ok / l.length * 100) : null; }); }
};

// ---------- الحضور وشهادة المشاركة ----------
const Attend = {
  cfg() { const c = Object.assign({ days: ATTEND_DAYS_DEFAULT, hours: ATTEND_HOURS_DEFAULT, threshold: CERT_THRESHOLD_DEFAULT, codes: {} }, Store.attCfg || {}); c.days = Math.max(1, Math.min(10, +c.days || ATTEND_DAYS_DEFAULT)); c.hours = Math.max(1, +c.hours || ATTEND_HOURS_DEFAULT); c.threshold = Math.max(0, Math.min(100, +c.threshold || 0)); c.codes = c.codes || {}; const sec = (Store.secure && Store.secure.attcodes) || {}; c.codes = Object.assign({}, c.codes); Object.keys(sec).forEach(k => { c.codes[k] = Object.assign({}, c.codes[k], { code: (sec[k] || {}).code }); }); return c; },
  // تسجيل الحضور وشهادة المشاركة ميزتان اختياريتان (قد تتولاهما الجهة الراعية)؛ الشهادة تعتمد على الحضور
  // الافتراضي: غير مفعّلتين حتى يفعّلهما المدرب من لوحة الإدارة
  on() { return (Store.attCfg || {}).enabled === true; },
  certOn() { return Attend.on() && (Store.attCfg || {}).cert === true; },
  days() { const out = []; for (let i = 1; i <= Attend.cfg().days; i++) out.push(i); return out; },
  hoursOf(uid, d) { const man = ((Store.attendance || {})[uid] || {})['d' + d]; if (man != null) return Math.max(0, Math.min(Attend.cfg().hours, +man || 0)); return ((Store.checkins || {})['d' + d] || {})[uid] ? Attend.cfg().hours : 0; }, // الساعات اليدوية من المدرب تتقدم على تسجيل الرمز
  pct(uid) { const c = Attend.cfg(); const tot = c.days * c.hours; const got = Attend.days().reduce((s, d) => s + Attend.hoursOf(uid, d), 0); return tot ? Math.round(got / tot * 100) : 0; },
  eligible(uid) { return Attend.pct(uid) >= Attend.cfg().threshold; },
  openDays() { if (!Attend.on()) return []; const c = Attend.cfg(); return Attend.days().filter(d => c.codes['d' + d] && c.codes['d' + d].open); },
  holders() { if (!Attend.certOn()) return []; return Object.keys(Store.users || {}).filter(Attend.eligible).map(u => Object.assign({ uid: u }, Store.users[u])); }
};

// ---------- حقول التسجيل (قابلة للتحكم من لوحة الإدارة) ----------
const REG_DEFAULTS = {
  name: { label: 'الاسم الكامل', type: 'text', required: true, visible: true, locked: true, ph: 'مثال: محمد عبدالله' },
  role: { label: 'المجال / المسمى الوظيفي', type: 'text', required: true, visible: true, ph: 'مثال: صاحب متجر إلكتروني' },
  org: { label: 'اسم المشروع / الشركة', type: 'text', required: false, visible: true, ph: 'مثال: دار المسك للعطور' },
  sector: { label: 'قطاع المشروع', type: 'select', required: false, visible: true, options: ['تجزئة ومنتجات استهلاكية', 'أغذية ومشروبات', 'أزياء وعطور ومستحضرات', 'خدمات وحجوزات', 'تقنية ومنتجات رقمية', 'صناعة وتوريد (B2B)', 'أخرى'] },
  stage: { label: 'مرحلة المشروع', type: 'select', required: false, visible: true, options: ['فكرة لم تنطلق بعد', 'مشروع قائم دون بيع إلكتروني', 'بدأت البيع إلكترونيًا منذ أقل من سنة', 'متجر إلكتروني قائم يسعى للتوسع'] },
  hasStore: { label: 'هل لديك قناة بيع إلكترونية؟', type: 'select', required: false, visible: true, options: ['متجر إلكتروني خاص', 'سوق إلكتروني (مثل Noon أو سنونو)', 'وسائل التواصل وواتساب فقط', 'أكثر من قناة', 'لا يوجد بعد'] },
  onlineSales: { label: 'نسبة المبيعات الإلكترونية من إجمالي المبيعات', type: 'select', required: false, visible: true, options: ['لا توجد مبيعات إلكترونية', 'أقل من 10%', '10% – 30%', '30% – 60%', 'أكثر من 60%'] },
  email: { label: 'البريد الإلكتروني', type: 'email', required: false, visible: true, ph: 'name@example.com' },
  phone: { label: 'رقم الجوال', type: 'tel', required: false, visible: false, ph: '+974' },
  cr: { label: 'رقم السجل التجاري', type: 'text', required: false, visible: false }
};
const REG_TYPES = { text: 'نص قصير', textarea: 'نص طويل', select: 'قائمة اختيار', email: 'بريد إلكتروني', tel: 'رقم هاتف', number: 'رقم' };
const RegFields = {
  all() {
    const cfg = (Store.site && Store.site.regFields) || {}; const fc = cfg.fields || {};
    const keys = Object.keys(REG_DEFAULTS).concat(Object.keys(fc).filter(k => !REG_DEFAULTS[k]));
    const saved = arr(cfg.order).filter(k => keys.indexOf(k) > -1); const order = saved.concat(keys.filter(k => saved.indexOf(k) === -1));
    return order.map(k => { const f = Object.assign({}, REG_DEFAULTS[k] || {}, fc[k] || {}, { key: k, builtin: !!REG_DEFAULTS[k] }); f.options = arr(f.options); if (k === 'name') { f.visible = true; f.required = true; } return f; }).filter(f => !f.deleted);
  },
  visible() { return RegFields.all().filter(f => f.visible); },
  // قيمة الحقل لمستخدم: الاسم والمسمى في الجذر، والبقية في f/
  val(u, k) { if (!u) return ''; if (k === 'name' || k === 'role') return u[k] || ''; return (u.f && u.f[k]) != null ? u.f[k] : (u[k] || ''); },
  input(f, v, prefix) {
    const id = prefix + f.key; const req = f.required ? ' <span class="req">*</span>' : ' <span class="muted">(اختياري)</span>';
    let el;
    if (f.type === 'select') el = '<select id="' + id + '" data-keep="' + id + '" data-rf="' + f.key + '"><option value="">— اختر —</option>' + f.options.map(o => '<option ' + (o === v ? 'selected' : '') + '>' + h(o) + '</option>').join('') + '</select>';
    else if (f.type === 'textarea') el = '<textarea id="' + id + '" data-keep="' + id + '" data-rf="' + f.key + '" rows="2" placeholder="' + h(f.ph || '') + '">' + h(v || '') + '</textarea>';
    else el = '<input id="' + id + '" data-keep="' + id + '" data-rf="' + f.key + '" type="' + (f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text') + '" value="' + h(v || '') + '" placeholder="' + h(f.ph || '') + '"' + (f.key === 'name' ? ' autocomplete="name"' : '') + '>';
    return '<div class="field"><label>' + h(f.label) + req + '</label>' + el + '</div>';
  },
  collect(root, prefix) {
    const out = { f: {} }; let err = '';
    RegFields.visible().forEach(f => { const el = document.getElementById(prefix + f.key); const v = el ? el.value.trim() : ''; if (f.required && !v && !err) err = 'أكمل حقل «' + f.label + '».'; if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !err) err = 'صيغة البريد الإلكتروني غير صحيحة.'; if (f.key === 'name' || f.key === 'role') out[f.key] = v; else out.f[f.key] = v; });
    if (out.name != null && out.name.length < 2 && !err) err = 'اكتب اسمك الكامل.';
    return { data: out, err };
  }
};
const DEFAULT_PRIVACY = {
  text: 'نجمع في هذه المنصة البيانات التي تدخلها عند التسجيل (الاسم والمسمى وبيانات المشروع وما تختاره من حقول اختيارية)، ومشاركاتك في التمارين والتقييمات، وسجل حضورك. نستخدمها فقط لإدارة البرنامج التدريبي، وإصدار شهادة المشاركة، وقياس أثر التدريب وإعداد تقرير الختام للجهة المنظمة. لا نبيع بياناتك ولا نشاركها لأغراض تسويقية لطرف ثالث. تُحفظ البيانات في قاعدة بيانات سحابية (Google Firebase)، ويمكنك تعديل بياناتك أو حذفها بالكامل في أي وقت من صفحة «حسابي». نلتزم بمبادئ قانون حماية خصوصية البيانات الشخصية في دولة قطر (القانون رقم 13 لسنة 2016).',
  consent: 'قرأت إشعار الخصوصية وأوافق على معالجة بياناتي لأغراض البرنامج',
  followup: 'أوافق على التواصل معي بعد البرنامج لقياس الأثر (بعد 30 و60 و90 يومًا) وبخصوص برامج الدعم ذات الصلة'
};

// ---------- المجموعات ----------
const Groups = {
  // وضع المجموعات عام: الأصل مفعّل، وعند تعطيله تصير تمارين المجموعات فردية (لا اختيار مجموعة)
  on() { return !Store.groupsOff; },
  count() { const n = parseInt(Store.groupCount, 10); return isFinite(n) && n >= 2 ? Math.min(30, n) : DEFAULT_GROUPS; },
  list() { const out = []; for (let i = 1; i <= Groups.count(); i++) out.push(i); return out; },
  label(n) { const nm = Store.groupNames && Store.groupNames[n]; return nm ? 'مجموعة ' + n + ' · ' + nm : 'مجموعة ' + n; },
  assignedOf(uid) { const v = Store.assign && Store.assign[uid]; return v ? +v : null; },
  membersOf(n) { return Object.keys(Store.assign || {}).filter(u => +Store.assign[u] === +n); },
  anyAssign() { return Object.keys(Store.assign || {}).length > 0; }
};

// ---------- الهوية المحلية (طبقات حفظ متعددة) ----------
// ---------- مدة الجلسة: يبقى المتدرب والمدرب داخل المنصة 72 ساعة من آخر استخدام، ثم يُطلب دخول جديد ----------
const Session = {
  TTL: 72 * 3600 * 1000, KEY: 'ec_last', expired: false, _t: 0,
  last() { return +SafeLS.get(Session.KEY) || 0; },
  over() { const t = Session.last(); return t > 0 && Date.now() - t > Session.TTL; },
  touch(force) { const n = Date.now(); if (!force && n - Session._t < 60000) return; Session._t = n; SafeLS.set(Session.KEY, String(n)); },
  // عند الإقلاع: إن انقضت المدة نمسح هوية الجهاز (يُسجَّل الخروج من Firebase لاحقًا في authInit)
  boot() { if (Session.over()) { Session.expired = Session.notice = true; Me.clear(); SafeSS.del('ec_admin'); SafeSS.del('ec_preview'); } Session.touch(true); },
  // الصفحة المفتوحة طويلًا دون استخدام: نتحقق عند العودة إليها أو عند أول نقرة
  check() { if (Session.over()) { location.reload(); return false; } Session.touch(); return true; }
};

const Me = {
  data: null, guest: false,
  load() {
    const tryParse = s => { try { const o = JSON.parse(s); return o && o.uid ? o : null; } catch (e) { return null; } };
    let d = tryParse(SafeLS.get('ec_me')) || tryParse(SafeSS.get('ec_me'));
    Cookie.del('ec_me'); // الهوية لم تعد تُحفظ في كوكي (كانت تُرسل مع كل طلب ويقرؤها أي موقع على النطاق نفسه)
    const hp = getHashParams();
    // لم يعد مُعرّف المتدرب يوضع في الرابط (كان يتسرب عند مشاركة الروابط)؛ الهوية من التخزين المحلي والجلسة فقط
    Me.data = d;
    Me.guest = !d && (SafeLS.get('ec_guest') === '1' || SafeSS.get('ec_guest') === '1');
    if (d && !d._fromHash) Me.save(d);
    return d;
  },
  save(d) {
    Me.data = d; Me.guest = false; const s = JSON.stringify(d);
    SafeLS.set('ec_me', s); SafeSS.set('ec_me', s);
    SafeLS.del('ec_guest'); SafeSS.del('ec_guest');
    Router.syncHash();
  },
  clear() {
    Me.data = null; Me.guest = false;
    SafeLS.del('ec_me'); SafeSS.del('ec_me'); SafeLS.del('ec_guest'); SafeSS.del('ec_guest');
    Router.syncHash();
  },
  setGuest() { Me.data = null; Me.guest = true; SafeLS.set('ec_guest', '1'); SafeSS.set('ec_guest', '1'); },
  // عند دخول المدرب تحلّ هوية «الإدارة» محل هوية المتدرب المحفوظة على الجهاز (وتعود هي بعد خروجه)
  uid() { return Admin.ok() ? ADMIN_ID : (Me.data ? Me.data.uid : null); },
  isReg() { return !Admin.ok() && !!(Me.data && Me.data.uid); },
  // من يستطيع المشاركة في التمارين: المتدرب المسجل والمدرب (والزائر لا)
  canPost() { return Admin.ok() || Me.isReg(); },
  actor() { return Admin.ok() ? { uid: ADMIN_ID, name: ADMIN_NAME, role: '' } : Me.data; },
  group() { return !Admin.ok() && Me.data && Me.data.group ? +Me.data.group : null; },
  setGroup(n) { if (!Me.data || Admin.ok()) return; Me.data.group = n; Me.save(Me.data); DB.update('users/' + Me.data.uid, { group: n, gkey: 'g' + n }); }
};

// ---------- الإنجاز والأوسمة ----------
const Progress = {
  exDone(e, uid) {
    const ps = Store.posts[e.id]; if (!ps || !uid) return false;
    const inGroup = Object.keys(ps).some(k => ps[k] && ps[k].members && ps[k].members[uid]); // إجابات جماعية سابقة تُحتسب لأعضائها
    if (e.mode === 'group') return inGroup;
    if (e.format === 'mcq' && ps[uid]) { const a = ansList(ps[uid].answers, e.items.length); return a.every(v => v !== null && v !== '') || inGroup; }
    return !!ps[uid] || inGroup;
  },
  // يستثني تمامًا: المحاور المخفية، المحاور المعطلة، والتمارين المخفية
  forUser(uid) {
    const axes = Content.eligibleAxes().map(a => {
      const exs = Content.exercisesOf(a.id); const done = exs.filter(e => Progress.exDone(e, uid)).length;
      return { a, total: exs.length, done, pct: exs.length ? done / exs.length : 0 };
    });
    const total = axes.reduce((s, x) => s + x.total, 0), done = axes.reduce((s, x) => s + x.done, 0);
    return { axes, total, done, pct: total ? done / total : 0 };
  },
  achievers() { return Object.keys(Store.users || {}).filter(u => Progress.forUser(u).pct >= BADGE_THRESHOLD).map(u => Object.assign({ uid: u }, Store.users[u])); }
};

// ---------- الإعجابات: تخزين مؤقت موحّد + دالة تبديل واحدة لكل السياقات ----------
const Likes = {
  cache: {},
  count(path, likesObj) { const c = Likes.cache[path]; const base = Object.assign({}, likesObj || {}); if (c) Object.keys(c).forEach(u => { if (c[u]) base[u] = true; else delete base[u]; }); return base; },
  toggle(path, likesObj) {
    const uid = Me.uid(); if (!uid) { UI.toast('الإعجاب متاح للمسجلين فقط'); return; }
    const cur = Likes.count(path, likesObj); const on = !cur[uid];
    Likes.cache[path] = Object.assign(Likes.cache[path] || {}, { [uid]: on });
    DB.set(path + '/likes/' + uid, on ? true : null).then(() => { delete Likes.cache[path]; });
    return on;
  },
  btn(path, likesObj) {
    const l = Likes.count(path, likesObj); const n = Object.keys(l).length; const mine = Me.uid() && l[Me.uid()];
    return '<button class="like-btn ' + (mine ? 'on' : '') + '" data-like="' + h(path) + '" ' + (Me.canPost() ? '' : 'disabled title="للمسجلين فقط"') + '>👍 <span class="num">' + n + '</span></button>';
  }
};

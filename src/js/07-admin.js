// ---------------------------------------------------------------------
// لوحة الأدمن — شاشة واحدة متصلة + نماذج الإنشاء/التعديل
// ---------------------------------------------------------------------
const Bell = {
  events() {
    const ev = [];
    Object.keys(Store.users || {}).forEach(u => { const x = Store.users[u]; if (x && x.ts) ev.push({ ts: x.ts, html: '🆕 <b>' + h(x.name) + '</b> سجّل في البرنامج' }); });
    Object.keys(Store.posts || {}).forEach(exId => { const ps = Store.posts[exId] || {}; const t = Content.exTitle(exId); Object.keys(ps).forEach(k => { const p = ps[k]; if (p && p.ts) ev.push({ ts: p.ts, html: '✍️ <b>' + h(k.charAt(0) === 'g' && p.group ? Groups.label(p.group) + ' (' + (p.name || '') + ')' : (p.name || 'مشارك')) + '</b> شارك في «' + h(t) + '»' }); }); });
    Object.keys(Store.labAnswers || {}).forEach(g => { const ga = Store.labAnswers[g] || {}; Object.keys(ga).forEach(s => { const a = ga[s]; if (a && a.ts) ev.push({ ts: a.ts, html: '🧪 <b>' + h(Groups.label(+g.slice(1))) + '</b> حفظت مرحلة في المختبر الختامي' }); }); });
    ['pre', 'post'].forEach(ph => { const o = (Store.assess || {})[ph] || {}; Object.keys(o).forEach(u => { const x = o[u]; if (x && x.done && x.ts) ev.push({ ts: x.ts, html: '📋 <b>' + h(x.name || '') + '</b> أنجز ' + (ph === 'pre' ? 'التقييم القبلي' : 'التقييم البعدي') }); }); });
    Object.keys(Store.attendance || {}).forEach(u => { const x = Store.attendance[u] || {}; Object.keys(x).filter(k => /^t\d+$/.test(k)).forEach(k => ev.push({ ts: x[k], html: '📍 <b>' + h((Store.users[u] || {}).name || '') + '</b> سجّل حضور اليوم ' + k.slice(1) })); });
    return ev.sort((a, b) => b.ts - a.ts).slice(0, 80);
  },
  seen() { return +(SafeLS.get('ec_bell_seen') || 0); }, // تفضيل عرض محلي على جهاز المدرّب فقط
  html() {
    const ev = Bell.events(); const seen = Bell.seen(); const unread = ev.filter(e => e.ts > seen).length;
    return '<div class="bell-wrap"><button class="icon-btn" data-act="bell" title="الإشعارات">' + iconSvg('bell', 19) + (unread ? '<span class="bell-dot num">' + (unread > 99 ? '99+' : unread) + '</span>' : '') + '</button>' +
      (UIState.bellOpen ? '<div class="bell-menu">' + (ev.length ? ev.map(e => '<div class="bell-item ' + (e.ts > seen ? 'unread' : '') + '"><div class="grow">' + e.html + '<div class="t">' + ago(e.ts) + '</div></div></div>').join('') : '<div class="empty">لا توجد إشعارات بعد.</div>') + '</div>' : '') + '</div>';
  }
};
function adminHeader(title) {
  return '<div class="admin-top"><h1>' + h(title) + '</h1>' + Bell.html() + '<button class="btn btn-primary btn-sm" data-go="present">🎤 وضع العرض</button><button class="btn btn-ghost btn-sm" data-go="home">🌐 عرض الموقع</button><button class="btn btn-danger btn-sm" data-act="admin-exit">خروج من الإدارة</button></div>';
}
function band(title, color, extra = '') { return '<div class="admin-band" style="--bc:' + color + '"><span class="bar"></span><h2>' + h(title) + '</h2><span class="grow"></span>' + extra + '</div>'; }
function tool(key, icon, color, title, body, foot, cls = '') {
  return '<div class="tool ' + cls + '" data-tool="' + key + '"><div class="th"><span class="ti" style="background:' + tint(color, .14) + ';color:' + color + '">' + icon + '</span><h4>' + h(title) + '</h4></div><div class="tb">' + body + '</div><div class="tf">' + foot + '</div></div>';
}
function drop(key, inner) { return UIState.openDrop.has(key) ? '<div class="tool-drop" data-drop="' + key + '">' + inner + '</div>' : ''; }
function tags(x) { return (x._added ? '<span class="tag added">مضاف</span> ' : '') + (x._modified ? '<span class="tag mod">معدَّل</span> ' : '') + (x._hidden ? '<span class="tag hid">مخفي</span> ' : '') + (x._disabled ? '<span class="tag off">معطّل</span> ' : ''); }

function exSummary(e) {
  if (e.kind === 'survey') { const st = SurveyStats.of(Store.posts[e.id], e); if (st.n) return '<div class="summary"><b class="num">' + st.n + '</b> تقييم · متوسط الرضا <b class="num">' + (st.overall ? st.overall.toFixed(2) : '—') + '</b>/5 · NPS <b class="num">' + (st.nps == null ? '—' : st.nps) + '</b>' + st.rates.map((r, i) => '<div class="it"><span class="grow">' + h(r) + '</span><b class="num">' + (st.avgs[i] ? st.avgs[i].toFixed(2) : '—') + '</b></div>').join('') + '</div>'; }
  const ps = Store.posts[e.id] || {}; const keys = Object.keys(ps).filter(k => ps[k]).sort((a, b) => (ps[b].ts || 0) - (ps[a].ts || 0));
  if (!keys.length) return '<div class="summary">لا مشاركات بعد.</div>';
  const reveal = isRevealed(e);
  return '<div class="summary"><b class="num">' + keys.length + '</b> مشاركة' + (e.format !== 'text' && e.format !== 'sim' ? ' · ' + (reveal ? '🔓 مكشوفة' : '🔒 غير مكشوفة') : '') +
    keys.slice(0, 30).map(k => { const p = ps[k]; const who = k.charAt(0) === 'g' && e.mode === 'group' ? Groups.label(+k.slice(1)) : (p.name || 'مشارك');
      let brief = '';
      if (e.format === 'text') brief = h(String(p.text || '').slice(0, 140)) + (String(p.text || '').length > 140 ? '…' : '');
      else if (e.format === 'sim') brief = h(p.summary || '');
      else { const a = ansList(p.answers, e.items.length); let sc = 0; e.items.forEach((it, i) => { const v = a[i]; if (v == null) return; if (e.format === 'mcq' ? +v === +it.answer : e.format === 'truefalse' ? ((v === true || v === 'true') === !!it.answer) : v === it.answer) sc++; }); brief = 'الصحيح: ' + sc + ' من ' + e.items.length; }
      return '<div class="it"><b>' + h(who) + ':</b><span class="grow">' + brief + '</span><button class="del-btn" data-act="del-post" data-ex="' + h(e.id) + '" data-k="' + h(k) + '" title="حذف هذه المشاركة وحدها">🗑</button></div>'; }).join('') + '</div>';
}
function exRow(e, o = {}) {
  const isDef = !!DEF_EX[e.id];
  return '<div class="ex-row"><div class="top"><span style="font-size:18px">' + h(e.icon || '✍️') + '</span><span class="nm">' + h(e.title) + ' ' + tags(e) + '<span class="tag fmt">' + h(FORMATS[e.format] || '') + ' · ' + (e.mode === 'group' ? 'جماعي' : 'فردي') + '</span></span>' +
    (o.kind !== 'survey' ? '<button class="btn btn-ghost btn-xs" data-act="ex-move" data-d="-1" data-id="' + h(e.id) + '" data-key="' + h(o.axis || '_acts') + '" title="تحريك لأعلى">↑</button><button class="btn btn-ghost btn-xs" data-act="ex-move" data-d="1" data-id="' + h(e.id) + '" data-key="' + h(o.axis || '_acts') + '" title="تحريك لأسفل">↓</button>' : '') +
    '<button class="btn btn-soft btn-xs" data-go="' + (o.kind === 'activity' || o.kind === 'survey' ? 'actEdit' : 'exEdit') + '" data-id="' + h(e.id) + '"' + (o.axis ? ' data-axis="' + h(o.axis) + '"' : '') + '>✏️ تعديل</button>' +
    '<button class="btn btn-ghost btn-xs" data-act="toggle-vis" data-id="' + h(e.id) + '">' + (e._hidden ? '👁 إظهار' : '🙈 إخفاء') + '</button>' +
    (o.kind !== 'survey' ? '<button class="btn btn-ghost btn-xs" data-act="copy-ex" data-id="' + h(e.id) + '">🧬 نسخ</button>' : '') +
    (isDef ? (e._modified ? '<button class="btn btn-ghost btn-xs" data-act="reset-ex" data-id="' + h(e.id) + '">↺ استرجاع الافتراضي</button>' : '') : '<button class="btn btn-danger btn-xs" data-act="delete-ex" data-id="' + h(e.id) + '">🗑 حذف نهائي</button>') +
    '<button class="btn btn-danger btn-xs" data-act="clear-posts" data-id="' + h(e.id) + '">🧹 مسح المشاركات</button>' +
    (e.format !== 'text' && e.format !== 'sim' ? '<button class="btn btn-mint btn-xs" data-act="reveal" data-id="' + h(e.id) + '">' + (isRevealed(e) ? '🔒 إخفاء الإجابات' : '🔓 كشف الإجابات الصحيحة') + '</button>' : '') +
    '</div>' + exSummary(e) + '</div>';
}

Views.admin = {
  html() {
    const users = Store.users || {}; const uids = Object.keys(users).sort((a, b) => (users[a].ts || 0) - (users[b].ts || 0));
    const ach = Progress.achievers(); const s = Content.site(); const pdf = Content.pdf();
    let out = ''; const blocks = {}; let curId = null; const B = id => { if (curId) blocks[curId] = (blocks[curId] || '') + out; out = ''; curId = id; };
    B('users');
    out += tool('users', '👥', '#8A1538', 'المسجّلون', '<div class="bigno num">' + uids.length + '</div>اسم مسجّل في قاعدة البيانات', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="users">' + (UIState.openDrop.has('users') ? 'إخفاء' : 'عرض') + ' القائمة</button><button class="btn btn-danger btn-xs" data-act="clear-names">مسح أسماء المسجّلين فقط</button>');
    out += drop('users', '<div class="field"><input data-keep="users-search" data-filter=".person" placeholder="🔍 بحث بالاسم…"></div><div class="people-list">' + (uids.length ? uids.map(u => '<div class="person" data-name="' + h((users[u].name || '').toLowerCase()) + '"><span class="nm">' + h(users[u].name) + '</span><span class="muted">' + h(users[u].role || '') + '</span><span class="pill num">#' + pad4(users[u].member || 0) + '</span>' + ((Store.secrets || {})[u] ? '<span class="pill num notranslate" translate="no" dir="ltr" title="رمز الدخول الشخصي" style="user-select:all">🔑 ' + h(Store.secrets[u]) + '</span>' : '<span class="pill" title="لا يوجد رمز دخول بعد">🔑 —</span>') + '<button class="btn btn-ghost btn-xs" data-act="code-copy" data-uid="' + h(u) + '" title="نسخ رسالة فيها رقم العضوية والرمز لإرسالها للمتدرب">📋</button><button class="btn btn-ghost btn-xs" data-act="code-new" data-uid="' + h(u) + '" title="توليد رمز جديد وإلغاء ربط الأجهزة الأخرى">🔄 رمز جديد</button><span class="muted">' + fmtDate(users[u].ts) + '</span></div>').join('') : '<div class="empty">لا يوجد مسجّلون.</div>') + '</div>');
    B('groups');
    out += tool('groups', '🧩', '#138A5E', 'إدارة المجموعات', '<div class="row"><input type="number" min="2" max="30" id="grpCount" data-keep="grp-count" value="' + Groups.count() + '" style="width:80px;border:1px solid var(--line);border-radius:10px;padding:6px 8px"><button class="btn btn-soft btn-xs" data-act="save-groups">حفظ العدد</button></div><div style="margin-top:6px">عدد المجموعات (2–30). التوزيع اليدوي إرشادي لا إلزامي.</div>', '<button class="btn btn-primary btn-xs" data-act="assign-open">🧭 توزيع</button>');
    B('preview');
    out += tool('preview', '👀', '#1F3A5F', 'معاينة كمتدرب', 'اعرض الصفحة الرئيسية تمامًا كما يراها المتدرب، مع زر عائم للعودة.', '<button class="btn btn-soft btn-xs" data-act="preview">فتح المعاينة</button>');
    B('congrats');
    out += tool('congrats', '🏆', '#C8702A', 'تهنئة الإنجاز', '<div class="bigno num">' + ach.length + '</div>متدرب بلغ <span class="num">80%</span> إجمالًا', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="ach">الأسماء</button><button class="btn btn-soft btn-xs" data-act="congrats-preview" data-kind="congrats">معاينة</button><button class="btn btn-ghost btn-xs" data-act="drop" data-k="congEdit">تعديل المحتوى</button>');
    out += drop('ach', ach.length ? '<div class="people-list">' + ach.map(u => '<div class="person"><span class="nm">🏆 ' + h(u.name) + '</span><span class="muted">' + h(u.role || '') + '</span></div>').join('') + '</div>' : '<div class="empty">لم يبلغ أحد 80% بعد.</div>');
    out += drop('congEdit', Views.admin.congratsEditor('congrats'));
    B('regform');
    out += tool('regform', '📝', '#5B3A8A', 'نموذج التسجيل والخصوصية', '<span class="num">' + RegFields.visible().length + '</span> حقول ظاهرة من <span class="num">' + RegFields.all().length + '</span>. تحكم في الحقول المطلوبة والاختيارية وأضف حقولًا جديدة، وعدّل إشعار الخصوصية.', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="regEdit">حقول التسجيل</button><button class="btn btn-ghost btn-xs" data-act="drop" data-k="privEdit">إشعار الخصوصية</button><button class="btn btn-ghost btn-xs" data-act="users-csv">⬇️ المسجّلون CSV</button>');
    out += drop('regEdit', Views.admin.regEditor());
    out += drop('privEdit', Views.admin.privacyEditor());
    const ac = Attend.cfg(); const holders = Attend.holders(); const aOn = Attend.on(), cOn = Attend.certOn();
    B('attend');
    // مفاتيح تفعيل الميزتين: عند تعطيلهما يختفي كل ما يرتبط بهما عند المتدرب وفي التقارير ولوحة المشرف
    const sw = (f, on, label, dis) => '<button class="feat-sw' + (on ? ' on' : '') + '" data-act="att-feature" data-f="' + f + '" role="switch" aria-checked="' + on + '"' + (dis ? ' disabled title="فعّل تسجيل الحضور أولًا — الشهادة تُمنح بنسبة الحضور"' : '') + '><i></i><span>' + label + '</span></button>';
    const sws = '<div class="feat-sws">' + sw('enabled', aOn, 'تسجيل الحضور') + sw('cert', cOn, 'شهادة المشاركة', !aOn) + '</div>';
    out += tool('attend', '📍', '#0E7C7B', 'الحضور وشهادة المشاركة', sws + (aOn ? (cOn ? '<div class="bigno num">' + holders.length + '</div>مستحق للشهادة (حضور ≥ <span class="num">' + ac.threshold + '%</span>)' : '<div class="muted" style="font-family:var(--f-ui);font-size:12.5px;margin-bottom:6px">الشهادة معطّلة — لا تظهر للمتدربين ولا في التقارير.</div>') + Attend.days().map(d => { const cd = ac.codes['d' + d] || {}; return '<div class="att-day"><b>اليوم <span class="num">' + d + '</span></b>' + (cd.code ? '<span class="att-code num notranslate" translate="no">' + h(cd.code) + '</span>' : '') + '<span class="pill ' + (cd.open ? 'open-pill' : '') + '">' + (cd.open ? 'مفتوح' : 'مغلق') + '</span></div>'; }).join('') : '<div class="muted" style="font-family:var(--f-ui);font-size:12.5px">معطّل — لا يظهر للمتدربين شريط تسجيل الحضور ولا نسبة الحضور ولا الشهادة، وتُحذف مؤشراتها من التقارير ولوحة المشرف (مثلًا إن كانت الجهة الراعية تتابع الحضور وتصدر الشهادات بنفسها). البيانات المسجّلة سابقًا تبقى محفوظة.</div>'),
      aOn ? '<button class="btn btn-primary btn-xs" data-act="drop" data-k="attCtl">إدارة الحضور</button><button class="btn btn-soft btn-xs" data-act="drop" data-k="attSheet">سجل الحضور</button>' + (cOn ? '<button class="btn btn-ghost btn-xs" data-act="drop" data-k="certEdit">محتوى الشهادة</button><button class="btn btn-ghost btn-xs" data-act="congrats-preview" data-kind="cert">معاينة</button>' : '') : '');
    if (aOn) { out += drop('attCtl', Views.admin.attCtl()); out += drop('attSheet', Views.admin.attSheet()); }
    if (cOn) out += drop('certEdit', Views.admin.congratsEditor('cert'));
    const acfg = Assess.cfg(); const apre = Assess.avg('pre'), apost = Assess.avg('post');
    B('assess');
    out += tool('assess', '📋', '#2F5D8A', 'التقييم القبلي والبعدي', '<div class="row" style="gap:14px"><div><div class="bigno num">' + (apre == null ? '—' : Math.round(apre) + '%') + '</div>قبلي · <span class="num">' + Assess.list('pre').length + '</span></div><div><div class="bigno num">' + (apost == null ? '—' : Math.round(apost) + '%') + '</div>بعدي · <span class="num">' + Assess.list('post').length + '</span></div></div>' + (apre != null && apost != null ? '<div style="margin-top:4px">التحسن: <b class="num">' + (apost - apre >= 0 ? '+' : '') + Math.round(apost - apre) + '</b> نقطة</div>' : ''),
      '<button class="btn btn-xs ' + (acfg.pre === 'open' ? 'btn-danger' : 'btn-primary') + '" data-act="as-toggle" data-ph="pre">' + (acfg.pre === 'open' ? '🔒 إغلاق القبلي' : '🟢 فتح القبلي') + '</button><button class="btn btn-xs ' + (acfg.post === 'open' ? 'btn-danger' : 'btn-primary') + '" data-act="as-toggle" data-ph="post">' + (acfg.post === 'open' ? '🔒 إغلاق البعدي' : '🟢 فتح البعدي') + '</button><button class="btn btn-mint btn-xs" data-act="as-reveal">' + (acfg.reveal ? '🔒 إخفاء النتائج' : '🔓 كشف النتائج') + '</button><button class="btn btn-soft btn-xs" data-act="drop" data-k="asRes">النتائج</button><button class="btn btn-ghost btn-xs" data-go="assessEdit">✏️ الأسئلة</button>');
    out += drop('asRes', Views.admin.assessResults());
    B('broadcast');
    out += tool('broadcast', '📣', '#C8702A', 'بث رسالة مباشرة', '<textarea id="bcText" data-keep="bc-text" rows="2" style="width:100%;border:1px solid var(--line);border-radius:10px;padding:6px 8px;font-family:var(--f-body)" placeholder="رسالة تظهر كشريط أعلى الصفحة لكل المتصفحين الآن"></textarea>' + (Store.broadcast && Store.broadcast.text ? '<div class="muted" style="margin-top:4px">الحالية: ' + h(Store.broadcast.text) + '</div>' : ''), '<button class="btn btn-primary btn-xs" data-act="bc-send">إرسال</button>' + (Store.broadcast && Store.broadcast.text ? '<button class="btn btn-ghost btn-xs" data-act="bc-stop">إيقاف البث</button>' : ''));
    const mc = Monitor.cfg(); const lds = Leads.list(); const coh = Cohort.cur(); const cl = Cohort.list();
    B('monitor');
    out += tool('monitor', '👁', '#1F3A5F', 'رابط متابعة للمشرف', 'لوحة حية للقراءة فقط لممثل الجهة الراعية: الحضور والتقييمات والمشاركة والرضا والاهتمامات، مع تنزيل التقرير. ' + (mc.enabled ? '<span class="tag added">مفعّل</span>' : '<span class="tag off">معطّل</span>'), '<button class="btn btn-xs ' + (mc.enabled ? 'btn-danger' : 'btn-primary') + '" data-act="mon-toggle">' + (mc.enabled ? 'إيقاف الرابط' : 'تفعيل الرابط') + '</button>' + (mc.enabled ? '<button class="btn btn-soft btn-xs" data-act="mon-copy">📋 نسخ الرابط</button><button class="btn btn-ghost btn-xs" data-act="mon-open">👀 معاينة</button><button class="btn btn-ghost btn-xs" data-act="mon-new">رابط جديد</button>' : ''));
    B('leads');
    out += tool('leads', '🤝', '#138A5E', 'المهتمون ببرامج البنك', '<div class="bigno num">' + lds.length + '</div>مشروع طلب التواصل بخصوص برامج بنك قطر للتنمية', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="leadsList">القائمة</button><button class="btn btn-primary btn-xs" data-act="leads-csv">⬇️ CSV</button><button class="btn btn-ghost btn-xs" data-act="drop" data-k="leadsCfg">إعدادات النموذج</button>');
    out += drop('leadsList', lds.length ? '<div class="table-wrap"><table class="att-table"><thead><tr><th>الاسم</th><th>المشروع</th><th>البرامج</th><th>الاحتياج</th><th>التواصل</th><th>التاريخ</th></tr></thead><tbody>' + lds.map(l => { const u = Store.users[l.uid] || {}; return '<tr><td><b>' + h(l.name || u.name || '') + '</b></td><td>' + h(l.org || RegFields.val(u, 'org')) + '<div class="muted" style="font-size:11.5px">' + h(RegFields.val(u, 'sector')) + '</div></td><td>' + l.programs.map(h).join('<br>') + '</td><td>' + h(l.need || '') + '</td><td>' + h(l.method || '') + '<div class="num">' + h(l.contact || '') + '</div></td><td>' + fmtDate(l.ts) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">لا توجد طلبات بعد.</div>');
    const lc = Leads.cfg();
    out += drop('leadsCfg', '<div class="field"><label>النص التعريفي</label><textarea id="lcIntro" data-keep="lc-intro" rows="2">' + h(lc.intro) + '</textarea></div><div class="field"><label>البرامج (سطر لكل برنامج)</label><textarea id="lcProgs" data-keep="lc-progs" rows="6">' + h(lc.programs.join('\n')) + '</textarea></div><div class="field"><label>نص الموافقة</label><input id="lcConsent" data-keep="lc-consent" value="' + h(lc.consent) + '"></div><div class="field"><label>يظهر النموذج أيضًا أسفل المحور</label><select id="lcAxis"><option value="">— لا يظهر في محور —</option>' + Content.axes({ all: true }).map(a => '<option value="' + h(a.id) + '" ' + (a.id === lc.axis ? 'selected' : '') + '>' + h(a.title) + '</option>').join('') + '</select><span class="help">ويظهر دائمًا في صفحة «حسابي».</span></div><div class="row"><button class="btn btn-primary btn-sm" data-act="leads-cfg-save">💾 حفظ</button><button class="btn btn-ghost btn-sm" data-act="leads-cfg-reset">↺ الافتراضي</button></div>');
    const fuc = Followup.cfg(); const endD = Followup.endDate();
    B('followup');
    out += tool('followup', '📈', '#5B3A8A', 'المتابعة بعد البرنامج', 'نماذج قياس الأثر بعد 30 و60 و90 يومًا من تاريخ نهاية الدفعة' + (endD ? ' (<span class="num">' + fmtDate(endD) + '</span>)' : ' — <b>حدد تاريخ نهاية الدفعة أولًا</b>') + '.' + FU_DAYS.map(n => '<div class="att-day"><b>بعد <span class="num">' + n + '</span> يومًا</b><span class="pill ' + (Followup.isOpen(n) ? 'open-pill' : '') + '">' + (Followup.isOpen(n) ? 'مفتوحة' : 'مغلقة') + '</span><span class="muted num">' + Followup.list(n).length + ' رد</span></div>').join(''), '<button class="btn btn-soft btn-xs" data-act="drop" data-k="fuCtl">إدارة وإرسال التذكير</button><button class="btn btn-ghost btn-xs" data-act="fu-csv">⬇️ النتائج CSV</button>');
    out += drop('fuCtl', '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">تُفتح كل متابعة تلقائيًا في موعدها، ويمكنك فتحها أو إغلاقها يدويًا. الإرسال الآلي للبريد يحتاج خادم بريد؛ لذلك يفتح زر البريد رسالة جاهزة في برنامج بريدك إلى من وافقوا على المتابعة ولم يردوا بعد (نسخة مخفية BCC)، ويمكنك نسخ رسالة واتساب لمجموعة البرنامج.</p>' +
      FU_DAYS.map(n => { const st = fuc.open[n] || 'auto'; return '<div class="att-row"><b>بعد <span class="num">' + n + '</span> يومًا</b><span class="muted">' + (Followup.due(n) ? 'موعدها ' + fmtDate(Followup.due(n)) : 'بلا موعد') + '</span><button class="btn btn-ghost btn-xs" data-act="fu-state" data-n="' + n + '">الحالة: ' + ({ auto: '⏱ تلقائي', open: '🟢 مفتوحة يدويًا', closed: '🔒 مغلقة يدويًا' })[st] + '</button><button class="btn btn-primary btn-xs" data-act="fu-mail" data-n="' + n + '">📧 تذكير بالبريد</button><button class="btn btn-soft btn-xs" data-act="fu-wa" data-n="' + n + '">💬 رسالة واتساب</button><span class="pill num">' + Followup.list(n).length + ' رد</span></div>'; }).join(''));
    const gm = Points.cfg();
    B('gamify');
    out += tool('gamify', '🏆', '#D07A32', 'النقاط ولوحة الصدارة', 'نقاط للمشاركة والإعجابات والحضور والتقييمات، ولوحة صدارة للأفراد والمجموعات، وشارات خاصة (أول مشارك، الأكثر إعجابًا…).', '<button class="btn btn-xs ' + (gm.enabled ? 'btn-danger' : 'btn-primary') + '" data-act="gm-toggle" data-k="enabled">' + (gm.enabled ? 'إيقاف النقاط' : 'تفعيل النقاط') + '</button><button class="btn btn-ghost btn-xs" data-act="gm-toggle" data-k="names">' + (gm.names ? '🙈 إخفاء الأسماء في اللوحة' : '👁 إظهار الأسماء') + '</button><button class="btn btn-soft btn-xs" data-act="drop" data-k="lbView">عرض اللوحة</button>');
    out += drop('lbView', leaderboardHtml(20));
    B('tplTool');
    out += tool('tplTool', '📚', '#0E7C7B', 'صندوق الأدوات والقوالب', '7 حاسبات عملية و' + TEMPLATES.length + ' قوالب قابلة للتحميل للمتدربين.', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="tplVis">إظهار/إخفاء القوالب</button><button class="btn btn-ghost btn-xs" data-go="tools">👀 فتح الصندوق</button>');
    out += drop('tplVis', '<div class="people-list">' + TEMPLATES.map(t => '<div class="person"><span class="nm">' + t.icon + ' ' + h(t.title) + '</span><button class="btn btn-ghost btn-xs" data-act="tpl-vis" data-id="' + t.id + '">' + (Content.isHidden('tpl_' + t.id) ? '👁 إظهار' : '🙈 إخفاء') + '</button></div>').join('') + '</div>');
    B('cohorts');
    out += tool('cohorts', '📦', '#9A7412', 'الدفعات والأرشيف', 'الدفعة الحالية: <b>' + h(coh.name) + '</b> · في الأرشيف: <b class="num">' + cl.length + '</b> دفعة', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="cohList">المقارنة والأرشيف</button><button class="btn btn-ghost btn-xs" data-act="drop" data-k="cohEdit">بيانات الدفعة</button><button class="btn btn-danger btn-xs" data-act="cohort-close">📦 إغلاق وأرشفة</button>');
    out += drop('cohEdit', '<div class="grid2"><div class="field"><label>اسم الدفعة</label><input id="cohName" data-keep="coh-name" value="' + h(coh.name) + '"></div><div class="field"><label>تاريخ البداية</label><input id="cohStart" type="date" data-keep="coh-start" value="' + h(coh.start) + '"></div><div class="field"><label>تاريخ النهاية</label><input id="cohEnd" type="date" data-keep="coh-end" value="' + h(coh.end) + '"></div></div><button class="btn btn-primary btn-sm" data-act="cohort-save">💾 حفظ</button>');
    if (UIState.openDrop.has('cohList')) { const live = cohortSummary(reportData()); const rows = cl.map(c => ({ c, s: c.summary || {} })).concat([{ c: Object.assign({ id: '' }, coh), s: live, live: true }]); const v = x => x == null ? '—' : x;
      out += drop('cohList', '<div class="table-wrap"><table class="att-table"><thead><tr><th>الدفعة</th><th>المشاركون</th><th>الحضور</th><th>الشهادات</th><th>قبلي</th><th>بعدي</th><th>التحسن</th><th>الرضا</th><th>NPS</th><th>المهتمون</th><th></th></tr></thead><tbody>' +
        rows.map(r => '<tr><td><b>' + h(r.c.name || '') + '</b>' + (r.live ? ' <span class="tag added">حالية</span>' : '') + '<div class="muted num" style="font-size:11.5px">' + h(r.c.start || '') + (r.c.end ? ' — ' + h(r.c.end) : '') + '</div></td><td class="num">' + v(r.s.participants) + '</td><td class="num">' + v(r.s.attAvg) + '%</td><td class="num">' + v(r.s.certs) + '</td><td class="num">' + (r.s.preAvg == null ? '—' : r.s.preAvg + '%') + '</td><td class="num">' + (r.s.postAvg == null ? '—' : r.s.postAvg + '%') + '</td><td class="num">' + (r.s.gain == null ? '—' : (r.s.gain >= 0 ? '+' : '') + r.s.gain) + '</td><td class="num">' + v(r.s.sat) + '</td><td class="num">' + v(r.s.nps) + '</td><td class="num">' + v(r.s.leads) + '</td><td>' +
          (r.live ? '' : '<button class="btn btn-soft btn-xs" data-act="coh-report" data-cid="' + h(r.c.id) + '" data-lang="ar">PDF</button><button class="btn btn-ghost btn-xs" data-act="coh-report" data-cid="' + h(r.c.id) + '" data-lang="en">EN</button><button class="btn btn-ghost btn-xs" data-act="coh-csv" data-cid="' + h(r.c.id) + '">CSV</button><button class="btn btn-ghost btn-xs" data-act="coh-json" data-cid="' + h(r.c.id) + '">JSON</button><button class="btn btn-danger btn-xs" data-act="coh-del" data-cid="' + h(r.c.id) + '">🗑</button>') + '</td></tr>').join('') + '</tbody></table></div>'); }
    B('pdf');
    out += tool('pdf', '📄', '#00827F', 'ملف المحتوى PDF', 'A5 مصمَّم: أغلفة، فهرس، وشرائح كل محور. ' + (pdf.enabled === false ? '<span class="tag off">معطّل للمتدربين</span>' : '<span class="tag added">متاح للمتدربين</span>'), '<button class="btn btn-soft btn-xs" data-act="drop" data-k="pdfEdit">بيانات الملف</button><button class="btn btn-primary btn-xs" data-act="content-pdf">معاينة الآن</button>');
    out += drop('pdfEdit', Views.admin.pdfEditor());
    B('guide');
    out += tool('guide', '📘', '#1F3A5F', 'دليل المدرب', 'ملف PDF يضم أهداف البرنامج ومنهجيته وجدول اليومين ومخرجات كل محور وملاحظة لكل شريحة، إضافة إلى التمارين ومفتاح إجابات التقييم — جاهز للتسليم قبل التدريب.', '<button class="btn btn-primary btn-xs" data-act="guide-pdf">📘 تصدير الدليل PDF</button><button class="btn btn-soft btn-xs" data-act="drop" data-k="guideEdit">تعديل الأهداف والجدول</button>');
    out += drop('guideEdit', Views.admin.guideEditor());
    B('report');
    out += tool('report', '📑', '#8A1538', 'تقرير ختام البرنامج', 'تقرير مؤسسي آلي بشعار البنك: ملخص تنفيذي، ملف المشاركين، نتائج التقييم القبلي والبعدي، التفاعل، الرضا وNPS، الاهتمام ببرامج البنك، وتوصيات آلية — بالعربية أو الإنجليزية.', '<button class="btn btn-primary btn-xs" data-act="report-pdf" data-lang="ar">📑 عربي</button><button class="btn btn-primary btn-xs" data-act="report-pdf" data-lang="en">📑 English</button><button class="btn btn-soft btn-xs" data-act="report-csv">📊 CSV</button><button class="btn btn-ghost btn-xs" data-act="drop" data-k="logoEdit">شعار البنك</button>');
    out += drop('logoEdit', '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">ارفع الشعار الرسمي لبنك قطر للتنمية (PNG بخلفية شفافة أو بيضاء). يظهر في الغلاف وأعلى كل صفحة من التقرير. بدون شعار يُستخدم اسم البنك نصيًا.</p>' + ImgPick.html('brandLogo', (Store.site || {}).brandLogo) + '<div class="row" style="margin-top:8px"><button class="btn btn-primary btn-sm" data-act="logo-save">💾 حفظ الشعار</button></div>');
    B('csv');
    out += tool('csv', '📊', '#138A5E', 'تصدير المشاركات', 'كل إجابات المحاور والأنشطة والاستطلاع والمختبر والتقييمين في ملف CSV واحد يفتح في Excel.', '<button class="btn btn-primary btn-xs" data-act="export-csv">⬇️ تصدير CSV</button>');
    B('person');
    out += tool('person', '🗂️', '#1F3A5F', 'مشاركات فردية', 'ملف PDF وCSV لمشاركات كل متدرب على حدة، أو للجميع في ملف ZIP.', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="persons">' + (UIState.openDrop.has('persons') ? 'إخفاء' : 'فتح') + ' القائمة</button>');
    out += drop('persons', '<div class="row" style="margin-bottom:10px"><input data-keep="persons-search" data-filter=".person" placeholder="🔍 بحث بالاسم…" style="flex:1;min-width:180px;border:1px solid var(--line);border-radius:10px;padding:8px 10px"><button class="btn btn-primary btn-xs" data-act="export-all-pdf">📦 تصدير الكل PDF</button><button class="btn btn-soft btn-xs" data-act="export-all-csv">📦 تصدير الكل CSV</button></div><div class="people-list">' + (uids.length ? uids.map(u => '<div class="person" data-name="' + h((users[u].name || '').toLowerCase()) + '"><span class="nm">' + h(users[u].name) + '</span><button class="btn btn-soft btn-xs" data-act="person-pdf" data-uid="' + h(u) + '">PDF</button><button class="btn btn-ghost btn-xs" data-act="person-csv" data-uid="' + h(u) + '">CSV</button></div>').join('') : '<div class="empty">لا يوجد مسجّلون.</div>') + '</div>');
    B('backup');
    out += tool('backup', '💾', '#E8960C', 'النسخة الاحتياطية للمحتوى', 'كل تعديلات وإضافات المحتوى (بلا مشاركات المتدربين) في ملف JSON.', '<button class="btn btn-soft btn-xs" data-act="backup">⬇️ تنزيل</button><button class="btn btn-primary btn-xs" data-act="export-all" title="كل عقد القاعدة: المحتوى والمدخلات والنسخ والأرشيف">💾 نسخة كاملة</button><label class="btn btn-ghost btn-xs">⬆️ استيراد<input type="file" accept="application/json,.json" hidden data-act-change="import-backup"></label>');
    const bks = Object.keys(Store.backupIndex || {}).sort().reverse();
    B('autobk');
    out += tool('autobk', '🛟', '#138A5E', 'نسخ يومي تلقائي للمدخلات', 'نسخة يومية تلقائية من التسجيل والمشاركات والتقييمات والحضور (آخر <span class="num">' + BACKUP_KEEP + '</span> يومًا). آخر نسخة: <b class="num">' + (bks[0] || '—') + '</b>', '<button class="btn btn-soft btn-xs" data-act="drop" data-k="bkList">النسخ المتاحة</button><button class="btn btn-ghost btn-xs" data-act="bk-now">نسخة الآن</button>');
    out += drop('bkList', bks.length ? '<div class="people-list">' + bks.map(d => { const x = Store.backupIndex[d]; return '<div class="person"><span class="nm num">' + h(d) + '</span><span class="muted"><span class="num">' + (x.users || 0) + '</span> مسجّل · <span class="num">' + (x.posts || 0) + '</span> مشاركة · <span class="num">' + (x.kb || 0) + '</span> KB</span><button class="btn btn-soft btn-xs" data-act="bk-dl" data-d="' + h(d) + '">⬇️ تنزيل</button><button class="btn btn-danger btn-xs" data-act="bk-restore" data-d="' + h(d) + '">↺ استعادة</button></div>'; }).join('') + '</div>' : '<div class="empty">لا توجد نسخ بعد — تُؤخذ أول نسخة تلقائيًا عند توفر مدخلات.</div>');
    const accH = UIState.openAcc.has('home-ui');
    B('homeUi');
    out += '<div class="acc ' + (accH ? 'open' : '') + '" style="--ac:#C8702A;--acg:' + tint('#C8702A', .08) + '"><div class="acc-head" data-act="acc" data-k="home-ui"><span class="aico">' + iconSvg('home', 20, '#fff') + '</span><h3>تعديل الشريط العلوي والقسم البارز والتذييل وعدد المسجّلين</h3><span class="arrow">◀</span></div><div class="acc-body">' + (accH ? Views.admin.homeEditor() : '') + '</div></div>';
    const accL = UIState.openAcc.has('landing');
    B('landing');
    out += '<div class="acc ' + (accL ? 'open' : '') + '" style="--ac:#8A1538;--acg:' + tint('#8A1538', .08) + '"><div class="acc-head" data-act="acc" data-k="landing"><span class="aico">🛬</span><h3>الصفحة التعريفية (قبل الدخول) — نبذة، أهداف، مزايا، محتوى، رحلة، مخرجات</h3><span class="arrow">◀</span></div><div class="acc-body">' + (accL ? Views.admin.landingEditor() : '') + '</div></div>';
    const accS = UIState.openAcc.has('home-secs');
    B('homeSecs');
    out += '<div class="acc ' + (accS ? 'open' : '') + '" style="--ac:#C8702A;--acg:' + tint('#C8702A', .08) + '"><div class="acc-head" data-act="acc" data-k="home-secs"><span class="aico">' + iconSvg('grid', 20, '#fff') + '</span><h3>أقسام الصفحة الرئيسية — ترتيب، إظهار وإخفاء، تعديل، إضافة وحذف <span class="muted num" style="font-size:12.5px">(' + Content.homeSections({ all: true }).length + ')</span></h3><span class="arrow">◀</span></div><div class="acc-body">' + (accS ? Views.admin.sectionsList() : '') + '</div></div>';
    B('stories'); out += '<div class="row blk-actions">' + '<button class="btn btn-primary btn-sm" data-go="storyEdit" data-id="new">➕ إضافة قصة</button>' + '</div>';
    const accSt = UIState.openAcc.has('storiesAcc'); const sts = Content.stories({ all: true });
    out += '<div class="acc ' + (accSt ? 'open' : '') + '" style="--ac:#9A7412;--acg:' + tint('#9A7412', .08) + '"><div class="acc-head" data-act="acc" data-k="storiesAcc"><span class="aico">🌟</span><h3>قصص النجاح الحقيقية <span class="muted num" style="font-size:12.5px">(' + sts.length + ')</span></h3><span class="arrow">◀</span></div><div class="acc-body">' + (accSt ? sts.map((st, i) => '<div class="ex-row"><div class="top"><span style="font-size:18px">' + h(st.flag || '🌟') + '</span><span class="nm">' + h(st.title) + ' ' + tags(st) + '<span class="tag fmt"><span class="num">' + st.sources.length + '</span> مصادر · 👏 <span class="num">' + Object.keys((Store.storyLikes[st.id] || {}).likes || {}).length + '</span></span></span>' +
      '<button class="btn btn-ghost btn-xs" data-act="story-move" data-d="-1" data-id="' + h(st.id) + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="btn btn-ghost btn-xs" data-act="story-move" data-d="1" data-id="' + h(st.id) + '" ' + (i === sts.length - 1 ? 'disabled' : '') + '>↓</button><button class="btn btn-soft btn-xs" data-go="storyEdit" data-id="' + h(st.id) + '">✏️ تعديل</button><button class="btn btn-ghost btn-xs" data-act="toggle-vis" data-id="' + h(st.id) + '">' + (st._hidden ? '👁 إظهار' : '🙈 إخفاء') + '</button><button class="btn btn-ghost btn-xs" data-go="story" data-id="' + h(st.id) + '">👀 عرض</button>' +
      (st._added ? '<button class="btn btn-danger btn-xs" data-act="story-delete" data-id="' + h(st.id) + '">🗑 حذف نهائي</button>' : (st._modified ? '<button class="btn btn-ghost btn-xs" data-act="story-reset" data-id="' + h(st.id) + '">↺ استرجاع الافتراضي</button>' : '')) + '</div></div>').join('') : '') + '</div></div>';
    const axBtns = '<button class="btn btn-primary btn-sm" data-go="axisEdit" data-id="new">➕ إضافة محور جديد</button><button class="btn btn-soft btn-sm" data-go="actEdit" data-id="new">➕ إضافة نشاط جديد</button>'; B('units');
    const accU = UIState.openAcc.has('units');
    out += '<div class="acc ' + (accU ? 'open' : '') + '" style="--ac:#1F3A5F;--acg:' + tint('#1F3A5F', .08) + '"><div class="acc-head" data-act="acc" data-k="units"><span class="aico">' + iconSvg('layers', 20, '#fff') + '</span><h3>أسماء الوحدات (العناوين الجانبية فوق المحاور)</h3><span class="arrow">◀</span></div><div class="acc-body">' + (accU ? Views.admin.unitsEditor() : '') + '</div></div>';
    B('axes'); out += '<div class="row blk-actions">' + axBtns + '</div>';
    out += '<p class="muted" style="font-family:var(--f-ui);font-size:13px;margin:10px 0">اسحب المحاور من المقبض ⠿ أو استخدم ↑↓ لإعادة ترتيبها. اضغط عنوان المحور لعرض تمارينه.</p><div id="axisAcc">';
    Content.axes({ all: true }).forEach(a => {
      const col = Content.color(a); const open = UIState.openAcc.has(a.id); const isDef = !!DEF_AXIS[a.id];
      const exs = Content.exercisesOf(a.id, { all: true });
      out += '<div class="acc ' + (open ? 'open' : '') + '" draggable="true" data-axis-drag="' + h(a.id) + '" style="--ac:' + col + ';--acg:' + tint(col, .08) + '"><div class="acc-head" data-act="acc" data-k="' + h(a.id) + '"><span class="drag-handle" title="اسحب لإعادة الترتيب">⠿</span><span class="aico">' + iconSvg(a.icon || 'star', 20, '#fff') + '</span><h3>' + h(a.title) + ' <span class="muted" style="font-weight:500;font-size:12.5px">· ' + h(Content.unitName(a.unit) || 'بدون وحدة') + ' · <span class="num">' + exs.length + '</span> تمرين</span> ' + tags(a) + '</h3>' +
        '<div class="acc-actions"><button class="btn btn-ghost btn-xs" data-act="axis-move" data-d="-1" data-id="' + h(a.id) + '" title="تحريك لأعلى">↑</button><button class="btn btn-ghost btn-xs" data-act="axis-move" data-d="1" data-id="' + h(a.id) + '" title="تحريك لأسفل">↓</button><button class="btn btn-soft btn-xs" data-go="axisEdit" data-id="' + h(a.id) + '">✏️ تعديل</button><button class="btn btn-ghost btn-xs" data-act="toggle-vis" data-id="' + h(a.id) + '">' + (a._hidden ? '👁 إظهار' : '🙈 إخفاء') + '</button><button class="btn btn-ghost btn-xs" data-act="toggle-en" data-id="' + h(a.id) + '">' + (a._disabled ? '⏸ معطّل ⇄ تفعيل' : '✅ مفعّل ⇄ تعطيل') + '</button><button class="btn btn-ghost btn-xs" data-act="copy-axis" data-id="' + h(a.id) + '">🧬 نسخ</button>' +
        (isDef ? (a._modified ? '<button class="btn btn-ghost btn-xs" data-act="reset-axis" data-id="' + h(a.id) + '">↺ استرجاع الافتراضي</button>' : '') : '<button class="btn btn-danger btn-xs" data-act="delete-axis" data-id="' + h(a.id) + '">🗑 حذف نهائي</button>') + '</div><span class="arrow">◀</span></div>' +
        '<div class="acc-body">' + (open ? (exs.length ? exs.map(e => exRow(e, { axis: a.id })).join('') : '<div class="empty">لا توجد تمارين.</div>') + '<div style="margin-top:10px"><button class="btn btn-soft btn-sm" data-go="exEdit" data-id="new" data-axis="' + h(a.id) + '">➕ أضف تمرينًا لهذا المحور</button></div>' : '') + '</div></div>';
    });
    out += '</div>';
    const openAct = UIState.openAcc.has('acts');
    B('acts');
    out += '<div class="acc ' + (openAct ? 'open' : '') + '" style="--ac:#1F3A5F;--acg:' + tint('#1F3A5F', .08) + '"><div class="acc-head" data-act="acc" data-k="acts"><span class="aico">⚡</span><h3>قسم «أنشطة» <span class="muted num" style="font-size:12.5px">(' + Content.activities({ all: true }).length + ')</span></h3><span class="arrow">◀</span></div><div class="acc-body">' + (openAct ? Content.activities({ all: true }).map(e => exRow(e, { kind: 'activity' })).join('') : '') + '</div></div>';
    const sv = Content.survey({ all: true }); const openSv = UIState.openAcc.has('survey');
    B('survey');
    out += '<div class="acc ' + (openSv ? 'open' : '') + '" style="--ac:#C8702A;--acg:' + tint('#C8702A', .08) + '"><div class="acc-head" data-act="acc" data-k="survey"><span class="aico">🎓</span><h3>ختام البرنامج — ' + h(sv.title) + ' ' + tags(sv) + '</h3><span class="arrow">◀</span></div><div class="acc-body">' + (openSv ? exRow(sv, { kind: 'survey' }) : '') + '</div></div>';
    const L = Content.lab(); const openLab = UIState.openAcc.has('labAcc');
    B('lab');
    out += '<div class="acc ' + (openLab ? 'open' : '') + '" style="--ac:#0F6E8C;--acg:' + tint('#0F6E8C', .08) + '"><div class="acc-head" data-act="acc" data-k="labAcc"><span class="aico">🧪</span><h3>المختبر الختامي — ' + h(L.title) + ' ' + (L._modified ? '<span class="tag mod">معدَّل</span> ' : '') + (Content.isHidden('home_lab') ? '<span class="tag hid">مخفي من الرئيسية</span>' : '') + '</h3><span class="arrow">◀</span></div><div class="acc-body">' + (openLab ? '<div class="ex-row"><div class="top"><span class="nm"><span class="num">' + L.stages.length + '</span> مراحل × <span class="num">' + L.minutes + '</span> دقائق · <span class="num">' + Object.keys(Store.labAnswers || {}).length + '</span> مجموعة شاركت</span><button class="btn btn-soft btn-xs" data-go="labEdit">✏️ تعديل المختبر ومراحله</button>' + (L._modified ? '<button class="btn btn-ghost btn-xs" data-act="lab-reset-content">↺ استرجاع الافتراضي</button>' : '') + '<button class="btn btn-danger btn-xs" data-act="lab-clear">🧹 مسح إجابات ومؤقتات المختبر</button></div></div>' : '') + '</div></div>';
    B('reset');
    out += '<div class="tool danger-tool" style="min-height:0"><div class="th"><span class="ti" style="background:#FDECEC;color:#C62F35">⚠️</span><h4>إعادة ضبط شاملة — مسح جميع المدخلات من السيرفر</h4></div><div class="tb">يأخذ نسخة احتياطية تلقائيًا ثم يمسح كل مشاركات التمارين والأنشطة (عدا الاستطلاع الختامي)، ومؤقتات وإجابات المختبر، والتقييم القبلي والبعدي، وسجل الحضور، وقائمة المسجّلين والتعيينات، ويُلزم كل متصفح قديم بتسجيل اسم جديد. لا يمس المحتوى وتعديلاته.</div><div class="tf"><button class="btn btn-danger btn-sm" data-act="global-reset">مسح جميع المدخلات من السيرفر</button></div></div>';
    B(null);
    return Views.admin.shell(blocks);
  },
  homeEditor() {
    const s = Content.site();
    const f = (k, label, ph = '') => '<div class="field"><label>' + label + '</label><input data-home="' + k + '" data-keep="home-' + k + '" value="' + h(s[k] || '') + '" placeholder="' + h(ph) + '"></div>';
    return '<div class="grid2">' + f('headerTitle', 'عنوان الشريط العلوي') + f('headerSub', 'الوصف الفرعي للشريط العلوي') + '</div>' + f('heroTitle', 'العنوان الرئيسي للقسم البارز') +
      '<div class="field"><label>وصف القسم البارز</label>' + RTE.html('heroDesc', s.heroDesc) + '</div>' +
      '<div class="field"><label>صورة الغلاف (اختيارية — تركها فارغة يُبقي الرسم التوليدي)</label>' + ImgPick.html('heroImage', s.heroImage) + '</div>' +
      '<div class="field"><label>عدد المسجّلين المعروض في «مسجّل حتى الآن»</label><div class="row"><input type="number" min="0" data-keep="home-reg" id="regCountIn" value="' + (Number(Store.registered) || 0) + '" style="width:140px;border:1px solid var(--line);border-radius:10px;padding:8px"><button class="btn btn-soft btn-xs" data-act="reg-set">حفظ الرقم</button><button class="btn btn-danger btn-xs" data-act="reg-zero">تصفير</button></div><span class="help">عدّاد مستقل يزيد تلقائيًا مع كل تسجيل جديد، ولا يتأثر بمسح قائمة الأسماء.</span></div>' +
      '<h4 style="margin:10px 0">التذييل (يظهر في كل الصفحات)</h4><div class="grid2">' + f('footerName', 'الاسم') + f('footerUrl', 'الرابط الشخصي') + '</div>' + f('footerBio', 'التعريف') +
      '<div class="grid2">' + f('linkedin', 'LinkedIn', 'رابط الحساب') + f('x', 'X / تويتر', 'رابط الحساب') + f('instagram', 'Instagram', 'رابط الحساب') + f('whatsapp', 'واتساب', 'رقم دولي مثل 9665xxxxxxxx') + f('email', 'البريد الإلكتروني', 'name@example.com') + '</div>' +
      '<div class="row"><button class="btn btn-primary btn-sm" data-act="home-save">💾 حفظ الواجهة</button><button class="btn btn-ghost btn-sm" data-act="home-reset">↺ استرجاع الافتراضي</button></div>';
  },
  congratsEditor(kind) {
    const c = Content.doc(kind); const K = kind + '-';
    return '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px">رموز الاستبدال المتاحة داخل أي فقرة: {{name}} و{{courseTitle}} و{{date}}</p><div class="grid2"><div class="field"><label>العنوان</label><input data-cg="title" data-keep="' + K + 'title" value="' + h(c.title) + '"></div><div class="field"><label>الرمز / الإيموجي</label><input data-cg="emoji" data-keep="' + K + 'emoji" value="' + h(c.emoji) + '"></div></div>' +
      '<div class="field"><label>الفقرات</label><div data-cg-paras>' + c.paragraphs.map((p, i) => '<div class="row" style="margin-bottom:6px"><textarea data-cg-para rows="2" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:6px 8px;font-family:var(--f-body)">' + h(p) + '</textarea><button class="btn btn-danger btn-xs" data-act="cg-del-para">🗑</button></div>').join('') + '</div><button class="btn btn-soft btn-xs" data-act="cg-add-para">➕ فقرة</button></div>' +
      '<div class="grid2"><div class="field"><label>تذييل يمين</label><input data-cg="footerRight" data-keep="' + K + 'fr" value="' + h(c.footerRight) + '"></div><div class="field"><label>تذييل يسار</label><input data-cg="footerLeft" data-keep="' + K + 'fl" value="' + h(c.footerLeft) + '"></div></div>' +
      '<div class="field"><label>نص الإشعار أسفل ' + (kind === 'cert' ? 'الشهادة' : 'التهنئة') + '</label><textarea data-cg="notice" data-keep="' + K + 'notice" rows="2">' + h(c.notice) + '</textarea></div><div class="row"><button class="btn btn-primary btn-sm" data-act="cg-save" data-kind="' + kind + '">💾 حفظ</button><button class="btn btn-ghost btn-sm" data-act="cg-reset" data-kind="' + kind + '">↺ استرجاع الافتراضي</button></div>';
  },
  regEditor() {
    const fs = UIState.regDraft || RegFields.all(); UIState.regDraft = fs;
    return '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">الاسم الكامل إلزامي دائمًا. غيّر العنوان والنوع والخيارات، وأظهر أو أخفِ أي حقل، واجعله إلزاميًا أو اختياريًا، ورتّبه بـ ↑↓. الحقول المخفية لا تُحذف بياناتها السابقة.</p><div id="regRows">' +
      fs.map((f, i) => '<div class="reg-row" data-rrow="' + i + '"><div class="row"><span class="pill num">' + (i + 1) + '</span><input data-rr="label" data-keep="rr-' + f.key + '-label" value="' + h(f.label) + '" class="grow" style="min-width:160px">' +
        '<select data-rr="type" ' + (f.builtin ? 'disabled' : '') + '>' + Object.keys(REG_TYPES).map(t => '<option value="' + t + '" ' + (t === f.type ? 'selected' : '') + '>' + REG_TYPES[t] + '</option>').join('') + '</select>' +
        '<label class="sim-cb"><input type="checkbox" data-rr="visible" ' + (f.visible ? 'checked' : '') + ' ' + (f.key === 'name' ? 'disabled' : '') + '> ظاهر</label><label class="sim-cb"><input type="checkbox" data-rr="required" ' + (f.required ? 'checked' : '') + ' ' + (f.key === 'name' ? 'disabled' : '') + '> إلزامي</label>' +
        '<button class="btn btn-ghost btn-xs" data-act="rr-move" data-d="-1" data-i="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="btn btn-ghost btn-xs" data-act="rr-move" data-d="1" data-i="' + i + '" ' + (i === fs.length - 1 ? 'disabled' : '') + '>↓</button>' + (f.builtin ? '' : '<button class="btn btn-danger btn-xs" data-act="rr-del" data-i="' + i + '">🗑</button>') + '</div>' +
        '<div class="row" style="margin-top:6px"><input data-rr="ph" data-keep="rr-' + f.key + '-ph" value="' + h(f.ph || '') + '" placeholder="نص توضيحي داخل الحقل (اختياري)" class="grow"></div>' +
        (f.type === 'select' ? '<textarea data-rr="options" data-keep="rr-' + f.key + '-options" rows="3" placeholder="خيارات القائمة (سطر لكل خيار)" style="width:100%;margin-top:6px">' + h(f.options.join('\n')) + '</textarea>' : '') + '</div>').join('') + '</div>' +
      '<div class="row" style="margin-top:8px"><button class="btn btn-soft btn-xs" data-act="rr-add">➕ إضافة حقل</button><button class="btn btn-primary btn-sm" data-act="rr-save">💾 حفظ نموذج التسجيل</button><button class="btn btn-ghost btn-sm" data-act="rr-reset">↺ الافتراضي</button></div>';
  },
  privacyEditor() {
    const pv = Content.privacy();
    return '<div class="field"><label>نص إشعار الخصوصية</label><textarea id="pvText" data-keep="pv-text" rows="7">' + h(pv.text) + '</textarea></div><div class="field"><label>نص خانة الموافقة الإلزامية</label><input id="pvConsent" data-keep="pv-consent" value="' + h(pv.consent) + '"></div><div class="field"><label>نص موافقة التواصل للمتابعة (اختيارية)</label><input id="pvFollow" data-keep="pv-follow" value="' + h(pv.followup) + '"></div><div class="row"><button class="btn btn-primary btn-sm" data-act="pv-save">💾 حفظ</button><button class="btn btn-ghost btn-sm" data-act="pv-reset">↺ الافتراضي</button></div>';
  },
  guideEditor() {
    const g = Content.guide(); const dayTxt = d => d.map(x => [x.t, x.min, x.act, x.note].join(' | ')).join('\n');
    return '<div class="field"><label>أهداف البرنامج (سطر لكل هدف)</label><textarea id="gObj" data-keep="g-obj" rows="5">' + h(g.objectives.join('\n')) + '</textarea></div><div class="field"><label>المنهجية (سطر لكل بند)</label><textarea id="gMeth" data-keep="g-meth" rows="5">' + h(g.methodology.join('\n')) + '</textarea></div>' +
      [0, 1].map(i => '<div class="field"><label>جدول اليوم ' + (i + 1) + ' (سطر لكل فقرة: الوقت | الدقائق | النشاط | ملاحظة)</label><textarea id="gDay' + i + '" data-keep="g-day' + i + '" rows="8" dir="auto">' + h(dayTxt(g.days[i])) + '</textarea><span class="help num">المجموع: ' + g.days[i].reduce((a, b) => a + (+b.min || 0), 0) + ' دقيقة</span></div>').join('') +
      '<div class="row"><button class="btn btn-primary btn-sm" data-act="guide-save">💾 حفظ</button><button class="btn btn-ghost btn-sm" data-act="guide-reset">↺ استرجاع الافتراضي</button></div><p class="help muted" style="font-family:var(--f-ui);font-size:12.5px">مخرجات المحاور وملاحظات الشرائح تُعدَّل من صفحة تعديل كل محور.</p>';
  },
  attCtl() {
    const c = Attend.cfg();
    return '<div class="grid2"><div class="field"><label>عدد أيام البرنامج</label><input type="number" min="1" max="10" id="attDays" data-keep="att-days" value="' + c.days + '"></div><div class="field"><label>ساعات كل يوم</label><input type="number" min="1" max="12" id="attHours" data-keep="att-hours" value="' + c.hours + '"></div><div class="field"><label>نسبة الحضور المطلوبة للشهادة %</label><input type="number" min="0" max="100" id="attTh" data-keep="att-th" value="' + c.threshold + '"></div></div><button class="btn btn-soft btn-xs" data-act="att-cfg-save">💾 حفظ الإعدادات</button>' +
      '<h4 style="margin:14px 0 6px">تسجيل الحضور الذاتي برمز</h4><p class="help muted" style="font-family:var(--f-ui);font-size:12.5px">ولّد رمزًا لليوم واعرضه على الشاشة، ثم افتح التسجيل: يظهر للمتدربين شريط لإدخال الرمز، ويُسجَّل لمن يدخله حضور كامل لذلك اليوم (يمكنك تعديل الساعات يدويًا من «سجل الحضور»).</p>' +
      Attend.days().map(d => { const cd = c.codes['d' + d] || {}; const cnt = Object.keys(Store.users || {}).filter(u => Attend.hoursOf(u, d) > 0).length; return '<div class="att-row"><b>اليوم <span class="num">' + d + '</span></b><span class="att-code num notranslate" translate="no">' + h(cd.code || '— — — —') + '</span><button class="btn btn-soft btn-xs" data-act="att-code" data-d="' + d + '">🎲 رمز جديد</button><button class="btn btn-xs ' + (cd.open ? 'btn-danger' : 'btn-primary') + '" data-act="att-open" data-d="' + d + '" ' + (cd.code ? '' : 'disabled') + '>' + (cd.open ? '🔒 إغلاق التسجيل' : '🟢 فتح التسجيل') + '</button><button class="btn btn-ghost btn-xs" data-act="att-show" data-d="' + d + '" ' + (cd.code ? '' : 'disabled') + '>🖥 عرض الرمز بملء الشاشة</button><button class="btn btn-ghost btn-xs" data-act="att-all" data-d="' + d + '">✔ حضور كامل للجميع</button><span class="pill num">' + cnt + ' حاضر</span></div>'; }).join('');
  },
  attSheet() {
    const users = Store.users || {}; const uids = Object.keys(users).sort((a, b) => (users[a].name || '').localeCompare(users[b].name || '', 'ar')); const c = Attend.cfg();
    if (!uids.length) return '<div class="empty">لا يوجد مسجّلون.</div>';
    return '<div class="field"><input data-keep="att-search" data-filter=".att-person" placeholder="🔍 بحث بالاسم…"></div><div class="table-wrap"><table class="att-table"><thead><tr><th>المتدرب</th>' + Attend.days().map(d => '<th>اليوم <span class="num">' + d + '</span> (ساعات)</th>').join('') + '<th>النسبة</th><th>الشهادة</th></tr></thead><tbody>' +
      uids.map(u => '<tr class="att-person" data-name="' + h((users[u].name || '').toLowerCase()) + '"><td><b>' + h(users[u].name) + '</b><div class="muted" style="font-size:12px">' + h(users[u].role || '') + '</div></td>' + Attend.days().map(d => '<td><input type="number" min="0" max="' + c.hours + '" step="0.5" class="att-in num" data-att-u="' + h(u) + '" data-att-d="' + d + '" value="' + Attend.hoursOf(u, d) + '"></td>').join('') + '<td class="num"><b>' + Attend.pct(u) + '%</b></td><td>' + (Attend.eligible(u) ? '<span class="pill ok-pill">✔ مستحق</span>' : '<span class="pill">—</span>') + '</td></tr>').join('') + '</tbody></table></div><div class="row" style="margin-top:8px"><button class="btn btn-soft btn-xs" data-act="att-csv">⬇️ تصدير سجل الحضور CSV</button><button class="btn btn-danger btn-xs" data-act="att-clear">🧹 مسح سجل الحضور</button></div>';
  },
  assessResults() {
    const A = Content.assess(); const pq = Assess.perQuestion('pre'), qq = Assess.perQuestion('post');
    const pre = {}; Assess.list('pre').forEach(x => { pre[x.uid] = x; }); const post = {}; Assess.list('post').forEach(x => { post[x.uid] = x; });
    const uids = Object.keys(Object.assign({}, pre, post)); const n = A.items.length;
    let out = '<h4 style="margin:4px 0 8px">نسبة الإجابة الصحيحة لكل سؤال</h4><div class="q-compare">' + A.items.map((it, i) => '<div class="qc-row"><span class="qn num">' + (i + 1) + '</span><span class="grow qc-q">' + h(clip(it.q, 90)) + '</span><span class="qc-bars"><span class="qc-bar pre" style="width:' + (pq[i] || 0) + '%"></span><span class="qc-bar post" style="width:' + (qq[i] || 0) + '%"></span></span><span class="num qc-v">' + (pq[i] == null ? '—' : pq[i] + '%') + ' ← ' + (qq[i] == null ? '—' : qq[i] + '%') + '</span></div>').join('') + '</div><div class="muted" style="font-family:var(--f-ui);font-size:12px;margin-top:4px">■ قبلي (فاتح) · ■ بعدي (داكن)</div>';
    out += '<h4 style="margin:14px 0 8px">النتائج الفردية <span class="pill num">' + uids.length + '</span></h4>' + (uids.length ? '<div class="table-wrap"><table class="att-table"><thead><tr><th>المتدرب</th><th>القبلي</th><th>البعدي</th><th>التغير</th></tr></thead><tbody>' + uids.map(u => { const a = pre[u], b = post[u]; const nm = (a || b).name || ((Store.users || {})[u] || {}).name || ''; return '<tr><td>' + h(nm) + '</td><td class="num">' + (a ? a.score + '/' + n : '—') + '</td><td class="num">' + (b ? b.score + '/' + n : '—') + '</td><td class="num"><b>' + (a && b ? ((b.score - a.score) >= 0 ? '+' : '') + (b.score - a.score) : '—') + '</b></td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="empty">لا توجد إجابات بعد.</div>');
    return out + '<div class="row" style="margin-top:10px"><button class="btn btn-danger btn-xs" data-act="as-clear" data-ph="pre">🧹 مسح نتائج القبلي</button><button class="btn btn-danger btn-xs" data-act="as-clear" data-ph="post">🧹 مسح نتائج البعدي</button></div>';
  },
  landingEditor() {
    const ord = Landing.order(); const F = { kicker: 'السطر الصغير', title: 'العنوان', sub: 'الوصف', cta: 'نص الزر الرئيسي', cta2: 'نص الزر الثانوي' };
    return '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">أول ما يراه الزائر قبل التسجيل، وينتهي بزر «الدخول للمنصة التعليمية» الذي يفتح نموذج التسجيل. العناصر تُكتب سطرًا لكل عنصر بصيغة: <b>أيقونة | عنوان | وصف</b>. قسم «المحتوى» يُبنى تلقائيًا من المحاور والوحدات.</p><div class="row" style="margin-bottom:10px"><button class="btn btn-primary btn-sm" data-go="landing">👁 معاينة الصفحة التعريفية</button></div>' +
      ord.map((k, i) => { const sc = Landing.sec(k); const hid = Landing.hidden(k); const open = UIState.openDrop.has('lp_' + k);
        const fields = Object.keys(F).filter(f => f in DEFAULT_LANDING[k]).map(f => '<div class="field"><label>' + F[f] + (k === 'hero' && f === 'title' ? ' (فارغ = عنوان البرنامج)' : '') + '</label>' + (f === 'sub' ? '<textarea rows="3" id="lp_' + k + '_' + f + '" data-keep="lp-' + k + '-' + f + '">' + h(sc[f] || '') + '</textarea>' : '<input id="lp_' + k + '_' + f + '" data-keep="lp-' + k + '-' + f + '" value="' + h(sc[f] || '') + '">') + '</div>').join('') +
          ('items' in DEFAULT_LANDING[k] ? '<div class="field"><label>' + (k === 'logos' ? 'الأسماء (سطر لكل اسم)' : k === 'objectives' ? 'الأهداف (سطر لكل هدف — فارغ = أهداف دليل المدرب)' : 'العناصر: أيقونة | عنوان | وصف') + '</label><textarea rows="' + (k === 'logos' ? 6 : 7) + '" id="lp_' + k + '_items" data-keep="lp-' + k + '-items" style="font-family:var(--f-ui);font-size:13px">' + h(k === 'objectives' && !sc.items ? '' : sc.items || '') + '</textarea></div>' : '');
        return '<div class="sec-row" style="flex-wrap:wrap"><span class="grow"><b>' + h(LANDING_NAMES[k]) + '</b>' + (sc._modified ? ' <span class="tag mod">معدّل</span>' : '') + (hid ? ' <span class="tag hid">مخفي</span>' : '') + '</span>' +
          '<button class="btn btn-ghost btn-xs" data-act="lp-move" data-d="-1" data-k="' + k + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="btn btn-ghost btn-xs" data-act="lp-move" data-d="1" data-k="' + k + '" ' + (i === ord.length - 1 ? 'disabled' : '') + '>↓</button>' +
          '<button class="btn btn-soft btn-xs" data-act="drop" data-k="lp_' + k + '">' + (open ? 'إغلاق' : '✏️ تعديل') + '</button><button class="btn btn-ghost btn-xs" data-act="lp-vis" data-k="' + k + '">' + (hid ? '👁 إظهار' : '🙈 إخفاء') + '</button></div>' +
          (open ? '<div class="card pad" style="margin:6px 0 12px">' + fields + '<div class="row"><button class="btn btn-primary btn-sm" data-act="lp-save" data-k="' + k + '">💾 حفظ</button>' + (sc._modified ? '<button class="btn btn-ghost btn-sm" data-act="lp-reset" data-k="' + k + '">↺ استرجاع الافتراضي</button>' : '') + '</div></div>' : ''); }).join('') +
      '<div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="lp-reset-order">↺ الترتيب الافتراضي</button></div>';
  },
  sectionsList() {
    const list = Content.homeSections({ all: true });
    const lay = HomeNav.layout();
    return '<div class="layout-pick"><span class="lp-lbl">تخطيط الرئيسية:</span><button class="lp-opt ' + (lay === 'sidebar' ? 'on' : '') + '" data-act="home-layout" data-v="sidebar">▤ قائمة جانبية <small>كل قسم يُعرض عند الضغط على عنوانه</small></button><button class="lp-opt ' + (lay === 'classic' ? 'on' : '') + '" data-act="home-layout" data-v="classic">☰ صفحة طويلة <small>كل الأقسام متتالية (التخطيط السابق)</small></button></div>' +
      '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">القسم البارز (العنوان والوصف والإحصاءات) يبقى أعلى الصفحة دائمًا. رتّب بقية الأقسام بالسحب أو ↑↓، وأخفِ ما لا تريده، وأضف أقسامًا جديدة (نص، فيديو، صورة وإعلان، زر رابط).</p><div id="secList">' +
      list.map((x, i) => '<div class="sec-row" draggable="true" data-sec-drag="' + h(x.key) + '"><span class="drag-handle">⠿</span><span style="font-size:18px">' + h(x.icon || (x.type === 'video' ? '🎬' : x.type === 'image' ? '🖼️' : x.type === 'cta' ? '🔗' : '📝')) + '</span><span class="grow"><b>' + h(stripHtml(x.title) || (x.key === 'lab' ? Content.lab().title : '') || '(بدون عنوان)') + '</b> <span class="tag fmt">' + (x.builtin ? 'قسم أساسي' : 'مضاف · ' + h(SECTION_TYPES[x.type] || '')) + '</span>' + (x._hidden ? ' <span class="tag hid">مخفي</span>' : '') + '</span>' +
        '<button class="btn btn-ghost btn-xs" data-act="sec-move" data-d="-1" data-k="' + h(x.key) + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="btn btn-ghost btn-xs" data-act="sec-move" data-d="1" data-k="' + h(x.key) + '" ' + (i === list.length - 1 ? 'disabled' : '') + '>↓</button>' +
        '<button class="btn btn-soft btn-xs" data-go="secEdit" data-id="' + h(x.key) + '">✏️ تعديل</button><button class="btn btn-ghost btn-xs" data-act="toggle-vis" data-id="home_' + h(x.key) + '">' + (x._hidden ? '👁 إظهار' : '🙈 إخفاء') + '</button>' +
        (x.builtin ? '' : '<button class="btn btn-ghost btn-xs" data-act="sec-copy" data-k="' + h(x.key) + '">🧬 نسخ</button><button class="btn btn-danger btn-xs" data-act="sec-del" data-k="' + h(x.key) + '">🗑 حذف</button>') + '</div>').join('') + '</div>' +
      '<div class="row" style="margin-top:10px"><select id="newSecType" style="border:1px solid var(--line);border-radius:10px;padding:7px">' + Object.keys(SECTION_TYPES).map(k => '<option value="' + k + '">' + SECTION_TYPES[k] + '</option>').join('') + '</select><button class="btn btn-primary btn-sm" data-act="sec-add">➕ إضافة قسم جديد</button><button class="btn btn-ghost btn-sm" data-act="sec-reset-order">↺ الترتيب الافتراضي</button></div>';
  },
  unitsEditor() {
    return '<p class="help muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">تظهر هذه العناوين في الرئيسية قبل محاور كل وحدة، وعلى بطاقات المحاور وملفات PDF. اختر وحدة كل محور من صفحة تعديله.</p>' +
      UNIT_IDS.map(n => '<div class="grid2 unit-ed"><div class="field"><label>السطر الصغير (' + h(UNIT_KICKERS[n]) + ')</label><input data-unit-k="' + n + '" data-keep="unit-k-' + n + '" value="' + h(Content.unitKicker(n)) + '"></div><div class="field"><label>عنوان الوحدة</label><input data-unit-n="' + n + '" data-keep="unit-n-' + n + '" value="' + h(Content.unitName(n)) + '"></div></div>').join('') +
      '<div class="row"><button class="btn btn-primary btn-sm" data-act="units-save">💾 حفظ أسماء الوحدات</button><button class="btn btn-ghost btn-sm" data-act="units-reset">↺ استرجاع الافتراضي</button></div>';
  },
  pdfEditor() {
    const p = Content.pdf();
    const f = (k, l, ph = '') => '<div class="field"><label>' + l + '</label><input data-pdf="' + k + '" data-keep="pdf-' + k + '" value="' + h(p[k] || '') + '" placeholder="' + h(ph) + '"></div>';
    return '<label class="row" style="font-family:var(--f-ui);font-weight:700;margin-bottom:10px"><input type="checkbox" id="pdfEnabled" ' + (p.enabled !== false ? 'checked' : '') + '> إتاحة زر «استخراج المحتوى» للمتدربين</label>' +
      '<div class="grid2">' + f('coverTitle', 'عنوان الغلاف الأمامي', 'يُقرأ من عنوان الدورة إن تُرك فارغًا') + f('coverSub', 'وصف الغلاف الأمامي') + f('trainerName', 'اسم المدرّب (الغلاف الخلفي)') + f('trainerRole', 'المسمى') + '</div>' + f('trainerBio', 'نبذة') + f('trainerContact', 'وسيلة تواصل (اختيارية)') +
      '<button class="btn btn-primary btn-sm" data-act="pdf-save">💾 حفظ بيانات الملف</button>';
  },
  after(root) {
    RTE.mount(root); ImgPick.mount(root); Views.admin.afterNav(root);
    // السحب والإفلات لترتيب المحاور
    let dragId = null;
    $$('[data-axis-drag]', root).forEach(el => {
      el.addEventListener('dragstart', e => { dragId = el.getAttribute('data-axis-drag'); el.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (er) {} });
      el.addEventListener('dragend', () => { el.classList.remove('dragging'); $$('.drop-target', root).forEach(x => x.classList.remove('drop-target')); });
      el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drop-target'); });
      el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
      el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drop-target'); const target = el.getAttribute('data-axis-drag'); if (!dragId || dragId === target) return; const ids = Content.axisIds().filter(x => x !== dragId); ids.splice(ids.indexOf(target), 0, dragId); DB.set('order/axes', ids); UI.toast('تم حفظ الترتيب الجديد'); });
    });
    let secDrag = null;
    $$('[data-sec-drag]', root).forEach(el => {
      el.addEventListener('dragstart', e => { secDrag = el.getAttribute('data-sec-drag'); el.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', secDrag); } catch (er) {} });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drop-target'); });
      el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
      el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drop-target'); const target = el.getAttribute('data-sec-drag'); if (!secDrag || secDrag === target) return; const ids = Content.homeSections({ all: true }).map(x => x.key).filter(x => x !== secDrag); ids.splice(ids.indexOf(target), 0, secDrag); DB.set('site/homeOrder', ids); UI.toast('تم حفظ ترتيب الأقسام'); });
    });
    // تعديل ساعات الحضور مباشرة من الجدول
    $$('[data-att-u]', root).forEach(inp => inp.addEventListener('change', () => { const v = Math.max(0, Math.min(Attend.cfg().hours, parseFloat(inp.value) || 0)); DB.set('attendance/' + inp.getAttribute('data-att-u') + '/d' + inp.getAttribute('data-att-d'), v || null); }));
  }
};

// ============ نموذج المحور ============
const FormState = { slides: [], items: [], axisId: null, exId: null, format: 'text' };
function slideEditorHtml(s, i, n) {
  const k = 's' + i; const t = s.type || 'principle';
  let f = '<div class="slide-editor" data-se="' + i + '"><div class="se-head"><span class="pill num">' + (i + 1) + '</span><select data-sf="type" style="border:1px solid var(--line);border-radius:10px;padding:6px">' + Object.keys(SLIDE_TYPES).map(x => '<option value="' + x + '" ' + (x === t ? 'selected' : '') + '>' + SLIDE_TYPES[x] + '</option>').join('') + '</select><span class="grow"></span>' +
    '<button type="button" class="btn btn-ghost btn-xs" data-act="se-up" data-i="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button type="button" class="btn btn-ghost btn-xs" data-act="se-down" data-i="' + i + '" ' + (i === n - 1 ? 'disabled' : '') + '>↓</button><button type="button" class="btn btn-danger btn-xs" data-act="se-del" data-i="' + i + '">🗑 حذف الشريحة</button></div>' +
    '<div class="field"><label>عنوان الشريحة</label><input data-sf="title" value="' + h(s.title || '') + '"></div>';
  if (t === 'opening' || t === 'summary') f += '<div class="field"><label>النص الرئيسي</label>' + RTE.html(k + 'text', s.text) + '</div><div class="field"><label>قاعدة تذكّرها</label>' + RTE.html(k + 'rule', s.rule) + '</div>';
  else if (t === 'principle') f += '<div class="field"><label>مقدمة المبدأ العلمي</label>' + RTE.html(k + 'intro', s.intro) + '</div><div class="field"><label>النقاط (سطر لكل نقطة)</label><textarea data-sf="points" rows="5">' + h(arr(s.points).join('\n')) + '</textarea><span class="help">المصطلح قبل «:» أو «—» يُبرز تلقائيًا.</span></div><div class="field"><label>جملة الربط / الرسالة</label>' + RTE.html(k + 'rule', s.rule) + '</div>';
  else if (SK_TYPES.indexOf(t) > -1) {
    const help = { hook: 'غير مستخدم في هذا النمط', myth: 'الخرافة :: الحقيقة', scenario: 'الخيار :: التعليق عليه — ضع * قبل الخيار الأفضل', numbers: 'الرقم :: ما يعنيه :: المصدر (اختياري)', framework: 'الحرف أو الرمز :: الكلمة :: الشرح', checklist: 'البند :: توضيح (اختياري)', versus: 'العنصر :: قبل :: بعد التحسين', journey: 'أيقونة :: المرحلة :: الشرح' }[t];
    const lbl = { hook: 'النص', scenario: 'وصف الموقف' }[t];
    if (t === 'hook' || t === 'framework') f += '<div class="grid2"><div class="field"><label>' + (t === 'hook' ? 'الرقم الكبير (مثال: 70%)' : 'اسم الإطار (مثال: S.C.O.P.E)') + '</label><input data-sf="big" value="' + h(s.big || '') + '"></div>' + (t === 'hook' ? '<div class="field"><label>ما يعنيه الرقم</label><input data-sf="label" value="' + h(s.label || '') + '"></div>' : '<div></div>') + '</div>';
    f += lbl ? '<div class="field"><label>' + lbl + '</label>' + RTE.html(k + 'text', s.text) + '</div>' : '<div class="field"><label>مقدمة (اختيارية)</label>' + RTE.html(k + 'intro', s.intro) + '</div>';
    if (t !== 'hook') f += '<div class="field"><label>العناصر (سطر لكل عنصر بصيغة: ' + help + ')</label><textarea data-sf="items" rows="6">' + h(arr(s.items).join('\n')) + '</textarea></div>';
    if (t === 'hook' || t === 'numbers') f += '<div class="field"><label>المصدر (اختياري)</label><input data-sf="src" value="' + h(s.src || '') + '"></div>';
    f += '<div class="field"><label>' + (t === 'hook' ? 'سؤال للقاعة' : t === 'scenario' ? 'الخلاصة (تظهر بعد الاختيار)' : 'الفكرة الذهبية (اختيارية)') + '</label>' + RTE.html(k + 'rule', s.rule) + '</div>';
  }
  else f += '<div class="field"><label>' + (t === 'mistakes' ? 'الأخطاء وتصحيحاتها' : t === 'tools' ? 'الأدوات واستخداماتها' : 'الأمثلة') + ' (سطر لكل عنصر، بصيغة: العنوان :: التفصيل)</label><textarea data-sf="items" rows="5">' + h(arr(s.items).map(x => String(x).replace('::', ' :: ')).join('\n')) + '</textarea></div><div class="field"><label>الرسالة (اختيارية)</label>' + RTE.html(k + 'rule', s.rule) + '</div>';
  f += '<div class="field"><label>صورة الشريحة (اختيارية، تظهر أعلى محتواها)</label>' + ImgPick.html(k + 'img', s.image) + '</div>' +
    '<div class="grid2"><div class="field"><label>رابط مصدر للتوسع (اختياري)</label><input data-sf="srcUrl" value="' + h(s.srcUrl || '') + '" placeholder="https://"></div><div class="field"><label>نص الرابط</label><input data-sf="srcLabel" value="' + h(s.srcLabel || '') + '" placeholder="مصدر للتوسع"></div></div>' +
    '<div class="field"><label>رابط فيديو (يوتيوب أو Google Drive)</label><input data-sf="videoUrl" value="' + h(s.videoUrl || '') + '" placeholder="الصق رابط المشاركة كما هو"></div>' +
    '<div class="field"><label>🎤 ملاحظات المدرب لهذه الشريحة (تظهر للأدمن فقط وفي دليل المدرب)</label><textarea data-sf="note" rows="2">' + h(s.note || '') + '</textarea></div>' +
    (s.chart ? '<div class="notice" style="margin-top:0">📊 لهذه الشريحة رسم بياني مبني في الكود؛ يبقى كما هو ولا يُعدَّل من هنا.</div>' : '') + '</div>';
  return f;
}
function collectSlides(root) {
  return $$('[data-se]', root).map(box => {
    const i = +box.getAttribute('data-se'); const k = 's' + i; const old = FormState.slides[i] || {};
    const g = n => { const el = $('[data-sf="' + n + '"]', box); return el ? el.value : ''; };
    const t = g('type') || old.type; const s = { id: old.id || genId('sl'), type: t, title: g('title').trim() };
    if (t === 'opening' || t === 'summary') { s.text = RTE.val(box, k + 'text'); s.rule = RTE.val(box, k + 'rule'); }
    else if (t === 'principle') { s.intro = RTE.val(box, k + 'intro'); s.points = g('points').split('\n').map(x => x.trim()).filter(Boolean); s.rule = RTE.val(box, k + 'rule'); }
    else if (SK_TYPES.indexOf(t) > -1) {
      if (t === 'hook' || t === 'scenario') s.text = RTE.val(box, k + 'text'); else s.intro = RTE.val(box, k + 'intro');
      if (t !== 'hook') s.items = g('items').split('\n').map(x => x.trim()).filter(Boolean).map(x => x.replace(/\s*::\s*/g, ' :: '));
      ['big', 'label', 'src'].forEach(x => { const el = $('[data-sf="' + x + '"]', box); if (el) s[x] = el.value.trim(); });
      s.rule = RTE.val(box, k + 'rule');
    }
    else { s.items = g('items').split('\n').map(x => x.trim()).filter(Boolean).map(x => x.replace(/\s*::\s*/, '::')); s.rule = RTE.val(box, k + 'rule'); }
    // الحقول الخاصة بالأنواع الأخرى تُحفظ من الحالة القديمة عند تبديل النوع حتى لا تضيع
    ['text', 'intro', 'points', 'items', 'rule', 'big', 'label', 'src'].forEach(x => { if (s[x] === undefined && old[x] !== undefined) s[x] = old[x]; });
    s.note = g('note').trim(); s.image = ImgPick.val(k + 'img'); s.srcUrl = g('srcUrl').trim(); s.srcLabel = g('srcLabel').trim(); s.videoUrl = g('videoUrl').trim();
    if (old.chart) s.chart = old.chart;
    return s;
  });
}
Views.axisEdit = {
  html() {
    const id = Router.cur.id; const isNew = id === 'new'; const a = isNew ? { title: '', classic: '', desc: '', duration: '', highlights: [], icon: 'star', slides: [], unit: 0 } : Content.axis(id);
    if (!a) return adminHeader('تعديل محور') + '<div class="empty">المحور غير موجود.</div>';
    if (FormState.axisId !== id) { FormState.axisId = id; FormState.slides = isNew ? ['opening', 'principle', 'examples', 'mistakes', 'tools', 'summary'].map(t => ({ type: t, title: '' })) : a.slides.map(s => Object.assign({}, s)); }
    const col = isNew ? AXIS_COLORS[Content.axisIds().length % AXIS_COLORS.length] : Content.color(a);
    let out = adminHeader(isNew ? '➕ محور جديد' : '✏️ تعديل المحور') + Layout.crumbs() + '<div class="form-page" style="--ac:' + col + '">' +
      '<div class="card pad"><div class="grid2"><div class="field"><label>العنوان (الإبداعي)</label><input id="axTitle" data-keep="ax-title" value="' + h(a.title) + '"></div><div class="field"><label>العنوان التقليدي (اختياري)</label><input id="axClassic" data-keep="ax-classic" value="' + h(a.classic || '') + '"></div></div>' +
      '<div class="field"><label>الوصف</label>' + RTE.html('axDesc', a.desc) + '</div>' +
      '<div class="grid2"><div class="field"><label>المدة</label><input id="axDur" data-keep="ax-dur" value="' + h(a.duration || '') + '" placeholder="مثال: 90 دقيقة"></div><div class="field"><label>الأيقونة</label><select id="axIcon">' + AXIS_ICON_CHOICES.map(x => '<option value="' + x + '" ' + (x === a.icon ? 'selected' : '') + '>' + x + '</option>').join('') + '</select><span id="axIconPrev" style="display:inline-flex;margin-top:6px;width:44px;height:44px;border-radius:12px;background:' + col + ';align-items:center;justify-content:center">' + iconSvg(a.icon || 'star', 24, '#fff') + '</span></div></div>' +
      '<div class="field"><label>الوحدة التي ينتمي إليها المحور</label><select id="axUnit">' + ['<option value="0">بدون وحدة (محاور إضافية)</option>'].concat(UNIT_IDS.map(n => '<option value="' + n + '" ' + (+a.unit === n ? 'selected' : '') + '>' + h(Content.unitKicker(n) + ' — ' + Content.unitName(n)) + '</option>')).join('') + '</select></div>' +
      '<div class="field"><label>🎯 مخرج التعلم (يظهر في دليل المدرب)</label><input id="axOutcome" data-keep="ax-out" value="' + h(a.outcome || '') + '"></div>' +
      '<div class="field"><label>أبرز النقاط (سطر لكل نقطة)</label><textarea id="axHl" data-keep="ax-hl" rows="4">' + h(arr(a.highlights).join('\n')) + '</textarea></div>' +
      '<div class="field"><label>صورة المحور (اختيارية — تظهر في بطاقته بالرئيسية بدل الرسم التلقائي)</label>' + ImgPick.html('axImg', a.image) + '</div>' +
      '<div class="notice">🖼 تُضغط الصور تلقائيًا عند الرفع (حتى 1600 بكسل بصيغة WebP) وتُحفظ في مسار مستقل يُحمَّل عند الحاجة فقط، فلا تُبطئ مزامنة المحتوى (حد الرفع 5 ميجابايت للصورة الأصلية).<br>📊 الرسوم البيانية داخل الشرائح ليست جزءًا من هذا التعديل في هذه النسخة، وتبقى قابلة للتعديل عبر الكود فقط.</div></div>' +
      '<h3 style="margin:22px 0 10px">🎞️ الشرائح <span class="pill num">' + FormState.slides.length + '</span></h3><div id="slidesEd">' + FormState.slides.map((s, i) => slideEditorHtml(s, i, FormState.slides.length)).join('') + '</div>' +
      '<div class="row"><select id="newSlideType" style="border:1px solid var(--line);border-radius:10px;padding:8px">' + Object.keys(SLIDE_TYPES).map(x => '<option value="' + x + '">' + SLIDE_TYPES[x] + '</option>').join('') + '</select><button class="btn btn-soft btn-sm" data-act="se-add">➕ إضافة شريحة</button></div>';
    if (!isNew) {
      const exs = Content.exercisesOf(id, { all: true });
      out += '<h3 style="margin:26px 0 10px">✍️ تمارين هذا المحور <span class="pill num">' + exs.length + '</span></h3><div class="card pad">' + (exs.length ? exs.map(e => exRow(e, { axis: id })).join('') : '<div class="empty">لا توجد تمارين بعد.</div>') + '<div style="margin-top:10px"><button class="btn btn-primary btn-sm" data-go="exEdit" data-id="new" data-axis="' + h(id) + '" data-from="axisEdit">➕ أضف تمرينًا لهذا المحور</button></div></div>';
    }
    out += '<div class="sticky-actions"><button class="btn btn-primary" data-act="axis-save">💾 حفظ المحور</button><button class="btn btn-ghost" data-act="form-cancel">إلغاء</button></div></div>';
    return out;
  },
  after(root) {
    RTE.mount(root); ImgPick.mount(root);
    const sel = $('#axIcon', root); if (sel) sel.addEventListener('change', () => { $('#axIconPrev', root).innerHTML = iconSvg(sel.value, 24, '#fff'); });
    $$('[data-sf="type"]', root).forEach(s => s.addEventListener('change', () => { FormState.slides = collectSlides(root); Views.axisEdit.reslides(root); }));
  },
  reslides(root) {
    const box = $('#slidesEd', root); box.innerHTML = FormState.slides.map((s, i) => slideEditorHtml(s, i, FormState.slides.length)).join('');
    RTE.mount(box); ImgPick.mount(box);
    $$('[data-sf="type"]', box).forEach(s => s.addEventListener('change', () => { FormState.slides = collectSlides(root); Views.axisEdit.reslides(root); }));
  },
  async save(root) {
    const id = Router.cur.id; const isNew = id === 'new';
    const slides = collectSlides(root).map(s => { const o = Object.assign({}, s); delete o.chart; return o; });
    const data = { title: $('#axTitle', root).value.trim(), classic: $('#axClassic', root).value.trim(), desc: RTE.val(root, 'axDesc'), duration: $('#axDur', root).value.trim(), icon: $('#axIcon', root).value, highlights: $('#axHl', root).value.split('\n').map(x => x.trim()).filter(Boolean), image: ImgPick.val('axImg'), unit: +(($('#axUnit', root) || {}).value || 0), outcome: (($('#axOutcome', root) || {}).value || '').trim(), slides };
    if (!data.title) { UI.alert('اكتب عنوان المحور أولًا.'); return; }
    if (isNew) {
      const nid = 'x' + genId(); data.ts = DB.now(); data.color = Content.axisIds().length % AXIS_COLORS.length; data.scene = 'idea';
      await DB.set('added/axes/' + nid, data); UI.toast('✅ تم إنشاء المحور — أضف تمارينه الآن');
      FormState.axisId = null; Router.go('axisEdit', { id: nid }, { replace: true });
    } else if (DEF_AXIS[id]) { await DB.set('content/axes/' + id, data); UI.toast('✅ حُفظ التعديل ونُشر حيًا'); FormState.axisId = null; Router.go('admin'); }
    else { const cur = Store.addedAxes[id] || {}; await DB.set('added/axes/' + id, Object.assign({}, cur, data)); UI.toast('✅ حُفظ التعديل ونُشر حيًا'); FormState.axisId = null; Router.go('admin'); }
  }
};

// ============ نموذج التمرين / النشاط ============
function itemsEditorHtml(fmt, items) {
  if (fmt === 'text') return '';
  const row = (i, inner) => '<div class="item-editor" data-it="' + i + '"><div class="row" style="margin-bottom:6px"><span class="pill num">' + (i + 1) + '</span><span class="grow"></span><button type="button" class="btn btn-danger btn-xs" data-act="it-del" data-i="' + i + '">🗑 حذف</button></div>' + inner + '</div>';
  let out = '<h4 style="margin:14px 0 8px">عناصر النموذج التفاعلي</h4>';
  out += items.map((it, i) => {
    if (fmt === 'mcq') return row(i, '<div class="field"><label>السؤال</label><input data-if="q" value="' + h(it.q || '') + '"></div><div class="field"><label>الخيارات (سطر لكل خيار)</label><textarea data-if="options" rows="4">' + h(arr(it.options).join('\n')) + '</textarea></div><div class="field"><label>رقم الخيار الصحيح (1، 2، 3...)</label><input type="number" min="1" data-if="answer" value="' + ((+it.answer || 0) + 1) + '"></div>');
    if (fmt === 'truefalse') return row(i, '<div class="field"><label>العبارة</label><input data-if="q" value="' + h(it.q || '') + '"></div><div class="field"><label>الإجابة الصحيحة</label><select data-if="answer"><option value="true" ' + (it.answer ? 'selected' : '') + '>صح</option><option value="false" ' + (!it.answer ? 'selected' : '') + '>خطأ</option></select></div>');
    if (fmt === 'fillblank') return row(i, '<div class="field"><label>الجملة (ضع ___ مكان الفراغ)</label><input data-if="text" value="' + h(it.text || '') + '"></div><div class="field"><label>الكلمة الصحيحة (تُضاف إلى بنك الكلمات)</label><input data-if="answer" value="' + h(it.answer || '') + '"></div>');
    if (fmt === 'comparePairs') return row(i, '<div class="grid2"><div class="field"><label>العبارة (أ)</label><textarea data-if="a" rows="2">' + h(it.a || '') + '</textarea></div><div class="field"><label>العبارة (ب)</label><textarea data-if="b" rows="2">' + h(it.b || '') + '</textarea></div></div><div class="field"><label>الأدق</label><select data-if="answer"><option value="a" ' + (it.answer === 'a' ? 'selected' : '') + '>(أ)</option><option value="b" ' + (it.answer !== 'a' ? 'selected' : '') + '>(ب)</option></select></div>');
    return '';
  }).join('');
  return out + '<button type="button" class="btn btn-soft btn-sm" data-act="it-add">➕ أضف عنصرًا جديدًا</button>';
}
function collectItems(root, fmt) {
  return $$('[data-it]', root).map(box => {
    const g = n => { const el = $('[data-if="' + n + '"]', box); return el ? el.value : ''; };
    if (fmt === 'mcq') { const opts = g('options').split('\n').map(x => x.trim()).filter(Boolean); return { q: g('q').trim(), options: opts, answer: Math.max(0, Math.min(opts.length - 1, (parseInt(g('answer'), 10) || 1) - 1)) }; }
    if (fmt === 'truefalse') return { q: g('q').trim(), answer: g('answer') === 'true' };
    if (fmt === 'fillblank') { let t = g('text').trim(); if (t.indexOf('___') === -1) t += ' ___'; return { text: t, answer: g('answer').trim() }; }
    if (fmt === 'comparePairs') return { a: g('a').trim(), b: g('b').trim(), answer: g('answer') === 'a' ? 'a' : 'b' };
    return {};
  });
}
function exFormHtml(kind) {
  const id = Router.cur.id; const isNew = id === 'new';
  const e = isNew ? { title: '', icon: kind === 'activity' ? '⚡' : '✍️', mode: 'individual', format: 'text', scenario: '', principle: '', steps: [], task: '', hint: '', why: '', model: '', items: [] } : Content.ex(id);
  if (!e) return adminHeader('تعديل') + '<div class="empty">غير موجود.</div>';
  const isSurvey = e.kind === 'survey'; const isAct = kind === 'activity' || e.kind === 'activity';
  if (FormState.exId !== id) { FormState.exId = id; FormState.format = e.format || 'text'; FormState.items = arr(e.items).map(x => Object.assign({}, x)); }
  const fmt = FormState.format; const locked = FORMAT_MODE[fmt];
  const axId = isNew ? Router.cur.axis : Content.axisOfEx(id);
  let out = adminHeader(isNew ? (isAct ? '➕ نشاط جديد' : '➕ تمرين جديد') : (isSurvey ? '✏️ تعديل الاستطلاع الختامي' : isAct ? '✏️ تعديل النشاط' : '✏️ تعديل التمرين')) + Layout.crumbs(axId ? '<span class="crumb-tag">' + h(Content.axis(axId) ? Content.axis(axId).title : '') + '</span>' : '') + '<div class="form-page"><div class="card pad">' +
    '<div class="grid2"><div class="field"><label>العنوان</label><input id="exTitle" data-keep="ex-title" value="' + h(e.title) + '"></div><div class="field"><label>الأيقونة</label><div class="icon-in"><input id="exIcon" data-keep="ex-icon" data-iconpick value="' + h(e.icon || '') + '">' + IconPick.btn(e.icon) + '</div></div></div>';
  if (!isSurvey) {
    out += '<div class="grid2"><div class="field"><label>نموذج الإجابة</label><select id="exFormat">' + Object.keys(FORMATS).map(x => '<option value="' + x + '" ' + (x === fmt ? 'selected' : '') + '>' + FORMATS[x] + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>نوع العمل</label><select id="exMode" ' + (locked ? 'disabled' : '') + '><option value="individual" ' + ((locked || e.mode) === 'individual' ? 'selected' : '') + '>فردي</option><option value="group" ' + ((locked || e.mode) === 'group' ? 'selected' : '') + '>جماعي</option></select>' + (locked ? '<span class="help">🔒 مقفل تلقائيًا على «' + (locked === 'group' ? 'جماعي' : 'فردي') + '» ليتوافق مع آلية هذا النموذج.</span>' : '') + '</div></div>';
    out += '<div class="field" id="simField" ' + (fmt === 'sim' ? '' : 'style="display:none"') + '><label>نوع المحاكاة</label><select id="exSim">' + Object.keys(SIM_TYPES).map(k => '<option value="' + k + '" ' + (k === (e.sim || 'store') ? 'selected' : '') + '>' + SIM_TYPES[k] + '</option>').join('') + '</select><span class="help">المحاكاة تعمل بنموذج مبني في الكود؛ يمكنك تعديل النصوص حولها ونوع العمل.</span></div>';
    out += '<div class="field"><label>السيناريو / الموقف' + (isAct ? ' (اختياري)' : '') + '</label>' + RTE.html('exScenario', e.scenario) + '</div>';
    if (!isAct) out += '<div class="field"><label>المبدأ العلمي باختصار</label><textarea id="exPrinciple" data-keep="ex-pr" rows="2">' + h(stripHtml(e.principle || '')) + '</textarea></div><div class="field"><label>خطوات «كيف تنجز التمرين؟» (سطر لكل خطوة)</label><textarea id="exSteps" data-keep="ex-steps" rows="4">' + h(arr(e.steps).join('\n')) + '</textarea></div>';
  }
  out += '<div class="field"><label>📝 ' + (isSurvey ? 'سؤال الرأي المفتوح' : 'المطلوب منك') + '</label>' + RTE.html('exTask', e.task) + '</div>';
  if (isSurvey) out += '<div class="field"><label>⭐ بنود التقييم بالنجوم (سطر لكل بند)</label><textarea id="svRates" data-keep="sv-rates" rows="6">' + h(arr(e.rates).join('\n')) + '</textarea></div><div class="field"><label>سؤال التوصية NPS (0–10) — اتركه فارغًا لإخفائه</label><input id="svNps" data-keep="sv-nps" value="' + h(e.nps || '') + '"></div>';
  if (!isSurvey) {
    out += '<div class="field" id="hintField" ' + (fmt === 'text' ? 'style="display:none"' : '') + '><label>💡 تلميح عام (يحل محل «المطلوب» في النماذج التفاعلية)</label>' + RTE.html('exHint', e.hint) + '</div>';
    if (!isAct) out += '<div class="field"><label>🎯 لماذا هذا النشاط؟</label><textarea id="exWhy" data-keep="ex-why" rows="2">' + h(stripHtml(e.why || '')) + '</textarea></div>';
    out += '<div class="field" id="modelField" ' + (fmt !== 'text' ? 'style="display:none"' : '') + '><label>🧩 النموذج المساعد' + (isAct ? ' (اختياري)' : '') + '</label>' + RTE.html('exModel', e.model) + '<span class="help">مثال موجز يقرّب الفكرة دون أن يعطي الإجابة. لا يظهر في النماذج التفاعلية.</span></div>';
    out += '<div class="field"><label>صورة (اختيارية — تظهر أعلى صفحته)</label>' + ImgPick.html('exImg', e.image) + '</div>';
    out += '<div id="itemsEd">' + itemsEditorHtml(fmt, FormState.items) + '</div>';
  }
  out += '</div><div class="sticky-actions"><button class="btn btn-primary" data-act="ex-save" data-kind="' + (isSurvey ? 'survey' : isAct ? 'activity' : 'ex') + '">💾 حفظ</button><button class="btn btn-ghost" data-act="form-cancel">إلغاء</button></div></div>';
  return out;
}
function exFormAfter(root) {
  RTE.mount(root); ImgPick.mount(root);
  const f = $('#exFormat', root);
  if (f) f.addEventListener('change', () => {
    FormState.items = FormState.format === f.value ? collectItems(root, FormState.format) : [];
    FormState.format = f.value;
    const m = $('#exMode', root); const lk = FORMAT_MODE[f.value];
    if (lk) { m.value = lk; m.disabled = true; } else m.disabled = false;
    const hf = $('#hintField', root); if (hf) hf.style.display = f.value === 'text' ? 'none' : '';
    const sf = $('#simField', root); if (sf) sf.style.display = f.value === 'sim' ? '' : 'none';
    const mf = $('#modelField', root); if (mf) mf.style.display = f.value === 'text' ? '' : 'none';
    if (!FormState.items.length && f.value !== 'text' && f.value !== 'sim') FormState.items = [{}];
    $('#itemsEd', root).innerHTML = itemsEditorHtml(f.value, FormState.items);
    const help = m.parentNode.querySelector('.help'); if (help) help.remove();
    if (lk) m.insertAdjacentHTML('afterend', '<span class="help">🔒 مقفل تلقائيًا على «' + (lk === 'group' ? 'جماعي' : 'فردي') + '» ليتوافق مع آلية هذا النموذج.</span>');
  });
}
async function exFormSave(root, kind) {
  const id = Router.cur.id; const isNew = id === 'new';
  const fmt = kind === 'survey' ? 'text' : ($('#exFormat', root) ? $('#exFormat', root).value : 'text');
  const data = { title: $('#exTitle', root).value.trim(), icon: $('#exIcon', root).value.trim(), task: RTE.val(root, 'exTask') };
  if (!data.title) { UI.alert('اكتب عنوانًا أولًا.'); return; }
  if (kind === 'survey') { data.rates = ($('#svRates', root).value || '').split('\n').map(x => x.trim()).filter(Boolean); data.nps = $('#svNps', root).value.trim(); }
  if (kind !== 'survey') {
    data.format = fmt; data.mode = FORMAT_MODE[fmt] || $('#exMode', root).value;
    data.scenario = RTE.val(root, 'exScenario'); data.hint = RTE.val(root, 'exHint'); data.model = fmt === 'text' ? RTE.val(root, 'exModel') : ''; data.image = ImgPick.val('exImg');
    if ($('#exPrinciple', root)) { data.principle = $('#exPrinciple', root).value.trim(); data.steps = $('#exSteps', root).value.split('\n').map(x => x.trim()).filter(Boolean); data.why = $('#exWhy', root).value.trim(); }
    data.items = fmt === 'text' || fmt === 'sim' ? [] : collectItems(root, fmt).filter(it => it.q || it.text || it.a);
    if (fmt === 'sim') data.sim = $('#exSim', root).value;
    if (fmt !== 'text' && fmt !== 'sim' && !data.items.length) { UI.alert('أضف عنصرًا واحدًا على الأقل للنموذج التفاعلي.'); return; }
    if (fmt === 'fillblank') { const ans = data.items.map(i => i.answer); if (ans.some(x => !x)) { UI.alert('اكتب الكلمة الصحيحة لكل فراغ.'); return; } }
  }
  if (isNew) {
    const nid = 'n' + genId(); data.ts = DB.now();
    if (kind === 'activity') data.kind = 'activity'; else data.axis = Router.cur.axis;
    await DB.set('added/ex/' + nid, data);
  } else if (DEF_EX[id]) await DB.set('content/ex/' + id, data);
  else await DB.set('added/ex/' + id, Object.assign({}, Store.addedEx[id] || {}, data));
  UI.toast('✅ تم الحفظ ونُشر حيًا'); FormState.exId = null;
  const back = Router.backOf(Router.cur); Router.go(back.view, back.id ? { id: back.id } : {});
}
Views.exEdit = { html() { return exFormHtml('ex'); }, after: exFormAfter };
Views.actEdit = { html() { const e = Router.cur.id !== 'new' ? Content.ex(Router.cur.id) : null; return exFormHtml(e && e.kind === 'survey' ? 'survey' : 'activity'); }, after: exFormAfter };

// ============ نافذة توزيع المجموعات (تعيين يدوي إرشادي) ============
const Assign = {
  modal: null, open: new Set(),
  show() { Assign.modal = UI.modal('<div data-assign></div>', { wide: true, onClose: () => { Assign.modal = null; } }); Assign.render(); },
  render() {
    if (!Assign.modal) return; const box = $('[data-assign]', Assign.modal.el);
    const users = Store.users || {}; const assigned = Store.assign || {};
    const free = Object.keys(users).filter(u => !assigned[u]).sort((a, b) => (users[a].name || '').localeCompare(users[b].name || '', 'ar'));
    const html = '<h3>🧭 توزيع المجموعات</h3><p class="muted" style="font-family:var(--f-ui);font-size:13.5px">التعيين إرشادي: يرى المتدرب تنبيهًا باسم مجموعته، دون منعه من اختيار غيرها.</p>' +
      Groups.list().map(n => { const mem = Groups.membersOf(n); const op = Assign.open.has(n);
        return '<div class="assign-group ' + (op ? 'open' : '') + '"><div class="ag-head" data-act="ag-toggle" data-g="' + n + '"><span>👥</span><b class="grow">' + h(Groups.label(n)) + '</b><span class="pill num">' + mem.length + ' عضو</span><span>' + (op ? '▼' : '◀') + '</span></div><div class="ag-body">' + (op ? '<div class="field"><label>اسم مخصّص لهذه المجموعة (اختياري)</label><input data-gname="' + n + '" data-keep="gname-' + n + '" value="' + h((Store.groupNames || {})[n] || '') + '" placeholder="اتركه فارغًا لعرض الرقم وحده"></div>' +
          '<div class="field"><input data-keep="gsearch-' + n + '" data-filter-list="' + n + '" placeholder="🔍 بحث بالاسم…"></div><div class="chk-list" data-list="' + n + '">' + (free.length ? free.map(u => '<label data-name="' + h((users[u].name || '').toLowerCase()) + '"><input type="checkbox" data-assign-u="' + h(u) + '" data-g="' + n + '"> ' + h(users[u].name) + ' <span class="muted">' + h(users[u].role || '') + '</span></label>').join('') : '<div class="muted" style="padding:6px">كل المسجّلين معيَّنون.</div>') + '</div>' +
          '<div class="member-box"><b style="font-family:var(--f-ui);font-size:13px">أعضاء المجموعة:</b> ' + (mem.length ? mem.map(u => '<span class="m">' + h(users[u] ? users[u].name : '(محذوف)') + '<button class="btn btn-danger btn-xs" data-act="unassign" data-uid="' + h(u) + '">✕</button></span>').join('') : '<span class="muted">لا أعضاء بعد.</span>') + '</div>' : '') + '</div></div>'; }).join('') +
      '<div class="actions"><button class="btn btn-danger btn-sm" data-act="unassign-all">إلغاء كل التعيينات</button><button class="btn btn-ghost btn-sm" data-act="assign-close">إغلاق</button></div>';
    preserveRender(box, html);
    $$('[data-filter-list]', box).forEach(inp => { const apply = () => { const q = inp.value.trim().toLowerCase(); $$('[data-list="' + inp.getAttribute('data-filter-list') + '"] label', box).forEach(l => { l.style.display = !q || (l.getAttribute('data-name') || '').indexOf(q) > -1 ? '' : 'none'; }); }; inp.addEventListener('input', apply); apply(); });
    $$('[data-gname]', box).forEach(inp => inp.addEventListener('change', () => { const v = inp.value.trim(); DB.set('settings/groupNames/' + inp.getAttribute('data-gname'), v || null); }));
    $$('[data-assign-u]', box).forEach(cb => cb.addEventListener('change', () => { if (cb.checked) DB.set('assign/' + cb.getAttribute('data-assign-u'), +cb.getAttribute('data-g')); }));
  }
};

// ============ نموذج قسم الصفحة الرئيسية ============
Views.secEdit = {
  html() {
    const key = Router.cur.id; const sec = Content.homeSections({ all: true }).find(x => x.key === key);
    if (!sec) return adminHeader('تعديل قسم') + '<div class="empty">القسم غير موجود.</div>';
    let out = adminHeader('✏️ تعديل قسم في الصفحة الرئيسية') + Layout.crumbs() + '<div class="form-page"><div class="card pad">' +
      '<div class="grid2"><div class="field"><label>السطر الصغير فوق العنوان (اختياري)</label><input id="secKicker" data-keep="sec-kicker" value="' + h(sec.kicker || '') + '"></div><div class="field"><label>عنوان القسم</label><input id="secTitle" data-keep="sec-title" value="' + h(sec.title || '') + '" placeholder="' + (key === 'lab' ? 'يُقرأ من عنوان المختبر إن تُرك فارغًا' : '') + '"></div></div>';
    if (sec.builtin) {
      const hints = { assess: 'يعرض بطاقتي التقييم القبلي والبعدي. افتحهما وأغلقهما من بطاقة «التقييم القبلي والبعدي» في اللوحة، وعدّل الأسئلة من زر «✏️ الأسئلة».', activities: 'يعرض الأنشطة الظاهرة. عدّل الأنشطة أو أضف جديدة من قسم «الأنشطة والاستطلاع الختامي».', axes: 'يعرض شبكة المحاور الظاهرة مجمّعة حسب الوحدات. عدّل المحاور وترتيبها ووحداتها من قسم «المحاور والتمارين».', lab: 'يعرض بطاقة المختبر الختامي. عدّل المختبر ومراحله من «✏️ تعديل المختبر».', survey: 'يعرض الاستطلاع الختامي. عدّل نصه من قسم «الأنشطة والاستطلاع الختامي».' };
      out += '<div class="notice" style="margin-top:0">ℹ️ هذا قسم أساسي: ' + h(hints[key] || '') + '</div>' + (key === 'lab' ? '<button class="btn btn-soft btn-sm" data-go="labEdit">✏️ تعديل المختبر ومراحله</button>' : key === 'assess' ? '<button class="btn btn-soft btn-sm" data-go="assessEdit">✏️ تعديل أسئلة التقييم</button>' : '');
    } else {
      out += '<div class="field"><label>نوع القسم</label><select id="secType">' + Object.keys(SECTION_TYPES).map(k => '<option value="' + k + '" ' + (k === (sec.type || 'text') ? 'selected' : '') + '>' + SECTION_TYPES[k] + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>النص (اختياري)</label>' + RTE.html('secBody', sec.body) + '</div>' +
        '<div class="field"><label>رابط فيديو يوتيوب أو Google Drive (لقسم الفيديو)</label><input id="secVideo" data-keep="sec-video" value="' + h(sec.videoUrl || '') + '" placeholder="الصق رابط المشاركة كما هو"></div>' +
        '<div class="field"><label>صورة (اختيارية)</label>' + ImgPick.html('secImg', sec.image) + '</div>' +
        '<div class="grid2"><div class="field"><label>نص الزر (اختياري)</label><input id="secBtnL" data-keep="sec-btnl" value="' + h(sec.btnLabel || '') + '" placeholder="مثال: سجّل في برامج البنك"></div><div class="field"><label>رابط الزر</label><input id="secBtnU" data-keep="sec-btnu" value="' + h(sec.btnUrl || '') + '" placeholder="https://"></div></div>';
    }
    out += '</div><div class="sticky-actions"><button class="btn btn-primary" data-act="sec-save">💾 حفظ القسم</button>' + (sec.builtin ? '<button class="btn btn-ghost" data-act="sec-label-reset">↺ العنوان الافتراضي</button>' : '') + '<button class="btn btn-ghost" data-act="form-cancel">إلغاء</button></div></div>';
    return out;
  },
  after(root) { RTE.mount(root); ImgPick.mount(root); },
  async save(root) {
    const key = Router.cur.id; const b = HOME_BUILTINS.find(x => x.key === key);
    const kicker = $('#secKicker', root).value.trim(), title = $('#secTitle', root).value.trim();
    if (b) await DB.set('site/labels/' + key, { kicker, title });
    else {
      const cur = ((Store.site || {}).sections || {})[key] || {};
      await DB.set('site/sections/' + key, Object.assign({}, cur, { kicker, title, type: $('#secType', root).value, body: RTE.val(root, 'secBody'), videoUrl: $('#secVideo', root).value.trim(), image: ImgPick.val('secImg'), btnLabel: $('#secBtnL', root).value.trim(), btnUrl: $('#secBtnU', root).value.trim() }));
    }
    UI.toast('✅ حُفظ القسم ونُشر حيًا'); UIState.openAcc.add('home-secs'); Router.go('admin');
  }
};

// ============ نموذج المختبر الختامي ============
Views.labEdit = {
  html() {
    const L = Content.lab();
    if (FormState.exId !== '__lab') { FormState.exId = '__lab'; FormState.items = L.stages.map(x => Object.assign({}, x)); }
    return adminHeader('✏️ تعديل المختبر الختامي') + Layout.crumbs() + '<div class="form-page"><div class="card pad">' +
      '<div class="grid2"><div class="field"><label>عنوان المختبر</label><input id="labTitle" data-keep="lab-title" value="' + h(L.title) + '"></div><div class="field"><label>دقائق كل مرحلة</label><input type="number" min="1" max="120" id="labMin" data-keep="lab-min" value="' + L.minutes + '"></div></div>' +
      '<div class="field"><label>الحالة / السيناريو</label>' + RTE.html('labIntro', L.intro) + '</div>' +
      (L.chart ? '<div class="notice" style="margin-top:0">📊 رسم القمع أسفل الحالة مبني في الكود ويبقى كما هو.</div>' : '') + '</div>' +
      '<h3 style="margin:22px 0 10px">🧩 المراحل <span class="pill num">' + FormState.items.length + '</span></h3><div id="stagesEd">' + Views.labEdit.stagesHtml() + '</div>' +
      '<div class="sticky-actions"><button class="btn btn-primary" data-act="labform-save">💾 حفظ المختبر</button><button class="btn btn-ghost" data-act="form-cancel">إلغاء</button></div></div>';
  },
  stagesHtml() {
    const n = FormState.items.length;
    return FormState.items.map((st, i) => '<div class="item-editor" data-stage="' + i + '"><div class="row" style="margin-bottom:6px"><span class="pill num">' + (i + 1) + '</span><span class="grow"></span><button type="button" class="btn btn-ghost btn-xs" data-act="st-move" data-d="-1" data-i="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button type="button" class="btn btn-ghost btn-xs" data-act="st-move" data-d="1" data-i="' + i + '" ' + (i === n - 1 ? 'disabled' : '') + '>↓</button><button type="button" class="btn btn-danger btn-xs" data-act="st-del" data-i="' + i + '">🗑 حذف</button></div>' +
      '<div class="grid2"><div class="field"><label>الأيقونة</label><div class="icon-in"><input data-sf="icon" data-iconpick value="' + h(st.icon || '') + '">' + IconPick.btn(st.icon) + '</div></div><div class="field"><label>عنوان المرحلة</label><input data-sf="title" value="' + h(st.title || '') + '"></div></div><div class="field"><label>المطلوب في هذه المرحلة</label><textarea data-sf="task" rows="3">' + h(st.task || '') + '</textarea></div></div>').join('') +
      '<button type="button" class="btn btn-soft btn-sm" data-act="st-add">➕ إضافة مرحلة</button>';
  },
  collect(root) { return $$('[data-stage]', root).map(b => ({ icon: $('[data-sf="icon"]', b).value.trim() || '📌', title: $('[data-sf="title"]', b).value.trim(), task: $('[data-sf="task"]', b).value.trim() })); },
  after(root) { RTE.mount(root); },
  async save(root) {
    const stages = Views.labEdit.collect(root).filter(x => x.title || x.task);
    if (!stages.length) { UI.alert('أضف مرحلة واحدة على الأقل.'); return; }
    await DB.set('content/lab', { title: $('#labTitle', root).value.trim() || COURSE.lab.title, minutes: Math.max(1, parseInt($('#labMin', root).value, 10) || 10), intro: RTE.val(root, 'labIntro'), stages });
    FormState.exId = null; UI.toast('✅ حُفظ المختبر ونُشر حيًا'); Router.go('admin');
  }
};

// ============ نموذج أسئلة التقييم القبلي والبعدي ============
Views.assessEdit = {
  html() {
    const A = Content.assess();
    if (FormState.exId !== '__assess') { FormState.exId = '__assess'; FormState.format = 'mcq'; FormState.items = A.items.map(x => Object.assign({}, x, { options: arr(x.options) })); }
    return adminHeader('✏️ أسئلة التقييم القبلي والبعدي') + Layout.crumbs() + '<div class="form-page"><div class="card pad">' +
      '<div class="field"><label>العنوان</label><input id="asTitle" data-keep="as-title" value="' + h(A.title || '') + '"></div><div class="field"><label>التعليمات</label>' + RTE.html('asIntro', A.intro) + '</div>' +
      '<div class="notice" style="margin-top:0">⚠️ الأسئلة نفسها تُستخدم في التقييمين القبلي والبعدي لقياس التحسن. تعديل الأسئلة أو ترتيب الخيارات بعد بدء المتدربين في الإجابة يغيّر احتساب نتائجهم؛ عدّلها قبل فتح التقييم القبلي.</div>' +
      '<div id="itemsEd">' + itemsEditorHtml('mcq', FormState.items) + '</div></div>' +
      '<div class="sticky-actions"><button class="btn btn-primary" data-act="assessform-save">💾 حفظ الأسئلة</button>' + (A._modified ? '<button class="btn btn-ghost" data-act="assess-reset-content">↺ استرجاع الافتراضي</button>' : '') + '<button class="btn btn-ghost" data-act="form-cancel">إلغاء</button></div></div>';
  },
  after(root) { RTE.mount(root); },
  async save(root) {
    const items = collectItems(root, 'mcq').filter(it => it.q && it.options.length >= 2);
    if (!items.length) { UI.alert('أضف سؤالًا واحدًا على الأقل بخيارين أو أكثر.'); return; }
    await DB.set('content/assess', { title: $('#asTitle', root).value.trim(), intro: RTE.val(root, 'asIntro'), items });
    FormState.exId = null; UI.toast('✅ حُفظت الأسئلة'); Router.go('admin');
  }
};


// ============ نموذج قصة النجاح ============
Views.storyEdit = {
  html() {
    const id = Router.cur.id; const isNew = id === 'new';
    const st = isNew ? { title: '', country: 'قطر', flag: '🇶🇦', sector: '', year: '', axis: '', scene: 'idea', color: 0, summary: '', story: '', numbers: [], lessons: [], sources: [] } : Content.story(id);
    if (!st) return adminHeader('تعديل قصة') + '<div class="empty">القصة غير موجودة.</div>';
    const f = (k, l, ph = '') => '<div class="field"><label>' + l + '</label><input data-stf="' + k + '" data-keep="stf-' + k + '" value="' + h(st[k] || '') + '" placeholder="' + h(ph) + '"></div>';
    const scenes = Scenes.keys.filter(k => k !== 'hero');
    return adminHeader(isNew ? '➕ قصة نجاح جديدة' : '✏️ تعديل قصة نجاح') + Layout.crumbs() + '<div class="form-page"><div class="card pad">' +
      f('title', 'العنوان') + '<div class="grid2">' + f('country', 'الدولة') + f('flag', 'العلم (إيموجي)', '🇶🇦') + f('sector', 'القطاع') + f('year', 'سنة التأسيس') + '</div>' +
      '<div class="grid2"><div class="field"><label>المحور المرتبط</label><select data-stf="axis"><option value="">— بدون —</option>' + Content.axes({ all: true }).map(a => '<option value="' + h(a.id) + '" ' + (a.id === st.axis ? 'selected' : '') + '>' + h(a.title) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>الرسم التعبيري</label><select data-stf="scene" id="stScene">' + scenes.map(k => '<option value="' + k + '" ' + (k === st.scene ? 'selected' : '') + '>' + k + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>اللون</label><select data-stf="color" id="stColor">' + AXIS_COLORS.map((c, i) => '<option value="' + i + '" ' + (i === +st.color ? 'selected' : '') + ' style="background:' + c + ';color:#fff">لون ' + (i + 1) + '</option>').join('') + '</select></div></div>' +
      '<div id="stPreview" class="story-preview">' + Scenes.render(st.scene || 'idea', AXIS_COLORS[(+st.color || 0) % AXIS_COLORS.length]) + '</div>' +
      '<div class="field"><label>صورة بدل الرسم (اختيارية)</label>' + ImgPick.html('stImg', st.image) + '</div>' +
      '<div class="field"><label>الملخص (يظهر على البطاقة)</label><textarea data-stf="summary" rows="3">' + h(stripHtml(st.summary || '')) + '</textarea></div>' +
      '<div class="field"><label>نص القصة</label>' + RTE.html('stStory', st.story) + '</div>' +
      '<div class="field"><label>أرقام بارزة (سطر لكل رقم بصيغة: الرقم :: الوصف)</label><textarea data-stf="numbers" rows="3">' + h(st.numbers.map(n => n.v + ' :: ' + n.l).join('\n')) + '</textarea></div>' +
      '<div class="field"><label>دروس لمشروعك (سطر لكل درس)</label><textarea data-stf="lessons" rows="4">' + h(st.lessons.join('\n')) + '</textarea></div>' +
      '<div class="field"><label>المصادر (سطر لكل مصدر بصيغة: اسم المصدر :: الرابط)</label><textarea data-stf="sources" rows="4" dir="auto">' + h(st.sources.map(x => x.label + ' :: ' + x.url).join('\n')) + '</textarea></div>' +
      '</div><div class="sticky-actions"><button class="btn btn-primary" data-act="storyform-save">💾 حفظ القصة</button><button class="btn btn-ghost" data-act="form-cancel">إلغاء</button></div></div>';
  },
  after(root) {
    RTE.mount(root); ImgPick.mount(root);
    const upd = () => { $('#stPreview', root).innerHTML = Scenes.render($('#stScene', root).value, AXIS_COLORS[+$('#stColor', root).value % AXIS_COLORS.length]); };
    $('#stScene', root).addEventListener('change', upd); $('#stColor', root).addEventListener('change', upd);
  },
  async save(root) {
    const id = Router.cur.id; const isNew = id === 'new'; const g = k => ($('[data-stf="' + k + '"]', root) || {}).value || '';
    const lines = k => g(k).split('\n').map(x => x.trim()).filter(Boolean);
    const data = { title: g('title').trim(), country: g('country').trim(), flag: g('flag').trim(), sector: g('sector').trim(), year: g('year').trim(), axis: g('axis'), scene: g('scene'), color: +g('color') || 0, image: ImgPick.val('stImg'), summary: g('summary').trim(), story: RTE.val(root, 'stStory'),
      numbers: lines('numbers').map(x => { const i = x.indexOf('::'); return i > -1 ? { v: x.slice(0, i).trim(), l: x.slice(i + 2).trim() } : { v: x, l: '' }; }),
      lessons: lines('lessons'),
      sources: lines('sources').map(x => { const i = x.lastIndexOf('::'); return i > -1 ? { label: x.slice(0, i).trim(), url: x.slice(i + 2).trim() } : { label: x, url: x }; }).filter(x => /^https?:\/\//.test(x.url)) };
    if (!data.title) { UI.alert('اكتب عنوان القصة.'); return; }
    if (isNew) { data.ts = DB.now(); await DB.set('added/stories/s' + genId(), data); }
    else if (COURSE.stories.some(x => x.id === id)) await DB.set('content/stories/' + id, data);
    else await DB.set('added/stories/' + id, Object.assign({}, Store.addedStories[id] || {}, data));
    UI.toast('✅ حُفظت القصة ونُشرت حيًا'); UIState.openAcc.add('storiesAcc'); Router.go('admin');
  }
};

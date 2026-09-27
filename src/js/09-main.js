// ---------------------------------------------------------------------
// التطبيق: الرسم، المراقبات الحية، والتفاعلات
// ---------------------------------------------------------------------
const FORM_VIEWS = ['axisEdit', 'exEdit', 'actEdit', 'secEdit', 'labEdit', 'assessEdit', 'storyEdit'];
const ADMIN_VIEWS = ['admin', 'present'].concat(FORM_VIEWS);
const App = {
  inIframe: (() => { try { return window.self !== window.top; } catch (e) { return true; } })(),
  render() {
    const root = document.getElementById('app'); if (!root) return;
    // أثناء عرض الشريحة بملء الشاشة لا نعيد رسم الصفحة (إعادة الرسم تُخرج العنصر من ملء الشاشة)؛ نؤجلها حتى الخروج
    if (document.fullscreenElement && document.fullscreenElement.matches && document.fullscreenElement.matches('.deck')) { App._pendingRender = true; return; }
    let v = Router.cur.view;
    if (ADMIN_VIEWS.indexOf(v) > -1 && !Admin.ok()) { Router.cur = { view: 'home' }; v = 'home'; }
    if (!App.dataReady || !AUTH.resolved) { root.innerHTML = connectScreen(); return; }
    // اكتمال الدائرة لحظة جاهزية البيانات قبل عرض الصفحة
    const ring = root.querySelector('.cs-ring:not(.stop)'); if (ring && !ring.classList.contains('done')) { ring.classList.add('done'); setTimeout(() => App.render(), 320); return; }
    const needLogin = !Me.isReg() && !Me.guest && !Admin.ok() && ADMIN_VIEWS.indexOf(v) === -1 && v !== 'monitor' && v !== 'show';
    const view = needLogin ? Views.landing : (Views[v] || Views.home);
    App.onLanding = view === Views.landing;
    if (App.onLanding && !App._wasLanding) { Views.landing._played = false; Views.landing._seen = new Set(); Views.landing._counted = false; } App._wasLanding = App.onLanding;
    let body = '';
    try { body = view.html(); } catch (e) { console.error(e); body = '<div class="empty" style="margin-top:24px">حدث خطأ في عرض هذه الصفحة. <button class="btn btn-soft btn-sm" data-go="home">المنصة التعليمية</button></div>'; }
    const html = (v === 'present' && view === Views.present) || (v === 'show' && view === Views.show) ? body : Layout.banners() + Layout.topbar() + '<main class="wrap">' + body + '</main>' + Layout.footer() +
      (Admin.ok() && Admin.preview() ? '<button class="float-badge" data-act="preview-exit">↩ العودة للوحة الإدارة</button>' : '');
    // صفحة الهبوط: لا نعيد رسمها إن لم يتغير شيء حتى لا تتكرر الحركات مع كل تحديث للبيانات
    if (App.onLanding && html === App._lastLanding && root.firstChild) return;
    App._lastLanding = App.onLanding ? html : null;
    preserveRender(root, html);
    if (view.after) try { view.after(root); } catch (e) { console.error(e); }
    $$('[data-filter]', root).forEach(applyFilter);
    $$('textarea:not([maxlength])', root).forEach(t => { t.maxLength = 4000; }); $$('input[type=text]:not([maxlength]),input:not([type]):not([maxlength])', root).forEach(t => { t.maxLength = 250; });
    document.title = (Content.site().headerTitle || 'الدورة');
  },
  onData: debounce(() => {
    if (FORM_VIEWS.indexOf(Router.cur.view) > -1) return; // لا نعيد رسم نماذج التحرير أثناء الكتابة
    App.render(); if (Assign.modal) Assign.render();
  }, 60)
};
function applyFilter(inp) { const q = inp.value.trim().toLowerCase(); const scope = inp.closest('.tool-drop') || document; $$(inp.getAttribute('data-filter'), scope).forEach(x => { x.style.display = !q || (x.getAttribute('data-name') || '').indexOf(q) > -1 ? '' : 'none'; }); }

// ---------- المراقبات الحية ----------
// كل زائر يراقب العقد العامة فقط، وسجلاته الخاصة (عقد المتدرب نفسه)، والمدرب وحده يراقب العقد الخاصة كاملة.
// الجاهزية: لا تُعرض الواجهة ولا تُقبل الكتابة قبل أول قراءة مؤكدة لكل العقد العامة.
const Watch = { active: {}, publicPaths: [], seen: new Set() };
function mergeUsers() { // الملف العام (users) + البيانات الخاصة (private) = سجل كامل للواجهة
  const pub = Store.usersPub || {}; const pr = Store.priv || {}; const out = {};
  Object.keys(pub).forEach(u => { out[u] = Object.assign({}, pub[u], pr[u] ? { f: Object.assign({}, pub[u].f || {}, pr[u].f || {}), consent: pr[u].consent || pub[u].consent } : {}); });
  Store.users = out;
}
function watchDefs() {
  const d = {
    'content': v => { v = v || {}; Store.contentAxes = v.axes || {}; Store.contentEx = v.ex || {}; Store.contentLab = v.lab || null; Store.contentAssess = v.assess || null; Store.contentStories = v.stories || {}; },
    'added': v => { v = v || {}; Store.addedAxes = v.axes || {}; Store.addedEx = v.ex || {}; Store.addedStories = v.stories || {}; },
    'storyLikes': v => { Store.storyLikes = v || {}; },
    'visibility': v => { Store.visibility = v || {}; },
    'enabled': v => { Store.enabled = v || {}; },
    'order': v => { v = v || {}; Store.order = arr(v.axes); Store.exOrder = v.ex || {}; Store.storyOrder = arr(v.stories); },
    'assess': v => { Store.assess = v || {}; },
    'attendance': v => { Store.attendance = v || {}; },
    'checkins': v => { Store.checkins = v || {}; },
    'site': v => { Store.site = v || {}; },
    'settings': v => { v = v || {}; Store.groupCount = v.groups && v.groups.count ? v.groups.count : DEFAULT_GROUPS; Store.groupNames = v.groupNames || {}; Store.assessCfg = v.assess || {}; Store.attCfg = v.attendance || {}; Store.cohortCfg = v.cohort || {}; Store.presentCfg = v.present || {}; },
    'assign': v => { Store.assign = v || {}; },
    'users': v => { Store.usersPub = v || {}; mergeUsers(); },
    'posts': v => { Store.posts = v || {}; },
    'reveal': v => { Store.reveal = v || {}; },
    'lab': v => { v = v || {}; Store.labTimers = v.timers || {}; Store.labAnswers = v.answers || {}; },
    'broadcast': v => { Store.broadcast = v; },
    'stats/registered': v => { Store.registered = Number(v) || 0; },
    'meta/resetStamp': v => {
      Store.resetStamp = Number(v) || 0;
      if (Me.data && Store.resetStamp && (Me.data.ts || 0) < Store.resetStamp) { Me.clear(); UIState.draft = {}; UIState.editing = {}; setTimeout(() => UI.toast('تمت إعادة ضبط البرنامج — سجّل اسمك من جديد'), 300); syncWatchers(); }
    }
  };
  const pub = Object.keys(d);
  const me = Me.uid();
  if (Admin.ok()) {
    Object.assign(d, {
      'private': v => { Store.priv = v || {}; mergeUsers(); },
      'leads': v => { Store.leads = v || {}; },
      'followups': v => { Store.followups = v || {}; },
      'backupIndex': v => { Store.backupIndex = v || {}; },
      'cohortIndex': v => { Store.cohortIndex = v || {}; },
      'secure': v => { Store.secure = v || {}; },
      'secrets': v => { Store.secrets = v || {}; }
    });
  } else if (me) {
    d['private/' + me] = v => { Store.priv = v ? { [me]: v } : {}; mergeUsers(); };
    d['leads/' + me] = v => { Store.leads = v ? { [me]: v } : {}; };
    ['30', '60', '90'].forEach(n => { d['followups/d' + n + '/' + me] = v => { Store.followups = Object.assign({}, Store.followups); Store.followups['d' + n] = v ? { [me]: v } : {}; }; });
    d['secrets/' + me] = v => { Store.mySecret = v || ''; };
  }
  return { defs: d, pub };
}
function syncWatchers() {
  const { defs, pub } = watchDefs(); Watch.publicPaths = pub;
  Object.keys(Watch.active).forEach(p => { if (!defs[p]) { try { Watch.active[p](); } catch (e) {} delete Watch.active[p]; } });
  if (!Admin.ok()) { Store.backupIndex = {}; Store.cohortIndex = {}; Store.secure = {}; Store.secrets = {}; if (!Me.uid()) { Store.priv = {}; Store.leads = {}; Store.followups = {}; Store.mySecret = ''; mergeUsers(); } }
  Object.keys(defs).forEach(path => {
    if (Watch.active[path]) return;
    Watch.active[path] = DB.watch(path, v => {
      defs[path](v);
      if (!Watch.seen.has(path)) { Watch.seen.add(path); if (!App.dataReady && Watch.publicPaths.every(x => Watch.seen.has(x))) { App.dataReady = true; DB.markReady(); App.render(); } }
      App.onData();
    }, e => { console.warn('watch denied', path, e); if (Watch.publicPaths.indexOf(path) > -1) { App.watchError = e; App.render(); } });
  });
}
function watchAll() { syncWatchers(); }
function getByPath(path) { const seg = path.split('/'); let n = seg[0] === 'posts' ? Store.posts : seg[0] === 'lab' ? Store.labAnswers : seg[0] === 'storyLikes' ? Store.storyLikes : null; const rest = seg[0] === 'lab' ? seg.slice(2) : seg.slice(1); for (const s of rest) { if (!n) return null; n = n[s]; } return n; }

// ---------- التسجيل والدخول ----------
async function doRegister() {
  const { data, err } = RegFields.collect(document, 'reg_');
  if (err) { UI.alert(err); return; }
  if (!($('#regConsent') || {}).checked) { UI.alert('يلزم الموافقة على إشعار الخصوصية لإتمام التسجيل.'); return; }
  const follow = !!($('#regFollow') || {}).checked;
  const btn = $('[data-act="register"]'); if (btn) { btn.disabled = true; btn.textContent = 'جارٍ التسجيل…'; }
  try {
    const uid = genId('u'); const code = genCode();
    // 1) ربط هذا الجهاز بالسجل الجديد (قبل أي كتابة، حتى تسمح القواعد لصاحبه فقط)
    if (!(await linkDevice(uid, code))) throw new Error('تعذر تجهيز الجلسة الآمنة. أعد تحميل الصفحة ثم حاول مرة أخرى.');
    // 2) رقم عضوية تسلسلي عبر عملية ذرّية
    const member = await DB.transaction('meta/memberCounter', cur => Math.max(Number(cur) || 0, MEMBER_NO_FLOOR) + 1);
    const ts = DB.now(); const name = data.name, role = data.role || '';
    // 3) الملف العام (الاسم فقط) + البيانات الخاصة (الحقول والموافقة) + رمز الدخول الشخصي
    await DB.set('users/' + uid, { name, role, member, ts });
    await DB.set('private/' + uid, { f: data.f || {}, consent: { privacy: ts, followup: follow } });
    await DB.set('secrets/' + uid, code);
    DB.transaction('stats/registered', c => (Number(c) || 0) + 1);
    const me = { uid, name, role, member, ts, code }; Me.save(me); syncWatchers();
    LoginModal.close(); App.render(); window.scrollTo(0, 0); welcomeModal(me);
  } catch (e) { UI.alert('تعذر التسجيل: ' + h(e.message || e)); if (btn) { btn.disabled = false; btn.textContent = 'ابدأ 🚀'; } }
}
function privacyModal() { const pv = Content.privacy(); const m = UI.modal('<h3>🔒 إشعار الخصوصية</h3><div style="line-height:1.9">' + richHtml(pv.text) + '</div><div class="actions"><button class="btn btn-primary" data-x>حسنًا</button></div>', { wide: true }); $('[data-x]', m.el).onclick = () => m.close(); }
// حذف كل بيانات المتدرب من السيرفر (حق المستخدم في حذف بياناته)
async function deleteMyData() {
  const ok = await UI.confirm('سيُحذف نهائيًا من السيرفر: بياناتك، ومشاركاتك الفردية، ونتائج تقييماتك، وسجل حضورك، واهتماماتك، ومتابعاتك، وإعجاباتك. إجابات المجموعات تبقى باسم المجموعة مع إزالة اسمك منها. لا يمكن التراجع، ولن تتمكن من الحصول على الشهادة.', { danger: true, ok: 'احذف بياناتي نهائيًا', title: 'حذف بياناتي' });
  if (!ok) return; const uid = Me.uid(); const upd = {};
  upd['users/' + uid] = null; upd['assess/pre/' + uid] = null; upd['assess/post/' + uid] = null; upd['attendance/' + uid] = null; upd['assign/' + uid] = null; upd['leads/' + uid] = null;
  ['30', '60', '90'].forEach(n => { upd['followups/d' + n + '/' + uid] = null; });
  upd['private/' + uid] = null; upd['secrets/' + uid] = null; upd['devices/' + uid] = null; Attend.days().forEach(d => { upd['checkins/d' + d + '/' + uid] = null; });
  Object.keys(Store.posts || {}).forEach(ex => { const ps = Store.posts[ex] || {}; Object.keys(ps).forEach(k => { const p = ps[k] || {}; if (k === uid) upd['posts/' + ex + '/' + k] = null; else { if (p.members && p.members[uid]) upd['posts/' + ex + '/' + k + '/members/' + uid] = null; if (p.likes && p.likes[uid]) upd['posts/' + ex + '/' + k + '/likes/' + uid] = null; if (p.by === uid) upd['posts/' + ex + '/' + k + '/name'] = ''; } }); });
  Object.keys(Store.storyLikes || {}).forEach(st => { if (((Store.storyLikes[st] || {}).likes || {})[uid]) upd['storyLikes/' + st + '/likes/' + uid] = null; });
  await DB.update('', upd); DB.transaction('stats/registered', c => Math.max(0, (Number(c) || 0) - 1));
  Me.clear(); UIState.draft = {}; UIState.editing = {}; Router.go('home'); UI.toast('تم حذف بياناتك نهائيًا');
}
function welcomeModal(me) {
  const m = UI.modal('<div class="center"><div style="font-size:48px">🎉</div><h3>أهلًا ' + h(me.name) + '!</h3><p class="muted" style="font-family:var(--f-ui)">تم تسجيلك بنجاح. احفظ رقم العضوية ورمز الدخول الشخصي: تحتاجهما معًا للدخول من أي جهاز آخر.</p><div class="num" style="font-family:var(--f-display);font-size:52px;font-weight:800;letter-spacing:4px;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block">' + pad4(me.member) + '</div>' + (me.code ? '<div style="margin-top:6px;font-family:var(--f-ui);font-size:13px;color:var(--ink-3)">رمز الدخول الشخصي</div><div class="num notranslate" translate="no" dir="ltr" style="font-family:var(--f-display);font-size:30px;font-weight:800;letter-spacing:6px;user-select:all">' + h(me.code) + '</div>' : '') + '</div><div class="actions" style="justify-content:center"><button class="btn btn-primary" data-save-card>💾 حفظ رقم العضوية</button><button class="btn btn-ghost" data-close>ابدأ الجولة</button></div>');
  $('[data-save-card]', m.el).onclick = () => saveMemberCard(me);
  $('[data-close]', m.el).onclick = () => m.close();
}
async function memberLogin() {
  const m = UI.modal('<h3>الدخول برقم العضوية</h3><p class="muted" style="font-family:var(--f-ui);font-size:13px;margin-top:0">تجدهما في بطاقة العضوية التي ظهرت عند تسجيلك، أو في صفحة «حسابي» على جهازك الأول.</p>' +
    '<div class="grid2"><div class="field"><label>رقم العضوية</label><input id="mlNum" inputmode="numeric" dir="ltr" placeholder="0058"></div><div class="field"><label>رمز الدخول الشخصي</label><input id="mlCode" dir="ltr" autocapitalize="characters" placeholder="ABC234"></div></div>' +
    '<div id="mlErr" style="color:#C62F35;font-family:var(--f-ui);font-size:13px;min-height:18px"></div><div class="actions"><button class="btn btn-primary" data-ok>دخول</button><button class="btn btn-ghost" data-x>إلغاء</button></div>');
  const err = t => { $('#mlErr', m.el).innerHTML = t; }; $('[data-x]', m.el).onclick = () => m.close(); setTimeout(() => $('#mlNum', m.el).focus(), 50);
  $('[data-ok]', m.el).onclick = async () => {
    const num = parseInt(String($('#mlNum', m.el).value).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\d]/g, ''), 10); const code = String($('#mlCode', m.el).value || '').trim().toUpperCase();
    if (!num) { err('اكتب رقم عضوية صحيحًا.'); return; }
    const users = Store.usersPub || {}; const uid = Object.keys(users).find(u => +users[u].member === num);
    if (!uid) { err('لم نجد حسابًا بهذا الرقم (ربما حُذف لاحقًا). يُرجى التسجيل من جديد باسمك.'); return; }
    if (!(await linkDevice(uid, code))) { err(code ? 'رقم العضوية أو رمز الدخول غير صحيح.' : 'اكتب رمز الدخول الشخصي المكتوب في بطاقة عضويتك.'); return; }
    const u = users[uid]; let mycode = code;
    if (DB.real && authUid() && !code) { mycode = genCode(); try { await DB.set('secrets/' + uid, mycode, { quiet: true }); } catch (e) { mycode = ''; } }
    Me.save({ uid, name: u.name, role: u.role || '', member: u.member, ts: u.ts || DB.now(), group: u.group || null, code: mycode }); syncWatchers();
    m.close(); LoginModal.close(); UI.toast('مرحبًا بعودتك يا ' + u.name + ' 👋'); App.render(); window.scrollTo(0, 0);
  };
}

// ---------- حفظ الإجابات ----------
async function saveText(exId) {
  const e = Content.ex(exId); const ta = $('#ans-' + CSS.escape(exId)); const text = ta ? ta.value.trim() : '';
  if (!text) { UI.alert('اكتب إجابتك أولًا.'); return; }
  const key = postKey(e); if (!key) return;
  const me = Me.data; const upd = { text, name: me.name, role: me.role || '', ts: DB.now() };
  if (e.mode === 'group') { upd.group = Me.group(); upd.by = me.uid; upd['members/' + me.uid] = true; } else upd.uid = me.uid;
  await DB.update('posts/' + exId + '/' + key, upd);
  if (ta) ta.value = ''; UIState.editing[exId] = false; UI.toast('✅ تم الحفظ'); App.render();
}
async function saveInter(exId) {
  const e = Content.ex(exId); const d = UIState.draft[exId] || [];
  const missing = e.items.some((_, i) => d[i] === null || d[i] === undefined || d[i] === '');
  if (missing) { UI.alert(e.format === 'fillblank' ? 'املأ كل الفراغات قبل الإرسال.' : 'أجب عن كل الأسئلة قبل الحفظ.'); return; }
  const key = postKey(e); if (!key) return; const me = Me.data;
  const upd = { answers: e.items.map((_, i) => d[i]), name: me.name, role: me.role || '', ts: DB.now() };
  if (e.mode === 'group') { upd.group = Me.group(); upd.by = me.uid; upd['members/' + me.uid] = true; } else upd.uid = me.uid;
  await DB.update('posts/' + exId + '/' + key, upd);
  UIState.editing[exId] = false; UIState.draft[exId] = upd.answers.slice(); UI.toast(e.mode === 'group' ? '📤 أُرسلت إجابات المجموعة' : '✅ تم حفظ إجاباتك'); App.render();
}

// ---------- أدوات الأدمن ----------
function stripFlags(o) { const c = JSON.parse(JSON.stringify(o)); Object.keys(c).forEach(k => { if (k.charAt(0) === '_') delete c[k]; }); delete c.exercises; return c; }
async function copyAxis(id) {
  const a = Content.axis(id); if (!a) return;
  const nid = 'x' + genId(); const data = stripFlags(a); data.title = a.title + ' (نسخة)'; data.ts = DB.now(); data.slides = a.slides.map(s => { const o = stripFlags(s); delete o.chart; o.id = genId('sl'); return o; }); data.color = Content.axisIds().length % AXIS_COLORS.length; delete data.id;
  const upd = {}; upd['added/axes/' + nid] = data;
  Content.exercisesOf(id, { all: true }).forEach((e, i) => { const ne = stripFlags(e); delete ne.id; ne.axis = nid; ne.ts = DB.now() + i; upd['added/ex/n' + genId()] = ne; });
  await DB.update('', upd); UI.toast('🧬 تم نسخ المحور مع شرائحه وتمارينه'); Router.go('axisEdit', { id: nid });
}
async function copyEx(id) {
  const e = Content.ex(id); if (!e) return; const ne = stripFlags(e); delete ne.id; ne.title = e.title + ' (نسخة)'; ne.ts = DB.now();
  const ax = Content.axisOfEx(id); if (ax) ne.axis = ax; else ne.kind = 'activity';
  await DB.set('added/ex/n' + genId(), ne); UI.toast('🧬 تم نسخ التمرين');
}
async function backupData() { // يُقرأ من الخادم مباشرة (لا من حالة الواجهة) حتى لا تُصدَّر نسخة ناقصة
  const g = k => DB.get(k);
  return { app: 'qdb-ecom', version: 2, exportedAt: new Date().toISOString(), data: { content: await g('content'), added: await g('added'), visibility: await g('visibility'), enabled: await g('enabled'), order: await g('order'), media: await g('media'), site: await g('site'), settings: await g('settings') } };
}
async function importBackup(file) {
  try {
    const obj = JSON.parse(await file.text());
    if (!obj || obj.app !== 'qdb-ecom' || !obj.data) { UI.alert('الملف ليس نسخة احتياطية صالحة لهذا الموقع.'); return; }
    const d = obj.data; const keys = ['media', 'content', 'added', 'visibility', 'enabled', 'order'].filter(k => d[k] != null);
    const merge = ['site', 'settings'].filter(k => d[k] && typeof d[k] === 'object');
    const ok = await UI.confirm('استيراد نسخة المحتوى (' + h(obj.exportedAt || '') + '):<br>• تُستبدل: ' + (keys.map(h).join('، ') || '—') + '<br>• تُحدَّث عناصرها الموجودة في الملف فقط: ' + (merge.map(h).join('، ') || '—') + '<br>ما لا يحتويه الملف يبقى كما هو، ومشاركات المتدربين لا تتأثر. سيُنزَّل ملف بالمحتوى الحالي أولًا.', { danger: true, ok: 'تنزيل الحالي ثم الاستيراد' });
    if (!ok) return;
    downloadBlob(new Blob([JSON.stringify(await backupData(), null, 1)], { type: 'application/json' }), 'المحتوى قبل الاستيراد ' + dayKey(DB.now()) + '.json');
    const upd = {}; keys.forEach(k => { upd[k] = d[k]; }); merge.forEach(k => Object.keys(d[k]).forEach(c => { upd[k + '/' + c] = d[k][c]; }));
    await DB.update('', upd, { allowTopLevel: true });
    UI.toast('✅ تم استيراد المحتوى');
  } catch (e) { UI.alert('تعذر الاستيراد: ' + h(e.message || e)); }
}
// نسخة كاملة من كل عقد القاعدة (ملف خارجي) — للاحتفاظ بها خارج Firebase
const ALL_NODES = ['admins', 'secure', 'monitorData', 'private', 'devices', 'secrets', 'checkins', 'content', 'added', 'visibility', 'enabled', 'order', 'site', 'settings', 'media', 'users', 'posts', 'assess', 'attendance', 'lab', 'assign', 'leads', 'followups', 'storyLikes', 'reveal', 'broadcast', 'stats', 'meta', 'cohorts', 'cohortIndex', 'backups', 'backupIndex'];
async function exportAll() {
  const pm = progressModal('💾 نسخة كاملة'); const out = {};
  try { for (let i = 0; i < ALL_NODES.length; i++) { pm.set(i + 1, ALL_NODES.length, ALL_NODES[i]); out[ALL_NODES[i]] = await DB.get(ALL_NODES[i]); }
    downloadBlob(new Blob([JSON.stringify({ app: 'qdb-ecom', kind: 'full', exportedAt: new Date().toISOString(), data: out })], { type: 'application/json' }), 'نسخة كاملة لقاعدة البيانات ' + dayKey(DB.now()) + '.json'); pm.close(); UI.toast('✅ نُزّلت النسخة الكاملة');
  } catch (e) { pm.close(); UI.alert('تعذر التنزيل: ' + h(e.message || e)); }
}
async function globalReset() {
  const ok = await UI.confirm('<b>تحذير:</b> سيُمسح نهائيًا كل ما أدخله المتدربون (المشاركات، المختبر، المؤقتات، التقييم القبلي والبعدي، الحضور، قائمة المسجّلين، التعيينات)، ما عدا الاستطلاع الختامي، وسيُطلب من كل متصفح تسجيل اسم جديد. لا يمكن التراجع.', { danger: true, ok: 'نعم، امسح كل المدخلات', title: 'إعادة ضبط شاملة' });
  if (!ok) return;
  const posts = await DB.get('posts') || {}; const upd = {};
  Object.keys(posts).forEach(k => { if (k !== SURVEY_ID) upd['posts/' + k] = null; }); // استثناء صريح للاستطلاع الختامي
  await autoBackup(true); // نسخة احتياطية تلقائية قبل المسح
  upd.lab = null; upd.users = null; upd.private = null; upd.devices = null; upd.secrets = null; upd.checkins = null; upd.assign = null; upd.assess = null; upd.attendance = null; upd.leads = null; upd.followups = null; upd['meta/resetStamp'] = DB.now();
  await DB.update('', upd, { allowTopLevel: true }); UI.toast('تمت إعادة الضبط الشاملة');
}

function collectRegRows() {
  const base = UIState.regDraft || RegFields.all();
  return $$('[data-rrow]').map(row => { const f = Object.assign({}, base[+row.getAttribute('data-rrow')]); const g = k => $('[data-rr="' + k + '"]', row);
    f.label = g('label').value.trim() || f.label; if (!f.builtin) f.type = g('type').value; if (f.key !== 'name') { f.visible = g('visible').checked; f.required = g('required').checked; }
    f.ph = g('ph').value.trim(); if (g('options')) f.options = g('options').value.split('\n').map(x => x.trim()).filter(Boolean); else if (f.type === 'select' && !f.options.length) f.options = ['خيار 1', 'خيار 2']; return f; });
}

// ---------- التفاعلات (تفويض أحداث واحد) ----------
document.addEventListener('click', async ev => {
  const t = ev.target.closest('[data-act],[data-go],[data-back],[data-like],[data-deck-go],[data-slide]'); if (!t || t.disabled) return;
  if (!Session.check()) return;
  if (t.hasAttribute('data-go')) { ev.preventDefault(); const p = {}; ['id', 'axis', 'from'].forEach(k => { if (t.getAttribute('data-' + k)) p[k] = t.getAttribute('data-' + k); }); if (FORM_VIEWS.indexOf(t.getAttribute('data-go')) > -1) { FormState.axisId = null; FormState.exId = null; } Router.go(t.getAttribute('data-go'), p); return; }
  if (t.hasAttribute('data-back')) { const b = Router.backOf(Router.cur) || { view: 'home' }; Router.go(b.view, b.id ? { id: b.id } : {}); return; }
  if (t.hasAttribute('data-like')) { const p = t.getAttribute('data-like'); const cur = getByPath(p); Likes.toggle(p, cur && cur.likes); App.render(); return; }
  if (t.hasAttribute('data-deck-go')) { Deck.move(Router.cur.id, +t.getAttribute('data-deck-go')); return; }
  if (t.hasAttribute('data-slide')) { Deck.to(Router.cur.id, +t.getAttribute('data-slide')); return; }
  const act = t.getAttribute('data-act'); const id = t.getAttribute('data-id'); const exId = t.getAttribute('data-ex');
  const root = document.getElementById('app');
  switch (act) {
    // ----- عام -----
    case 'switch-user': { const ok = await UI.confirm('سيُمسح تسجيلك من هذا الجهاز فقط (لن يُحذف أي شيء من السيرفر)، وستعود إلى الصفحة التعريفية للبرنامج لتسجيل مستخدم جديد أو الدخول برقم العضوية.', { ok: 'تسجيل مستخدم جديد' }); if (ok) { Me.clear(); UIState.draft = {}; UIState.editing = {}; syncWatchers(); Router.go('home'); window.scrollTo(0, 0); } break; }
    case 'open-login': LoginModal.open(); break;
    case 'lp-enter': Router.go('home'); window.scrollTo(0, 0); break;
    case 'lp-scroll': { const n = document.querySelector('.lp-hero'); const nx = n && n.nextElementSibling; if (nx) window.scrollTo({ top: nx.getBoundingClientRect().top + window.scrollY - 70, behavior: document.documentElement.getAttribute('data-motion') === 'reduce' ? 'auto' : 'smooth' }); break; }
    case 'lp-unit': { UIState.lpUnit = +t.getAttribute('data-i'); const old = document.querySelector('.lp-content'); if (old) { const tmp = document.createElement('div'); tmp.innerHTML = LandingSections.content(Landing.sec('content')); const nw = tmp.firstChild; $$('.rv', nw).forEach(e => e.classList.add('in')); old.replaceWith(nw); App._lastLanding = null; } break; }
    case 'admin-enter': {
      if (Admin.ok()) { SafeSS.del('ec_preview'); Router.go('admin'); break; }
      if (AUTH.enabled) { adminLogin(); break; }
      const v = await UI.prompt('أدخل الرمز السري للوحة الإدارة', { title: '🔐 لوحة الإدارة', type: 'password', inputmode: 'numeric', ok: 'دخول' });
      if (v == null) break; if (v.trim() === ADMIN_PASS) { SafeSS.set('ec_admin', '1'); SafeSS.del('ec_preview'); Router.go('admin'); } else UI.alert('الرمز غير صحيح.');
      break;
    }
    case 'admin-exit': SafeSS.del('ec_admin'); SafeSS.del('ec_preview'); if (AUTH.enabled) { AUTH.isAdmin = false; try { await firebase.auth().signOut(); } catch (e) {} } Router.go('home'); break;
    case 'preview': SafeSS.set('ec_preview', '1'); Router.go('home'); break;
    case 'preview-exit': SafeSS.del('ec_preview'); Router.go('admin'); break;
    case 'bc-close': SafeLS.set('ec_bc_closed', t.getAttribute('data-id')); App.render(); break;
    case 'register': doRegister(); break;
    case 'member-login': memberLogin(); break;
    case 'guest': LoginModal.close(); Me.setGuest(); App.render(); window.scrollTo(0, 0); break;
    case 'open-axis': { const a = Content.axis(id); if (a && a._disabled && !Admin.ctl()) UI.alert('هذا المحور غير متاح بعد — سيُفتح قريبًا.', '⏳ قريبًا'); else Router.go('axis', { id }); break; }
    // ----- التمارين -----
    case 'pick-group': { const g = +t.getAttribute('data-g'); Me.setGroup(g); Object.keys(UIState.draft).forEach(k => { const e = Content.ex(k); if (e && e.mode === 'group') delete UIState.draft[k]; }); UIState.editing = {}; App.render(); break; }
    case 'pick-opt': { const d = UIState.draft[exId]; const e = Content.ex(exId); const v = t.getAttribute('data-v'); d[+t.getAttribute('data-i')] = e.format === 'mcq' ? +v : v === 'true'; App.render(); break; }
    case 'pick-cmp': { UIState.draft[exId][+t.getAttribute('data-i')] = t.getAttribute('data-v'); App.render(); break; }
    case 'fb-word': { const w = t.getAttribute('data-w'); UIState.fbSel[exId] = UIState.fbSel[exId] === w ? null : w; App.render(); break; }
    case 'fb-blank': {
      const d = UIState.draft[exId]; const i = +t.getAttribute('data-i'); const sel = UIState.fbSel[exId];
      if (sel) { d[i] = sel; UIState.fbSel[exId] = null; } else if (d[i]) d[i] = null; // الضغط على فراغ ممتلئ دون تحديد كلمة يُفرغه ويعيد كلمته للبنك
      else UI.toast('اختر كلمة من البنك أولًا');
      App.render(); break;
    }
    case 'vote': { // حفظ فوري لكل سؤال على حدة، والتعديل بالضغط على خيار آخر
      if (!Me.isReg()) break; const me = Me.data; const i = t.getAttribute('data-i');
      DB.update('posts/' + exId + '/' + me.uid, { ['answers/' + i]: +t.getAttribute('data-v'), name: me.name, role: me.role || '', uid: me.uid, ts: DB.now() });
      break;
    }
    case 'save-inter': saveInter(exId); break;
    case 'sim-save': Sims.save(exId); break;
    case 'sv-rate': { UIState.draft.sv.ratings[t.getAttribute('data-i')] = +t.getAttribute('data-v'); App.render(); break; }
    case 'sv-nps': { UIState.draft.sv.nps = +t.getAttribute('data-v'); App.render(); break; }
    case 'sv-save': {
      const e = Content.ex(exId); const d = UIState.draft.sv || { ratings: {} };
      if (e.rates.some((_, i) => !d.ratings[i])) { UI.alert('قيّم كل البنود بالنجوم قبل الإرسال.'); break; }
      if (e.nps && d.nps == null) { UI.alert('اختر درجة التوصية من 0 إلى 10.'); break; }
      const me = Me.data; await DB.set('posts/' + exId + '/' + me.uid, Object.assign({}, (Store.posts[exId] || {})[me.uid] || {}, { ratings: d.ratings, nps: d.nps, text: ($('#svText') || {}).value ? $('#svText').value.trim() : '', name: me.name, role: me.role || '', uid: me.uid, ts: DB.now() }));
      UIState.editing[exId] = false; delete UIState.draft.sv; UI.toast('✅ شكرًا لتقييمك'); App.render(); break;
    }
    case 'sim-step': { const e = Content.ex(exId); Sims.state(e).step = +t.getAttribute('data-i'); App.render(); break; }
    case 'sim-reset': { const e = Content.ex(exId); if (await UI.confirm('إعادة المحاكاة إلى البداية؟ (لن تُحذف النتيجة المحفوظة إلا إذا حفظت من جديد)', { ok: 'إعادة' })) { UIState.sim[exId] = Sims.of(e).def(); App.render(); } break; }
    case 'save-text': saveText(exId); break;
    case 'edit-ans': { UIState.editing[exId] = true; const e = Content.ex(exId); if (e) { const p = (Store.posts[exId] || {})[postKey(e)]; if (p && p.answers) UIState.draft[exId] = ansList(p.answers, e.items.length); } App.render(); break; }
    case 'cancel-edit': UIState.editing[exId] = false; delete UIState.draft[exId]; delete UIState.draft.sv; App.render(); break;
    case 'show-model': UIState.modelShown[exId] = true; App.render(); break;
    case 'del-post': { if (await UI.confirm('حذف هذه المشاركة وحدها؟ لن تتأثر بقية المشاركات.', { danger: true, ok: 'حذف' })) DB.remove('posts/' + exId + '/' + t.getAttribute('data-k')); break; }
    // ----- المختبر -----
    case 'lab-start': { const g = Me.group(); if (g) DB.set('lab/timers/g' + g, { start: DB.now(), pausedTotal: 0, by: Me.uid() }); break; }
    case 'lab-pause': { const g = Me.group(); DB.update('lab/timers/g' + g, { pausedAt: DB.now(), by: Me.uid() }); break; }
    case 'lab-resume': { const g = Me.group(); const tm = Store.labTimers['g' + g] || {}; DB.update('lab/timers/g' + g, { by: Me.uid(), pausedTotal: (tm.pausedTotal || 0) + (DB.now() - (tm.pausedAt || DB.now())), pausedAt: null }); break; }
    case 'lab-reset': { if (await UI.confirm('إعادة الوقت إلى الصفر لمجموعتك؟ الإجابات المحفوظة لن تُحذف.', { ok: 'إعادة ضبط الوقت' })) DB.set('lab/timers/g' + Me.group(), { by: Me.uid(), resetAt: DB.now() }); break; }
    case 'lab-save': { const i = t.getAttribute('data-i'); const ta = $('#labAns' + i); const txt = ta ? ta.value.trim() : ''; if (!txt) { UI.alert('اكتبوا مخرج المرحلة أولًا.'); break; } await DB.update('lab/answers/g' + Me.group() + '/s' + i, { text: txt, name: Me.data.name, uid: Me.uid(), ts: DB.now() }); UIState.editing['lab' + i] = false; if (ta) ta.value = ''; UI.toast('✅ حُفظت المرحلة'); App.render(); break; }
    case 'del-lab': { if (await UI.confirm('حذف إجابة هذه المرحلة؟', { danger: true, ok: 'حذف' })) DB.remove('lab/answers/' + t.getAttribute('data-k') + '/s' + t.getAttribute('data-i')); break; }
    // ----- حسابي -----
    case 'acc-save': { const { data, err } = RegFields.collect(document, 'acc_'); if (err) { UI.alert(err); break; } const me = Object.assign({}, Me.data, { name: data.name || Me.data.name, role: data.role != null ? data.role : Me.data.role }); Me.save(me); await DB.update('users/' + me.uid, { name: me.name, role: me.role || '' }); await DB.update('private/' + me.uid, { f: Object.assign({}, (Store.users[me.uid] || {}).f || {}, data.f), 'consent/followup': !!($('#accFollow') || {}).checked }); UI.toast('✅ تم تحديث بياناتك'); App.render(); break; }
    case 'privacy-show': ev.preventDefault(); privacyModal(); break;
    case 'rr-move': case 'rr-del': case 'rr-add': {
      const fs = collectRegRows(); if (act === 'rr-add') fs.push({ key: 'c' + genId(), label: 'حقل جديد', type: 'text', visible: true, required: false, options: [], builtin: false });
      else if (act === 'rr-del') fs.splice(+t.getAttribute('data-i'), 1); else { const i = +t.getAttribute('data-i'), j = i + (+t.getAttribute('data-d')); [fs[i], fs[j]] = [fs[j], fs[i]]; }
      UIState.regDraft = fs; App.render(); break;
    }
    case 'rr-save': { const fs = collectRegRows(); const fields = {}; fs.forEach(f => { fields[f.key] = { label: f.label, type: f.type, visible: !!f.visible, required: !!f.required, options: f.options, ph: f.ph || '' }; }); const cur = ((Store.site || {}).regFields || {}).fields || {}; Object.keys(cur).forEach(k => { if (!fields[k] && !REG_DEFAULTS[k]) fields[k] = Object.assign({}, cur[k], { deleted: true }); }); await DB.set('site/regFields', { order: fs.map(f => f.key), fields }); UIState.regDraft = null; UI.toast('✅ حُفظ نموذج التسجيل'); break; }
    case 'rr-reset': { if (await UI.confirm('استرجاع حقول التسجيل الافتراضية؟', { ok: 'استرجاع' })) { await DB.remove('site/regFields'); UIState.regDraft = null; App.render(); } break; }
    case 'pv-save': await DB.set('site/privacy', { text: $('#pvText').value.trim(), consent: $('#pvConsent').value.trim(), followup: $('#pvFollow').value.trim() }); UI.toast('✅ حُفظ'); break;
    case 'pv-reset': { if (await UI.confirm('استرجاع النص الافتراضي؟', { ok: 'استرجاع' })) DB.remove('site/privacy'); break; }
    case 'users-csv': exportUsersCsv(); break;
    case 'bk-now': { const ok = await autoBackup(true); UI.toast(ok ? '✅ أُخذت نسخة احتياطية الآن' : 'تعذر أخذ النسخة'); break; }
    case 'bk-dl': { const d = t.getAttribute('data-d'); const b = await DB.get('backups/' + d); downloadBlob(new Blob([JSON.stringify({ app: 'qdb-ecom-data', day: d, data: b && b.data }, null, 2)], { type: 'application/json' }), 'نسخة مدخلات المتدربين ' + d + '.json'); break; }
    case 'bk-restore': restoreBackup(t.getAttribute('data-d')); break;
    case 'delete-me': deleteMyData(); break;
    case 'congrats-pdf': buildCongratsPdf(Me.data.name, t.getAttribute('data-kind') || 'congrats'); break;
    case 'congrats-mail': {
      const subj = 'تهنئة إنجاز — ' + Content.courseTitle();
      const body = 'مرحبًا،\n\nأحتفظ بهذه الرسالة كنسخة من تهنئة الإنجاز الخاصة بي في برنامج «' + Content.courseTitle() + '».\nالاسم: ' + Me.data.name + '\nالتاريخ: ' + fmtDate(Date.now()) + '\n\nتنبيه مهم: صفحة الويب لا تستطيع إرفاق الملف تلقائيًا (لا يوجد خادم بريد). يُرجى إرفاق ملف PDF الذي حمّلته من زر «تحميل / حفظ كـ PDF» يدويًا قبل الإرسال.';
      location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body); break;
    }
    case 'content-pdf': buildContentPdf(); break;
    case 'translate': Translate.menu(); break;
    case 'prefs': Prefs.menu(); break;
    case 'save-card': saveMemberCard(Object.assign({}, Me.data, { member: Me.data.member || ((Store.users[Me.uid()] || {}).member) })); break;
    case 'my-filter': UIState.myFilter = t.getAttribute('data-k'); App.render(); break;
    case 'checkin': {
      if (!Attend.on()) break;
      const d = t.getAttribute('data-d'); const inp = $('#checkin' + d); const v = inp ? inp.value.replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).trim() : '';
      const cd = (Attend.cfg().codes || {})['d' + d] || {};
      if (!cd.open) { UI.alert('تسجيل الحضور لهذا اليوم مغلق الآن.'); break; }
      if (!v) { UI.alert('اكتب رمز الحضور المعروض على الشاشة.'); break; }
      // الرمز لا يصل إلى المتصفح؛ الخادم يقارنه بالرمز السري ويقبل التسجيل أو يرفضه
      try { await DB.set('checkins/d' + d + '/' + Me.uid(), { code: v, ts: DB.now() }, { quiet: true }); UI.toast('✅ تم تسجيل حضورك لليوم ' + d); }
      catch (e) { UI.alert(DB.real ? 'الرمز غير صحيح أو أُغلق التسجيل. تأكد من الرمز المعروض على الشاشة.' : 'تعذر التسجيل: ' + h(e.message || e)); }
      break;
    }
    case 'as-pick': { const k = 'as_' + t.getAttribute('data-ph'); UIState.draft[k][+t.getAttribute('data-i')] = +t.getAttribute('data-v'); App.render(); break; }
    case 'as-submit': {
      const ph = t.getAttribute('data-ph'); const d = UIState.draft['as_' + ph] || []; const A = Content.assess();
      if (!Assess.isOpen(ph)) { UI.alert('التقييم مغلق الآن.'); break; }
      if (A.items.some((_, i) => d[i] === null || d[i] === undefined)) { UI.alert('أجب عن كل الأسئلة قبل الإرسال.'); break; }
      if (!(await UI.confirm('إرسال إجاباتك نهائيًا؟ لا يمكن تعديلها بعد الإرسال.', { ok: 'إرسال' }))) break;
      const me = Me.data; await DB.set('assess/' + ph + '/' + me.uid, { answers: A.items.map((_, i) => d[i]), name: me.name, role: me.role || '', ts: DB.now(), done: true });
      UI.toast('✅ تم إرسال ' + (ph === 'pre' ? 'التقييم القبلي' : 'التقييم البعدي')); App.render(); break;
    }
    // ----- لوحة الأدمن -----
    case 'bell': UIState.bellOpen = !UIState.bellOpen; App.render(); if (UIState.bellOpen) setTimeout(() => { SafeLS.set('ec_bell_seen', String(Date.now())); if (UIState.bellOpen) App.render(); }, 1800); break;
    case 'drop': { const k = t.getAttribute('data-k'); if (k === 'regEdit') UIState.regDraft = null; UIState.openDrop.has(k) ? UIState.openDrop.delete(k) : UIState.openDrop.add(k); App.render(); break; }
    case 'acc': { if (ev.target.closest('.acc-actions') || ev.target.closest('.drag-handle')) break; const k = t.getAttribute('data-k'); UIState.openAcc.has(k) ? UIState.openAcc.delete(k) : UIState.openAcc.add(k); App.render(); break; }
    case 'clear-names': { if (await UI.confirm('مسح أسماء المسجّلين فقط من السيرفر؟ لن تتأثر الإجابات أو المؤقتات، ولن يُطلب من أي متدرب حالي إعادة التسجيل.', { danger: true, ok: 'مسح الأسماء' })) { await DB.remove('users'); UI.toast('تم مسح قائمة الأسماء'); } break; }
    case 'save-groups': { const n = parseInt($('#grpCount').value, 10); if (!(n >= 2 && n <= 30)) { UI.alert('اختر عددًا بين 2 و30.'); break; } await DB.set('settings/groups/count', n); UI.toast('✅ عدد المجموعات: ' + n); break; }
    case 'assign-open': Assign.show(); break;
    case 'assign-close': if (Assign.modal) Assign.modal.close(); break;
    case 'ag-toggle': { const g = +t.getAttribute('data-g'); Assign.open.has(g) ? Assign.open.delete(g) : Assign.open.add(g); Assign.render(); break; }
    case 'unassign': DB.remove('assign/' + t.getAttribute('data-uid')); break;
    case 'unassign-all': { if (await UI.confirm('إلغاء كل التعيينات وإعادة الجميع للاختيار الحر؟', { danger: true, ok: 'إلغاء الكل' })) DB.remove('assign'); break; }
    case 'congrats-preview': { const kind = t.getAttribute('data-kind') || 'congrats'; const nm = (Me.data && Me.data.name) || 'اسم المتدرب'; const m = UI.modal('<div class="congrats-card ' + (kind === 'cert' ? 'cert-card' : '') + '">' + congratsInner(nm, kind) + '</div><div class="notice">ℹ️ ' + h(Content.doc(kind).notice) + '</div><div class="actions"><button class="btn btn-primary btn-sm" data-pv-pdf>📥 معاينة PDF</button></div>', { wide: true }); $('[data-pv-pdf]', m.el).onclick = () => buildCongratsPdf(nm, kind); break; }
    case 'bc-send': { const txt = $('#bcText').value.trim(); if (!txt) { UI.alert('اكتب نص الرسالة.'); break; } await DB.set('broadcast', { text: txt, id: genId('b'), ts: DB.now() }); $('#bcText').value = ''; UI.toast('📣 تم البث'); break; }
    case 'bc-stop': DB.remove('broadcast'); break;
    case 'export-csv': exportAllCsv(); break;
    case 'person-pdf': { const u = t.getAttribute('data-uid'); const pm = progressModal('📄 ملف ' + ((Store.users[u] || {}).name || '')); try { const doc = await personPdfDoc(u, pm); doc.save('مشاركات - ' + safeName((Store.users[u] || {}).name) + '.pdf'); } catch (e) { UI.alert('تعذر إنشاء الملف: ' + h(e.message || e)); } pm.close(); break; }
    case 'person-csv': { const u = t.getAttribute('data-uid'); downloadBlob(personCsvBlob(u), 'مشاركات - ' + safeName((Store.users[u] || {}).name) + '.csv'); break; }
    case 'export-all-pdf': exportAllPersons('pdf'); break;
    case 'export-all-csv': exportAllPersons('csv'); break;
    case 'export-all': exportAll(); break;
    case 'code-copy': { const u = t.getAttribute('data-uid'); const x = (Store.users || {})[u] || {}; const code = (Store.secrets || {})[u]; if (!code) { UI.alert('لا يوجد رمز لهذا المتدرب بعد. اضغط «🔄 رمز جديد» لتوليده.'); break; }
      const msg = 'مرحبًا ' + (x.name || '') + '،\nبيانات دخولك إلى منصة «' + Content.courseTitle() + '» من أي جهاز:\nرقم العضوية: ' + pad4(x.member || 0) + '\nرمز الدخول الشخصي: ' + code + '\n(اختر «مسجّل مسبقًا؟ الدخول برقم العضوية»)';
      try { await navigator.clipboard.writeText(msg); UI.toast('📋 نُسخت رسالة الدخول — أرسلها للمتدرب'); } catch (e) { UI.prompt('انسخ الرسالة:', { value: msg, title: 'رسالة الدخول' }); } break; }
    case 'code-new': { const u = t.getAttribute('data-uid'); const x = (Store.users || {})[u] || {};
      if (!(await UI.confirm('توليد رمز دخول جديد لـ«' + h(x.name || '') + '»؟ سيتوقف الرمز القديم، وتُلغى الأجهزة المرتبطة حاليًا بحسابه، فيدخل من جديد برقم العضوية والرمز الجديد.', { ok: 'توليد رمز جديد' }))) break;
      const code = genCode(); await DB.update('', { ['secrets/' + u]: code, ['devices/' + u]: null }); UI.toast('🔑 الرمز الجديد: ' + code, 7000); break; }
    case 'backup': downloadBlob(new Blob([JSON.stringify(await backupData(), null, 2)], { type: 'application/json' }), 'نسخة احتياطية للمحتوى ' + fmtDate(Date.now()).replace(/\//g, '-') + '.json'); break;
    case 'home-save': { const o = {}; $$('[data-home]', root).forEach(i => { o[i.getAttribute('data-home')] = i.value.trim(); }); o.heroDesc = RTE.val(root, 'heroDesc'); o.heroImage = ImgPick.val('heroImage'); await DB.set('site/home', o); UI.toast('✅ حُفظت الواجهة ونُشرت حيًا'); break; }
    case 'home-reset': { if (await UI.confirm('استرجاع كل عناصر الواجهة لنصوصها ورسمها الأصلي؟', { ok: 'استرجاع' })) { await DB.remove('site/home'); UI.toast('تم الاسترجاع'); } break; }
    case 'reg-set': { const n = parseInt($('#regCountIn').value, 10); if (!(n >= 0)) break; await DB.set('stats/registered', n); UI.toast('✅ تم تحديث الرقم'); break; }
    case 'reg-zero': { if (await UI.confirm('تصفير عدد المسجّلين المعروض؟', { ok: 'تصفير' })) DB.set('stats/registered', 0); break; }
    case 'cg-add-para': $('[data-cg-paras]', t.closest('.tool-drop')).insertAdjacentHTML('beforeend', '<div class="row" style="margin-bottom:6px"><textarea data-cg-para rows="2" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:6px 8px;font-family:var(--f-body)"></textarea><button class="btn btn-danger btn-xs" data-act="cg-del-para">🗑</button></div>'); break;
    case 'cg-del-para': t.closest('.row').remove(); break;
    case 'cg-save': { const kind = t.getAttribute('data-kind'); const box = t.closest('.tool-drop'); const o = { paragraphs: $$('[data-cg-para]', box).map(x => x.value.trim()).filter(Boolean) }; $$('[data-cg]', box).forEach(x => { o[x.getAttribute('data-cg')] = x.value.trim(); }); await DB.set('site/' + kind, o); UI.toast('✅ حُفظ المحتوى'); break; }
    case 'cg-reset': { const kind = t.getAttribute('data-kind'); if (await UI.confirm('استرجاع المحتوى الافتراضي؟', { ok: 'استرجاع' })) DB.remove('site/' + kind); break; }
    // ----- الحضور -----
    case 'att-feature': {
      const f = t.getAttribute('data-f'); const on = f === 'enabled' ? Attend.on() : Attend.certOn(); const upd = { [f]: !on };
      if (f === 'enabled' && on) Attend.days().forEach(d => { if ((Attend.cfg().codes['d' + d] || {}).open) upd['codes/d' + d + '/open'] = false; }); // إغلاق أي تسجيل مفتوح
      await DB.update('settings/attendance', upd); UI.toast(f === 'enabled' ? (on ? '⏸ عُطّل تسجيل الحضور (ومعه الشهادة)' : '✅ فُعّل تسجيل الحضور') : (on ? '⏸ عُطّلت شهادة المشاركة' : '✅ فُعّلت شهادة المشاركة')); break;
    }
    case 'att-cfg-save': { const days = parseInt($('#attDays').value, 10), hours = parseFloat($('#attHours').value), th = parseInt($('#attTh').value, 10); if (!(days >= 1 && days <= 10) || !(hours > 0) || !(th >= 0 && th <= 100)) { UI.alert('تحقق من القيم المدخلة.'); break; } await DB.update('settings/attendance', { days, hours, threshold: th }); UI.toast('✅ حُفظت إعدادات الحضور'); break; }
    case 'att-code': { const d = t.getAttribute('data-d'); await DB.set('secure/attcodes/d' + d + '/code', String(Math.floor(1000 + Math.random() * 9000))); break; }
    case 'att-open': { const d = t.getAttribute('data-d'); const cd = Attend.cfg().codes['d' + d] || {}; await DB.update('settings/attendance/codes/d' + d, { open: !cd.open }); UI.toast(cd.open ? '🔒 أُغلق تسجيل الحضور' : '🟢 فُتح تسجيل الحضور لليوم ' + d); break; }
    case 'att-show': { const d = t.getAttribute('data-d'); const cd = Attend.cfg().codes['d' + d] || {}; const m = UI.modal('<div class="center"><div class="sec-kicker">رمز حضور اليوم ' + d + '</div><div class="att-big num notranslate" translate="no">' + h(cd.code || '') + '</div><p class="muted" style="font-family:var(--f-ui)">افتح المنصة ← أدخل الرمز في شريط «تسجيل الحضور» أعلى الصفحة</p></div><div class="actions" style="justify-content:center"><button class="btn btn-ghost" data-x>إغلاق</button></div>', { wide: true }); $('[data-x]', m.el).onclick = () => m.close(); break; }
    case 'att-all': { const d = t.getAttribute('data-d'); if (!(await UI.confirm('تسجيل حضور كامل لكل المسجّلين في اليوم ' + d + '؟', { ok: 'تسجيل' }))) break; const upd = {}; Object.keys(Store.users || {}).forEach(u => { upd['attendance/' + u + '/d' + d] = Attend.cfg().hours; }); await DB.update('', upd); UI.toast('✅ تم'); break; }
    case 'att-clear': { if (await UI.confirm('مسح سجل الحضور بالكامل؟', { danger: true, ok: 'مسح' })) DB.remove('attendance'); break; }
    case 'att-csv': exportAttendanceCsv(); break;
    // ----- التقييم -----
    case 'as-toggle': { const ph = t.getAttribute('data-ph'); const cur = (await DB.get('settings/assess/' + ph)) || (ph === 'pre' ? 'open' : 'closed'); await DB.set('settings/assess/' + ph, cur === 'open' ? 'closed' : 'open'); break; }
    case 'as-reveal': { const cur = await DB.get('settings/assess/reveal'); await DB.set('settings/assess/reveal', !cur); UI.toast(cur ? '🔒 أُخفيت النتائج' : '🔓 كُشفت النتائج والإجابات الصحيحة'); break; }
    case 'as-clear': { const ph = t.getAttribute('data-ph'); if (await UI.confirm('مسح كل نتائج ' + (ph === 'pre' ? 'التقييم القبلي' : 'التقييم البعدي') + '؟', { danger: true, ok: 'مسح' })) DB.remove('assess/' + ph); break; }
    case 'assessform-save': Views.assessEdit.save(root); break;
    case 'assess-reset-content': { if (await UI.confirm('استرجاع الأسئلة الافتراضية؟', { ok: 'استرجاع' })) { await DB.remove('content/assess'); FormState.exId = null; Router.go('admin'); } break; }
    case 'report-pdf': buildReportPdf(t.getAttribute('data-lang') || 'ar'); break;
    case 'leads-csv': exportLeadsCsv(); break;
    case 'plan-pdf': buildPlanPdf(Me.uid()); break;
    case 'tpl-doc': { const tp = TEMPLATES.find(x => x.id === id); downloadBlob(new Blob(['\ufeff' + tplDoc(tp)], { type: 'application/msword' }), tp.title + '.doc'); break; }
    case 'tpl-pdf': tplPdf(TEMPLATES.find(x => x.id === id)); break;
    case 'tpl-view': { const tp = TEMPLATES.find(x => x.id === id); UI.modal('<div class="tpl-preview">' + tp.body + '</div><div class="actions"><button class="btn btn-primary btn-sm" data-act="tpl-doc" data-id="' + tp.id + '">⬇️ Word</button></div>', { wide: true }); break; }
    case 'fu-save': {
      const n = t.getAttribute('data-n'); const acts = $$('[data-fu-a]').filter(x => x.checked).map(x => FU_ACTIONS[+x.getAttribute('data-fu-a')]);
      if (!acts.length && !$('#fuSales').value) { UI.alert('اختر ما طبقته أو تغير المبيعات على الأقل.'); break; }
      await DB.set('followups/d' + n + '/' + Me.uid(), { actions: acts, sales: $('#fuSales').value, useful: +$('#fuUse').value || null, win: $('#fuWin').value.trim(), need: $('#fuNeed').value.trim(), name: Me.data.name, ts: DB.now() });
      UI.toast('✅ شكرًا! أُرسلت المتابعة'); App.render(); break;
    }
    case 'fu-mail': followupMailto(t.getAttribute('data-n')); break;
    case 'fu-wa': { const n = t.getAttribute('data-n'); const msg = 'مرحبًا 👋 مرّ ' + n + ' يومًا على برنامج «' + Content.courseTitle() + '». شاركنا ما طبقته في مشروعك عبر نموذج قصير (دقيقتان): ' + Followup.link(n); try { await navigator.clipboard.writeText(msg); UI.toast('📋 نُسخت رسالة واتساب — الصقها في مجموعة البرنامج'); } catch (e) { UI.prompt('انسخ الرسالة:', { value: msg }); } break; }
    case 'fu-state': { const n = t.getAttribute('data-n'); const cur = Followup.cfg().open[n] || 'auto'; const nx = cur === 'auto' ? 'open' : cur === 'open' ? 'closed' : 'auto'; await DB.set('site/followup/open/' + n, nx === 'auto' ? null : nx); break; }
    case 'fu-csv': exportFollowupCsv(); break;
    case 'gm-toggle': { const c = Points.cfg(); await DB.set('site/gamify/' + t.getAttribute('data-k'), !c[t.getAttribute('data-k')]); break; }
    case 'tpl-vis': DB.set('visibility/tpl_' + id, Content.isHidden('tpl_' + id) ? null : false); break;
    case 'pr-q': { const c = Present.cfg(); DB.set('settings/present/q', Math.max(0, (+c.q || 0) + (+t.getAttribute('data-d')))); break; }
    case 'pr-full': { try { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); } catch (e) {} break; }
    case 'logo-save': { await DB.set('site/brandLogo', ImgPick.val('brandLogo') || null); UI.toast('✅ حُفظ الشعار'); break; }
    case 'lead-edit': UIState.editing.lead = true; App.render(); break;
    case 'lead-withdraw': { if (await UI.confirm('سحب اهتمامك ببرامج البنك؟', { ok: 'سحب' })) DB.remove('leads/' + Me.uid()); break; }
    case 'lead-save': {
      const w = t.getAttribute('data-w'); const box = t.closest('.lead-box'); const c = Leads.cfg();
      const programs = $$('[data-lead-p]', box).filter(x => x.checked).map(x => c.programs[+x.getAttribute('data-lead-p')]);
      if (!programs.length) { UI.alert('اختر برنامجًا واحدًا على الأقل.'); break; }
      if (!($('#leadConsent_' + w) || {}).checked) { UI.alert('يلزم الموافقة على مشاركة بياناتك مع البنك.'); break; }
      const contact = $('#leadContact_' + w).value.trim(); if (!contact) { UI.alert('اكتب رقم الهاتف أو البريد للتواصل.'); break; }
      const u = Store.users[Me.uid()] || {};
      await DB.set('leads/' + Me.uid(), { programs, need: $('#leadNeed_' + w).value.trim(), method: $('#leadMethod_' + w).value, contact, name: Me.data.name, org: RegFields.val(u, 'org'), consent: DB.now(), ts: DB.now() });
      UIState.editing.lead = false; UI.toast('🤝 سُجّل اهتمامك وسيصل إلى الجهة المنظمة'); App.render(); break;
    }
    case 'leads-cfg-save': { const progs = $('#lcProgs').value.split('\n').map(x => x.trim()).filter(Boolean); await DB.set('site/leads', { intro: $('#lcIntro').value.trim(), consent: $('#lcConsent').value.trim(), programs: progs, axis: $('#lcAxis').value }); UI.toast('✅ حُفظ'); break; }
    case 'leads-cfg-reset': { if (await UI.confirm('استرجاع الإعدادات الافتراضية لنموذج الاهتمام؟', { ok: 'استرجاع' })) DB.remove('site/leads'); break; }
    case 'mon-toggle': { const c = Monitor.cfg(); const tok = c.token || genId('m') + genId(); await DB.set('secure/monitor', { enabled: !c.enabled, token: tok }); if (c.enabled) await DB.remove('monitorData/' + tok); else setTimeout(() => Monitor.publish(true), 500); break; }
    case 'mon-new': { if (await UI.confirm('إنشاء رابط جديد؟ سيتوقف الرابط القديم عن العمل.', { ok: 'إنشاء' })) { const old = Monitor.cfg().token; await DB.set('secure/monitor', { enabled: true, token: genId('m') + genId() }); if (old) await DB.remove('monitorData/' + old); setTimeout(() => Monitor.publish(true), 500); } break; }
    case 'mon-copy': { const u = Monitor.url(); try { await navigator.clipboard.writeText(u); UI.toast('📋 نُسخ الرابط'); } catch (e) { UI.prompt('انسخ الرابط:', { value: u, title: 'رابط المتابعة' }); } break; }
    case 'mon-open': Router.go('monitor', { id: Monitor.cfg().token }); break;
    case 'cohort-save': { await DB.update('settings/cohort', { name: $('#cohName').value.trim() || 'الدفعة', start: $('#cohStart').value, end: $('#cohEnd').value }); UI.toast('✅ حُفظت بيانات الدفعة'); break; }
    case 'cohort-close': closeCohort(); break;
    case 'coh-report': { const cid = t.getAttribute('data-cid'); const c = await DB.get('cohorts/' + cid); if (!c) break; buildReportPdf(t.getAttribute('data-lang') || 'ar', c.data, c.meta && c.meta.name); break; }
    case 'coh-csv': { const cid = t.getAttribute('data-cid'); const c = await DB.get('cohorts/' + cid); if (c) exportReportCsv(c.data, c.meta && c.meta.name); break; }
    case 'coh-json': { const cid = t.getAttribute('data-cid'); const c = await DB.get('cohorts/' + cid); downloadBlob(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' }), 'أرشيف ' + safeName(c && c.meta && c.meta.name) + '.json'); break; }
    case 'coh-del': { const cid = t.getAttribute('data-cid'); if (await UI.confirm('حذف أرشيف هذه الدفعة نهائيًا؟', { danger: true, ok: 'حذف' })) DB.update('', { ['cohorts/' + cid]: null, ['cohortIndex/' + cid]: null }); break; }
    case 'guide-pdf': buildGuidePdf(); break;
    case 'guide-save': { const L = id2 => ($(id2).value || '').split('\n').map(x => x.trim()).filter(Boolean); const day = id2 => L(id2).map(x => { const p = x.split('|').map(y => y.trim()); return { t: p[0] || '', min: +p[1] || 0, act: p[2] || '', note: p[3] || '' }; }); await DB.set('site/guide', { objectives: L('#gObj'), methodology: L('#gMeth'), days: [day('#gDay0'), day('#gDay1')] }); UI.toast('✅ حُفظ الدليل'); break; }
    case 'guide-reset': { if (await UI.confirm('استرجاع بيانات الدليل الافتراضية؟', { ok: 'استرجاع' })) DB.remove('site/guide'); break; }
    case 'report-csv': exportReportCsv(); break;
    // ----- أقسام الرئيسية -----
    case 'sec-move': { const k = t.getAttribute('data-k'); const ids = Content.homeSections({ all: true }).map(x => x.key); const i = ids.indexOf(k), j = i + (+t.getAttribute('data-d')); if (j < 0 || j >= ids.length) break; [ids[i], ids[j]] = [ids[j], ids[i]]; DB.set('site/homeOrder', ids); break; }
    case 'sec-add': { const k = 'c' + genId(); const type = $('#newSecType').value; await DB.set('site/sections/' + k, { type, title: SECTION_TYPES[type], kicker: '', body: '', ts: DB.now() }); FormState.exId = null; Router.go('secEdit', { id: k }); break; }
    case 'sec-copy': { const k = t.getAttribute('data-k'); const cur = ((Store.site || {}).sections || {})[k]; if (!cur) break; await DB.set('site/sections/c' + genId(), Object.assign({}, cur, { title: (cur.title || '') + ' (نسخة)', ts: DB.now() })); UI.toast('🧬 تم نسخ القسم'); break; }
    case 'sec-del': { const k = t.getAttribute('data-k'); if (await UI.confirm('حذف هذا القسم نهائيًا من الصفحة الرئيسية؟', { danger: true, ok: 'حذف' })) DB.update('', { ['site/sections/' + k]: null, ['visibility/home_' + k]: null }); break; }
    case 'sec-reset-order': DB.remove('site/homeOrder'); break;
    case 'adm-edit': UIState.adminEdit = !UIState.adminEdit; App.render(); break;
    case 'adm-grp': UIState.adminGrp = t.getAttribute('data-g'); SafeLS.set('ec_admin_grp', UIState.adminGrp); App.render(); { const p = document.querySelector('.adm-pane'); if (p && window.innerWidth <= 860) window.scrollTo({ top: p.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }); else window.scrollTo(0, 0); } break;
    case 'adm-gmove': { const gs = AdminNav.groups(); const i = gs.findIndex(g => g.id === t.getAttribute('data-g')), j = i + (+t.getAttribute('data-d')); if (i < 0 || j < 0 || j >= gs.length) break; [gs[i], gs[j]] = [gs[j], gs[i]]; AdminNav.save(gs); break; }
    case 'adm-gadd': { const title = await UI.prompt('اسم العنوان الجديد', { title: '➕ عنوان جديد في القائمة', placeholder: 'مثال: أدوات اليوم الأول', ok: 'إضافة' }); if (!title || !title.trim()) break; const gs = AdminNav.groups(); const id = 'g' + Date.now().toString(36); gs.push({ id, icon: '📁', title: title.trim(), blocks: [] }); await AdminNav.save(gs); UIState.adminGrp = id; SafeLS.set('ec_admin_grp', id); App.render(); break; }
    case 'adm-gdel': { const gs = AdminNav.groups(); const g = gs.find(x => x.id === t.getAttribute('data-g')); if (!g || gs.length < 2) break; const rest = gs.filter(x => x !== g); if (!(await UI.confirm('حذف العنوان «' + h(g.title) + '»؟' + (g.blocks.length ? ' ستنتقل أدواته (<span class="num">' + g.blocks.length + '</span>) إلى «' + h(rest[0].title) + '».' : ''), { ok: 'حذف', danger: true }))) break; rest[0].blocks = rest[0].blocks.concat(g.blocks); await AdminNav.save(rest); if (UIState.adminGrp === g.id) UIState.adminGrp = rest[0].id; App.render(); break; }
    case 'adm-reset': if (await UI.confirm('استرجاع العناوين الافتراضية وتوزيع الأدوات الأصلي؟', { ok: 'استرجاع' })) { $$('[data-keep^="adm-"]').forEach(el => el.removeAttribute('data-keep')); DB.remove('site/adminNav'); } break;
    case 'lp-move': { const k = t.getAttribute('data-k'); const ids = Landing.order(); const i = ids.indexOf(k), j = i + (+t.getAttribute('data-d')); if (j < 0 || j >= ids.length) break; [ids[i], ids[j]] = [ids[j], ids[i]]; DB.set('site/landing/_order', ids); break; }
    case 'lp-vis': { const k = t.getAttribute('data-k'); DB.set('site/landing/_hidden/' + k, Landing.hidden(k) ? null : true); break; }
    case 'lp-reset-order': DB.remove('site/landing/_order'); break;
    case 'lp-save': { const k = t.getAttribute('data-k'); const o = {}; ['kicker', 'title', 'sub', 'cta', 'cta2', 'items'].forEach(f => { const el = document.getElementById('lp_' + k + '_' + f); if (el) o[f] = el.value.trim(); }); await DB.set('site/landing/' + k, o); UI.toast('✅ حُفظ قسم «' + LANDING_NAMES[k] + '»'); break; }
    case 'lp-reset': { const k = t.getAttribute('data-k'); if (await UI.confirm('استرجاع النصوص الافتراضية لقسم «' + LANDING_NAMES[k] + '»؟', { ok: 'استرجاع' })) { DB.remove('site/landing/' + k); $$('[data-keep^="lp-' + k + '-"]').forEach(el => el.removeAttribute('data-keep')); } break; }
    case 'home-layout': DB.set('site/homeLayout', t.getAttribute('data-v')); UI.toast(t.getAttribute('data-v') === 'classic' ? 'عادت الرئيسية إلى التخطيط الطويل' : 'فُعّل تخطيط القائمة الجانبية'); break;
    case 'home-sec': case 'acc-sec': {
      if (act === 'acc-sec') { UIState.accSec = t.getAttribute('data-k'); SafeLS.set('ec_acc_sec', UIState.accSec); } else { UIState.homeSec = t.getAttribute('data-k'); SafeLS.set('ec_home_sec', UIState.homeSec); } App.render();
      const pane = document.getElementById('homePane'); const nav = document.querySelector('.home-nav');
      if (pane) { const top = pane.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 860 && nav ? nav.offsetHeight + 76 : 84); if (window.scrollY > top || t.classList.contains('hn-next') || window.innerWidth <= 860) window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' }); }
      const actEl = document.querySelector('.hn-item.active'); if (actEl && actEl.scrollIntoView && window.innerWidth <= 860) actEl.scrollIntoView({ block: 'nearest', inline: 'center' });
      break;
    }
    case 'sec-save': Views.secEdit.save(root); break;
    case 'sec-label-reset': { await DB.remove('site/labels/' + Router.cur.id); UI.toast('تم الاسترجاع'); Router.go('admin'); break; }
    case 'units-save': { const o = {}; UNIT_IDS.forEach(n => { const k = $('[data-unit-k="' + n + '"]').value.trim(), nm = $('[data-unit-n="' + n + '"]').value.trim(); if (k !== UNIT_KICKERS[n] || nm !== UNIT_NAMES[n]) o[n] = { kicker: k, name: nm }; }); await DB.set('site/units', Object.keys(o).length ? o : null); UI.toast('✅ حُفظت أسماء الوحدات'); break; }
    case 'units-reset': { if (await UI.confirm('استرجاع أسماء الوحدات الافتراضية؟', { ok: 'استرجاع' })) DB.remove('site/units'); break; }
    // ----- الترتيب -----
    case 'axis-move': { const ids = Content.axisIds(); const i = ids.indexOf(id), j = i + (+t.getAttribute('data-d')); if (i < 0 || j < 0 || j >= ids.length) break; [ids[i], ids[j]] = [ids[j], ids[i]]; DB.set('order/axes', ids); break; }
    case 'ex-move': { const key = t.getAttribute('data-key'); const ids = key === '_acts' ? Content.activities({ all: true }).map(e => e.id) : Content.exIdsOf(key); const i = ids.indexOf(id), j = i + (+t.getAttribute('data-d')); if (i < 0 || j < 0 || j >= ids.length) break; [ids[i], ids[j]] = [ids[j], ids[i]]; DB.set('order/ex/' + key, ids); break; }
    case 'story-move': { const ids = Content.storyIds(); const i = ids.indexOf(id), j = i + (+t.getAttribute('data-d')); if (i < 0 || j < 0 || j >= ids.length) break; [ids[i], ids[j]] = [ids[j], ids[i]]; DB.set('order/stories', ids); break; }
    case 'story-reset': { if (await UI.confirm('استرجاع النص الأصلي لهذه القصة؟', { ok: 'استرجاع' })) DB.remove('content/stories/' + id); break; }
    case 'story-delete': { if (await UI.confirm('حذف هذه القصة نهائيًا؟', { danger: true, ok: 'حذف' })) DB.update('', { ['added/stories/' + id]: null, ['visibility/' + id]: null, ['storyLikes/' + id]: null }); break; }
    case 'storyform-save': Views.storyEdit.save(root); break;
    // ----- المختبر -----
    case 'lab-reset-content': { if (await UI.confirm('استرجاع المحتوى الأصلي للمختبر؟', { ok: 'استرجاع' })) DB.remove('content/lab'); break; }
    case 'lab-clear': { if (await UI.confirm('مسح كل إجابات ومؤقتات المختبر لكل المجموعات؟', { danger: true, ok: 'مسح' })) DB.remove('lab'); break; }
    case 'labform-save': Views.labEdit.save(root); break;
    case 'st-add': FormState.items = Views.labEdit.collect(root); FormState.items.push({ icon: '📌', title: '', task: '' }); $('#stagesEd').innerHTML = Views.labEdit.stagesHtml(); break;
    case 'st-del': FormState.items = Views.labEdit.collect(root); FormState.items.splice(+t.getAttribute('data-i'), 1); $('#stagesEd').innerHTML = Views.labEdit.stagesHtml(); break;
    case 'st-move': { FormState.items = Views.labEdit.collect(root); const i = +t.getAttribute('data-i'), j = i + (+t.getAttribute('data-d')); const a = FormState.items; [a[i], a[j]] = [a[j], a[i]]; $('#stagesEd').innerHTML = Views.labEdit.stagesHtml(); break; }
    case 'pdf-save': { const o = { enabled: $('#pdfEnabled').checked }; $$('[data-pdf]', root).forEach(i => { o[i.getAttribute('data-pdf')] = i.value.trim(); }); await DB.set('site/pdf', o); UI.toast('✅ حُفظت بيانات الملف'); break; }
    case 'toggle-vis': DB.set('visibility/' + id, Content.isHidden(id) ? null : false); break; // مسار مستقل عن المحتوى
    case 'toggle-en': DB.set('enabled/' + id, Content.isEnabled(id) ? false : null); break;     // مسار مستقل ثالث
    case 'copy-axis': copyAxis(id); break;
    case 'copy-ex': copyEx(id); break;
    case 'reset-axis': { if (await UI.confirm('استرجاع المحتوى الأصلي لهذا المحور؟ سيُحذف التراكب فقط (حالة الإظهار والتفعيل لا تتأثر).', { ok: 'استرجاع الافتراضي' })) DB.remove('content/axes/' + id); break; }
    case 'reset-ex': { if (await UI.confirm('استرجاع المحتوى الأصلي لهذا التمرين؟', { ok: 'استرجاع الافتراضي' })) DB.remove('content/ex/' + id); break; }
    case 'delete-axis': {
      if (!(await UI.confirm('حذف نهائي لهذا المحور المُضاف وكل تمارينه المُضافة التابعة له؟ <b>لا رجعة في هذا الحذف.</b>', { danger: true, ok: 'حذف نهائي' }))) break;
      const upd = { ['added/axes/' + id]: null, ['visibility/' + id]: null, ['enabled/' + id]: null };
      Object.keys(Store.addedEx || {}).forEach(k => { if (Store.addedEx[k].axis === id) { upd['added/ex/' + k] = null; upd['posts/' + k] = null; upd['visibility/' + k] = null; } });
      await DB.update('', upd); DB.set('order/axes', arr(Store.order).filter(x => x !== id)); UI.toast('تم الحذف'); break;
    }
    case 'delete-ex': { if (await UI.confirm('حذف نهائي لهذا العنصر المُضاف ومشاركاته؟ <b>لا رجعة في هذا الحذف.</b>', { danger: true, ok: 'حذف نهائي' })) DB.update('', { ['added/ex/' + id]: null, ['posts/' + id]: null, ['visibility/' + id]: null, ['reveal/' + id]: null }); break; }
    case 'clear-posts': { if (await UI.confirm('مسح كل مشاركات «' + h(Content.exTitle(id)) + '»؟', { danger: true, ok: 'مسح المشاركات' })) DB.remove('posts/' + id); break; }
    case 'reveal': { const cur = await DB.get('reveal/' + id); await DB.set('reveal/' + id, cur ? null : true); UI.toast(cur ? '🔒 أُخفيت الإجابات' : '🔓 كُشفت الإجابات الصحيحة لكل المتدربين'); break; } // قراءة الحالة الفعلية من القاعدة قبل التبديل
    case 'global-reset': globalReset(); break;
    // ----- نموذج المحور -----
    case 'se-add': FormState.slides = collectSlides(root); FormState.slides.push({ type: $('#newSlideType').value, title: '' }); Views.axisEdit.reslides(root); break;
    case 'se-del': { FormState.slides = collectSlides(root); FormState.slides.splice(+t.getAttribute('data-i'), 1); Views.axisEdit.reslides(root); break; }
    case 'se-up': case 'se-down': { FormState.slides = collectSlides(root); const i = +t.getAttribute('data-i'), j = act === 'se-up' ? i - 1 : i + 1; const s = FormState.slides; [s[i], s[j]] = [s[j], s[i]]; const k = ['text', 'rule', 'intro', 'img']; Views.axisEdit.reslides(root); break; }
    case 'axis-save': Views.axisEdit.save(root); break;
    case 'form-cancel': { FormState.axisId = null; FormState.exId = null; const b = Router.backOf(Router.cur); Router.go(b.view, b.id ? { id: b.id } : {}); break; }
    case 'it-add': FormState.items = collectItems(root, FormState.format); FormState.items.push({}); $('#itemsEd').innerHTML = itemsEditorHtml(FormState.format, FormState.items); break;
    case 'it-del': FormState.items = collectItems(root, FormState.format); FormState.items.splice(+t.getAttribute('data-i'), 1); $('#itemsEd').innerHTML = itemsEditorHtml(FormState.format, FormState.items); break;
    case 'ex-save': exFormSave(root, t.getAttribute('data-kind')); break;
  }
});
document.addEventListener('change', ev => { const t = ev.target; if (t.getAttribute && t.getAttribute('data-act-change') === 'import-backup' && t.files && t.files[0]) { importBackup(t.files[0]); t.value = ''; } });
document.addEventListener('input', ev => { const t = ev.target; if (t.hasAttribute && t.hasAttribute('data-filter')) applyFilter(t); });
document.addEventListener('click', ev => { if (UIState.bellOpen && !ev.target.closest('.bell-wrap')) { UIState.bellOpen = false; App.render(); } });

// ---------- مؤقت المختبر ----------
function labTick() {
  if (Router.cur.view !== 'lab') return; const g = Me.group(); if (!g) return; const tm = Store.labTimers['g' + g]; if (!tm || !tm.start) return;
  const el = labElapsed(tm); const total = Content.lab().stages.length * Content.lab().minutes * 60000; const c = $('#labClock'); if (c) c.textContent = mmss(total - el);
  let rerender = false; $$('[data-lock-at]').forEach(n => { const at = +n.getAttribute('data-lock-at'); if (el >= at) rerender = true; else { const s = n.querySelector('.num'); if (s) s.textContent = mmss(at - el); } });
  if (rerender) App.render();
}

// ---------- نسخ احتياطي يومي تلقائي لمدخلات المتدربين ----------
// أول متصفح يفتح المنصة في يوم جديد يأخذ نسخة من المشاركات والتسجيل والحضور والتقييمات (عملية ذرّية تضمن نسخة واحدة يوميًا)
const BACKUP_KEEP = 14;
const BACKUP_PATHS = ['users', 'private', 'devices', 'secrets', 'posts', 'assess', 'attendance', 'checkins', 'lab', 'assign', 'leads', 'followups', 'storyLikes'];
function dayKey(ts) { const d = new Date(ts || Date.now()); const p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
async function snapshotData() { const o = {}; for (const k of BACKUP_PATHS) o[k] = await DB.get(k); return o; }
async function autoBackup(force) {
  try {
    const day = dayKey(DB.now()); const mark = day + '|' + genId();
    const res = await DB.transaction('meta/backupDay', cur => (!force && cur && String(cur).indexOf(day + '|') === 0) ? undefined : mark);
    if (res !== mark) return false;
    const data = await snapshotData(); const json = JSON.stringify(data);
    if (!force && json.length < 20) return false;
    await DB.set('backups/' + day, { ts: DB.now(), data });
    await DB.set('backupIndex/' + day, { ts: DB.now(), users: Object.keys(data.users || {}).length, posts: Object.keys(data.posts || {}).reduce((n, k) => n + Object.keys(data.posts[k] || {}).length, 0), kb: Math.round(json.length / 1024) });
    const idx = Object.keys((await DB.get('backupIndex')) || {}).sort(); const old = idx.slice(0, Math.max(0, idx.length - BACKUP_KEEP));
    if (old.length) { const upd = {}; old.forEach(k => { upd['backups/' + k] = null; upd['backupIndex/' + k] = null; }); await DB.update('', upd); }
    return true;
  } catch (e) { console.warn('backup', e); return false; }
}
async function restoreBackup(day) {
  const b = await DB.get('backups/' + day); if (!b || !b.data) { UI.alert('النسخة غير موجودة.'); return; }
  const cur = await snapshotData(); const cnt = d => ({ u: Object.keys(d.users || {}).length, p: Object.keys(d.posts || {}).reduce((n, k) => n + Object.keys(d.posts[k] || {}).length, 0) });
  const nb = cnt(b.data), nc = cnt(cur);
  if (!(await UI.confirm('استعادة مدخلات المتدربين من نسخة <b class="num">' + h(day) + '</b>:<br>• في النسخة: <b class="num">' + nb.u + '</b> مسجّل و<b class="num">' + nb.p + '</b> مشاركة<br>• الحالي الآن: <b class="num">' + nc.u + '</b> مسجّل و<b class="num">' + nc.p + '</b> مشاركة<br><br>سيُنزَّل ملف بالبيانات الحالية تلقائيًا قبل الاستعادة لتتمكن من الرجوع. المحتوى وتعديلاته لا تتأثر.', { danger: true, ok: 'تنزيل الحالي ثم الاستعادة' }))) return;
  downloadBlob(new Blob([JSON.stringify({ app: 'qdb-ecom', kind: 'trainee-data', exportedAt: new Date().toISOString(), data: cur }, null, 1)], { type: 'application/json' }), 'مدخلات المتدربين قبل الاستعادة ' + dayKey(DB.now()) + '.json');
  const upd = {}; BACKUP_PATHS.forEach(k => { upd[k] = b.data[k] || null; }); await DB.update('', upd, { allowTopLevel: true }); UI.toast('✅ تمت الاستعادة');
}

// ---------- إغلاق الدفعة الحالية وأرشفتها ثم تجهيز المنصة لدفعة جديدة ----------
function cohortSummary(d) { return { participants: d.uids.length, attAvg: d.attAvg, certs: d.certs, preAvg: d.preAvg == null ? null : Math.round(d.preAvg), postAvg: d.postAvg == null ? null : Math.round(d.postAvg), gain: d.gain == null ? null : Math.round(d.gain), sat: d.survey.overall == null ? null : Math.round(d.survey.overall * 100) / 100, nps: d.survey.nps, leads: d.leads.length, labGroups: d.labGroups }; }
async function closeCohort() {
  const cur = Cohort.cur(); const num = Cohort.list().length + 2;
  if (!(await UI.confirm('سيتم أرشفة كل مدخلات «' + h(cur.name) + '» (المسجّلون، المشاركات، التقييمات، الحضور، المختبر، الاهتمامات، المتابعات) في أرشيف الدفعات مع ملخص مؤشراتها، ثم تفريغ المنصة لاستقبال دفعة جديدة. المحتوى وتعديلاته لا تتأثر.', { ok: 'أرشفة وبدء دفعة جديدة', title: 'إغلاق الدفعة' }))) return;
  const pm = progressModal('📦 أرشفة الدفعة');
  try {
    pm.set(1, 3, 'جارٍ جمع البيانات…'); const data = await snapshotData();
    const summary = cohortSummary(reportData(data)); const id = 'c' + genId(); const meta = Object.assign({}, cur, { closedAt: DB.now() });
    pm.set(2, 3, 'جارٍ الحفظ في الأرشيف…'); await DB.set('cohorts/' + id, { meta, data }); await DB.set('cohortIndex/' + id, Object.assign({}, meta, { summary }));
    pm.set(3, 3, 'جارٍ تجهيز الدفعة الجديدة…'); const upd = {}; BACKUP_PATHS.forEach(k => { upd[k] = null; }); upd['meta/resetStamp'] = DB.now(); upd['stats/registered'] = 0; upd['settings/attendance/codes'] = null; upd.reveal = null;
    upd['settings/cohort'] = { name: 'الدفعة ' + num, start: '', end: '' };
    await DB.update('', upd, { allowTopLevel: true }); pm.close(); UI.toast('✅ أُرشفت الدفعة وبدأت دفعة جديدة');
  } catch (e) { pm.close(); UI.alert('تعذرت الأرشفة: ' + h(e.message || e)); }
}

// ---------- شاشة الاتصال (لا وضع محلي بديل: ننتظر الخادم ونعرض الحالة) ----------
function connectScreen() {
  const noLib = DB.status && !DB.status.lib;
  const err = App.watchError;
  const msg = noLib ? 'تعذّر تحميل مكتبة الاتصال بقاعدة البيانات (قد تكون الشبكة ضعيفة أو محجوبة).' : err ? 'رفضت قاعدة البيانات القراءة: ' + h(err.message || err) : '';
  // دائرة تمتلئ تدريجيًا أثناء الاتصال؛ التأخير السالب يحفظ موضعها عند إعادة الرسم
  if (!App._csT0) App._csT0 = Date.now();
  const ring = '<svg class="cs-ring' + (noLib || err ? ' stop' : '') + '" viewBox="0 0 48 48" aria-hidden="true"><circle class="cs-track" cx="24" cy="24" r="20"/><circle class="cs-fill" cx="24" cy="24" r="20" pathLength="100" style="animation-delay:-' + (Date.now() - App._csT0) + 'ms"/></svg>';
  return '<div class="connect-screen" role="status" aria-label="جارٍ التحميل"><div class="cs-box">' + ring + '<h2>' + h(Content.site ? (Content.site().headerTitle || '') : '') + '</h2>' + (msg ? '<p>' + msg + '</p>' : '') + (noLib || err || App.slow ? '<button class="btn btn-primary" onclick="location.reload()">↻ إعادة المحاولة</button>' : '') + '</div></div>';
}

// ---------- دخول المدرب عبر Firebase Authentication ----------
// كل زائر يحصل على جلسة Firebase مجهولة (Anonymous) تُربط بسجله، والمدرب يدخل بحساب Google — القواعد تميّز بينهما
function authInit() {
  const fb = !DEMO_MODE && typeof firebase !== 'undefined' && typeof firebase.auth === 'function' && !!firebaseConfig.apiKey;
  AUTH.enabled = fb; if (!fb) return;
  AUTH.resolved = false;
  firebase.auth().onAuthStateChanged(async u => {
    // انتهت مدة الجلسة (72 ساعة): خروج من حساب Firebase الحالي (مدرب أو جلسة متدرب) ثم جلسة جديدة
    if (u && Session.expired) { Session.expired = false; AUTH.isAdmin = false; try { await firebase.auth().signOut(); return; } catch (e) {} }
    if (!u) { try { await firebase.auth().signInAnonymously(); return; } catch (e) { console.warn('anonymous sign-in', e); AUTH.anonError = e; } }
    AUTH.user = u || null; let ok = false;
    if (u && !u.isAnonymous) { try { ok = (await DB.get('admins/' + u.uid)) === true; } catch (e) { ok = false; } }
    AUTH.isAdmin = ok; AUTH.resolved = true;
    if (SafeSS.get('ec_admin_redirect')) { SafeSS.del('ec_admin_redirect'); if (!ok && u && !u.isAnonymous) { UI.alert('الحساب ' + h(u.email || '') + ' غير مضاف إلى حسابات المدربين. أضف هذا الرقم في العقدة admins بقيمة true:<br><b class="num" dir="ltr" style="user-select:all">' + h(u.uid) + '</b>'); firebase.auth().signOut(); return; } }
    syncWatchers(); await ensureOwnership();
    if (ok) setTimeout(migrateSchema, 1500);
    if (ok && SafeSS.get('ec_go_admin')) { SafeSS.del('ec_go_admin'); Router.go('admin'); return; }
    App.render();
  });
}
const authUid = () => (AUTH.user && AUTH.user.uid) || null;
function genCode() { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; const r = new Uint32Array(6); try { crypto.getRandomValues(r); } catch (e) { for (let i = 0; i < 6; i++) r[i] = Math.floor(Math.random() * 1e9); } for (let i = 0; i < 6; i++) s += a[r[i] % a.length]; return s; }
// ربط الجهاز بالسجل: السجل الجديد يُربط فورًا، والدخول من جهاز آخر يحتاج رمز الدخول الشخصي
async function linkDevice(uid, code) { const au = authUid(); if (!DB.real || !au) return true; try { await DB.set('devices/' + uid + '/' + au, code || 'legacy', { quiet: true, beforeReady: true }); return true; } catch (e) { return false; } }
async function ensureOwnership() {
  if (!DB.real || !Me.data || !authUid() || !AUTH.enabled) return;
  const uid = Me.data.uid; if (uid === authUid()) return;
  try { if (await DB.get('devices/' + uid + '/' + authUid())) return; } catch (e) {}
  if (await linkDevice(uid, Me.data.code)) {
    if (!Me.data.code) { const code = genCode(); try { await DB.set('secrets/' + uid, code, { quiet: true, beforeReady: true }); Me.save(Object.assign({}, Me.data, { code })); } catch (e) {} }
    syncWatchers(); return;
  }
  Me.clear(); syncWatchers(); setTimeout(() => UI.toast('🔐 لحماية حسابك: ادخل مجددًا برقم العضوية ورمز الدخول الشخصي', 6000), 400);
}
// نقل البيانات القديمة إلى النموذج الآمن (مرة واحدة من جلسة المدرب)
async function migrateSchema() {
  try {
    if (!Admin.ok() || !DB.real) return; const meta = await DB.get('meta/schema'); if (Number(meta) >= 3) return;
    const users = (await DB.get('users')) || {}; const settings = (await DB.get('settings')) || {}; const upd = {};
    Object.keys(users).forEach(u => { const x = users[u] || {}; if (x.group && !x.gkey) upd['users/' + u + '/gkey'] = 'g' + x.group; if (x.f || x.consent) { if (x.f) upd['private/' + u + '/f'] = x.f; if (x.consent) upd['private/' + u + '/consent'] = x.consent; upd['users/' + u + '/f'] = null; upd['users/' + u + '/consent'] = null; } if (x.email) { upd['private/' + u + '/f/email'] = x.email; upd['users/' + u + '/email'] = null; } if (x.org) { upd['private/' + u + '/f/org'] = x.org; upd['users/' + u + '/org'] = null; } });
    const codes = ((settings.attendance || {}).codes) || {}; Object.keys(codes).forEach(k => { if (codes[k] && codes[k].code != null) { upd['secure/attcodes/' + k + '/code'] = String(codes[k].code); upd['settings/attendance/codes/' + k + '/code'] = null; } });
    if (settings.monitor) { upd['secure/monitor'] = settings.monitor; upd['settings/monitor'] = null; }
    upd['meta/schema'] = 3;
    await DB.update('', upd); UI.toast('🔐 نُقلت البيانات الخاصة ورموز الحضور إلى النموذج المحمي');
  } catch (e) { console.warn('migrate', e); }
}
function authErr(e) {
  const c = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(c)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (/too-many-requests/.test(c)) return 'محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة، أو استخدم «نسيت كلمة المرور».';
  if (/network-request-failed/.test(c)) return 'تعذر الاتصال بالإنترنت. تحقق من الشبكة ثم أعد المحاولة.';
  if (/operation-not-allowed/.test(c)) return 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في Firebase Authentication.';
  if (/popup-blocked/.test(c)) return 'منع المتصفح النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة.';
  if (/account-exists-with-different-credential/.test(c)) return 'هذا البريد مسجل بطريقة دخول أخرى. استخدم البريد وكلمة المرور.';
  if (/unauthorized-domain/.test(c)) return 'نطاق الموقع غير مضاف إلى Authorized domains في إعدادات Firebase Authentication.';
  return 'تعذر الدخول: ' + h((e && e.message) || e);
}
function adminLogin() {
  const m = UI.modal('<h3>🔐 دخول المدرب</h3><p class="muted" style="font-family:var(--f-ui);font-size:13px;margin-top:0">لوحة الإدارة متاحة لحسابات المدربين المسجلة في Firebase فقط.</p>' +
    '<button class="btn btn-block google-btn" data-google><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.8c-.5-1.4-.8-3-.8-4.8s.3-3.3.8-4.8l-7.8-6C1 16.5 0 20.1 0 24s1 7.5 2.7 10.8l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.7l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg><span>الدخول بحساب Google</span></button>' +
    '<details class="al-email"><summary>أو بالبريد الإلكتروني وكلمة المرور</summary>' +
    '<div class="field"><label>البريد الإلكتروني</label><input id="alEmail" type="email" dir="ltr" autocomplete="username"></div>' +
    '<div class="field"><label>كلمة المرور</label><input id="alPass" type="password" dir="ltr" autocomplete="current-password"></div>' +
    '<div class="row"><button class="btn btn-primary btn-sm" data-ok>دخول</button><button class="btn btn-ghost btn-sm" data-reset>نسيت كلمة المرور؟</button></div></details>' +
    '<div id="alErr" style="color:#C62F35;font-family:var(--f-ui);font-size:13px;min-height:20px;margin-top:10px"></div>' +
    '<div class="actions"><button class="btn btn-ghost" data-x>إلغاء</button></div>');
  const $e = $('#alEmail', m.el), $p = $('#alPass', m.el), err = t => { $('#alErr', m.el).innerHTML = t; };
  const finish = async user => {
    const ok = (await DB.get('admins/' + user.uid)) === true;
    if (!ok) { await firebase.auth().signOut(); err('الحساب ' + h(user.email || '') + ' غير مضاف إلى حسابات المدربين (العقدة admins في قاعدة البيانات).<br>انسخ هذا الرقم وأضفه هناك بقيمة true:<br><span class="num" dir="ltr" style="user-select:all;font-weight:700">' + h(user.uid) + '</span>'); return false; }
    AUTH.user = user; AUTH.isAdmin = true; m.close(); SafeSS.del('ec_preview'); syncWatchers(); setTimeout(migrateSchema, 1500); Router.go('admin'); return true;
  };
  $('[data-google]', m.el).onclick = async () => {
    const btn = $('[data-google]', m.el); btn.disabled = true; err('');
    try { const provider = new firebase.auth.GoogleAuthProvider(); provider.setCustomParameters({ prompt: 'select_account' }); const cred = await firebase.auth().signInWithPopup(provider); await finish(cred.user); }
    catch (e) { if (/popup-blocked|operation-not-supported/.test((e && e.code) || '')) { try { SafeSS.set('ec_admin_redirect', '1'); await firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()); return; } catch (e2) { err(authErr(e2)); } } else if (!/popup-closed|cancelled-popup/.test((e && e.code) || '')) err(authErr(e)); }
    finally { btn.disabled = false; }
  };
  const go = async () => {
    const email = $e.value.trim(), pass = $p.value; if (!email || !pass) { err('اكتب البريد الإلكتروني وكلمة المرور.'); return; }
    const btn = $('[data-ok]', m.el); btn.disabled = true; btn.textContent = 'جارٍ التحقق…'; err('');
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, pass); await finish(cred.user);
    } catch (e) { err(authErr(e)); } finally { btn.disabled = false; btn.textContent = 'دخول'; }
  };
  $('[data-ok]', m.el).onclick = go; $p.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }); $e.addEventListener('keydown', e => { if (e.key === 'Enter') $p.focus(); });
  $('[data-x]', m.el).onclick = () => m.close();
  $('[data-reset]', m.el).onclick = async () => { const email = $e.value.trim(); if (!email) { err('اكتب بريدك الإلكتروني أولًا ثم اضغط «نسيت كلمة المرور».'); return; } try { await firebase.auth().sendPasswordResetEmail(email); err('<span style="color:#138A5E">✉️ أُرسل رابط تعيين كلمة المرور إلى بريدك.</span>'); } catch (e) { err(authErr(e)); } };
}

// ---------- الإقلاع ----------
function boot() {
  Me.load(); Session.boot();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) Session.check(); });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('brand')) { e.preventDefault(); e.target.click(); } });
  Router.cur = Router.parse();
  SafeHist.replace(Router.cur, Router.url(Router.cur));
  authInit();
  watchAll();
  if (Session.notice) setTimeout(() => UI.toast('🔒 انتهت مدة الدخول (72 ساعة من آخر استخدام) — يرجى تسجيل الدخول من جديد.', 7000), 1500);
  if (Me.data && Me.data._fromHash) DB.get('users/' + Me.data.uid).then(u => { if (u) Me.save({ uid: Me.data.uid, name: u.name, role: u.role || '', org: u.org || '', email: u.email || '', member: u.member, ts: u.ts || 0, group: u.group || null }); else Me.clear(); App.render(); });
  Translate.boot();
  // النسخ اليومي التلقائي من جلسة المدرب فقط، وبعد قراءة مؤكدة من الخادم (لا يكتب الزوار شيئًا تلقائيًا)
  const bk = () => { if (App.dataReady && Admin.ok()) autoBackup(false); };
  setTimeout(bk, 15000); setInterval(bk, 3600000);
  setInterval(() => Monitor.publish(false), 60000); // لقطة لوحة المشرف تُحدَّث من جلسة المدرب
  setTimeout(() => { if (!App.dataReady) { App.slow = true; App.render(); } }, 8000);
  DB.onStatus(debounce(() => { if (App.dataReady) App.render(); }, 120));
  DB.onReject = (e, where) => { console.warn('write rejected', where, e); UI.toast('⚠️ تعذّر حفظ التعديل: ' + ((e && e.code === 'PERMISSION_DENIED') || /permission/i.test(String(e && e.message)) ? 'رفضت قاعدة البيانات الكتابة' : String((e && e.message) || e)) + ' — تُعرض الآن آخر نسخة محفوظة على الخادم', 6000); App.onData(); };
  DB.onSynced = () => UI.toast('✅ عاد الاتصال وحُفظت كل التعديلات المعلّقة', 4000);
  window.addEventListener('beforeunload', e => { if (DB.status && DB.status.pending > 0) { e.preventDefault(); e.returnValue = ''; return ''; } });
  App.render();
  setInterval(labTick, 1000);
}
boot();

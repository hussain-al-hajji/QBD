// ---------------------------------------------------------------------
// التطبيق: الرسم، المراقبات الحية، والتفاعلات
// ---------------------------------------------------------------------
const FORM_VIEWS = ['axisEdit', 'exEdit', 'actEdit', 'secEdit', 'labEdit', 'assessEdit', 'storyEdit'];
const ADMIN_VIEWS = ['admin'].concat(FORM_VIEWS);
const App = {
  inIframe: (() => { try { return window.self !== window.top; } catch (e) { return true; } })(),
  render() {
    const root = document.getElementById('app'); if (!root) return;
    let v = Router.cur.view;
    if (ADMIN_VIEWS.indexOf(v) > -1 && !Admin.ok()) { Router.cur = { view: 'home' }; v = 'home'; }
    const needLogin = !Me.isReg() && !Me.guest && ADMIN_VIEWS.indexOf(v) === -1;
    const view = needLogin ? Views.login : (Views[v] || Views.home);
    let body = '';
    try { body = view.html(); } catch (e) { console.error(e); body = '<div class="empty" style="margin-top:24px">حدث خطأ في عرض هذه الصفحة. <button class="btn btn-soft btn-sm" data-go="home">الرئيسية</button></div>'; }
    const html = Layout.banners() + Layout.topbar() + '<main class="wrap">' + body + '</main>' + Layout.footer() +
      (Admin.ok() && Admin.preview() ? '<button class="float-badge" data-act="preview-exit">↩ العودة للوحة الإدارة</button>' : '');
    preserveRender(root, html);
    if (view.after) try { view.after(root); } catch (e) { console.error(e); }
    $$('[data-filter]', root).forEach(applyFilter);
    document.title = (Content.site().headerTitle || 'الدورة');
  },
  onData: debounce(() => {
    if (FORM_VIEWS.indexOf(Router.cur.view) > -1) return; // لا نعيد رسم نماذج التحرير أثناء الكتابة
    App.render(); if (Assign.modal) Assign.render();
  }, 60)
};
function applyFilter(inp) { const q = inp.value.trim().toLowerCase(); const scope = inp.closest('.tool-drop') || document; $$(inp.getAttribute('data-filter'), scope).forEach(x => { x.style.display = !q || (x.getAttribute('data-name') || '').indexOf(q) > -1 ? '' : 'none'; }); }

// ---------- المراقبات الحية ----------
function watchAll() {
  const W = (path, fn) => DB.watch(path, v => { fn(v); App.onData(); });
  W('content', v => { v = v || {}; Store.contentAxes = v.axes || {}; Store.contentEx = v.ex || {}; Store.contentLab = v.lab || null; Store.contentAssess = v.assess || null; Store.contentStories = v.stories || {}; });
  W('added', v => { v = v || {}; Store.addedAxes = v.axes || {}; Store.addedEx = v.ex || {}; Store.addedStories = v.stories || {}; });
  W('storyLikes', v => { Store.storyLikes = v || {}; });
  W('visibility', v => { Store.visibility = v || {}; });
  W('enabled', v => { Store.enabled = v || {}; });
  W('order', v => { v = v || {}; Store.order = arr(v.axes); Store.exOrder = v.ex || {}; Store.storyOrder = arr(v.stories); });
  W('assess', v => { Store.assess = v || {}; });
  W('attendance', v => { Store.attendance = v || {}; });
  W('site', v => { Store.site = v || {}; });
  W('settings', v => { v = v || {}; Store.groupCount = v.groups && v.groups.count ? v.groups.count : DEFAULT_GROUPS; Store.groupNames = v.groupNames || {}; Store.assessCfg = v.assess || {}; Store.attCfg = v.attendance || {}; });
  W('assign', v => { Store.assign = v || {}; });
  W('users', v => { Store.users = v || {}; });
  W('posts', v => { Store.posts = v || {}; });
  W('reveal', v => { Store.reveal = v || {}; });
  W('lab', v => { v = v || {}; Store.labTimers = v.timers || {}; Store.labAnswers = v.answers || {}; });
  W('broadcast', v => { Store.broadcast = v; });
  W('stats/registered', v => { Store.registered = Number(v) || 0; });
  W('meta/resetStamp', v => {
    Store.resetStamp = Number(v) || 0;
    if (Me.data && Store.resetStamp && (Me.data.ts || 0) < Store.resetStamp) { Me.clear(); UIState.draft = {}; UIState.editing = {}; setTimeout(() => UI.toast('تمت إعادة ضبط البرنامج — سجّل اسمك من جديد'), 300); }
  });
}
function getByPath(path) { const seg = path.split('/'); let n = seg[0] === 'posts' ? Store.posts : seg[0] === 'lab' ? Store.labAnswers : seg[0] === 'storyLikes' ? Store.storyLikes : null; const rest = seg[0] === 'lab' ? seg.slice(2) : seg.slice(1); for (const s of rest) { if (!n) return null; n = n[s]; } return n; }

// ---------- التسجيل والدخول ----------
async function doRegister() {
  const name = ($('#regName') || {}).value ? $('#regName').value.trim() : ''; const role = ($('#regRole') || {}).value ? $('#regRole').value.trim() : ''; const org = ($('#regOrg') || {}).value ? $('#regOrg').value.trim() : '';
  if (name.length < 2) { UI.alert('اكتب اسمك الكامل أولًا.'); return; }
  if (!role) { UI.alert('اكتب مجالك أو مسماك الوظيفي.'); return; }
  const btn = $('[data-act="register"]'); if (btn) { btn.disabled = true; btn.textContent = 'جارٍ التسجيل…'; }
  try {
    const uid = genId('u');
    // رقم عضوية تسلسلي عبر عملية ذرّية مع حماية دنيا صريحة
    const member = await DB.transaction('meta/memberCounter', cur => Math.max(Number(cur) || 0, MEMBER_NO_FLOOR) + 1);
    const ts = DB.now();
    await DB.set('users/' + uid, { name, role, org, member, ts });
    DB.transaction('stats/registered', c => (Number(c) || 0) + 1);
    const me = { uid, name, role, org, member, ts }; Me.save(me);
    App.render(); welcomeModal(me);
  } catch (e) { UI.alert('تعذر التسجيل: ' + h(e.message || e)); if (btn) { btn.disabled = false; btn.textContent = 'ابدأ 🚀'; } }
}
function welcomeModal(me) {
  const m = UI.modal('<div class="center"><div style="font-size:48px">🎉</div><h3>أهلًا ' + h(me.name) + '!</h3><p class="muted" style="font-family:var(--f-ui)">تم تسجيلك بنجاح. هذا رقم عضويتك — احتفظ به للدخول من أي جهاز آخر دون كلمة مرور.</p><div class="num" style="font-family:var(--f-display);font-size:52px;font-weight:800;letter-spacing:4px;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block">' + pad4(me.member) + '</div></div><div class="actions" style="justify-content:center"><button class="btn btn-primary" data-save-card>💾 حفظ رقم العضوية</button><button class="btn btn-ghost" data-close>ابدأ الجولة</button></div>');
  $('[data-save-card]', m.el).onclick = () => saveMemberCard(me);
  $('[data-close]', m.el).onclick = () => m.close();
}
async function memberLogin() {
  const v = await UI.prompt('أدخل رقم عضويتك (مثال: 0058)', { title: 'الدخول برقم العضوية', type: 'text', inputmode: 'numeric', placeholder: '0000', ok: 'دخول' });
  if (v == null) return; const num = parseInt(String(v).replace(/[^\d٠-٩]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10);
  if (!num) { UI.alert('اكتب رقم عضوية صحيحًا.'); return; }
  const users = await DB.get('users') || {}; // قراءة لمرة واحدة لكامل السجل
  const uid = Object.keys(users).find(u => +users[u].member === num);
  if (!uid) { UI.alert('لم نجد حسابًا بهذا الرقم (ربما حُذف لاحقًا). يُرجى التسجيل من جديد باسمك.', 'رقم غير مطابق'); return; }
  const u = users[uid]; Me.save({ uid, name: u.name, role: u.role || '', org: u.org || '', email: u.email || '', member: u.member, ts: u.ts || DB.now(), group: u.group || null });
  UI.toast('مرحبًا بعودتك يا ' + u.name + ' 👋'); App.render();
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
function backupData() {
  return { app: 'qdb-ecom', version: 1, exportedAt: new Date().toISOString(), data: { content: { axes: Store.contentAxes, ex: Store.contentEx, lab: Store.contentLab, assess: Store.contentAssess, stories: Store.contentStories }, added: { axes: Store.addedAxes, ex: Store.addedEx, stories: Store.addedStories }, visibility: Store.visibility, enabled: Store.enabled, order: { axes: Store.order, ex: Store.exOrder, stories: Store.storyOrder }, site: Store.site, settings: { groups: { count: Groups.count() }, groupNames: Store.groupNames, assess: Store.assessCfg, attendance: Store.attCfg } } };
}
async function importBackup(file) {
  try {
    const obj = JSON.parse(await file.text());
    if (!obj || obj.app !== 'qdb-ecom' || !obj.data) { UI.alert('الملف ليس نسخة احتياطية صالحة لهذا الموقع.'); return; }
    const ok = await UI.confirm('سيستبدل الاستيراد كل تعديلات وإضافات المحتوى الحالية بما في الملف (' + h(obj.exportedAt || '') + '). مشاركات المتدربين لن تتأثر. متابعة؟', { danger: true, ok: 'استبدال المحتوى' });
    if (!ok) return; const d = obj.data;
    await DB.update('', { content: d.content || null, added: d.added || null, visibility: d.visibility || null, enabled: d.enabled || null, order: d.order || null, site: d.site || null, settings: d.settings || null });
    UI.toast('✅ تم استيراد المحتوى');
  } catch (e) { UI.alert('تعذر قراءة الملف: ' + h(e.message || e)); }
}
async function globalReset() {
  const ok = await UI.confirm('<b>تحذير:</b> سيُمسح نهائيًا كل ما أدخله المتدربون (المشاركات، المختبر، المؤقتات، التقييم القبلي والبعدي، الحضور، قائمة المسجّلين، التعيينات)، ما عدا الاستطلاع الختامي، وسيُطلب من كل متصفح تسجيل اسم جديد. لا يمكن التراجع.', { danger: true, ok: 'نعم، امسح كل المدخلات', title: 'إعادة ضبط شاملة' });
  if (!ok) return;
  const posts = await DB.get('posts') || {}; const upd = {};
  Object.keys(posts).forEach(k => { if (k !== SURVEY_ID) upd['posts/' + k] = null; }); // استثناء صريح للاستطلاع الختامي
  upd.lab = null; upd.users = null; upd.assign = null; upd.assess = null; upd.attendance = null; upd['meta/resetStamp'] = DB.now();
  await DB.update('', upd); UI.toast('تمت إعادة الضبط الشاملة');
}

// ---------- التفاعلات (تفويض أحداث واحد) ----------
document.addEventListener('click', async ev => {
  const t = ev.target.closest('[data-act],[data-go],[data-back],[data-like],[data-deck-go],[data-slide]'); if (!t || t.disabled) return;
  if (t.hasAttribute('data-go')) { ev.preventDefault(); const p = {}; ['id', 'axis', 'from'].forEach(k => { if (t.getAttribute('data-' + k)) p[k] = t.getAttribute('data-' + k); }); if (FORM_VIEWS.indexOf(t.getAttribute('data-go')) > -1) { FormState.axisId = null; FormState.exId = null; } Router.go(t.getAttribute('data-go'), p); return; }
  if (t.hasAttribute('data-back')) { const b = Router.backOf(Router.cur) || { view: 'home' }; Router.go(b.view, b.id ? { id: b.id } : {}); return; }
  if (t.hasAttribute('data-like')) { const p = t.getAttribute('data-like'); const cur = getByPath(p); Likes.toggle(p, cur && cur.likes); App.render(); return; }
  if (t.hasAttribute('data-deck-go')) { Deck.move(Router.cur.id, +t.getAttribute('data-deck-go')); return; }
  if (t.hasAttribute('data-slide')) { Deck.to(Router.cur.id, +t.getAttribute('data-slide')); return; }
  const act = t.getAttribute('data-act'); const id = t.getAttribute('data-id'); const exId = t.getAttribute('data-ex');
  const root = document.getElementById('app');
  switch (act) {
    // ----- عام -----
    case 'switch-user': { const ok = await UI.confirm('سيُمسح تسجيلك من هذا الجهاز فقط (لن يُحذف أي شيء من السيرفر)، ويمكنك تسجيل مستخدم جديد أو الدخول برقم العضوية.', { ok: 'تبديل المستخدم' }); if (ok) { Me.clear(); UIState.draft = {}; UIState.editing = {}; Router.go('home'); } break; }
    case 'admin-enter': {
      if (Admin.ok()) { SafeSS.del('ec_preview'); Router.go('admin'); break; }
      const v = await UI.prompt('أدخل الرمز السري للوحة الإدارة', { title: '🔐 لوحة الإدارة', type: 'password', inputmode: 'numeric', ok: 'دخول' });
      if (v == null) break; if (v.trim() === ADMIN_PASS) { SafeSS.set('ec_admin', '1'); SafeSS.del('ec_preview'); Router.go('admin'); } else UI.alert('الرمز غير صحيح.');
      break;
    }
    case 'admin-exit': SafeSS.del('ec_admin'); SafeSS.del('ec_preview'); Router.go('home'); break;
    case 'preview': SafeSS.set('ec_preview', '1'); Router.go('home'); break;
    case 'preview-exit': SafeSS.del('ec_preview'); Router.go('admin'); break;
    case 'bc-close': SafeLS.set('ec_bc_closed', t.getAttribute('data-id')); App.render(); break;
    case 'register': doRegister(); break;
    case 'member-login': memberLogin(); break;
    case 'guest': Me.setGuest(); App.render(); break;
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
    case 'lab-start': { const g = Me.group(); if (g) DB.set('lab/timers/g' + g, { start: DB.now(), pausedTotal: 0 }); break; }
    case 'lab-pause': { const g = Me.group(); DB.update('lab/timers/g' + g, { pausedAt: DB.now() }); break; }
    case 'lab-resume': { const g = Me.group(); const tm = Store.labTimers['g' + g] || {}; DB.update('lab/timers/g' + g, { pausedTotal: (tm.pausedTotal || 0) + (DB.now() - (tm.pausedAt || DB.now())), pausedAt: null }); break; }
    case 'lab-reset': { if (await UI.confirm('إعادة الوقت إلى الصفر لمجموعتك؟ الإجابات المحفوظة لن تُحذف.', { ok: 'إعادة ضبط الوقت' })) DB.remove('lab/timers/g' + Me.group()); break; }
    case 'lab-save': { const i = t.getAttribute('data-i'); const ta = $('#labAns' + i); const txt = ta ? ta.value.trim() : ''; if (!txt) { UI.alert('اكتبوا مخرج المرحلة أولًا.'); break; } await DB.update('lab/answers/g' + Me.group() + '/s' + i, { text: txt, name: Me.data.name, uid: Me.uid(), ts: DB.now() }); UIState.editing['lab' + i] = false; if (ta) ta.value = ''; UI.toast('✅ حُفظت المرحلة'); App.render(); break; }
    case 'del-lab': { if (await UI.confirm('حذف إجابة هذه المرحلة؟', { danger: true, ok: 'حذف' })) DB.remove('lab/answers/' + t.getAttribute('data-k') + '/s' + t.getAttribute('data-i')); break; }
    // ----- حسابي -----
    case 'acc-save': { const n = $('#accName').value.trim(), r = $('#accRole').value.trim(), org = $('#accOrg').value.trim(), em = $('#accEmail').value.trim(); if (n.length < 2) { UI.alert('الاسم قصير جدًا.'); break; } if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { UI.alert('صيغة البريد الإلكتروني غير صحيحة.'); break; } const me = Object.assign({}, Me.data, { name: n, role: r, org, email: em }); Me.save(me); await DB.update('users/' + me.uid, { name: n, role: r, org, email: em }); UI.toast('✅ تم تحديث بياناتك'); App.render(); break; }
    case 'congrats-pdf': buildCongratsPdf(Me.data.name, t.getAttribute('data-kind') || 'congrats'); break;
    case 'congrats-mail': {
      const subj = 'تهنئة إنجاز — ' + Content.courseTitle();
      const body = 'مرحبًا،\n\nأحتفظ بهذه الرسالة كنسخة من تهنئة الإنجاز الخاصة بي في برنامج «' + Content.courseTitle() + '».\nالاسم: ' + Me.data.name + '\nالتاريخ: ' + fmtDate(Date.now()) + '\n\nتنبيه مهم: صفحة الويب لا تستطيع إرفاق الملف تلقائيًا (لا يوجد خادم بريد). يُرجى إرفاق ملف PDF الذي حمّلته من زر «تحميل / حفظ كـ PDF» يدويًا قبل الإرسال.';
      location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body); break;
    }
    case 'content-pdf': buildContentPdf(); break;
    case 'translate': Translate.menu(); break;
    case 'save-card': saveMemberCard(Object.assign({}, Me.data, { member: Me.data.member || ((Store.users[Me.uid()] || {}).member) })); break;
    case 'my-filter': UIState.myFilter = t.getAttribute('data-k'); App.render(); break;
    case 'checkin': {
      const d = t.getAttribute('data-d'); const inp = $('#checkin' + d); const v = inp ? inp.value.replace(/[٠-٩]/g, x => '٠١٢٣٤٥٦٧٨٩'.indexOf(x)).trim() : '';
      const cd = (Attend.cfg().codes || {})['d' + d] || {};
      if (!cd.open) { UI.alert('تسجيل الحضور لهذا اليوم مغلق الآن.'); break; }
      if (!v || v !== String(cd.code)) { UI.alert('الرمز غير صحيح. تأكد من الرمز المعروض على الشاشة.'); break; }
      await DB.update('attendance/' + Me.uid(), { ['d' + d]: Attend.cfg().hours, ['t' + d]: DB.now() }); UI.toast('✅ تم تسجيل حضورك لليوم ' + d); break;
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
    case 'drop': { const k = t.getAttribute('data-k'); UIState.openDrop.has(k) ? UIState.openDrop.delete(k) : UIState.openDrop.add(k); App.render(); break; }
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
    case 'backup': downloadBlob(new Blob([JSON.stringify(backupData(), null, 2)], { type: 'application/json' }), 'نسخة احتياطية للمحتوى ' + fmtDate(Date.now()).replace(/\//g, '-') + '.json'); break;
    case 'home-save': { const o = {}; $$('[data-home]', root).forEach(i => { o[i.getAttribute('data-home')] = i.value.trim(); }); o.heroDesc = RTE.val(root, 'heroDesc'); o.heroImage = ImgPick.val('heroImage'); await DB.set('site/home', o); UI.toast('✅ حُفظت الواجهة ونُشرت حيًا'); break; }
    case 'home-reset': { if (await UI.confirm('استرجاع كل عناصر الواجهة لنصوصها ورسمها الأصلي؟', { ok: 'استرجاع' })) { await DB.remove('site/home'); UI.toast('تم الاسترجاع'); } break; }
    case 'reg-set': { const n = parseInt($('#regCountIn').value, 10); if (!(n >= 0)) break; await DB.set('stats/registered', n); UI.toast('✅ تم تحديث الرقم'); break; }
    case 'reg-zero': { if (await UI.confirm('تصفير عدد المسجّلين المعروض؟', { ok: 'تصفير' })) DB.set('stats/registered', 0); break; }
    case 'cg-add-para': $('[data-cg-paras]', t.closest('.tool-drop')).insertAdjacentHTML('beforeend', '<div class="row" style="margin-bottom:6px"><textarea data-cg-para rows="2" style="flex:1;border:1px solid var(--line);border-radius:10px;padding:6px 8px;font-family:var(--f-body)"></textarea><button class="btn btn-danger btn-xs" data-act="cg-del-para">🗑</button></div>'); break;
    case 'cg-del-para': t.closest('.row').remove(); break;
    case 'cg-save': { const kind = t.getAttribute('data-kind'); const box = t.closest('.tool-drop'); const o = { paragraphs: $$('[data-cg-para]', box).map(x => x.value.trim()).filter(Boolean) }; $$('[data-cg]', box).forEach(x => { o[x.getAttribute('data-cg')] = x.value.trim(); }); await DB.set('site/' + kind, o); UI.toast('✅ حُفظ المحتوى'); break; }
    case 'cg-reset': { const kind = t.getAttribute('data-kind'); if (await UI.confirm('استرجاع المحتوى الافتراضي؟', { ok: 'استرجاع' })) DB.remove('site/' + kind); break; }
    // ----- الحضور -----
    case 'att-cfg-save': { const days = parseInt($('#attDays').value, 10), hours = parseFloat($('#attHours').value), th = parseInt($('#attTh').value, 10); if (!(days >= 1 && days <= 10) || !(hours > 0) || !(th >= 0 && th <= 100)) { UI.alert('تحقق من القيم المدخلة.'); break; } await DB.update('settings/attendance', { days, hours, threshold: th }); UI.toast('✅ حُفظت إعدادات الحضور'); break; }
    case 'att-code': { const d = t.getAttribute('data-d'); await DB.update('settings/attendance/codes/d' + d, { code: String(Math.floor(1000 + Math.random() * 9000)) }); break; }
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
    case 'report-pdf': buildReportPdf(); break;
    case 'report-csv': exportReportCsv(); break;
    // ----- أقسام الرئيسية -----
    case 'sec-move': { const k = t.getAttribute('data-k'); const ids = Content.homeSections({ all: true }).map(x => x.key); const i = ids.indexOf(k), j = i + (+t.getAttribute('data-d')); if (j < 0 || j >= ids.length) break; [ids[i], ids[j]] = [ids[j], ids[i]]; DB.set('site/homeOrder', ids); break; }
    case 'sec-add': { const k = 'c' + genId(); const type = $('#newSecType').value; await DB.set('site/sections/' + k, { type, title: SECTION_TYPES[type], kicker: '', body: '', ts: DB.now() }); FormState.exId = null; Router.go('secEdit', { id: k }); break; }
    case 'sec-copy': { const k = t.getAttribute('data-k'); const cur = ((Store.site || {}).sections || {})[k]; if (!cur) break; await DB.set('site/sections/c' + genId(), Object.assign({}, cur, { title: (cur.title || '') + ' (نسخة)', ts: DB.now() })); UI.toast('🧬 تم نسخ القسم'); break; }
    case 'sec-del': { const k = t.getAttribute('data-k'); if (await UI.confirm('حذف هذا القسم نهائيًا من الصفحة الرئيسية؟', { danger: true, ok: 'حذف' })) DB.update('', { ['site/sections/' + k]: null, ['visibility/home_' + k]: null }); break; }
    case 'sec-reset-order': DB.remove('site/homeOrder'); break;
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

// ---------- الإقلاع ----------
function boot() {
  Me.load();
  Router.cur = Router.parse();
  SafeHist.replace(Router.cur, Router.url(Router.cur));
  watchAll();
  if (Me.data && Me.data._fromHash) DB.get('users/' + Me.data.uid).then(u => { if (u) Me.save({ uid: Me.data.uid, name: u.name, role: u.role || '', org: u.org || '', email: u.email || '', member: u.member, ts: u.ts || 0, group: u.group || null }); else Me.clear(); App.render(); });
  Translate.boot();
  App.render();
  setInterval(labTick, 1000);
}
boot();

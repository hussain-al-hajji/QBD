// حذف متدرب من لوحة المدرب، وحذف المحاور والتمارين (الأصلي إلى «المحذوفات» والمضاف نهائيًا) مع الاسترجاع
// عدة أجهزة على خادم محاكى واحد بقواعد الملف الفعلي، دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const OLD_RULES = JSON.parse(JSON.stringify(RULES)); delete OLD_RULES.rules.presence; delete OLD_RULES.rules.invite; delete OLD_RULES.rules.removed;
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const now = Date.now();
const SEED = () => ({
  admins: { adm1: true },
  users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1, group: 2, gkey: 'g2' }, u2: { name: 'علي حسن', member: 1002, ts: 1, group: 2, gkey: 'g2' } },
  private: { u1: { f: { email: 's@x.com' } } }, secrets: { u1: 'ABCDEF', u2: 'GHJKLM' }, devices: { u1: { dev1: 'ABCDEF' } },
  posts: {
    a1e3: { u1: { text: 'إجابتي', name: 'سارة أحمد', uid: 'u1', ts: 1 }, u2: { text: 'إجابة علي', name: 'علي حسن', uid: 'u2', ts: 1, likes: { u1: true } } },
    a2e1: { g2: { text: 'إجابة المجموعة', name: 'سارة أحمد', by: 'u1', group: 2, members: { u1: true, u2: true }, ts: 1 } },
    a1e2: { u2: { answers: [true], name: 'علي حسن', uid: 'u2', ts: 1 } },
    xadd: { u2: { text: 'على المضاف', name: 'علي حسن', uid: 'u2', ts: 1 } }
  },
  assess: { pre: { u1: { answers: [0], done: true, ts: 1 } } }, attendance: { u1: { d1: 4 } }, checkins: { d1: { u1: true } }, assign: { u1: 2 },
  leads: { u1: { programs: ['تمويل'] } }, followups: { d30: { u1: { actions: 'x' } } }, storyLikes: { st1: { likes: { u1: true, u2: true } } },
  stats: { registered: 2 },
  visibility: { a1e2: false }, content: { ex: { a1e2: { title: 'عنوان معدّل' } } }, reveal: { a1e2: true }, order: { ex: { a1: ['a1e2', 'a1e1', 'a1e3', 'a1e4', 'xadd'] } },
  presence: { a1e2: { s1: { n: '', u: '', g: 0, ts: now } } }, invite: { id: 'i1', ex: 'a1e2', title: 't', ts: now },
  added: { ex: { xadd: { title: 'تمرين مضاف', axis: 'a1', format: 'text', mode: 'individual', ts: 5 }, xadd2: { title: 'مضاف على محور 2', axis: 'a2', format: 'text', mode: 'individual', ts: 6 } }, axes: { axNew: { title: 'محور مضاف', unit: 1, ts: 7, slides: [] } } }
});
let browser; let master = { tree: null }; let pages = [];
const fails = []; const ok = (k, v) => { if (!v) fails.push(k); return v; };
async function dev(o = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.exposeBinding('__srvPush', (src, json) => { master.tree = JSON.parse(json); pages.forEach(x => { if (x !== src.page) x.evaluate(j => window.__mock && __mock.replace(j), json).catch(() => {}); }); });
  pages.push(p);
  await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
  await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
  await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(([d, r, x, me]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 80 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' };
    if (me && !sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [master.tree || SEED(), o.rules || RULES, o.cfg, o.me]);
  await p.goto(U + (o.hash || '')); await p.waitForTimeout(900);
  if (o.admin) { await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
  return { ctx, p, net, errs };
}
const S = (p, pth) => p.evaluate(pth => { let n = window.__mock.server; for (const s of pth.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, pth);
const confirmOk = async p => { await p.waitForSelector('.modal [data-ok]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(700); };
const adminGrp = (p, g, acc) => p.evaluate(([g, acc]) => { Router.go('admin'); UIState.adminGrp = g; if (acc) acc.forEach(a => UIState.openAcc.add(a)); UIState.openDrop.add('users'); App.render(); }, [g, acc || []]);
(async () => {
  browser = await chromium.launch(); const R = { user: {}, ex: {}, axis: {}, oldRules: {}, audit: {} };
  const T = await dev({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
  const A = await dev({ me: { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, code: 'ABCDEF', group: 2 }, hash: '#/home' });
  await A.p.waitForTimeout(500);
  // ---------- 1) حذف متدرب ----------
  await adminGrp(T.p, 'g_users'); await T.p.waitForTimeout(300);
  R.user.btn = !!(await T.p.$('[data-act="user-del"][data-uid="u1"]')); ok('زر 🗑 في قائمة المسجلين', R.user.btn);
  await T.p.click('[data-act="user-del"][data-uid="u1"]'); await confirmOk(T.p); await T.p.waitForTimeout(500);
  const t = await T.p.evaluate(() => JSON.parse(JSON.stringify(window.__mock.server)));
  const gone = ['users/u1', 'private/u1', 'secrets/u1', 'devices/u1', 'assess/pre/u1', 'attendance/u1', 'checkins/d1/u1', 'assign/u1', 'leads/u1', 'followups/d30/u1', 'posts/a1e3/u1', 'posts/a1e3/u2/likes/u1', 'posts/a2e1/g2/members/u1', 'storyLikes/st1/likes/u1'];
  const at = pth => pth.split('/').reduce((n, s) => (n == null ? null : n[s]), t);
  R.user.remaining = gone.filter(pth => at(pth) != null); ok('حُذفت كل بيانات المتدرب', !R.user.remaining.length);
  R.user.groupKept = at('posts/a2e1/g2/text') === 'إجابة المجموعة' && at('posts/a2e1/g2/members/u2') === true && at('posts/a2e1/g2/name') === ''; ok('إجابة المجموعة باقية مع إزالة اسمه', R.user.groupKept);
  R.user.othersKept = !!at('users/u2') && !!at('posts/a1e3/u2') && at('storyLikes/st1/likes/u2') === true; ok('بيانات الآخرين سليمة', R.user.othersKept);
  R.user.stats = at('stats/registered'); ok('تقليل عدد المسجلين', R.user.stats === 1);
  await A.p.waitForTimeout(2200);
  R.user.traineeDevice = await A.p.evaluate(() => ({ me: !!Me.data, stored: !!localStorage.getItem('qbd:ec_me'), alert: (document.querySelector('.modal') || {}).innerText || '' }));
  ok('جهاز المتدرب المحذوف: خروج وتنبيه', !R.user.traineeDevice.me && !R.user.traineeDevice.stored && /حذف المدرب حسابك/.test(R.user.traineeDevice.alert));
  // ---------- 2) حذف تمرين أصلي ثم استرجاعه ----------
  await adminGrp(T.p, 'g_axes', ['a1']); await T.p.waitForTimeout(300);
  await T.p.click('.ex-row [data-act="delete-ex"][data-id="a1e2"]'); await confirmOk(T.p);
  const x = await T.p.evaluate(() => JSON.parse(JSON.stringify(window.__mock.server))); const ax = pth => pth.split('/').reduce((n, s) => (n == null ? null : n[s]), x);
  R.ex.marked = typeof ax('removed/ex/a1e2') === 'number'; ok('الأصلي يُسجَّل في removed/ex', R.ex.marked);
  R.ex.cleaned = ['posts/a1e2', 'visibility/a1e2', 'content/ex/a1e2', 'reveal/a1e2', 'presence/a1e2', 'invite'].filter(pth => ax(pth) != null); ok('تنظيف المشاركات والإظهار والتعديل والكشف والحضور والدعوة', !R.ex.cleaned.length);
  R.ex.order = ax('order/ex/a1'); ok('إزالته من الترتيب', Array.isArray(R.ex.order) && R.ex.order.indexOf('a1e2') === -1 && R.ex.order.length === 4);
  R.ex.hiddenAdmin = await T.p.evaluate(() => !document.querySelector('.ex-row [data-id="a1e2"]') && Content.ex('a1e2') === null); ok('يختفي من لوحة التحكم', R.ex.hiddenAdmin);
  const B = await dev({ me: { uid: 'u2', name: 'علي حسن', member: 1002, ts: 1, code: 'GHJKLM', group: 2 }, hash: '#/home' });
  await B.p.evaluate(() => Router.go('axis', { id: 'a1' })); await B.p.waitForTimeout(400);
  R.ex.traineeAxis = await B.p.evaluate(() => !document.querySelector('[data-go="ex"][data-id="a1e2"]') && Content.exercisesOf('a1').every(e => e.id !== 'a1e2')); ok('يختفي عند المتدرب', R.ex.traineeAxis);
  await B.p.evaluate(() => Router.go('ex', { id: 'a1e2' })); await B.p.waitForTimeout(300);
  R.ex.directLink = await B.p.evaluate(() => /غير متاح/.test(document.getElementById('app').innerText)); ok('الرابط المباشر: غير متاح', R.ex.directLink);
  await adminGrp(T.p, 'g_axes', ['a1']); await T.p.click('[data-act="trash"]'); await T.p.waitForSelector('.trash-list');
  R.ex.trash = await T.p.$eval('.trash-list', e => e.innerText.replace(/\s+/g, ' ')); ok('يظهر في «المحذوفات»', /تمرين/.test(R.ex.trash));
  await T.p.click('.trash-list [data-act="restore-ex"][data-id="a1e2"]'); await T.p.waitForTimeout(600);
  R.ex.restored = (await S(T.p, 'removed/ex/a1e2')) == null && await T.p.evaluate(() => !!Content.ex('a1e2') && Content.ex('a1e2').title !== 'عنوان معدّل'); ok('الاسترجاع يعيد المحتوى الأصلي', R.ex.restored);
  R.ex.trashEmpty = await T.p.evaluate(() => /لا توجد محذوفات/.test(document.querySelector('.modal').innerText)); ok('تحديث القائمة بعد الاسترجاع', R.ex.trashEmpty);
  await T.p.click('.modal [data-x]');
  await B.p.evaluate(() => Router.go('axis', { id: 'a1' })); await B.p.waitForTimeout(400);
  R.ex.backForTrainee = await B.p.evaluate(() => Content.exercisesOf('a1').some(e => e.id === 'a1e2')); ok('يعود عند المتدرب', R.ex.backForTrainee);
  // ---------- 3) حذف تمرين مضاف: نهائي ----------
  await adminGrp(T.p, 'g_axes', ['a1']); await T.p.click('.ex-row [data-act="delete-ex"][data-id="xadd"]'); await confirmOk(T.p);
  R.ex.addedGone = (await S(T.p, 'added/ex/xadd')) == null && (await S(T.p, 'posts/xadd')) == null && (await S(T.p, 'removed/ex/xadd')) == null; ok('المضاف يُحذف نهائيًا', R.ex.addedGone);
  // ---------- 4) حذف محور أصلي واسترجاعه ----------
  await adminGrp(T.p, 'g_axes'); await T.p.click('[data-act="delete-axis"][data-id="a2"]'); await confirmOk(T.p);
  R.axis.marked = typeof (await S(T.p, 'removed/axes/a2')) === 'number'; ok('المحور الأصلي في removed/axes', R.axis.marked);
  R.axis.postsGone = (await S(T.p, 'posts/a2e1')) == null; ok('مشاركات تمارينه حُذفت', R.axis.postsGone);
  R.axis.addedExKept = !!(await S(T.p, 'added/ex/xadd2')); ok('تمرينه المضاف محفوظ ليعود مع الاسترجاع', R.axis.addedExKept);
  R.axis.hidden = await B.p.evaluate(() => Content.axes().every(a => a.id !== 'a2') && Content.ex('a2e1') === null && Content.ex('xadd2') === null); ok('المحور وتمارينه تختفي', R.axis.hidden);
  await B.p.evaluate(() => Router.go('home')); await B.p.waitForTimeout(300);
  R.axis.homeNoLink = await B.p.evaluate(() => !document.querySelector('[data-go="axis"][data-id="a2"]')); ok('لا رابط للمحور في الرئيسية', R.axis.homeNoLink);
  await T.p.evaluate(() => Trash.open()); await T.p.waitForSelector('.trash-list');
  await T.p.click('.trash-list [data-act="restore-axis"][data-id="a2"]'); await T.p.waitForTimeout(600); await T.p.click('.modal [data-x]');
  R.axis.restored = await B.p.evaluate(() => Content.axes().some(a => a.id === 'a2') && !!Content.ex('a2e1') && !!Content.ex('xadd2')); ok('استرجاع المحور وتمارينه', R.axis.restored);
  // حذف محور مضاف: نهائي
  await adminGrp(T.p, 'g_axes'); await T.p.click('[data-act="delete-axis"][data-id="axNew"]'); await confirmOk(T.p);
  R.axis.addedGone = (await S(T.p, 'added/axes/axNew')) == null && (await S(T.p, 'removed/axes/axNew')) == null; ok('المحور المضاف يُحذف نهائيًا', R.axis.addedGone);
  // ---------- 5) فحص الأخطاء: كل الصفحات بعد حذف محور وتمرين ----------
  await T.p.evaluate(() => DB.update('', { 'removed/axes/a3': Date.now(), 'removed/ex/a1e1': Date.now() })); await T.p.waitForTimeout(500);
  for (const [nm, P] of [['admin', T.p], ['trainee', B.p]]) {
    const views = await P.evaluate(async () => { const out = []; const vs = [['home'], ['axis', 'a1'], ['axis', 'a3'], ['ex', 'a3e1'], ['ex', 'a1e1'], ['account'], ['lab'], ['assess'], ['tools']].concat(Admin.ok() ? [['admin'], ['present']] : []);
      for (const [v, id] of vs) { Router.go(v, id ? { id } : {}); await new Promise(r => setTimeout(r, 150)); out.push(v + (id ? ':' + id : '') + '=' + (document.getElementById('app').innerText.length > 20)); }
      if (Admin.ok()) for (const g of ADMIN_GROUPS_DEF.map(g => g.id)) { UIState.adminGrp = g; Router.go('admin'); await new Promise(r => setTimeout(r, 100)); }
      try { reportData(); out.push('report=ok'); } catch (e) { out.push('report=' + e.message); } return out; });
    R.audit[nm] = views;
  }
  R.audit.errs = { T: T.errs, A: A.errs, B: B.errs }; ok('بلا أخطاء صفحة', ![].concat(T.errs, B.errs).length && R.audit.admin.indexOf('report=ok') > -1);
  R.realNet = T.net.real + A.net.real + B.net.real; ok('بلا اتصال حقيقي', !R.realNet);
  for (const d of [T, A, B]) await d.ctx.close();
  // ---------- 6) قواعد قديمة: رسالة تشرح النشر، والمضاف يُحذف عاديًا ----------
  master = { tree: null }; pages = [];
  const T2 = await dev({ admin: true, rules: OLD_RULES, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
  await adminGrp(T2.p, 'g_axes', ['a1']); await T2.p.waitForTimeout(300);
  await T2.p.click('.ex-row [data-act="delete-ex"][data-id="a1e3"]'); await confirmOk(T2.p); await T2.p.waitForTimeout(300);
  R.oldRules.msg = await T2.p.$eval('.modal', e => e.innerText.replace(/\s+/g, ' ')).catch(() => ''); ok('قواعد قديمة: شرح خطوات النشر', /Publish/.test(R.oldRules.msg) && /removed/.test(R.oldRules.msg));
  R.oldRules.untouched = !!(await S(T2.p, 'posts/a1e3/u1')); ok('قواعد قديمة: لا حذف جزئي', R.oldRules.untouched);
  await T2.p.click('.modal [data-ok]'); await adminGrp(T2.p, 'g_axes', ['a1']);
  await T2.p.click('.ex-row [data-act="delete-ex"][data-id="xadd"]'); await confirmOk(T2.p);
  R.oldRules.addedDeleted = (await S(T2.p, 'added/ex/xadd')) == null; ok('قواعد قديمة: حذف المضاف يعمل', R.oldRules.addedDeleted);
  R.oldRules.errs = T2.errs; await T2.ctx.close();
  R.fails = fails; console.log(JSON.stringify(R, null, 1)); await browser.close(); process.exit(fails.length ? 1 : 0);
})();

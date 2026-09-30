// الحضور الحي على صفحات التمارين ودعوة المدرب — عدة أجهزة على خادم محاكى واحد بقواعد الملف الفعلي، دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const OLD_RULES = JSON.parse(JSON.stringify(RULES)); delete OLD_RULES.rules.presence; delete OLD_RULES.rules.invite; delete OLD_RULES.rules.removed;
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const OLD = Date.now() - 7 * 3600 * 1000;
const SEED = { admins: { adm1: true }, users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1, group: 2, gkey: 'g2' }, u2: { name: 'علي حسن', member: 1002, ts: 1 } },
  secrets: { u1: 'ABCDEF', u2: 'GHJKLM' }, presence: { a1e3: { stale1: { n: 'قديم', u: '', g: 0, ts: OLD } } } };
const ME1 = { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, code: 'ABCDEF', group: 2 };
const ME2 = { uid: 'u2', name: 'علي حسن', member: 1002, ts: 1, code: 'GHJKLM' };
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
    if (me && !sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded', '1'); localStorage.setItem('ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [master.tree || o.data || SEED, o.rules || RULES, o.cfg, o.me]);
  await p.goto(U + (o.hash || '')); await p.waitForTimeout(900);
  if (o.admin) { await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
  return { ctx, p, net, errs };
}
const go = (p, v, id) => p.evaluate(([v, id]) => { Router.go(v, id ? { id } : {}); }, [v, id]);
const S = (p, pth) => p.evaluate(pth => { let n = window.__mock.server; for (const s of pth.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, pth);
const tryW = (p, src) => p.evaluate(async src => { try { await (new Function('return (' + src + ')()'))(); return 'allowed'; } catch (e) { return 'denied'; } }, src);
const tryR = (p, pth) => p.evaluate(async pth => { try { await DB.get(pth); return 'readable'; } catch (e) { return 'denied'; } }, pth);
const count = async p => { const el = await p.$('.ex-head ~ .live-bar .live-count'); return el ? await el.evaluate(e => e.textContent.replace(/\s+/g, ' ').trim()) : null; };
(async () => {
  browser = await chromium.launch(); const R = { presence: {}, invite: {}, rules: {}, oldRules: {}, demo: {} };
  const T = await dev({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
  const A = await dev({ me: ME1, hash: '#/home' });
  const G = await dev({ hash: '#/home' }); await G.p.click('[data-act="open-login"]'); await G.p.click('.modal [data-act="guest"]'); await G.p.waitForTimeout(300);
  // 1) المتدرب والزائر على صفحة التمرين
  await go(A.p, 'ex', 'a1e3'); await go(G.p, 'ex', 'a1e3'); await A.p.waitForTimeout(600);
  const srv = await S(T.p, 'presence/a1e3');
  R.presence.server = Object.keys(srv || {}).length; R.presence.traineeRec = srv && srv.u1 && { n: srv.u1.n, u: srv.u1.u, g: srv.u1.g };
  ok('تسجيل المتدرب بمعرّف جلسته', srv && srv.u1 && srv.u1.n === 'سارة أحمد' && srv.u1.g === 2);
  await go(T.p, 'ex', 'a1e3'); await T.p.waitForTimeout(400);
  R.presence.adminCount = await count(T.p); ok('المدرب يرى 2 (ويتجاهل الأقدم من 6 ساعات)', /^2 /.test(R.presence.adminCount || ''));
  R.presence.adminNotRegistered = !Object.keys(srv || {}).some(k => k === 'adm1'); ok('المدرب لا يُسجَّل', R.presence.adminNotRegistered);
  await T.p.click('.live-bar .live-count'); await T.p.waitForSelector('.pres-list');
  R.presence.modal = await T.p.$eval('.pres-list', e => e.innerText.replace(/\s+/g, ' ').trim()); ok('الأسماء وسطر الزوار', /سارة أحمد/.test(R.presence.modal) && /\(1\) زائر/.test(R.presence.modal));
  await T.p.click('.modal [data-ok]');
  // صف التمرين في لوحة التحكم
  await T.p.evaluate(() => { Router.go('admin'); }); await T.p.waitForTimeout(300);
  await T.p.evaluate(() => { const a = Content.axisOfEx('a1e3'); UIState.adminGrp = 'g_axes'; UIState.openAcc.add(a); App.render(); }); await T.p.waitForTimeout(300);
  R.presence.panelRow = await T.p.evaluate(() => { const b = document.querySelector('.ex-row .live-count[data-ex="a1e3"]'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
  ok('العداد في صف لوحة التحكم', /^2 /.test(R.presence.panelRow || ''));
  // 2) مغادرة الصفحة، والانقطاع ثم العودة
  await go(A.p, 'home'); await A.p.waitForTimeout(500);
  R.presence.afterLeave = Object.keys((await S(T.p, 'presence/a1e3')) || {}).filter(k => k !== 'stale1').length; ok('المغادرة تحذف التسجيل', R.presence.afterLeave === 1);
  await G.p.evaluate(() => __mock.setConnected(false)); await G.p.waitForTimeout(400);
  R.presence.afterDrop = Object.keys((await S(T.p, 'presence/a1e3')) || {}).filter(k => k !== 'stale1').length; ok('onDisconnect يحذف عند الانقطاع', R.presence.afterDrop === 0);
  await G.p.evaluate(() => __mock.setConnected(true)); await G.p.waitForTimeout(600);
  R.presence.afterReconnect = Object.keys((await S(T.p, 'presence/a1e3')) || {}).filter(k => k !== 'stale1').length; ok('إعادة التسجيل عند عودة الاتصال', R.presence.afterReconnect === 1);
  // 3) القواعد
  R.rules = {
    traineeRead: await tryR(A.p, 'presence'),
    otherSid: await tryW(A.p, "() => DB.set('presence/a1e3/zzz', { n: 'x', u: '', g: 0, ts: DB.now() }, { quiet: true })"),
    badField: await tryW(A.p, "() => DB.set('presence/a1e3/u1', { n: 'x', u: '', g: 0, ts: DB.now(), evil: 1 }, { quiet: true })"),
    longName: await tryW(A.p, "() => DB.set('presence/a1e3/u1', { n: 'x'.repeat(200), u: '', g: 0, ts: DB.now() }, { quiet: true })"),
    spoofUid: await tryW(A.p, "() => DB.set('presence/a1e3/u1', { n: 'x', u: 'u2', g: 0, ts: DB.now() }, { quiet: true })"),
    own: await tryW(A.p, "() => DB.set('presence/a1e3/u1', { n: 'سارة', u: 'u1', g: 2, ts: DB.now() }, { quiet: true })"),
    traineeInvite: await tryW(A.p, "() => DB.set('invite', { id: 'x', ex: 'a1e3', title: 't', ts: DB.now() }, { quiet: true })"),
    adminInviteBad: await tryW(T.p, "() => DB.set('invite', { id: 'x', ex: 'a1e3', ts: DB.now(), evil: 1 }, { quiet: true })")
  };
  await A.p.evaluate(() => DB.remove('presence/a1e3/u1', { quiet: true }));
  ok('قواعد الحضور والدعوة', R.rules.traineeRead === 'denied' && R.rules.otherSid === 'denied' && R.rules.badField === 'denied' && R.rules.longName === 'denied' && R.rules.spoofUid === 'denied' && R.rules.own === 'allowed' && R.rules.traineeInvite === 'denied' && R.rules.adminInviteBad === 'denied');
  // 4) الدعوة
  const B = await dev({ me: ME2, hash: '#/home' }); await go(B.p, 'ex', 'a1e3'); await B.p.waitForTimeout(400); // على صفحة التمرين نفسه
  await go(T.p, 'ex', 'a1e3'); await T.p.waitForTimeout(300);
  await T.p.click('.live-bar [data-act="invite"]'); await T.p.waitForTimeout(700);
  R.invite.server = await S(T.p, 'invite'); ok('تُكتب الدعوة', R.invite.server && R.invite.server.ex === 'a1e3');
  R.invite.btn = await T.p.$eval('.live-bar [data-act="invite-cancel"]', e => e.textContent.trim()).catch(() => null); ok('الزر يصبح «مدعوون الآن · إلغاء»', /مدعوون الآن/.test(R.invite.btn || ''));
  R.invite.traineeModal = await A.p.$eval('.invite-modal', e => e.innerText.replace(/\s+/g, ' ')).catch(() => null); ok('نافذة الدعوة للمتدرب', /دعوة من المدرّب/.test(R.invite.traineeModal || '') && /انتقل إلى التمرين/.test(R.invite.traineeModal || ''));
  R.invite.guestModal = !!(await G.p.$('.invite-modal')); ok('لا دعوة للزائر', !R.invite.guestModal);
  R.invite.onPageModal = !!(await B.p.$('.invite-modal')); ok('لا دعوة على صفحة التمرين نفسه', !R.invite.onPageModal);
  await A.p.click('.invite-modal [data-ok]'); await A.p.waitForTimeout(400);
  R.invite.navigated = await A.p.evaluate(() => Router.cur.view + ':' + Router.cur.id); ok('«انتقل إلى التمرين»', R.invite.navigated === 'ex:a1e3');
  await go(A.p, 'home'); await A.p.reload(); await A.p.waitForTimeout(1200);
  R.invite.noRepeat = !(await A.p.$('.invite-modal')); ok('لا تتكرر الدعوة', R.invite.noRepeat);
  // دعوة جديدة تحل محل السابقة، ودعوة قديمة (أكثر من 3 ساعات) لا تظهر
  await T.p.evaluate(() => DB.set('invite', { id: 'old1', ex: 'a2e1', title: 'قديمة', ts: DB.now() - 4 * 3600 * 1000 })); await A.p.waitForTimeout(500);
  R.invite.oldHidden = !(await A.p.$('.invite-modal')); ok('الدعوة الأقدم من 3 ساعات لا تظهر', R.invite.oldHidden);
  await T.p.evaluate(() => Invite.send('a2e1')); await A.p.waitForTimeout(600);
  R.invite.replaced = !!(await A.p.$('.invite-modal')) && (await S(T.p, 'invite/ex')) === 'a2e1'; ok('الدعوة الجديدة تحل محل السابقة', R.invite.replaced);
  await A.p.click('.invite-modal [data-no]');
  await go(T.p, 'ex', 'a2e1'); await T.p.waitForTimeout(300); await T.p.click('.live-bar [data-act="invite-cancel"]'); await T.p.waitForTimeout(500);
  R.invite.cancelled = (await S(T.p, 'invite')) == null; ok('إلغاء الدعوة', R.invite.cancelled);
  R.errs = { T: T.errs, A: A.errs, G: G.errs, B: B.errs }; R.realNet = T.net.real + A.net.real + G.net.real + B.net.real;
  ok('بلا أخطاء صفحة', ![].concat(T.errs, A.errs, G.errs, B.errs).length); ok('بلا اتصال حقيقي', !R.realNet);
  for (const x of [T, A, G, B]) await x.ctx.close();
  // 5) قواعد قديمة منشورة: العداد معطّل ورسالة واضحة عند الدعوة، والمنصة تعمل
  master = { tree: null }; pages = [];
  const T2 = await dev({ admin: true, rules: OLD_RULES, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
  await go(T2.p, 'ex', 'a1e3'); await T2.p.waitForTimeout(400);
  R.oldRules.badge = await count(T2.p); ok('قواعد قديمة: «العداد معطّل»', /العداد معطّل/.test(R.oldRules.badge || ''));
  await T2.p.click('.live-bar [data-act="invite"]'); await T2.p.waitForTimeout(600);
  R.oldRules.inviteMsg = await T2.p.$eval('.modal', e => e.innerText.replace(/\s+/g, ' ')).catch(() => null); ok('قواعد قديمة: شرح خطوات النشر', /Publish/.test(R.oldRules.inviteMsg || ''));
  R.oldRules.appWorks = await T2.p.evaluate(() => App.dataReady && !App.watchError); ok('قواعد قديمة: المنصة لا تتعطل', R.oldRules.appWorks);
  const A2 = await dev({ me: ME1, rules: OLD_RULES, hash: '#/home' }); await go(A2.p, 'ex', 'a1e3'); await A2.p.waitForTimeout(500);
  R.oldRules.traineeOk = await A2.p.evaluate(() => App.dataReady && !App.watchError && !document.querySelector('.modal')); ok('قواعد قديمة: المتدرب بلا رسائل', R.oldRules.traineeOk);
  await T2.ctx.close(); await A2.ctx.close();
  // 6) الوضع المحلي التجريبي
  { const ctx = await browser.newContext(); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); const net = { real: 0 };
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken|gstatic/, r => { net.real++; return r.abort(); }); await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
    await p.goto(U + '?demo=1#/home'); await p.waitForTimeout(800);
    await p.evaluate(() => { Me.save({ uid: 'ud', name: 'تجربة', member: 1, ts: Date.now() }); Router.go('ex', { id: 'a1e3' }); }); await p.waitForTimeout(400);
    R.demo.local = await p.evaluate(() => { const t = JSON.parse(localStorage.getItem('qdb_ecom_demo_db') || '{}'); return Object.keys(((t.presence || {}).a1e3) || {}).length; });
    R.demo.errs = errs; ok('الوضع المحلي يعمل', R.demo.local === 1 && !errs.length); await ctx.close(); }
  R.fails = fails; console.log(JSON.stringify(R, null, 1)); await browser.close(); process.exit(fails.length ? 1 : 0);
})();

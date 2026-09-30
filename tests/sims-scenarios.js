// كشف الإجابات من المدرب فقط لكل الأنواع، ومحاكاة في نهاية كل محور بقوالبها (عوامل/تصنيف) ومعايرة درجاتها
// محاكاة Firebase بقواعد الملف الفعلي، دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const ME = { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, code: 'ABCDEF', group: 1 };
const SEED = (reveal) => ({ admins: { adm1: true }, users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1, group: 1, gkey: 'g1' }, u2: { name: 'علي', member: 1002, ts: 1 } }, secrets: { u1: 'ABCDEF' },
  reveal: reveal || {},
  posts: { a1e5: { u2: { state: { a: { 0: 'mkt', 1: 'own', 2: 'social', 3: 'b2b' } }, metric: 4, summary: 'أجاب على 4 من 8', name: 'علي', uid: 'u2', ts: 2 },
                   u1: { state: { a: { 0: 'mkt', 1: 'social' } }, metric: 1, summary: 'أجاب على 2 من 8', name: 'سارة أحمد', uid: 'u1', ts: 1 } } } });
const fails = []; const ok = (k, v) => { if (!v) fails.push(k); return v; };
let browser;
async function open(o = {}) {
  const ctx = await browser.newContext({ viewport: { width: o.w || 1280, height: 900 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
  await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
  await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(([d, r, x, me]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 80 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' };
    if (me) { localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [o.data || SEED(), RULES, o.cfg, o.me]);
  await p.goto(U + '#/home'); await p.waitForTimeout(900);
  if (o.admin) { await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
  return { ctx, p, net, errs };
}
const go = (p, id) => p.evaluate(id => { UIState.sim = {}; Router.go('ex', { id }); }, id).then(() => p.waitForTimeout(350));
(async () => {
  browser = await chromium.launch(); const R = { structure: {}, calib: {}, trainee: {}, admin: {}, after: {} };
  // ---------- 1) البنية والمعايرة ----------
  const T = await open({ me: ME });
  R.structure = await T.p.evaluate(() => Content.axes().map(a => { const l = Content.exercisesOf(a.id); const last = l[l.length - 1]; return a.id + ':' + (last && last.format === 'sim' ? last.sim : 'NO'); }));
  ok('محاكاة في نهاية كل محور', R.structure.length === 13 && R.structure.every(x => !/NO$/.test(x)));
  R.structure.contentOk = await T.p.evaluate(() => Content.axes().every(a => { const l = Content.exercisesOf(a.id); const e = l[l.length - 1]; return e.scenario && e.principle && e.steps.length >= 3 && e.task && e.why; }));
  ok('كل محاكاة: موقف ومبدأ وخطوات ومطلوب ولماذا', R.structure.contentOk);
  R.calib = await T.p.evaluate(() => {
    const o = {}; const f = Object.keys(SIMS).filter(k => SIMS[k].optimal);
    f.forEach(k => { const S = SIMS[k]; const b = S.optimal(); o[k] = { def: S.metric(S.def()), best: S.metric(b), okBest: !S.check || !S.check(b) }; });
    // خيارات «خدعة» لا تتفوق على الإصلاح الصحيح
    const L = ListingSim.optimal(); o.listingStuffWorse = ListingSim.metric(Object.assign({}, L, { stuff: true })) < ListingSim.metric(L) && !L.stuff;
    o.listingDeepDiscountWorse = ListingSim.metric(Object.assign({}, L, { price: 'low15' })) < ListingSim.metric(L);
    o.automationNoBot = !AutomationSim.optimal().bot && AutomationSim.metric(Object.assign({}, AutomationSim.def(), { bot: true, sync: true, low: true, reco: false })) < AutomationSim.metric(AutomationSim.optimal());
    o.paymixNoCod = !PayMixSim.optimal().cod;
    const G = GrowthSim.optimal(); o.growthBest = G.mkt + '/' + G.ch + '/' + G.pace;
    o.growthAggressiveBlocked = !!GrowthSim.check(Object.assign({}, GrowthSim.def(), { mkt: 'gcc', ch: 'both', pace: 'fast', loc: true, tpl: true, fund: true }));
    const F = FunnelSim.optimal(); o.funnelLeak = (F.f4 || 0) >= Math.max(F.f1 || 0, F.f2 || 0, F.f3 || 0);
    o.radarWeekBest = RadarSim.optimal().base === 'week' && RadarSim.metric(RadarSim.optimal()) > RadarSim.metric({ base: 'yday', thr: 10 });
    o.inventoryNoStockout = invRun(InventorySim.optimal()).lost === 0;
    return o;
  });
  ok('المعايرة: الحل النموذجي أعلى من البداية وضمن القيود', Object.keys(R.calib).filter(k => R.calib[k] && R.calib[k].best != null).every(k => R.calib[k].best > R.calib[k].def && R.calib[k].okBest));
  ['listingStuffWorse', 'listingDeepDiscountWorse', 'automationNoBot', 'paymixNoCod', 'growthAggressiveBlocked', 'funnelLeak', 'radarWeekBest', 'inventoryNoStockout'].forEach(k => ok('معايرة: ' + k, R.calib[k]));
  ok('معايرة: خطة النمو النموذجية', R.calib.growthBest === 'ksa/mkt/pilot');
  // ---------- 2) المتدرب قبل الكشف ----------
  await go(T.p, 'a1e5');
  R.trainee.noReveal = !(await T.p.$('[data-act="reveal"]')) && !(await T.p.$('[data-act="show-model"]')); ok('لا زر كشف/تحقق للمتدرب', R.trainee.noReveal);
  R.trainee.noCorrection = !(await T.p.$('.cls-why')) && !(await T.p.$('.cls-item.right,.cls-item.wrong'));
  R.trainee.feedNoScore = !(await T.p.$('#feedZone .sim-badge'));
  R.trainee.feedOrder = await T.p.$$eval('#feedZone .post .who', e => e.map(x => x.textContent));
  ok('التصنيف قبل الكشف: لا تصحيح ولا نتيجة ولا ترتيب', R.trainee.noCorrection && R.trainee.feedNoScore && R.trainee.feedOrder[0] === 'علي');
  await T.p.click('[data-act="cls-pick"][data-i="2"][data-v="social"]'); await T.p.click('[data-act="cls-pick"][data-i="3"][data-v="b2b"]'); await T.p.waitForTimeout(200);
  await T.p.click('[data-act="sim-save"]'); await T.p.waitForTimeout(600);
  const saved = await T.p.evaluate(() => window.__mock.server.posts.a1e5.u1);
  R.trainee.saved = { summary: saved.summary, metric: saved.metric }; ok('الملخص «أجاب على n من N» والدرجة في metric', saved.summary === 'أجاب على 4 من 8' && saved.metric === 3);
  // المحاكاة ذات الإعدادات: لا حل نموذجي قبل الكشف
  await go(T.p, 'a3e5'); R.trainee.noModelBefore = !(await T.p.$('.sim-model')); ok('لا حل نموذجي قبل الكشف', R.trainee.noModelBefore); ok('لا فلسفة حل قبل الكشف', !(await T.p.$('.sim-philosophy')));
  // القيد (onSet): تجاوز سعة الأتمتة يُرفض
  await go(T.p, 'a9e5');
  for (const k of ['sync', 'books', 'bot']) { await T.p.check('[data-sim-f="' + k + '"]'); await T.p.waitForTimeout(80); }
  await T.p.click('[data-sim-f="reco"]'); await T.p.waitForTimeout(300);
  R.trainee.capacity = await T.p.evaluate(() => ({ reco: !!Sims.state(Content.ex('a9e5')).reco, used: AutomationSim.calc(Sims.state(Content.ex('a9e5'))).counters[0].v, box: !!document.querySelector('[data-sim-f="reco"]:checked') }));
  ok('onSet يمنع تجاوز السعة', !R.trainee.capacity.reco && R.trainee.capacity.used <= 6 && !R.trainee.capacity.box);
  // النصي: النموذج المساعد مخفي حتى الكشف
  await go(T.p, 'a1e3'); R.trainee.textModelHidden = !(await T.p.$('.model-body')) && !!(await T.p.$('.model-locked')); ok('النموذج المساعد مخفي قبل الكشف', R.trainee.textModelHidden);
  R.trainee.errs = T.errs; await T.ctx.close();
  // ---------- 3) المدرب: الأزرار لكل الأنواع، ويرى النتائج دائمًا ----------
  const A = await open({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
  for (const id of ['a1e3', 'a1e1', 'a1e2', 'a1e4', 'a2e3', 'a1e5', 'a3e5']) { await go(A.p, id); R.admin[id] = !!(await A.p.$('.live-bar [data-act="reveal"]')); }
  ok('زر الكشف للمدرب في صفحة كل الأنواع', ['a1e3', 'a1e1', 'a1e2', 'a1e4', 'a2e3', 'a1e5', 'a3e5'].every(id => R.admin[id]));
  await go(A.p, 'a1e5'); R.admin.feedScores = await A.p.$$eval('#feedZone .sim-badge', e => e.map(x => x.textContent)); ok('المدرب يرى الدرجات والترتيب دائمًا', R.admin.feedScores[0] === '4/8');
  await A.p.evaluate(() => { Router.go('admin'); UIState.adminGrp = 'g_axes'; UIState.openAcc.add('a1'); App.render(); }); await A.p.waitForTimeout(300);
  R.admin.rowBtns = await A.p.$$eval('.ex-row [data-act="reveal"]', e => e.map(x => x.getAttribute('data-id'))); ok('زر الكشف في صف كل تمرين', ['a1e1', 'a1e2', 'a1e3', 'a1e4', 'a1e5'].every(x => R.admin.rowBtns.indexOf(x) > -1));
  await A.p.click('.ex-row [data-act="reveal"][data-id="a1e5"]'); await A.p.waitForTimeout(500);
  R.admin.revealWritten = await A.p.evaluate(() => window.__mock.server.reveal && window.__mock.server.reveal.a1e5 === true); ok('الكشف يُكتب في reveal', R.admin.revealWritten);
  R.admin.errs = A.errs; await A.ctx.close();
  // ---------- 4) المتدرب بعد الكشف ----------
  const B = await open({ me: ME, data: SEED(Object.fromEntries(['a1e5','a2e5','a3e5','a4e5','a5e5','a6e5','a7e5','a8e5','a9e5','a10e5','a11e5','a12e5','a13e4','a1e3'].map(k => [k, true]))) });
  await go(B.p, 'a1e5');
  R.after.corrections = await B.p.$$eval('.cls-why', e => e.length); R.after.locked = !(await B.p.$('[data-act="sim-save"]')) && !!(await B.p.$('.cls-opt:disabled'));
  ok('التصنيف بعد الكشف: تصحيح بسبب كل بند وقفل', R.after.corrections === 8 && R.after.locked);
  R.after.saveBlocked = await B.p.evaluate(async () => { const before = JSON.stringify(window.__mock.server.posts.a1e5.u1); await Sims.save('a1e5'); await new Promise(r => setTimeout(r, 300)); document.querySelectorAll('.modal-back').forEach(x => x.remove()); return JSON.stringify(window.__mock.server.posts.a1e5.u1) === before; });
  ok('الحفظ ممنوع بعد الكشف', R.after.saveBlocked);
  R.after.feedScores = await B.p.$$eval('#feedZone .sim-badge', e => e.map(x => x.textContent)); ok('الدرجات والترتيب بعد الكشف', R.after.feedScores.length === 2 && R.after.feedScores[0] === '4/8');
  await go(B.p, 'a3e5');
  R.after.model = await B.p.evaluate(() => { const m = document.querySelector('.sim-model'); return m ? { cmp: m.querySelector('.sim-cmp').innerText.replace(/\s+/g, ' '), inert: m.querySelector('.sim-ro').hasAttribute('inert') } : null; });
  ok('الحل النموذجي بعد الكشف مع مقارنة وللقراءة فقط', R.after.model && /الحل النموذجي/.test(R.after.model.cmp) && R.after.model.inert);
  await go(B.p, 'a1e3'); R.after.textModel = !!(await B.p.$('.model-body')); ok('النموذج المساعد بعد الكشف', R.after.textModel);
  R.after.noRevealBtn = !(await B.p.$('[data-act="reveal"]')); ok('لا زر كشف للمتدرب بعد الكشف أيضًا', R.after.noRevealBtn);
  // كل المحاكيات تُرسم دون أخطاء بعد الكشف (الحل النموذجي لكل منها)
  await B.p.evaluate(() => DB.update('', Object.fromEntries(Content.axes().map(a => { const l = Content.exercisesOf(a.id); return ['reveal/' + l[l.length - 1].id, true]; })))).catch(() => {});
  R.after.allSims = await B.p.evaluate(async () => { const out = []; for (const a of Content.axes()) { const l = Content.exercisesOf(a.id); const e = l[l.length - 1]; UIState.sim = {}; Router.go('ex', { id: e.id }); await new Promise(r => setTimeout(r, 120)); out.push(e.id + ':' + (!!document.querySelector('#simZone .sim-live'))); } return out; });
  ok('كل المحاكيات تعمل', R.after.allSims.every(x => /true$/.test(x)));
  // فلسفة الحل: تظهر بعد الكشف لكل المحاكيات (تصنيف وإعدادات) بأقسامها الأربعة، وتغيب قبله
  R.after.philosophy = await B.p.evaluate(async () => { const out = []; for (const a of Content.axes()) { const l = Content.exercisesOf(a.id); const e = l[l.length - 1]; UIState.sim = {}; Router.go('ex', { id: e.id }); await new Promise(r => setTimeout(r, 120)); const el = document.querySelector('.sim-philosophy'); out.push(e.sim + ':' + (el ? el.querySelectorAll('.sp-row').length : 0)); } return out; });
  ok('فلسفة الحل بعد الكشف: 4 أقسام لكل محاكاة', R.after.philosophy.length === 13 && R.after.philosophy.every(x => /:4$/.test(x)));
  R.after.philoAll = await B.p.evaluate(() => Object.keys(SIMS).filter(k => !SIM_PHILOSOPHY[k])); ok('لكل نوع محاكاة شرح', !R.after.philoAll.length);
  R.after.errs = B.errs; await B.ctx.close();
  // ---------- 5) جوال ----------
  const M = await open({ me: ME, w: 380 }); const ov = [];
  for (const id of ['a1e5', 'a5e5', 'a9e5', 'a11e5', 'a13e4']) { await go(M.p, id); if (await M.p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) ov.push(id); }
  R.mobileOverflow = ov; ok('لا انزلاق أفقي على الجوال', !ov.length); R.mobileErrs = M.errs; await M.ctx.close();
  ok('بلا أخطاء صفحة', ![].concat(R.trainee.errs, R.admin.errs, R.after.errs, R.mobileErrs).length);
  R.fails = fails; console.log(JSON.stringify(R, null, 1)); await browser.close(); process.exit(fails.length ? 1 : 0);
})();

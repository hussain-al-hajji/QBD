// (1) الإجابة الصحيحة تظهر مع كل بند بعد كشف المدرب؛ (2) تعطيل وضع المجموعات يحوّل تمارين المجموعات إلى فردية
// محاكاة Firebase بقواعد الملف الفعلي، دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const ME = { uid: 'u1', name: 'سارة', member: 1, ts: 1, code: 'ABCDEF' };
const seed = x => Object.assign({ admins: { adm1: true }, users: { u1: { name: 'سارة', member: 1, ts: 1 }, u2: { name: 'علي', member: 2, ts: 1, group: 2, gkey: 'g2' } }, secrets: { u1: 'ABCDEF' }, invite: { id: 'i', ex: 'x', ts: 1 } }, x || {});
const fails = []; const ok = (k, v) => { if (!v) fails.push(k); return v; };
let browser; const allErrs = []; let realNet = 0;
async function open(o = {}) {
  const ctx = await browser.newContext(); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
  await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
  await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(([d, r, x, me]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 60 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' }; localStorage.setItem('qbd:ec_inv_seen', 'i');
    if (me) { localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [o.data || seed(), RULES, o.cfg, o.me]);
  await p.goto(U + '#/home'); await p.waitForTimeout(900);
  if (o.admin) { await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
  return { ctx, p, errs, net, done() { allErrs.push(...errs); realNet += net.real; return ctx.close(); } };
}
const S = (p, pth) => p.evaluate(pth => { let n = window.__mock.server; for (const s of pth.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, pth);
const tryW = (p, src) => p.evaluate(async src => { try { await (new Function('return (' + src + ')()'))(); return 'allowed'; } catch (e) { return 'denied'; } }, src);
const go = (p, id) => p.evaluate(id => { UIState.sim = {}; Router.go('ex', { id }); }, id).then(() => p.waitForTimeout(350));
const notes = p => p.$$eval('.q-card .q-answer', e => e.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
(async () => {
  browser = await chromium.launch(); const R = { reveal: {}, groups: {} };
  const kinds = { mcq: 'a1e1', truefalse: 'a1e2', fillblank: 'a1e4', comparePairs: 'a2e3' };
  { // ---------- 1) الكشف داخل السؤال ----------
    const B = await open({ me: ME, data: seed({ reveal: { a1e1: true, a1e2: true, a1e4: true, a2e3: true }, posts: { a1e2: { u2: { answers: [true, false], name: 'علي', uid: 'u2', ts: 1 } } } }) });
    const A = await open({ me: ME });
    for (const [k, id] of Object.entries(kinds)) {
      await go(B.p, id); const n = await B.p.evaluate(id => Content.ex(id).items.length, id); const ns = await notes(B.p);
      const expect = await B.p.evaluate(id => Content.ex(id).items.map(it => correctText(Content.ex(id), it)), id);
      R.reveal[k] = { items: n, notes: ns.length, first: ns[0] };
      ok('بعد الكشف: ' + k + ' — ملاحظة لكل بند بنصها الصحيح', ns.length === n && ns.every((t, i) => t.indexOf(expect[i]) > -1 && /الإجابة الصحيحة/.test(t)));
      await go(A.p, id); ok('قبل الكشف: ' + k + ' — لا ملاحظة', (await notes(A.p)).length === 0);
    }
    // العلامة على الخيار الصحيح نفسه (اختيارات/صح-خطأ/مقارنة) لمن لم يجب
    await go(B.p, 'a1e2'); R.reveal.optMark = await B.p.$$eval('.q-card .opt.right', e => e.length); ok('صح/خطأ: تلوين الخيار الصحيح لمن لم يجب', R.reveal.optMark === (await B.p.evaluate(() => Content.ex('a1e2').items.length)));
    await go(B.p, 'a2e3'); ok('مقارنة: تلوين العبارة الصحيحة', (await B.p.$$eval('.cmp-opt.right', e => e.length)) === (await B.p.evaluate(() => Content.ex('a2e3').items.length)));
    // وتبقى الإجابة الصحيحة ظاهرة في إجابات المشاركين
    await go(B.p, 'a1e2'); R.reveal.feed = await B.p.$eval('#feedZone', e => e.innerText.replace(/\s+/g, ' ')); ok('وتظهر أيضًا في إجابات المشاركين', /النتيجة/.test(R.reveal.feed) && /✓|✗|الصحيح/.test(R.reveal.feed));
    // الاختيار من متعدد بأسلوب التصويت
    await go(B.p, 'a1e1'); ok('اختيار من متعدد: الخيار الصحيح ملوّن', (await B.p.$$eval('.opt.poll.right', e => e.length)) === (await B.p.evaluate(() => Content.ex('a1e1').items.length)));
    // زائر لم يسجل يرى الملاحظات أيضًا
    const G = await open({ data: seed({ reveal: { a1e2: true } }) }); await G.p.evaluate(() => { Me.setGuest(); Router.go('ex', { id: 'a1e2' }); }); await G.p.waitForTimeout(400);
    ok('الزائر يرى الإجابة الصحيحة مع السؤال', (await notes(G.p)).length === (await G.p.evaluate(() => Content.ex('a1e2').items.length)));
    // المدرب يكشف فتظهر فورًا للمتدرب على جهاز آخر
    await A.done(); await B.done(); await G.done();
  }
  { // ---------- 2) وضع المجموعات ----------
    const off = seed({ settings: { groups: { enabled: false } } });
    const T = await open({ me: ME, data: off });
    R.groups.state = await T.p.evaluate(() => ({ on: Groups.on(), mode: Content.ex('a1e4').mode, raw: Content.ex('a1e4')._mode0, cmp: Content.ex('a2e3').mode, sim: Content.ex('a8e5').mode }));
    ok('التعطيل: التمرين الجماعي يصير فرديًا والمخزَّن يبقى', !R.groups.state.on && R.groups.state.mode === 'individual' && R.groups.state.raw === 'group' && R.groups.state.cmp === 'individual' && R.groups.state.sim === 'individual');
    await go(T.p, 'a1e4');
    R.groups.ui = await T.p.evaluate(() => ({ picker: !!document.querySelector('#groupZone'), pills: [...document.querySelectorAll('.ex-head .pill')].map(x => x.textContent.trim()), locked: /اختر مجموعتك/.test(document.getElementById('app').innerText), blanks: document.querySelectorAll('.blank:not([disabled])').length }));
    ok('لا اختيار مجموعة ولا قفل', !R.groups.ui.picker && !R.groups.ui.locked); ok('التصنيف: فردي', R.groups.ui.pills.some(x => /فردي/.test(x)) && !R.groups.ui.pills.some(x => /جماعي/.test(x))); ok('الإكمال متاح للفرد مباشرة', R.groups.ui.blanks > 0);
    // مشاركة مباشرة بلا مجموعة
    await T.p.evaluate(() => { const e = Content.ex('a1e4'); UIState.draft['a1e4'] = e.items.map(it => it.answer); return saveInter('a1e4'); }); await T.p.waitForTimeout(500);
    const post = await S(T.p, 'posts/a1e4/u1'); R.groups.post = post && { uid: post.uid, by: post.by, group: post.group, members: post.members };
    ok('تُحفظ باسم الفرد بلا by/group/members', post && post.uid === 'u1' && post.by == null && post.group == null && post.members == null);
    R.groups.done = await T.p.evaluate(() => Progress.exDone(Content.ex('a1e4'), 'u1')); ok('يُحتسب إنجازًا', R.groups.done);
    // مقارنة وتمرين نصي جماعي
    await go(T.p, 'a2e1'); ok('نصي جماعي: صندوق الكتابة متاح مباشرة', !!(await T.p.$('#ans-a2e1')) && !(await T.p.$('#groupZone')));
    // لعبة الميزانية: حفظ فردي وتسمية الصف باسم المشارك (لا NaN)
    await go(T.p, 'a8e5'); await T.p.evaluate(() => { const s = Sims.state(Content.ex('a8e5')); s.alloc.meta = 5000; s.alloc.google = 5000; return Sims.save('a8e5'); }); await T.p.waitForTimeout(500);
    R.groups.budget = await T.p.$eval('#feedZone', e => e.innerText.replace(/\s+/g, ' ')); ok('لعبة الميزانية: اسم المشارك بدل مجموعة NaN', /سارة/.test(R.groups.budget) && !/NaN/.test(R.groups.budget));
    R.groups.report = await T.p.evaluate(() => reportData().budget.map(x => ({ g: x.g, name: x.name }))); ok('تقرير الميزانية بلا NaN', R.groups.report.length === 1 && R.groups.report[0].g === 0 && R.groups.report[0].name === 'سارة');
    // المتدرب لا يبدّل الإعداد
    R.groups.traineeToggle = await tryW(T.p, "() => DB.set('settings/groups/enabled', null, { quiet: true })"); ok('المتدرب لا يبدّل وضع المجموعات', R.groups.traineeToggle === 'denied');
    // إجابة جماعية سابقة تُحتسب لأعضائها بعد التعطيل
    await T.done();
    const old = await open({ me: Object.assign({}, ME, { uid: 'u2', name: 'علي', code: 'GHJKLM' }), data: seed({ settings: { groups: { enabled: false } }, secrets: { u2: 'GHJKLM' }, posts: { a1e4: { g2: { answers: ['x'], name: 'علي', by: 'u2', group: 2, members: { u2: true }, ts: 1 } } } }) });
    R.groups.oldCredit = await old.p.evaluate(() => Progress.exDone(Content.ex('a1e4'), 'u2')); ok('إجابة جماعية سابقة تُحتسب لعضوها', R.groups.oldCredit); await old.done();
  }
  { // ---------- 3) لوحة التحكم: المفتاح ----------
    const A = await open({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
    await A.p.evaluate(() => { UIState.adminGrp = 'g_users'; UIState.openDrop.add('groups'); Router.go('admin'); }); await A.p.waitForTimeout(300);
    R.groups.sw = await A.p.$eval('[data-act="groups-toggle"]', e => e.getAttribute('aria-checked')); ok('الأصل: مفعّل', R.groups.sw === 'true' && (await S(A.p, 'settings/groups/enabled')) == null);
    await A.p.click('[data-act="groups-toggle"]'); await A.p.waitForTimeout(500);
    ok('التعطيل يُكتب في settings/groups/enabled', (await S(A.p, 'settings/groups/enabled')) === false);
    R.groups.after = await A.p.evaluate(() => ({ aria: document.querySelector('[data-act="groups-toggle"]').getAttribute('aria-checked'), note: /معطّل/.test(document.getElementById('app').innerText), mode: Content.ex('a1e4').mode, row: (() => { UIState.adminGrp = 'g_axes'; UIState.openAcc.add('a1'); App.render(); const r = document.querySelector('.ex-row [data-id="a1e4"]'); return r ? r.closest('.ex-row').querySelector('.tag.fmt').textContent : ''; })() }));
    ok('يتحدث المفتاح والتلميح', R.groups.after.aria === 'false' && R.groups.after.note && R.groups.after.mode === 'individual'); ok('صف التمرين في اللوحة يعرض «فردي»', /فردي/.test(R.groups.after.row));
    // المحرر يحتفظ بالنوع المخزَّن (لا يحفظ «فردي» بالخطأ)
    R.groups.editor = await A.p.evaluate(() => { Router.go('exEdit', { id: 'a1e4' }); return document.getElementById('exMode') ? { v: document.getElementById('exMode').value, dis: document.getElementById('exMode').disabled } : null; }); await A.p.waitForTimeout(300);
    R.groups.editor = await A.p.evaluate(() => { const m = document.getElementById('exMode'); return m ? { v: m.value, dis: m.disabled } : null; }); ok('المحرر يعرض النوع المخزَّن (جماعي)', R.groups.editor && R.groups.editor.v === 'group');
    await A.p.evaluate(() => { UIState.adminGrp = 'g_users'; UIState.openDrop.add('groups'); Router.go('admin'); }); await A.p.waitForTimeout(300);
    await A.p.click('[data-act="groups-toggle"]'); await A.p.waitForTimeout(500); ok('إعادة التفعيل تعيد الجماعي', (await S(A.p, 'settings/groups/enabled')) == null && (await A.p.evaluate(() => Content.ex('a1e4').mode)) === 'group');
    await A.done();
  }
  ok('بلا أخطاء صفحة', !allErrs.length); ok('بلا اتصال حقيقي', !realNet);
  R.errs = allErrs; R.fails = fails; console.log(JSON.stringify(R, null, 1)); await browser.close(); process.exit(fails.length ? 1 : 0);
})();

// اختبارات إصلاحات المراجعة الشاملة — محاكاة Firebase بقواعد الملف الفعلي، دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NOW = Date.now();
const SEED = () => ({
  admins: { adm1: true },
  users: { u1: { name: 'سارة', member: 1, ts: 1, group: 3, gkey: 'g3' }, u2: { name: 'علي', member: 2, ts: 1, group: 2, gkey: 'g2' }, uOld: { name: 'قديم', member: 3, ts: 1 } },
  secrets: { u1: 'ABCDEF', u2: 'GHJKLM' }, stats: { registered: 3 },
  posts: {
    a2e1: { g2: { text: 'إجابة المجموعة', name: 'سارة', by: 'u1', group: 2, members: { u1: true, u2: true }, ts: 1 } },
    a1e3: { u2: { text: 'إجابة علي', name: 'علي', uid: 'u2', ts: 1 } },
    survey: { u1: { ratings: { 0: 5 }, nps: 9, text: 'رائع', name: 'سارة', uid: 'u1', ts: 1, likes: { u2: true } }, admin: { ratings: { 0: 1 }, nps: 0, name: 'الإدارة', uid: 'admin', ts: 1 } },
    a8e5: { admin: { state: { alloc: { meta: 1000 } }, metric: 1, summary: 'x', name: 'الإدارة', uid: 'admin', ts: 1 }, g1: { state: { alloc: { google: 2000 } }, metric: 2, summary: 'y', name: 'علي', by: 'u2', group: 1, ts: 1 } },
    a1e1: { admin: { answers: [0, 0], name: 'الإدارة', uid: 'admin', ts: 1 }, u2: { answers: [1, 1], name: 'علي', uid: 'u2', ts: 1 } }
  },
  lab: { answers: { g3: { s1: { text: 'مخرج', name: 'سارة', uid: 'u1', ts: 1 } } }, timers: { g3: { start: 1, pausedTotal: 0, by: 'u1' } } },
  storyLikes: { st1: { likes: { u1: true } } }, reveal: { a1e1: true },
  presence: { a1e3: { s: { n: '', u: '', g: 0, ts: NOW } } }, invite: { id: 'i', ex: 'a1e3', ts: NOW }, removed: { ex: { a2e2: 1 } }
});
const ME1 = { uid: 'u1', name: 'سارة', member: 1, ts: 1, code: 'ABCDEF', group: 3 };
const fails = []; const ok = (k, v) => { if (!v) fails.push(k); return v; };
(async () => {
  const b = await chromium.launch(); const R = {};
  async function open(o = {}) {
    const ctx = await b.newContext({ acceptDownloads: true }); const p = await ctx.newPage(); const errs = []; const net = { real: 0 };
    p.on('pageerror', e => errs.push(e.message));
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
    await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
    await p.addInitScript(([d, r, x, me, raw]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 60 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' };
      if (me) { localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); }
      localStorage.setItem('qbd:ec_inv_seen', 'i'); if (raw) Object.keys(raw).forEach(k => localStorage.setItem(k, raw[k])); }, [o.data || SEED(), RULES, o.cfg, o.me, o.raw]);
    await p.goto(U + '#/home'); await p.waitForTimeout(900);
    if (o.admin) { await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
    return { ctx, p, errs, net };
  }
  const S = (p, pth) => p.evaluate(pth => { let n = window.__mock.server; for (const s of pth.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, pth);
  const tryW = (p, src) => p.evaluate(async src => { try { await (new Function('return (' + src + ')()'))(); return 'allowed'; } catch (e) { return 'denied'; } }, src);
  const confirmOk = async p => { await p.waitForSelector('.modal [data-ok]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(700); };
  const allErrs = []; let realNet = 0;

  { // 1) مفاتيح التخزين بادئة المشروع: هوية مشروع آخر على النطاق نفسه لا تُقرأ، ولا كوكي للهوية
    const other = JSON.stringify({ uid: 'uPhone', name: 'متدرب الجوال', member: 9, ts: 1 });
    const { ctx, p, errs, net } = await open({ raw: { ec_me: other, 'phone:ec_me': other }, cfg: {} });
    R.ns = await p.evaluate(() => ({ me: Me.data, cookie: /ec_me=/.test(document.cookie), onLanding: App.onLanding }));
    ok('هوية مشروع آخر لا تُعدّ دخولًا', !R.ns.me && R.ns.onLanding);
    await p.evaluate(() => Me.save({ uid: 'uX', name: 'س', member: 1, ts: 1 }));
    R.ns.saved = await p.evaluate(() => ({ ns: !!localStorage.getItem('qbd:ec_me'), bare: localStorage.getItem('ec_me'), cookie: /ec_me=/.test(document.cookie) }));
    ok('الحفظ ببادئة qbd: ولا يمس مفاتيح المشاريع الأخرى ولا الكوكيز', R.ns.saved.ns && R.ns.saved.bare === other && !R.ns.saved.cookie);
    allErrs.push(...errs); realNet += net.real; await ctx.close();
  }
  { // 2) قراءة بيانات المتدربين تتطلب جلسة، والمحتوى العام مقروء
    const { ctx, p, errs, net } = await open({ me: ME1 });
    R.read = await p.evaluate(async () => { const noAuth = async path => { const keep = window.__mock.authUser; window.__mock.authUser = null; try { await firebase.database().ref(path).once('value'); return 'readable'; } catch (e) { return 'denied'; } finally { window.__mock.authUser = keep; } };
      const out = {}; for (const k of ['users', 'posts', 'assess', 'attendance', 'checkins', 'lab', 'assign', 'storyLikes']) out[k] = await noAuth(k); out.content = await noAuth('content'); out.withAuth = await firebase.database().ref('users').once('value').then(() => 'readable', () => 'denied'); return out; });
    ok('بيانات المتدربين غير مقروءة دون جلسة', ['users', 'posts', 'assess', 'attendance', 'checkins', 'lab', 'assign', 'storyLikes'].every(k => R.read[k] === 'denied'));
    ok('المحتوى العام مقروء، والبيانات مقروءة بالجلسة', R.read.content === 'readable' && R.read.withAuth === 'readable');
    // 3) حدود الكتابة في المشاركات وتزوير الإعجابات والأعضاء
    R.bounds = {
      evilField: await tryW(p, "() => DB.update('posts/a1e3/u1', { text: 'x', evil: 'y' }, { quiet: true })"),
      deepState: await tryW(p, "() => DB.update('posts/a2e5/u1', { state: { a: { b: { c: 1 } } } }, { quiet: true })"),
      longKey: await tryW(p, "() => DB.update('posts/a2e5/u1', { state: { ['k'.repeat(40)]: 1 } }, { quiet: true })"),
      hugeEx: await tryW(p, "() => DB.update('posts/' + 'x'.repeat(80) + '/u1', { text: 'x' }, { quiet: true })"),
      goodState: await tryW(p, "() => DB.update('posts/a2e5/u1', { state: { name: 'متجري', pay: { card: true } }, metric: 40, summary: 's', name: 'سارة', uid: 'u1', ts: 1 }, { quiet: true })"),
      forgeLike: await tryW(p, "() => DB.set('posts/a2e5/u1/likes/u2', true, { quiet: true })"),
      ownLike: await tryW(p, "() => DB.set('posts/a1e3/u2/likes/u1', true, { quiet: true })"),
      forgeMember: await tryW(p, "() => DB.update('posts/a2e1/g3', { text: 'x', name: 'سارة', by: 'u1', group: 3, 'members/u1': true, 'members/u2': true, ts: 1 }, { quiet: true })"),
      surveyEdit: await tryW(p, "() => DB.update('posts/survey/u1', { ratings: { 0: 4 }, nps: 8, text: 'تعديل', name: 'سارة', uid: 'u1', ts: 2 }, { quiet: true })")
    };
    ok('حقل غير معروف / عمق زائد / مفتاح طويل / معرّف تمرين طويل: مرفوض', ['evilField', 'deepState', 'longKey', 'hugeEx'].every(k => R.bounds[k] === 'denied'));
    ok('الحالة السليمة للمحاكاة مسموحة', R.bounds.goodState === 'allowed');
    ok('تزوير إعجاب أو عضو مرفوض، والإعجاب الشخصي مسموح', R.bounds.forgeLike === 'denied' && R.bounds.forgeMember === 'denied' && R.bounds.ownLike === 'allowed');
    ok('تعديل التقييم لا يمس إعجابات الآخرين', R.bounds.surveyEdit === 'allowed' && (await S(p, 'posts/survey/u1/likes/u2')) === true);
    // 4) باب المطالبة القديمة مغلق، والربط يحتاج جلسة
    R.legacy = { claimOld: await tryW(p, "() => DB.set('devices/uOld/' + authUid(), 'legacy', { quiet: true })"), noAuthLink: await p.evaluate(async () => { const keep = AUTH.user; AUTH.user = null; const r = await linkDevice('uNew', 'ABCDEF'); AUTH.user = keep; return r; }) };
    ok('لا مطالبة بحساب قديم بلا رمز', R.legacy.claimOld === 'denied'); ok('بلا جلسة آمنة لا ربط للجهاز', R.legacy.noAuthLink === false);
    // 5) «احذف بياناتي» بعد تغيير المجموعة
    const del = p.evaluate(() => deleteMyData()); await confirmOk(p); await del;
    const t = await p.evaluate(() => JSON.parse(JSON.stringify(window.__mock.server)));
    const at = pth => pth.split('/').reduce((n, s) => (n == null ? null : n[s]), t);
    R.del = { userGone: !at('users/u1'), groupName: at('posts/a2e1/g2/name'), groupBy: at('posts/a2e1/g2/by'), groupKept: at('posts/a2e1/g2/text'), member: at('posts/a2e1/g2/members/u1'), labName: at('lab/answers/g3/s1/name'), labUid: at('lab/answers/g3/s1/uid'), labKept: at('lab/answers/g3/s1/text'), timerBy: at('lab/timers/g3/by'), me: await p.evaluate(() => !!Me.data) };
    ok('الحذف ينجح بعد تغيير المجموعة', R.del.userGone && !R.del.me);
    ok('إجابة المجموعة باقية بلا اسمه ولا معرّفه', R.del.groupKept && R.del.groupName === '' && R.del.groupBy == null && R.del.member == null);
    ok('مخرجات المختبر باقية بلا اسمه ولا معرّفه', R.del.labKept && R.del.labName === '' && R.del.labUid == null && R.del.timerBy == null);
    allErrs.push(...errs); realNet += net.real; await ctx.close();
  }
  { // 6) المدرب: النسخة الكاملة، والإحصاءات دون «الإدارة»، والرمز من 6 أرقام، وإعادة الضبط والأرشفة الكاملتان
    let { ctx, p, errs, net } = await open({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
    const dl = p.waitForEvent('download', { timeout: 5000 }).catch(() => null); await p.evaluate(() => exportAll()); const d = await dl; await p.waitForTimeout(300);
    let full = null; if (d) full = JSON.parse(fs.readFileSync(await d.path(), 'utf8'));
    R.export = full && { skipped: full.skipped, has: ['users', 'posts', 'secrets', 'removed', 'invite'].filter(k => full.data[k] != null) };
    ok('النسخة الكاملة تُنزَّل كاملة', full && !full.skipped.length && R.export.has.length === 5);
    R.stats = await p.evaluate(() => { const sv = SurveyStats.of(Store.posts.survey, Content.survey({ all: true })); const r = reportData(); Router.go('ex', { id: 'survey' }); return { n: sv.n, nps: sv.nps, budgetGroups: r.budget.map(x => x.g), mcq: mcqStats(Content.ex('a1e1'))[0].total }; });
    await p.waitForTimeout(300); R.stats.surveyForm = await p.evaluate(() => !!document.querySelector('[data-act="sv-save"]'));
    ok('تقييم البرنامج دون «الإدارة»', R.stats.n === 1 && R.stats.nps === 100 && !R.stats.surveyForm);
    ok('تقرير الميزانية بلا «مجموعة NaN»', R.stats.budgetGroups.length === 1 && R.stats.budgetGroups[0] === 1);
    ok('نسب التصويت دون «الإدارة»', R.stats.mcq === 1);
    await p.evaluate(() => { UIState.adminGrp = 'g_users'; Router.go('admin'); }); await p.waitForTimeout(200);
    await p.evaluate(() => DB.set('secure/attcodes/d1/code', '0')); await p.evaluate(() => document.dispatchEvent(new Event('noop')));
    R.attCode = await p.evaluate(async () => { const b = document.createElement('button'); b.setAttribute('data-act', 'att-code'); b.setAttribute('data-d', '1'); document.getElementById('app').appendChild(b); b.click(); await new Promise(r => setTimeout(r, 300)); b.remove(); return window.__mock.server.secure.attcodes.d1.code; });
    ok('رمز الحضور 6 أرقام', /^\d{6}$/.test(R.attCode));
    const g = p.evaluate(() => globalReset()); await confirmOk(p); await g; await p.waitForTimeout(500);
    R.reset = await p.evaluate(() => { const s = window.__mock.server; return { users: !!s.users, storyLikes: !!s.storyLikes, reveal: !!s.reveal, registered: (s.stats || {}).registered, presence: !!s.presence, invite: !!s.invite, removedKept: !!s.removed, backup: Object.keys(s.backups || {}).length }; });
    ok('إعادة الضبط الشاملة كاملة', !R.reset.users && !R.reset.storyLikes && !R.reset.reveal && R.reset.registered === 0 && !R.reset.presence && !R.reset.invite && R.reset.removedKept && R.reset.backup === 1);
    allErrs.push(...errs); realNet += net.real; await ctx.close();
    ({ ctx, p, errs, net } = await open({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } }));
    const c = p.evaluate(() => closeCohort()); await confirmOk(p); await c; await p.waitForTimeout(500);
    R.cohort = await p.evaluate(() => { const s = window.__mock.server; return { users: !!s.users, presence: !!s.presence, invite: !!s.invite, archived: Object.keys(s.cohorts || {}).length }; });
    ok('أرشفة الدفعة تنظّف الحضور الحي والدعوة', !R.cohort.users && !R.cohort.presence && !R.cohort.invite && R.cohort.archived === 1);
    allErrs.push(...errs); realNet += net.real; await ctx.close();
  }
  { // 7) النسخة الاحتياطية الفاشلة قبل إعادة الضبط توقف المسح حتى يوافق المدرب صراحةً
    const { ctx, p, errs, net } = await open({ admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } });
    await p.evaluate(() => { window.autoBackup = async () => false; });
    const g = p.evaluate(() => globalReset()); await confirmOk(p); await p.waitForSelector('.modal [data-no]'); R.backupWarn = await p.$eval('.modal', e => e.innerText.slice(0, 60)); await p.click('.modal [data-no]'); await g; await p.waitForTimeout(300);
    ok('فشل النسخة يوقف المسح', /النسخة الاحتياطية/.test(R.backupWarn) && !!(await S(p, 'users/u1')));
    allErrs.push(...errs); realNet += net.real; await ctx.close();
  }
  ok('بلا أخطاء صفحة', !allErrs.length); ok('بلا اتصال حقيقي', !realNet);
  R.errs = allErrs; R.fails = fails; console.log(JSON.stringify(R, null, 1)); await b.close(); process.exit(fails.length ? 1 : 0);
})();

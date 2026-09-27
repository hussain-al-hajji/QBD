// اختبارات أمان النموذج الجديد على محاكاة Firebase تطبّق database.rules.json فعليًا — دون أي اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SEED = {
  admins: { adm1: true },
  site: { home: { heroTitle: 'عنوان' } },
  settings: { attendance: { codes: { d1: { open: true, code: '4321' } } }, monitor: { enabled: true, token: 'oldtok' } },
  users: { uL: { name: 'قديم', role: 'مؤسس', member: 1001, ts: 1, f: { email: 'legacy@x.com', phone: '5550000' }, consent: { privacy: 1 } } },
  posts: { a1e1: { uL: { text: 'إجابة قديمة', name: 'قديم', ts: 1 } } },
  leads: { uL: { programs: ['تمويل'], contact: '5550000' } },
  meta: { memberCounter: 1001 }, stats: { registered: 1 }
};
let browser; const master = { tree: null }; const pages = [];
async function visitor(o = {}) { // كل زائر في سياق مستقل = متصفح/جهاز مستقل بجلسة مجهولة خاصة
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.exposeBinding('__srvPush', (src, json) => { master.tree = JSON.parse(json); pages.forEach(o => { if (o !== src.page) o.evaluate(j => window.__mock && __mock.replace(j), json).catch(() => {}); }); });
  pages.push(p);
  await ctx.route(/firebaseio\.com|identitytoolkit|securetoken|googleapis\.com\/identity/, r => { net.real++; return r.abort(); });
  await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
  await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(([rules, server, x]) => {
    window.__MOCKCFG = Object.assign({ data: server, rules, delayFirst: 150, authUsers: { 'trainer@qdb.test': { pass: 'Secret#123', uid: 'adm1' } } }, x || {});
  }, [RULES, o.server || master.tree || SEED, o.cfg]);
  if (o.me) await p.addInitScript(me => { if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('ec_me', JSON.stringify(me)); sessionStorage.setItem('__seeded', '1'); } }, o.me);
  await p.goto(U + (o.hash || '')); await p.waitForTimeout(o.wait || 900);
  return { ctx, p, net, errs };
}
const server = p => p.evaluate(() => JSON.parse(JSON.stringify(window.__mock.server)));
const at = (t, pth) => pth.split('/').reduce((n, s) => (n == null ? null : n[s]), t);
const tryW = (p, src) => p.evaluate(async src => { try { await (new Function('return (' + src + ')()'))(); return 'allowed'; } catch (e) { return 'denied'; } }, src);
const tryR = (p, pth) => p.evaluate(async pth => { try { await DB.get(pth); return 'readable'; } catch (e) { return 'denied'; } }, pth);
async function register(p, name) { await p.click('[data-act="open-login"]'); await p.fill('#reg_name', name); await p.fill('#reg_role', 'مؤسس'); await p.check('#regConsent'); await p.click('.modal [data-act="register"]'); await p.waitForTimeout(700); const me = await p.evaluate(() => Me.data); const c = await p.$('[data-close]'); if (c) await c.click(); return me; }
(async () => {
  browser = await chromium.launch(); const R = {};
  // ---------- المتدرب أ: تسجيل ثم أنشطة ----------
  const A = await visitor(); const meA = await register(A.p, 'متدرب أ'); if (!meA) { console.log('REG FAIL', await A.p.evaluate(() => ({ d: __mock.denied, m: [...document.querySelectorAll('.modal')].map(x => x.innerText.slice(-120)) }))); process.exit(1); }
  let t = await server(A.p);
  R.register = { uid: meA.uid, hasCode: !!meA.code, member: meA.member, publicHasNoPII: !at(t, 'users/' + meA.uid + '/f') && !at(t, 'users/' + meA.uid + '/consent'), privateStored: !!at(t, 'private/' + meA.uid + '/consent'), secretStored: at(t, 'secrets/' + meA.uid) === meA.code, deviceLinked: !!at(t, 'devices/' + meA.uid), denied: await A.p.evaluate(() => __mock.denied) };
  await A.p.evaluate(async () => { const uid = Me.uid(); await DB.update('posts/a1e1/' + uid, { text: 'إجابة أ', name: 'أ', uid, ts: DB.now() }); await DB.set('posts/a1e1/uL/likes/' + uid, true); await DB.set('assess/pre/' + uid, { answers: [1], done: true, ts: DB.now() }); await DB.set('leads/' + uid, { programs: ['تمويل'], contact: '555' }); await DB.set('followups/d30/' + uid, { actions: 'x' }); Me.setGroup(2); await new Promise(r => setTimeout(r, 200)); await DB.set('lab/answers/g2/s1', { text: 'x', name: 'أ', uid, ts: DB.now() }); await DB.set('lab/timers/g2', { start: DB.now(), pausedTotal: 0, by: uid }); await DB.update('posts/a2e1/g2', { text: 'إجابة مجموعة 2', by: uid, group: 2, ['members/' + uid]: true, ts: DB.now() }); });
  await A.p.fill('#checkin1', '0000').catch(() => {});
  const wrong = await A.p.evaluate(async () => { try { await DB.set('checkins/d1/' + Me.uid(), { code: '0000', ts: DB.now() }, { quiet: true }); return 'accepted'; } catch (e) { return 'rejected'; } });
  R.attendance = { wrongCode: wrong, hoursBefore: await A.p.evaluate(() => Attend.hoursOf(Me.uid(), 1)), codeVisibleToTrainee: await A.p.evaluate(() => JSON.stringify(Attend.cfg().codes)) };
  R.traineeA = { denied: await A.p.evaluate(() => __mock.denied), errs: A.errs };
  // ---------- المتدرب ب: محاولات عبث بسجل أ ----------
  const B = await visitor(); const meB = await register(B.p, 'متدرب ب'); const a = meA.uid;
  R.traineeB_cannot = {
    editOthersProfile: await tryW(B.p, `() => DB.set('users/${a}/name', 'مخترق')`),
    editOthersAnswer: await tryW(B.p, `() => DB.set('posts/a1e1/${a}/text', 'مزوّر')`),
    deleteOthersAssess: await tryW(B.p, `() => DB.remove('assess/pre/${a}')`),
    selfAttendanceHours: await tryW(B.p, `() => DB.set('attendance/' + Me.uid() + '/d1', 4)`),
    checkinWrongCode: await tryW(B.p, `() => DB.set('checkins/d1/' + Me.uid(), { code: '1111' }, { quiet: true })`),
    checkinForOther: await tryW(B.p, `() => DB.set('checkins/d1/${a}', { code: '4321' }, { quiet: true })`),
    memberCounterJump: await tryW(B.p, `() => DB.set('meta/memberCounter', 99999)`),
    statsJump: await tryW(B.p, `() => DB.set('stats/registered', 500)`),
    claimOthersNoCode: await tryW(B.p, `() => DB.set('devices/${a}/' + firebase.auth().currentUser?.uid, 'legacy', { quiet: true })`),
    claimOthersWrongCode: await tryW(B.p, `() => DB.set('devices/${a}/' + __mock.authUser.uid, 'ZZZZZZ', { quiet: true })`),
    editSite: await tryW(B.p, `() => DB.set('site/home/heroTitle', 'x')`),
    otherGroupAnswer: await tryW(B.p, `() => DB.update('posts/a2e1/g2', { text: 'تخريب', by: Me.uid(), group: 2 })`),
    otherGroupAnswerSpoofBy: await tryW(B.p, `() => DB.update('posts/a2e1/g2', { text: 'تخريب', by: '${meA.uid}', group: 2 })`),
    otherGroupLab: await tryW(B.p, `() => DB.set('lab/answers/g2/s1', { text: 'تخريب', uid: Me.uid() })`),
    otherGroupTimer: await tryW(B.p, `() => DB.set('lab/timers/g2', { by: Me.uid(), resetAt: 1 })`),
    hugeAnswer: await tryW(B.p, `() => DB.set('posts/a1e3/' + Me.uid(), { text: 'x'.repeat(200000), uid: Me.uid() })`),
    hugeName: await tryW(B.p, `() => DB.set('users/' + Me.uid() + '/name', 'x'.repeat(5000))`),
    junkFieldOnProfile: await tryW(B.p, `() => DB.set('users/' + Me.uid() + '/blob', 'x'.repeat(100))`),
    makeAdmin: await tryW(B.p, `() => DB.set('admins/' + __mock.authUser.uid, true)`)
  };
  R.traineeB_ownGroupWorks = await tryW(B.p, `async () => { Me.setGroup(3); await new Promise(r => setTimeout(r, 200)); await DB.update('posts/a2e1/g3', { text: 'مجموعتي', by: Me.uid(), group: 3 }); await DB.set('lab/answers/g3/s1', { text: 'ok', uid: Me.uid(), name: 'ب' }); }`);
  R.traineeB_cannotRead = { othersPrivate: await tryR(B.p, 'private/' + a), allLeads: await tryR(B.p, 'leads'), othersLead: await tryR(B.p, 'leads/' + a), othersSecret: await tryR(B.p, 'secrets/' + a), secure: await tryR(B.p, 'secure'), backups: await tryR(B.p, 'backups'), monitorList: await tryR(B.p, 'monitorData') };
  R.traineeB_canRead = { ownPrivate: await tryR(B.p, 'private/' + meB.uid), publicUsers: await tryR(B.p, 'users'), posts: await tryR(B.p, 'posts') };
  t = await server(B.p); R.traineeB_effect = { aNameIntact: at(t, 'users/' + a + '/name') === 'متدرب أ', aAnswerIntact: at(t, 'posts/a1e1/' + a + '/text') === 'إجابة أ', groupAnswerIntact: at(t, 'posts/a2e1/g2/text') === 'إجابة مجموعة 2', errs: B.errs };
  // ---------- أ من جهاز ثانٍ برقم العضوية ورمز الدخول ----------
  const A2 = await visitor();
  await A2.p.click('[data-act="open-login"]'); await A2.p.click('.modal [data-act="member-login"]'); await A2.p.waitForTimeout(200);
  await A2.p.fill('#mlNum', String(meA.member)); await A2.p.fill('#mlCode', 'WRONG1'); await A2.p.click('.modal [data-ok]'); await A2.p.waitForTimeout(400);
  const wrongMsg = await A2.p.$eval('#mlErr', e => e.textContent);
  await A2.p.fill('#mlCode', meA.code.toLowerCase()); await A2.p.click('.modal [data-ok]'); await A2.p.waitForTimeout(600);
  R.secondDevice = { wrongCodeMsg: wrongMsg, loggedIn: await A2.p.evaluate(() => Me.uid()) === a, canEditOwn: await tryW(A2.p, `() => DB.set('users/${a}/role', 'مدير')`), seesOwnLead: await A2.p.evaluate(() => !!(Store.leads || {})[Me.uid()]) };
  // ---------- حذف بياناتي ----------
  const del = A2.p.evaluate(() => deleteMyData()); await A2.p.waitForSelector('.modal [data-ok]'); await A2.p.click('.modal [data-ok]'); await del; await A2.p.waitForTimeout(500);
  t = await server(A2.p);
  R.deleteMyData = { gone: ['users', 'private', 'secrets', 'devices', 'leads', 'followups/d30'].every(k => !at(t, k + '/' + a)) && !at(t, 'posts/a1e1/' + a) && !at(t, 'assess/pre/' + a), deniedTail: (await A2.p.evaluate(() => __mock.denied)).slice(-3) };
  // ---------- جهاز قديم لمتدرب مسجّل قبل التحديث (بلا رمز) ----------
  const L = await visitor({ me: { uid: 'uL', name: 'قديم', member: 1001, ts: 5 } }); await L.p.waitForTimeout(600);
  t = await server(L.p);
  R.legacy = { stillLoggedIn: await L.p.evaluate(() => Me.uid()) === 'uL', gotCode: !!(await L.p.evaluate(() => Me.data && Me.data.code)), secretSet: !!at(t, 'secrets/uL'), canEditOwn: await tryW(L.p, `() => DB.set('users/uL/role', 'x')`) };
  // ---------- المدرب: ترحيل البيانات، القراءة الكاملة، لوحة المشرف ----------
  const T = await visitor({ cfg: { googleUser: { uid: 'adm1', email: 't@gmail.com' } } });
  await T.p.click('[data-act="admin-enter"]'); await T.p.waitForTimeout(200); await T.p.click('[data-google]'); await T.p.waitForTimeout(2600);
  t = await server(T.p);
  R.admin = { inAdmin: await T.p.evaluate(() => Router.cur.view === 'admin' && Admin.ok()), migrated: at(t, 'meta/schema') === 3, legacyPIIMoved: !at(t, 'users/uL/f') && at(t, 'private/uL/f/email') === 'legacy@x.com', codeMovedToSecure: at(t, 'secure/attcodes/d1/code') === '4321' && at(t, 'settings/attendance/codes/d1/code') == null, monitorMoved: at(t, 'secure/monitor/token') === 'oldtok' && !at(t, 'settings/monitor'), readsLeads: await tryR(T.p, 'leads'), readsPrivate: await tryR(T.p, 'private') };
  // استعادة رمز الدخول من لوحة المدرب: يرى الرموز، ويولّد رمزًا جديدًا يلغي الأجهزة المرتبطة
  R.codeRecovery = { seesBcode: await T.p.evaluate(b => (Store.secrets || {})[b], meB.uid) === meB.code };
  await T.p.evaluate(() => { UIState.adminGrp = 'g_users'; UIState.openDrop.add('users'); App.render(); });
  await T.p.waitForTimeout(300); await T.p.click('[data-act="code-new"][data-uid="' + meB.uid + '"]'); await T.p.waitForSelector('.modal [data-ok]'); await T.p.click('.modal [data-ok]'); await T.p.waitForTimeout(500);
  t = await server(T.p); R.codeRecovery.newCode = at(t, 'secrets/' + meB.uid) && at(t, 'secrets/' + meB.uid) !== meB.code; R.codeRecovery.devicesCleared = !at(t, 'devices/' + meB.uid);
  R.codeRecovery.oldDeviceNowDenied = await tryW(B.p, `() => DB.set('users/' + Me.uid() + '/role', 'x')`);
  meB.code = at(t, 'secrets/' + meB.uid); await B.p.evaluate(([c, tree]) => { Me.save(Object.assign({}, Me.data, { code: c })); sessionStorage.setItem('__mock_server_boot', JSON.stringify(tree)); }, [meB.code, master.tree]); await B.p.reload(); await B.p.waitForTimeout(1200);
  R.codeRecovery.relinkedWithNewCode = await tryW(B.p, `() => DB.set('users/' + Me.uid() + '/role', 'y')`);
  await T.p.evaluate(() => Monitor.publish(true)); await T.p.waitForTimeout(400); t = await server(T.p);
  R.admin.monitorPublished = !!at(t, 'monitorData/oldtok/html');
  // المتدرب ب يسجّل حضوره بالرمز الصحيح (بعد نقل الرمز إلى secure) — والرمز لا يظهر في متصفحه
  R.attendance.rightCode = await tryW(B.p, `() => DB.set('checkins/d1/' + Me.uid(), { code: '4321', ts: DB.now() }, { quiet: true })`);
  await B.p.waitForTimeout(300); R.attendance.hoursAfter = await B.p.evaluate(() => Attend.hoursOf(Me.uid(), 1)); R.attendance.codeVisibleToTraineeAfterMigration = await B.p.evaluate(() => JSON.stringify(Attend.cfg().codes));
  // ---------- المشرف: رابط صحيح وخاطئ ----------
  const S = await visitor({ server: t, hash: '#v=monitor&id=oldtok', wait: 1200 });
  R.supervisor = { sees: /لوحة متابعة|آخر تحديث/.test(await S.p.evaluate(() => document.body.innerText)) };
  await S.p.evaluate(() => { location.hash = '#v=monitor&id=bad'; }); await S.p.waitForTimeout(700);
  R.supervisor.badTokenBlocked = /غير صالح/.test(await S.p.evaluate(() => document.body.innerText));
  R.supervisor.cannotReadPrivate = await tryR(S.p, 'private');
  R.realNet = [A, B, A2, L, T, S].reduce((n, x) => n + x.net.real, 0);
  console.log(JSON.stringify(R, null, 1)); await browser.close();
})();

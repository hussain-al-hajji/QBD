// اختبار دخول المدرب (Firebase Authentication) وقواعد القاعدة على محاكاة Firebase — دون أي اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const DATA = { admins: { adm1: true }, site: { home: { heroTitle: 'عنوان' } }, users: { u1: { name: 'سارة', member: 1001, ts: 1 } }, meta: { memberCounter: 1001 }, settings: { attendance: { open: { 1: true } } } };
const USERS = { 'trainer@qdb.test': { pass: 'Secret#123', uid: 'adm1' }, 'someone@qdb.test': { pass: 'pw123456', uid: 'u9' } };
async function open(b, hash, extra) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 850 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
  await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
  await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(([d, r, u, x]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, authUsers: u, delayFirst: 200 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'test-key', authDomain: 'test.firebaseapp.com', projectId: 'test', appCheckSiteKey: 'site-key-test' }; }, [DATA, RULES, USERS, extra]);
  await p.goto(U + (hash || '')); await p.waitForTimeout(900);
  return { ctx, p, net, errs };
}
const M = (p, k) => p.evaluate(k => window.__mock[k], k);
const S = (p, pth) => p.evaluate(pth => { let n = window.__mock.server; for (const s of pth.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, pth);
const tryW = (p, fnSrc) => p.evaluate(async src => { try { await (new Function('return (' + src + ')()'))(); return 'allowed'; } catch (e) { return 'denied'; } }, fnSrc);
(async () => {
  const b = await chromium.launch(); const R = {};
  { // 1) مسار المتدرب كاملًا دون حساب
    const { ctx, p, net, errs } = await open(b);
    await p.click('[data-act="open-login"]'); await p.fill('#reg_name', 'خالد'); await p.fill('#reg_role', 'مؤسس'); await p.check('#regConsent'); await p.click('.modal [data-act="register"]'); await p.waitForTimeout(600);
    const me = await p.evaluate(() => Me.uid());
    await p.evaluate(async () => { const uid = Me.uid(); const g = 2; Me.setGroup(g); for (let i = 0; i < 40 && !((Store.users || {})[uid] || {}).gkey; i++) await new Promise(r => setTimeout(r, 50));
      await DB.update('posts/a1e1/' + uid, { text: 'إجابتي', name: 'خالد', uid, ts: DB.now() });
      await DB.set('posts/a1e1/u1/likes/' + uid, true);
      await DB.set('storyLikes/st1/likes/' + uid, true);
      await DB.set('assess/pre/' + uid, { answers: [0, 1], done: true, ts: DB.now() });
      // الحضور صار عبر checkins برمز يتحقق منه الخادم (يُختبر في security-scenarios.js)
      await DB.set('lab/timers/g' + g, { start: DB.now(), pausedTotal: 0, by: uid }); await DB.set('lab/answers/g' + g + '/s1', { text: 'x', name: 'خالد', uid, ts: DB.now() });
      await DB.set('leads/' + uid, { programs: ['تمويل'] }); await DB.set('followups/d30/' + uid, { actions: 'x' });
    });
    await p.waitForTimeout(400);
    R.trainee = { registered: !!(await S(p, 'users/' + me)), member: (await S(p, 'users/' + me) || {}).member, denied: await M(p, 'denied') || [] };
    R.traineeCannot = {
      hideSection: await tryW(p, "() => DB.set('visibility/home_tools', false)"),
      editSite: await tryW(p, "() => DB.set('site/home/heroTitle', 'مخترق')"),
      wipeUsers: await tryW(p, "() => DB.update('', { users: null }, { allowTopLevel: true })"),
      wipePosts: await tryW(p, "() => DB.update('', { posts: null }, { allowTopLevel: true })"),
      makeSelfAdmin: await tryW(p, "() => DB.set('admins/' + Me.uid(), true)"),
      writeBackup: await tryW(p, "() => DB.set('backups/2099-01-01', { x: 1 })")
    };
    // حذف بياناتي (حق المتدرب) ما زال يعمل
    const del = p.evaluate(() => deleteMyData()); await p.waitForSelector('.modal [data-ok]'); await p.click('.modal [data-ok]'); await del; await p.waitForTimeout(400);
    R.deleteMyData = { userGone: !(await S(p, 'users/' + me)), postGone: !(await S(p, 'posts/a1e1/' + me)), deniedNew: (await M(p, 'denied') || []).slice(-2) };
    R.trainee.siteUnchanged = (await S(p, 'site/home/heroTitle')) === 'عنوان'; R.trainee.realNet = net.real; R.trainee.errs = errs;
    await ctx.close();
  }
  { // 2) دخول المدرب
    const { ctx, p, net } = await open(b);
    await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(300);
    R.login = { emailForm: !!(await p.$('#alEmail')), noPasscodePrompt: !(await p.$('.modal [data-in][type="password"]:not(#alPass)')) };
    R.login.googleBtn = !!(await p.$('[data-google]')); await p.click('.al-email summary');
    await p.fill('#alEmail', 'trainer@qdb.test'); await p.fill('#alPass', 'wrong'); await p.click('.modal [data-ok]'); await p.waitForTimeout(300);
    R.login.wrongPassMsg = await p.$eval('#alErr', e => e.textContent);
    await p.fill('#alEmail', 'someone@qdb.test'); await p.fill('#alPass', 'pw123456'); await p.click('.modal [data-ok]'); await p.waitForTimeout(400);
    R.login.notAdminMsg = (await p.$eval('#alErr', e => e.textContent)).slice(0, 60); R.login.notAdminInAdmin = await p.evaluate(() => Admin.ok());
    await p.fill('#alEmail', 'trainer@qdb.test'); await p.fill('#alPass', 'Secret#123'); await p.click('.modal [data-ok]'); await p.waitForTimeout(700);
    R.login.adminHomeFirst = await p.evaluate(() => Router.cur.view === 'home' && Admin.ok() && !!document.querySelector('.topbar [data-act="admin-panel"]'));
    R.adminCan = { hideSection: await tryW(p, "() => DB.set('visibility/home_tools', false)"), editSite: await tryW(p, "() => DB.set('site/home/heroTitle', 'عنوان جديد')"), backup: await tryW(p, "() => autoBackup(true)") };
    R.adminCan.serverHidden = (await S(p, 'visibility/home_tools')) === false;
    await p.click('[data-act="admin-exit"]'); await p.waitForTimeout(400);
    R.afterLogout = { adminOk: await p.evaluate(() => Admin.ok()), write: await tryW(p, "() => DB.set('visibility/home_tools', null)") };
    R.login.realNet = net.real; await ctx.close();
  }
  { // 3) Google: حساب مدرب وحساب غير مدرب
    let r = await open(b, '', { googleUser: { uid: 'adm1', email: 'trainer@gmail.com' } });
    await r.p.evaluate(() => LoginModal.open()); await r.p.click('.trainer-lock'); await r.p.waitForTimeout(300); await r.p.click('[data-google]'); await r.p.waitForTimeout(600);
    R.appCheckActivatedWith = await r.p.evaluate(() => window.__mock.appCheck);
    R.google = { adminHomeFirst: await r.p.evaluate(() => Router.cur.view === 'home' && Admin.ok() && !!document.querySelector('.topbar [data-act="admin-panel"]')), canHide: await tryW(r.p, "() => DB.set('visibility/home_x', false)") }; await r.ctx.close();
    r = await open(b, '', { googleUser: { uid: 'g777', email: 'stranger@gmail.com' } });
    await r.p.evaluate(() => LoginModal.open()); await r.p.click('.trainer-lock'); await r.p.waitForTimeout(300); await r.p.click('[data-google]'); await r.p.waitForTimeout(600);
    R.google.strangerMsg = (await r.p.$eval('#alErr', e => e.textContent)).replace(/\s+/g, ' ').slice(0, 140); R.google.strangerAdmin = await r.p.evaluate(() => Admin.ok()); await r.ctx.close();
  }
  console.log(JSON.stringify(R, null, 1)); await b.close();
})();

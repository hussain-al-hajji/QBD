// الصفحة التعريفية بعد الدخول + انتهاء الجلسة بعد 72 ساعة من آخر استخدام — على محاكاة Firebase دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const DATA = { admins: { adm1: true }, site: { home: { heroTitle: 'عنوان' } }, meta: { memberCounter: 1000 } };
const H = 3600 * 1000;
(async () => {
  const b = await chromium.launch(); const R = {};
  async function open(x) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 850 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
    await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
    await p.addInitScript(([d, r, x]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 100 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'test-key', authDomain: 'test.firebaseapp.com', projectId: 'test' }; }, [DATA, RULES, x]);
    await p.goto(U); await p.waitForTimeout(800); return { ctx, p, net, errs };
  }
  // يعيد التحميل مع الإبقاء على حالة الخادم المحاكى وضبط وقت آخر استخدام
  const reloadAged = async (p, hours) => { await p.evaluate(h => { sessionStorage.setItem('__mock_server_boot', JSON.stringify(window.__mock.server)); localStorage.setItem('ec_last', String(Date.now() - h * 3600000)); }, hours); await p.reload(); await p.waitForTimeout(1000); };
  const state = p => p.evaluate(() => ({ reg: Me.isReg(), view: Router.cur.view, landing: !!document.querySelector('.lp-hero'), authUid: (AUTH.user || {}).uid || null, admin: Admin.ok() }));
  { // المتدرب
    const { ctx, p, net, errs } = await open();
    await p.click('[data-act="open-login"]'); await p.fill('#reg_name', 'خالد'); await p.fill('#reg_role', 'مؤسس'); await p.check('#regConsent'); await p.click('.modal [data-act="register"]'); await p.waitForTimeout(700);
    for (let i = 0; i < 3 && await p.$('.modal-back'); i++) { await p.click('.modal [data-close]').catch(() => p.keyboard.press('Escape')); await p.waitForTimeout(300); }
    const me = await p.evaluate(() => Me.data);
    R.trainee = { registeredHome: await state(p) };
    R.trainee.shortLabel = await p.$eval('.brand-title', e => e.textContent); await p.click('.brand'); await p.waitForTimeout(500);
    R.trainee.onLanding = await state(p); R.trainee.fullTitleOnLanding = await p.$eval('.brand-title', e => e.textContent); R.trainee.oldBtnGone = !(await p.$('.top-actions [data-go="landing"]')); R.trainee.enterBtn = !!(await p.$('.top-cta[data-act="lp-enter"]')); R.trainee.noLoginBtn = !(await p.$('[data-act="open-login"]'));
    await p.click('.top-cta[data-act="lp-enter"]'); await p.waitForTimeout(400); R.trainee.backHome = await state(p);
    await reloadAged(p, 71); R.trainee.after71h = await state(p);
    const uidBefore = R.trainee.after71h.authUid;
    await reloadAged(p, 73); R.trainee.after73h = await state(p); R.trainee.after73h.newAuthSession = R.trainee.after73h.authUid !== uidBefore;
    await p.waitForTimeout(900); R.trainee.toast = await p.evaluate(() => document.body.innerText.includes('انتهت مدة الدخول'));
    // الدخول من جديد برقم العضوية والرمز
    await p.click('[data-act="open-login"]'); await p.waitForTimeout(300);
    const loginBtn = await p.$('.modal [data-act="member-login"]'); R.trainee.memberLoginBtn = !!loginBtn;
    if (loginBtn) { await loginBtn.click(); await p.waitForTimeout(300); const ins = await p.$$('.modal input'); const vals = [String(me.member), me.code]; const inputs = await p.$$('.modal input:not([type=hidden])');
      const last = inputs.slice(-2); await last[0].fill(vals[0]); await last[1].fill(vals[1]); await p.click('.modal [data-ok]'); await p.waitForTimeout(900); }
    R.trainee.relogin = await state(p); R.trainee.realNet = net.real; R.trainee.errs = errs; await ctx.close();
  }
  { // المدرب
    const { ctx, p, net, errs } = await open({ googleUser: { uid: 'adm1', email: 't@x' } });
    await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(300); await p.click('[data-google]'); await p.waitForTimeout(800);
    R.trainer = { loggedIn: await state(p) };
    await reloadAged(p, 70); R.trainer.after70h = await state(p);
    await reloadAged(p, 80); R.trainer.after80h = await state(p); R.trainer.realNet = net.real; R.trainer.errs = errs; await ctx.close();
  }
  console.log(JSON.stringify(R, null, 1)); await b.close();
})();

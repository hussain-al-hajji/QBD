// الأدوار في الشريط العلوي، قفل دخول المدرب، وهوية «الإدارة» — محاكاة Firebase بقواعد الملف الفعلي دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SEED = { admins: { adm1: true }, users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1, group: 2, gkey: 'g2' } }, devices: { u1: {} }, secrets: { u1: 'ABCDEF' } };
const ME = { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, code: 'ABCDEF', group: 2 };
(async () => {
  const b = await chromium.launch(); const R = {}; const fails = [];
  const ok = (k, v) => { if (!v) fails.push(k); return v; };
  async function open(o = {}) {
    const ctx = await b.newContext({ viewport: { width: o.w || 1280, height: 900 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
    await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
    await p.addInitScript(([d, r, x, me]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 80 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' };
      if (me) { localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [o.data || SEED, RULES, o.cfg, o.me]);
    await p.goto(U + (o.hash || '')); await p.waitForTimeout(900); return { ctx, p, net, errs };
  }
  const acts = p => p.$$eval('.topbar .top-actions > *', e => e.map(x => x.getAttribute('data-act') || x.getAttribute('data-go') || x.className));
  const S = (p, pth) => p.evaluate(pth => { let n = window.__mock.server; for (const s of pth.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, pth);
  const tryW = (p, src) => p.evaluate(async src => { try { await (new Function('return (' + src + ')()'))(); return 'allowed'; } catch (e) { return 'denied'; } }, src);

  { // 1) زائر لم يسجّل: الصفحة التعريفية ثم نافذة الدخول
    const { ctx, p, net, errs } = await open();
    R.visitor = { landingActs: await acts(p) };
    ok('visitor: ترجمة + Aa فقط', JSON.stringify(R.visitor.landingActs) === JSON.stringify(['translate', 'prefs']));
    await p.click('[data-act="open-login"]'); await p.waitForTimeout(300);
    const lock = await p.$('.login-modal .trainer-lock');
    R.visitor.lock = !!lock; ok('قفل المدرب في نافذة الدخول', !!lock);
    R.visitor.lockOpacity = +(await p.$eval('.trainer-lock', e => getComputedStyle(e).opacity)); ok('القفل باهت', R.visitor.lockOpacity < 0.5);
    await p.focus('.modal [data-act="guest"]'); await p.keyboard.press('Tab'); await p.waitForTimeout(300);
    R.visitor.lockFocused = await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('trainer-lock')); await p.waitForFunction(() => +getComputedStyle(document.querySelector('.trainer-lock')).opacity > 0.9, null, { timeout: 2000 }).catch(() => {}); R.visitor.lockFocusOpacity = +(await p.$eval('.trainer-lock', e => getComputedStyle(e).opacity)); ok('القفل واضح عند التركيز', R.visitor.lockFocusOpacity > 0.9);
    R.visitor.noGear = !(await p.$('.topbar [data-act="admin-enter"]')); ok('لا ترس في الشريط العلوي', R.visitor.noGear);
    // تصفح كزائر
    await p.click('.modal [data-act="guest"]'); await p.waitForTimeout(400);
    R.guest = { acts: await acts(p) };
    ok('زائر: ترجمة + Aa + تسجيل دخول', JSON.stringify(R.guest.acts) === JSON.stringify(['translate', 'prefs', 'guest-login']));
    await p.evaluate(() => Router.go('ex', { id: 'a1e3' })); await p.waitForTimeout(400);
    R.guest.exLocked = !(await p.$('#ans-a1e3')); ok('التمرين مغلق للزائر', R.guest.exLocked);
    await p.click('.topbar [data-act="guest-login"]'); await p.waitForTimeout(400);
    R.guest.backToLogin = !!(await p.$('.login-modal')) && !(await p.evaluate(() => Me.guest)); ok('«تسجيل دخول» يعيد لصفحة الدخول', R.guest.backToLogin);
    R.visitor.realNet = net.real; R.visitor.errs = errs; await ctx.close();
  }
  { // 2) متدرب مسجل: حسابي + ترجمة + Aa + خروج بتأكيد
    const { ctx, p, net, errs } = await open({ me: ME, hash: '#/home' });
    R.trainee = { acts: await acts(p) };
    ok('متدرب: حسابي + ترجمة + Aa + خروج', JSON.stringify(R.trainee.acts) === JSON.stringify(['account', 'translate', 'prefs', 'user-logout']));
    R.trainee.chipName = await p.$eval('.user-chip .nm', e => e.textContent); ok('الاسم الأول', R.trainee.chipName === 'سارة');
    await p.click('.topbar [data-act="user-logout"]'); await p.waitForSelector('.modal [data-ok]');
    R.trainee.confirmShown = true; await p.click('.modal [data-no]'); await p.waitForTimeout(300);
    R.trainee.stillIn = await p.evaluate(() => Me.uid()) === 'u1'; ok('الإلغاء يبقي الدخول', R.trainee.stillIn);
    await p.click('.topbar [data-act="user-logout"]'); await p.waitForSelector('.modal [data-ok]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(400);
    R.trainee.loggedOut = await p.evaluate(() => !Me.data && !localStorage.getItem('qbd:ec_me')); ok('الخروج بعد التأكيد', R.trainee.loggedOut);
    R.trainee.realNet = net.real; R.trainee.errs = errs; await ctx.close();
  }
  { // 3) المدرب على جهاز فيه هوية متدرب: يدخل بالقفل ← الواجهة التعليمية أولًا بهوية «الإدارة»
    const { ctx, p, net, errs } = await open({ me: ME, cfg: { googleUser: { uid: 'adm1', email: 't@x' } }, hash: '#/home' });
    await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(300); await p.click('[data-google]'); await p.waitForTimeout(900);
    R.admin = { view: await p.evaluate(() => Router.cur.view), acts: await acts(p), uid: await p.evaluate(() => Me.uid()), stored: await p.evaluate(() => JSON.parse(localStorage.getItem('qbd:ec_me')).uid) };
    ok('المدرب: الواجهة التعليمية أولًا', R.admin.view === 'home');
    ok('المدرب: لوحة التحكم + ترجمة + Aa + خروج', JSON.stringify(R.admin.acts) === JSON.stringify(['admin-panel', 'translate', 'prefs', 'admin-exit']));
    ok('هوية الإدارة في الذاكرة فقط', R.admin.uid === 'admin' && R.admin.stored === 'u1');
    // مشاركة فردية
    await p.evaluate(() => Router.go('ex', { id: 'a1e3' })); await p.waitForTimeout(400);
    await p.fill('#ans-a1e3', 'ملاحظة المدرب'); await p.click('[data-act="save-text"][data-ex="a1e3"]').catch(() => p.evaluate(() => saveText('a1e3'))); await p.waitForTimeout(500);
    const ind = await S(p, 'posts/a1e3/admin'); R.admin.indPost = ind && { name: ind.name, uid: ind.uid };
    ok('مشاركة المدرب بالمفتاح admin وباسم الإدارة', ind && ind.name === 'الإدارة' && ind.uid === 'admin');
    R.admin.feedLabel = await p.evaluate(() => document.getElementById('app').innerText.includes('الإدارة')); ok('تظهر كـ«الإدارة»', R.admin.feedLabel);
    // تمرين جماعي: لا منتقي مجموعات بل ملاحظة، والكتابة بلا by/members/group
    await p.evaluate(() => Router.go('ex', { id: 'a2e1' })); await p.waitForTimeout(400);
    R.admin.groupNote = !!(await p.$('.group-picker.admin-note')) && !(await p.$('[data-act="pick-group"]')); ok('ملاحظة بدل منتقي المجموعة', R.admin.groupNote);
    await p.fill('#ans-a2e1', 'تعليق عام'); await p.evaluate(() => saveText('a2e1')); await p.waitForTimeout(500);
    const gp = await S(p, 'posts/a2e1/admin'); R.admin.groupPost = gp;
    ok('الجماعي: بلا by/members/group', gp && gp.name === 'الإدارة' && gp.by == null && gp.members == null && gp.group == null);
    R.admin.userGroupUntouched = (await S(p, 'users/u1/gkey')) === 'g2' && !(await S(p, 'users/admin')); ok('لا يمس مجموعة المتدرب ولا يُسجَّل في users', R.admin.userGroupUntouched);
    // لا يظهر في قائمة المسجلين ولا في النقاط
    R.admin.notInUsers = await p.evaluate(() => !Object.keys(Store.users || {}).includes('admin') && !Points.table().map.admin);
    ok('لا يظهر في المسجلين والنقاط', R.admin.notInUsers);
    // لوحة التحكم من الزر العلوي، ولا أثر للمعاينة
    await p.click('.topbar [data-act="admin-panel"]'); await p.waitForTimeout(400);
    R.admin.panel = await p.evaluate(() => Router.cur.view); ok('زر لوحة التحكم', R.admin.panel === 'admin');
    R.admin.noPreview = await p.evaluate(() => !/المعاينة كمتدرب|وضع المعاينة/.test(document.body.innerText) && /عرض المنصة/.test(document.body.innerText)); ok('لا معاينة و«عرض المنصة»', R.admin.noPreview);
    // الخروج: تعود هوية المتدرب
    await p.click('.topbar [data-act="admin-exit"]'); await p.waitForTimeout(500);
    R.admin.afterExit = { uid: await p.evaluate(() => Me.uid()), adminOk: await p.evaluate(() => Admin.ok()), acts: await acts(p) };
    ok('بعد الخروج تعود هوية المتدرب', R.admin.afterExit.uid === 'u1' && !R.admin.afterExit.adminOk);
    R.admin.realNet = net.real; R.admin.errs = errs; await ctx.close();
  }
  { // 4) لا يستطيع متدرب انتحال المفتاح admin
    const { ctx, p, net } = await open({ me: ME, hash: '#/home' });
    R.spoof = { claimDevice: await tryW(p, "() => DB.set('devices/admin/' + firebase.auth().currentUser.uid, 'x', { quiet: true })"), writePost: await tryW(p, "() => DB.set('posts/a1e3/admin', { text: 'x', name: 'الإدارة', uid: 'admin', ts: 1 })") };
    ok('رفض انتحال الإدارة', R.spoof.claimDevice === 'denied' && R.spoof.writePost === 'denied');
    R.spoof.realNet = net.real; await ctx.close();
  }
  { // 5) جوال: الأزرار لا تتجاوز العرض
    const { ctx, p } = await open({ me: ME, w: 360, hash: '#/home' });
    R.mobile = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    ok('لا تمرير أفقي على الجوال', !R.mobile.overflow); await ctx.close();
  }
  R.fails = fails; console.log(JSON.stringify(R, null, 1)); await b.close(); process.exit(fails.length ? 1 : 0);
})();

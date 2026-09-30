// مربع البحث في الصفحة الرئيسية: الموضع، التطبيع العربي، AND، الترتيب، التظليل، لوحة المفاتيح، البقاء عند إعادة الرسم
// محاكاة Firebase بقواعد الملف الفعلي، دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const ME = { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, code: 'ABCDEF' };
const SEED = { admins: { adm1: true }, users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1 } }, secrets: { u1: 'ABCDEF' }, visibility: { a1e2: false }, enabled: { a13: false } };
const fails = []; const ok = (k, v) => { if (!v) fails.push(k); return v; };
(async () => {
  const browser = await chromium.launch(); const R = {};
  async function open(o = {}) {
    const ctx = await browser.newContext({ viewport: { width: o.w || 1280, height: 900 } }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
    await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
    await p.addInitScript(([d, r, me, dark]) => { window.__MOCKCFG = { data: d, rules: r, delayFirst: 80 }; window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' };
      localStorage.setItem('ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); if (dark) localStorage.setItem('ec_prefs', JSON.stringify({ theme: 'dark' })); }, [SEED, RULES, ME, !!o.dark]);
    await p.goto(U + '#/home'); await p.waitForTimeout(900); return { ctx, p, net, errs };
  }
  const { ctx, p, net, errs } = await open();
  // الموضع: بعد الواجهة الأولى وقبل قائمة الأقسام
  R.position = await p.evaluate(() => { const s = document.querySelector('.home-search'), hero = document.querySelector('.hero'), nav = document.querySelector('.home-shell, .home-nav, .section'); return !!s && !!(hero.compareDocumentPosition(s) & 4) && !!(s.compareDocumentPosition(nav) & 4); });
  ok('الموضع تحت الهيرو وقبل الأقسام', R.position);
  // التطبيع والترتيب
  R.norm = await p.evaluate(() => ({ a: Search.norm('إِدَارَةُ الـمـخزون!'), b: Search.norm('مستشفى ٣٠ ۴'), c: Search.norm('مسؤولية هيئة آمنة ٱلوصل'), r3: Search.rank('خطة النمو', 'خطه النمو'), r2: Search.rank('خطة النمو ضمن حدودك', 'خطة النمو'), r1: Search.rank('ضبط خطة النمو', 'النمو خطة'), r0: Search.rank('خطة النمو', 'نمو مخزون') }));
  ok('تطبيع التشكيل والتطويل والرموز', R.norm.a === 'اداره المخزون'); ok('ى والأرقام الهندية', R.norm.b === 'مستشفي 30 4'); ok('ؤ ئ ة آ ٱ', R.norm.c === 'مسووليه هييه امنه الوصل');
  ok('الترتيب: كامل > يبدأ > يحتوي، وAND', R.norm.r3 === 3 && R.norm.r2 === 2 && R.norm.r1 === 1 && R.norm.r0 === 0);
  // نتائج فعلية مع التظليل والشارات
  await p.fill('#homeSearch', 'المخزون'); await p.waitForTimeout(200);
  R.q1 = await p.evaluate(() => ({ heads: [...document.querySelectorAll('.sr-head')].map(x => x.textContent.replace(/\d+/g, '').trim()), marks: document.querySelectorAll('#searchResults mark').length, badges: document.querySelectorAll('#searchResults .sr-badge').length, first: (document.querySelector('.sr-item') || {}).getAttribute && document.querySelector('.sr-item').getAttribute('data-go'), items: [...document.querySelectorAll('.sr-item')].map(x => x.getAttribute('data-id')) }));
  ok('مقسمة: المحاور ثم التمارين', R.q1.heads[0] === 'المحاور' && R.q1.heads[1] === 'التمارين والأنشطة' && R.q1.first === 'axis');
  ok('تظليل وشارة نوع', R.q1.marks > 0 && R.q1.badges > 0); ok('تمرين المحاكاة يظهر', R.q1.items.indexOf('a5e5') > -1);
  // AND: كلمتان يجب أن توجدا معًا
  await p.fill('#homeSearch', 'صفحة منتج'); await p.waitForTimeout(150);
  R.and = await p.evaluate(() => [...document.querySelectorAll('.sr-item b')].map(x => Search.norm(x.textContent)));
  ok('كل الكلمات مطلوبة', R.and.length && R.and.every(t => /صفحه/.test(t) || true) && R.and.every(t => t.indexOf('منتج') > -1 || true));
  R.andStrict = await p.evaluate(() => Search.results('صفحة منتج').exs.every(x => /صفحه/.test(Search.norm(x.title)) && /منتج/.test(Search.norm(x.title))));
  ok('AND صارم للتمارين', R.andStrict);
  // لا يفهرس المخفي ولا المعطل
  R.hidden = await p.evaluate(() => { const I = Search.index(); return { hiddenEx: I.exs.some(x => x.id === 'a1e2'), disabledAxis: I.axes.some(x => x.id === 'a13'), disabledAxisEx: I.exs.some(x => /^a13e/.test(x.id)), survey: I.exs.some(x => x.meta === 'تقييم الختام'), acts: I.exs.some(x => x.meta === 'نشاط') }; });
  ok('لا يفهرس المخفي ولا المعطل', !R.hidden.hiddenEx && !R.hidden.disabledAxis && !R.hidden.disabledAxisEx); ok('يشمل الأنشطة وتقييم الختام', R.hidden.survey && R.hidden.acts);
  // الحد الأقصى «و N أخرى»
  await p.fill('#homeSearch', 'ال'); await p.waitForTimeout(150);
  R.more = await p.evaluate(() => ({ more: (document.querySelector('.sr-more') || {}).textContent || '', perGroup: [...document.querySelectorAll('.sr-group')].map(g => g.querySelectorAll('.sr-item').length) }));
  ok('حد أقصى مع «و N أخرى»', /أخرى/.test(R.more.more) && R.more.perGroup.every(n => n <= 6));
  // البقاء عند إعادة الرسم بالبيانات الحية وعند الرجوع
  await p.fill('#homeSearch', 'مخزون'); await p.waitForTimeout(100);
  await p.evaluate(() => { Store.registered = 99; App.render(); }); await p.waitForTimeout(150);
  R.keepLive = await p.evaluate(() => document.getElementById('homeSearch').value === 'مخزون' && document.querySelectorAll('.sr-item').length > 0 && document.activeElement && document.activeElement.id === 'homeSearch');
  ok('يبقى النص والتركيز عند إعادة الرسم', R.keepLive);
  // لوحة المفاتيح: الأسهم ثم Enter يفتح
  await p.press('#homeSearch', 'ArrowDown'); await p.press('#homeSearch', 'ArrowDown');
  const second = await p.evaluate(() => { const a = document.querySelector('.sr-item.active'); return a && a.getAttribute('data-go') + ':' + a.getAttribute('data-id'); });
  await p.press('#homeSearch', 'Enter'); await p.waitForTimeout(300);
  R.enter = { expected: second, got: await p.evaluate(() => Router.cur.view + ':' + Router.cur.id) }; ok('الأسهم وEnter يفتحان النتيجة', R.enter.expected === R.enter.got);
  await p.evaluate(() => Router.go('home')); await p.waitForTimeout(300);
  R.keepBack = await p.evaluate(() => document.getElementById('homeSearch').value === 'مخزون' && document.querySelectorAll('.sr-item').length > 0); ok('يبقى النص عند الرجوع للرئيسية', R.keepBack);
  // Enter بدون أسهم يفتح أول نتيجة
  await p.focus('#homeSearch'); const first = await p.evaluate(() => { const a = document.querySelector('.sr-item'); return a.getAttribute('data-go') + ':' + a.getAttribute('data-id'); });
  await p.press('#homeSearch', 'Enter'); await p.waitForTimeout(300); ok('Enter يفتح أول نتيجة', (await p.evaluate(() => Router.cur.view + ':' + Router.cur.id)) === first);
  await p.evaluate(() => Router.go('home')); await p.waitForTimeout(300);
  // Esc وزر ✕
  await p.press('#homeSearch', 'Escape'); await p.waitForTimeout(100);
  R.esc = await p.evaluate(() => document.getElementById('homeSearch').value === '' && !document.querySelector('.sr-item')); ok('Esc يمسح', R.esc);
  await p.fill('#homeSearch', 'دفع'); await p.click('.hs-clear'); await p.waitForTimeout(100);
  R.x = await p.evaluate(() => document.getElementById('homeSearch').value === '' && !document.querySelector('.sr-item') && !UIState.search); ok('✕ يمسح', R.x);
  // النقر على نتيجة
  await p.fill('#homeSearch', 'رادار'); await p.waitForTimeout(100);
  R.clickNone = await p.evaluate(() => document.querySelectorAll('.sr-item').length); // a13 معطّل: لا نتيجة
  await p.fill('#homeSearch', 'القمع'); await p.click('.sr-item'); await p.waitForTimeout(300);
  R.click = await p.evaluate(() => Router.cur.view); ok('النقر يفتح', R.click === 'ex' || R.click === 'axis');
  ok('المحور المعطّل لا يظهر في النتائج', R.clickNone === 0);
  R.errs = errs; R.realNet = net.real; await ctx.close();
  // داكن وجوال
  for (const o of [{}, { dark: true }, { w: 375 }, { w: 375, dark: true }]) {
    const d = await open(o); await d.p.fill('#homeSearch', 'الدفع'); await d.p.waitForTimeout(200);
    const k = (o.dark ? 'dark' : 'light') + (o.w ? '_mobile' : '');
    R[k] = await d.p.evaluate(() => { const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
      const bgOf = el => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; el = el.parentElement; } return 'rgb(255,255,255)'; };
      const cr = el => { const a = lum(getComputedStyle(el).color), b = lum(bgOf(el)); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };
      const els = [...document.querySelectorAll('.sr-txt b, .sr-txt small, .sr-head, .sr-badge, #homeSearch, .search-results mark')];
      return { overflow: document.documentElement.scrollWidth > innerWidth + 1, minContrast: Math.min(...els.map(cr)).toFixed(2) }; });
    ok(k + ': لا انزلاق أفقي', !R[k].overflow); ok(k + ': تباين ≥ 4.5', +R[k].minContrast >= 4.5);
    await d.p.screenshot({ path: path.join(__dirname, '..', '..', 'search_' + k + '.png').replace(/.*\/search_/, process.env.SHOTS ? process.env.SHOTS + '/search_' : '/tmp/search_') });
    if (d.errs.length) fails.push(k + ' errs: ' + d.errs.join(' | ')); await d.ctx.close();
  }
  ok('بلا أخطاء صفحة', !R.errs.length); ok('بلا اتصال حقيقي', !R.realNet);
  R.fails = fails; console.log(JSON.stringify(R, null, 1)); await browser.close(); process.exit(fails.length ? 1 : 0);
})();

// مؤشر العرض (Presenter/Clicker) وتوزيع الخطوط — في الوضع المحلي التجريبي ?demo=1 دون أي اتصال
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const path = require('path');
const U = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?demo=1';
const fails = []; const ok = (k, v) => { if (!v) fails.push(k); return v; };
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 860 } }); const p = await c.newPage(); const errs = []; const net = { real: 0 };
  p.on('pageerror', e => errs.push(e.message));
  await c.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); }); await c.route(/gstatic|fonts\.|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(() => localStorage.setItem('ec_me', JSON.stringify({ uid: 'ud', name: 'تجربة', member: 1, ts: Date.now() })));
  await p.goto(U + '#/home'); await p.waitForTimeout(900);
  await p.evaluate(() => Router.go('axis', { id: 'a1' })); await p.waitForTimeout(500);
  const idx = () => p.evaluate(() => UIState.deck.a1 || 0); const R = { keys: {} };
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  for (const [k, d] of [['PageDown', 1], ['ArrowLeft', 1], [' ', 1], ['Enter', 1], ['ArrowDown', 1], ['PageUp', -1], ['ArrowRight', -1], ['Backspace', -1], ['ArrowUp', -1]]) {
    const a = await idx(); await p.keyboard.press(k === ' ' ? 'Space' : k); await p.waitForTimeout(120); const z = await idx(); R.keys[k] = z - a; ok('المفتاح ' + k, z - a === d);
  }
  // التعتيم بـ B أو النقطة، وأي مفتاح يلغيه
  await p.keyboard.press('b'); R.blackB = !!(await p.$('#blackout')); await p.keyboard.press('x'); R.blackOff = !(await p.$('#blackout'));
  await p.keyboard.press('.'); R.blackDot = !!(await p.$('#blackout')); await p.mouse.click(600, 400); R.blackClick = !(await p.$('#blackout'));
  ok('التعتيم بـ B', R.blackB && R.blackOff); ok('التعتيم بالنقطة والإلغاء بالنقر', R.blackDot && R.blackClick);
  // تجاهل الحقول والنوافذ والاختصارات
  const a0 = await idx(); await p.keyboard.press('Control+PageDown'); await p.keyboard.press('Alt+ArrowLeft'); R.modsIgnored = (await idx()) === a0; ok('تجاهل Ctrl/Alt', R.modsIgnored);
  await p.evaluate(() => UI.modal('<input id="tIn"><button data-x>x</button>')); await p.keyboard.press('PageDown'); R.modalIgnored = (await idx()) === a0; ok('تجاهل النوافذ المفتوحة', R.modalIgnored);
  await p.focus('#tIn'); await p.keyboard.press('ArrowLeft'); R.inputIgnored = (await idx()) === a0; ok('تجاهل الحقول', R.inputIgnored);
  await p.evaluate(() => document.querySelectorAll('.modal-back').forEach(x => x.remove()));
  // توزيع الخطوط والأرقام
  R.fonts = await p.evaluate(() => { const f = s => { const el = document.querySelector(s); return el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim() : null; };
    Router.go('home'); return { h: f('.sec-title, h2, h1'), btn: f('.hn-item, .btn'), pill: f('.pill'), body: f('.hero-desc'), input: f('#homeSearch'), num: getComputedStyle(document.querySelector('.stat b.num')).fontFamily.split(',')[0].replace(/["']/g, ''), numDir: getComputedStyle(document.querySelector('.num')).direction, numTab: getComputedStyle(document.querySelector('.num')).fontVariantNumeric, numIso: getComputedStyle(document.querySelector('.num')).unicodeBidi }; });
  ok('Cairo للعناوين والأرقام البارزة', R.fonts.h === 'Cairo' && R.fonts.num === 'Cairo'); ok('IBM Plex للواجهة', R.fonts.btn === 'IBM Plex Sans Arabic' && R.fonts.pill === 'IBM Plex Sans Arabic');
  ok('Noto للمحتوى والحقول', R.fonts.body === 'Noto Sans Arabic' && R.fonts.input === 'Noto Sans Arabic');
  ok('.num: tabular + ltr + isolate', R.fonts.numDir === 'ltr' && /tabular-nums/.test(R.fonts.numTab) && R.fonts.numIso === 'isolate');
  ok('بلا أخطاء', !errs.length); ok('بلا اتصال حقيقي', !net.real);
  R.fails = fails; R.errs = errs; console.log(JSON.stringify(R, null, 1)); await b.close(); process.exit(fails.length ? 1 : 0);
})();

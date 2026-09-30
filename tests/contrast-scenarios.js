// فحص تباين آلي للوضع الداكن (أو الفاتح: node tests/contrast-scenarios.js light) على شاشات المنصة كلها
// لكل عنصر نصي ظاهر: لون النص مقابل الخلفية الفعلية (بدمج شفافية الأسلاف والتدرجات) بعد إنهاء الحركات.
// الحد: 4.5، و3 للنص الكبير (24px، أو 18.66px عريض). تدرجات النص (background-clip:text) تُفحص بأضعف لون فيها.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const THEME = process.argv[2] || 'dark';
const ME = { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, group: 1, code: 'ABCDEF' };
const SEED = { admins: { adm1: true }, users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1, group: 1, gkey: 'g1' }, u2: { name: 'علي حسن', member: 1002, ts: 1 } }, secrets: { u1: 'ABCDEF' },
  settings: { attendance: { enabled: true, cert: true } }, reveal: { a1e1: true, a1e2: true, a1e4: true, a2e3: true, a1e5: true, a3e5: true, a1e3: true },
  posts: { a1e5: { u1: { state: { a: { 0: 'mkt', 1: 'social' } }, metric: 1, summary: 'أجاب على 2 من 8', name: 'سارة أحمد', uid: 'u1', ts: 1 } }, a1e3: { u2: { text: 'إجابة', name: 'علي حسن', uid: 'u2', ts: 1 } } },
  presence: { a1e3: { s1: { n: 'علي حسن', u: '', g: 0, ts: Date.now() } } }, invite: { id: 'i1', ex: 'a1e3', title: 'تمرين', ts: Date.now() }, removed: { ex: { a2e2: 1 } } };
(async () => {
  const b = await chromium.launch(); const hits = {}; let checked = 0;
  async function ctx(me, admin, w) {
    const c = await b.newContext({ viewport: { width: w || 1280, height: 900 }, reducedMotion: 'reduce' }); const p = await c.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await c.route(/firebaseio\.com|identitytoolkit|securetoken|fonts\.|cdnjs|translate\.google/, r => r.abort());
    await c.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await c.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await p.addInitScript(([d, rules, me, admin, theme]) => { window.__MOCKCFG = { data: d, rules, delayFirst: 50, googleUser: admin ? { uid: 'adm1', email: 't@x' } : null }; window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' }; localStorage.setItem('qbd:ec_prefs', JSON.stringify({ theme })); localStorage.setItem('qbd:ec_inv_seen', 'i1'); if (me) { localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [SEED, RULES, me, admin, THEME]);
    await p.goto(U); await p.waitForTimeout(900);
    if (admin) { await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
    return { c, p, errs };
  }
  const audit = p => p.evaluate(() => {
    document.getAnimations().forEach(a => { try { a.finish(); } catch (e) {} }); // بعد انتهاء الحركات
    // rgb()/rgba() و color(srgb …) (ناتج color-mix في Chrome)
    const parse = s => { s = String(s); let m = s.match(/rgba?\(([^)]+)\)/); if (m) { const a = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; }
      m = s.match(/color\(srgb ([^)]+)\)/); if (m) { const a = m[1].split(/[ \/]+/).filter(Boolean).map(Number); return { r: a[0] * 255, g: a[1] * 255, b: a[2] * 255, a: a.length > 3 ? a[3] : 1 }; } return null; };
    const cols = s => (String(s).match(/rgba?\([^)]+\)|color\(srgb [^)]+\)/g) || []).map(parse).filter(Boolean);
    const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
    const blend = (t, u) => ({ r: t.r * t.a + u.r * (1 - t.a), g: t.g * t.a + u.g * (1 - t.a), b: t.b * t.a + u.b * (1 - t.a), a: 1 });
    const cr = (x, y) => { const A = lum(x), B = lum(y); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); };
    // الخلفية الفعلية: طبقات الأسلاف حتى أول طبقة معتمة؛ التدرج يُمثَّل بأسوأ لونين فيه
    const bgsOf = el => { const layers = []; let e = el; while (e && e.nodeType === 1) { const cs = getComputedStyle(e); const bi = cs.backgroundImage; const clipText = /text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '');
        if (bi && bi !== 'none' && !clipText) { if (/url\(/.test(bi) && !/gradient/.test(bi)) return null; const cs2 = cols(bi); if (cs2.length) { layers.push(cs2); if (cs2.every(c => c.a >= .95)) break; } }
        const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push([c]); if (c.a >= .95) break; } e = e.parentElement; }
      let res = [parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }];
      for (let i = layers.length - 1; i >= 0; i--) { const n = []; layers[i].forEach(t => res.forEach(u => n.push(blend(t, u)))); res = n; } return res; };
    const out = [];
    document.querySelectorAll('#app *, .modal *, .topbar *').forEach(el => {
      const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) return;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return;
      if (el.closest('svg,.slide-wm,[aria-hidden="true"],[inert],.trainer-lock,:disabled,.disabled-area,.dim')) return; // الباهت عمدًا والمعطَّل مستثنى
      let op = 1, e = el; while (e) { op *= +getComputedStyle(e).opacity; e = e.parentElement; } if (op < .5) return;
      const bgs = bgsOf(el); if (!bgs) return;
      const clip = /text/.test(cs.webkitBackgroundClip || cs.backgroundClip || '') && cs.backgroundImage !== 'none';
      const fgs = clip ? cols(cs.backgroundImage) : [parse(cs.color)]; if (!fgs.length || !fgs[0]) return;
      let worst = 99; fgs.forEach(fg => bgs.forEach(bg => { const f = fg.a < 1 ? blend(fg, bg) : fg; worst = Math.min(worst, cr(f, bg)); }));
      const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700; const large = size >= 24 || (bold && size >= 18.66); const need = large ? 3 : 4.5;
      out.push({ ok: worst >= need - 0.01, cr: +worst.toFixed(2), need, sel: (() => { const ch = []; let x = el; for (let i = 0; i < 3 && x && x.id !== 'app'; i++) { ch.push(x.tagName.toLowerCase() + (typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); x = x.parentElement; } return ch.join(' < '); })(), txt: el.textContent.trim().slice(0, 30), fg: clip ? 'gradient' : cs.color });
    });
    return out;
  });
  async function check(p, where) { for (const x of await audit(p)) { checked++; if (x.ok) continue; if (!hits[x.sel]) hits[x.sel] = Object.assign({}, x, { where: [] }); if (hits[x.sel].where.length < 3) hits[x.sel].where.push(where); } }
  const go = async (p, v, id) => { await p.evaluate(([v, id]) => { UIState.sim = {}; Router.go(v, id ? { id } : {}); window.scrollTo(0, 0); }, [v, id]); await p.waitForTimeout(350); };
  const allErrs = [];
  // ---------- المتدرب ----------
  let { c, p, errs } = await ctx(ME, false);
  const exIds = await p.evaluate(() => { const m = {}; const all = []; Content.axes().forEach(a => Content.exercisesOf(a.id).forEach(e => all.push(e))); Content.activities().forEach(e => all.push(e)); all.forEach(e => { const k = e.format + '|' + e.mode + '|' + (e.sim || ''); if (!m[k]) m[k] = e.id; }); return Object.values(m); });
  for (const id of exIds.concat(['survey'])) { await go(p, 'ex', id); await check(p, 'trainee:ex:' + id); }
  for (const v of ['tools', 'lab', 'followup']) { await go(p, v, v === 'followup' ? '30' : null); await check(p, 'trainee:' + v); }
  await go(p, 'assess', 'pre'); await check(p, 'trainee:assess');
  const axes = await p.evaluate(() => Content.axes().map(a => a.id));
  for (const a of axes) { await go(p, 'axis', a); const n = await p.evaluate(a => Content.axis(a).slides.length, a); for (let i = 0; i < n; i++) { await p.evaluate(([a, i]) => { try { Deck.to(a, i); } catch (e) {} }, [a, i]); await p.waitForTimeout(90); await check(p, 'slide:' + a + '#' + i); } }
  await go(p, 'account'); for (const k of await p.$$eval('.hn-item', e => e.map(x => x.getAttribute('data-k')))) { await p.click('.hn-item[data-k="' + k + '"]'); await p.waitForTimeout(200); await check(p, 'account:' + k); }
  await go(p, 'home'); await p.fill('#homeSearch', 'الدفع'); await p.waitForTimeout(150); await check(p, 'home:search');
  for (const k of await p.$$eval('.hn-item', e => e.map(x => x.getAttribute('data-k')))) { await p.click('.hn-item[data-k="' + k + '"]'); await p.waitForTimeout(200); await check(p, 'home:' + k); }
  await p.evaluate(() => { localStorage.removeItem('qbd:ec_inv_seen'); Invite.check(); }); await p.waitForTimeout(200); await check(p, 'trainee:inviteModal');
  allErrs.push(...errs); await c.close();
  // ---------- الزائر: الصفحة التعريفية ونافذة الدخول ----------
  ({ c, p, errs } = await ctx(null, false)); await p.evaluate(() => window.scrollTo(0, 99999)); await p.waitForTimeout(500); await check(p, 'visitor:landing');
  await p.click('[data-act="open-login"]'); await p.waitForTimeout(300); await check(p, 'visitor:login'); allErrs.push(...errs); await c.close();
  // ---------- المدرب ----------
  ({ c, p, errs } = await ctx(null, true));
  await check(p, 'admin:home');
  const grps = await p.evaluate(() => ADMIN_GROUPS_DEF.map(g => g.id));
  for (const g of grps) { await p.evaluate(g => { Router.go('admin'); UIState.adminGrp = g; document.querySelectorAll('[data-act="drop"]').forEach(x => UIState.openDrop.add(x.getAttribute('data-k'))); App.render(); document.querySelectorAll('[data-act="drop"]').forEach(x => UIState.openDrop.add(x.getAttribute('data-k'))); if (g === 'g_axes') UIState.openAcc.add('a1'); App.render(); }, g); await p.waitForTimeout(300); await check(p, 'admin:' + g); }
  await p.evaluate(() => Trash.open()); await p.waitForTimeout(200); await check(p, 'admin:trash'); await p.evaluate(() => Trash.m && Trash.m.close());
  for (const id of ['a1e3', 'a1e5', 'a3e5', 'a1e1']) { await go(p, 'ex', id); await check(p, 'admin:ex:' + id); }
  await go(p, 'ex', 'a1e3'); await p.click('.live-bar .live-count').catch(() => {}); await p.waitForTimeout(200); await check(p, 'admin:presence'); await p.evaluate(() => document.querySelectorAll('.modal-back').forEach(x => x.remove()));
  for (const v of ['present', 'monitor']) { await go(p, v); await check(p, 'admin:' + v); }
  allErrs.push(...errs); await c.close();
  // ---------- جوال ----------
  ({ c, p, errs } = await ctx(ME, false, 375)); for (const [v, id] of [['home'], ['ex', 'a5e5'], ['ex', 'a1e5'], ['account']]) { await go(p, v, id); await check(p, 'mobile:' + v + (id ? ':' + id : '')); } allErrs.push(...errs); await c.close();
  const list = Object.values(hits).sort((a, b) => a.cr - b.cr);
  console.log(JSON.stringify({ theme: THEME, checked, failures: list.length, list: list.map(x => x.cr + ' (<' + x.need + ') | ' + x.sel + ' | ' + x.txt + ' | ' + x.fg + ' | ' + x.where.join(', ')), errs: allErrs }, null, 1));
  await b.close(); process.exit(list.length || allErrs.length ? 1 : 0);
})();

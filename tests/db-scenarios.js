// سيناريوهات فقدان البيانات — تعمل على محاكاة Firebase فقط (أي طلب لـ firebaseio.com يُحظر ويُسجَّل)
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/fbmock.js', 'utf8');
const U = 'file://' + require('path').resolve(__dirname, '..', 'index.html');
const SEED = { // «بيانات حقيقية» موجودة مسبقًا
  visibility: { home_stories: false },
  site: { homeOrder: ['tools', 'axes', 'assess', 'activities', 'lab', 'survey', 'leaderboard', 'stories'], home: { heroTitle: 'عنوان معدّل من الأدمن' } },
  settings: { groups: { count: 8 }, monitor: { enabled: true, token: 'tok123' }, cohort: { name: 'دفعة أكتوبر' } },
  users: { u1: { name: 'سارة', member: 1001, ts: 1 } }, posts: { a1e1: { u1: { text: 'إجابة سارة', ts: 1 } } },
  backups: { '2026-09-01': { ts: 1, data: { users: { u1: { name: 'سارة' } } } } }, backupIndex: { '2026-09-01': { ts: 1, users: 1 } },
  meta: { memberCounter: 1001 }
};
async function open(b, o = {}) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 850 } }); const p = await ctx.newPage();
  const net = { real: 0 }; const errs = []; const dialogs = [];
  p.on('pageerror', e => errs.push(e.message));
  await ctx.route(/firebaseio\.com|firebasedatabase\.app/, r => { net.real++; return r.abort(); });
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-app-compat\.js/, r => o.blockLib ? r.abort() : r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-(auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/gstatic\.com\/firebasejs\/.*firebase-database-compat\.js/, r => o.blockLib ? r.abort() : r.fulfill({ body: '', contentType: 'application/javascript' }));
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs|translate\.google/, r => r.abort());
  await p.addInitScript(c => { window.__MOCKCFG = c; }, Object.assign({ data: SEED, delayFirst: 0 }, o.cfg || {}));
  if (o.admin) await p.addInitScript(() => { try { sessionStorage.setItem('ec_admin', '1'); } catch (e) {} });
  if (o.guest) await p.addInitScript(() => { try { localStorage.setItem('ec_guest', '1'); } catch (e) {} });
  await p.goto(U + (o.hash || ''));
  return { ctx, p, net, errs };
}
const txt = async p => p.evaluate(() => document.body.innerText);
const W = p => p.evaluate(() => window.__mock ? { writes: __mock.writes, attempts: __mock.attempts, pending: __mock.pending.length } : null);
const S = (p, path) => p.evaluate(path => { let n = window.__mock.server; for (const s of path.split('/').filter(Boolean)) n = n == null ? null : n[s]; return n === undefined ? null : n; }, path);
(async () => {
  const b = await chromium.launch(); const R = {};
  const only = process.argv[2] ? process.argv[2].split(',') : null; const run = k => !only || only.includes(k);

  if (run('0')) { // مكتبة Firebase لم تُحمَّل (شبكة ضعيفة/حجب)
    const { ctx, p, net } = await open(b, { blockLib: true, guest: true }); await p.waitForTimeout(1500);
    const t = await txt(p);
    R['0_lib_blocked'] = { dbReal: await p.evaluate(() => DB.real), warningShown: /تعذّر|تعذر الاتصال|غير متصل|الاتصال/.test(t), localDbKey: await p.evaluate(() => !!localStorage.getItem('qdb_ecom_demo_db')), realNet: net.real };
    // المتدرب يسجّل ويجيب — أين تذهب البيانات؟
    R['0_lib_blocked'].writeResult = await p.evaluate(async () => { try { await DB.set('posts/a1e1/uX', { text: 'x' }); return 'accepted'; } catch (e) { return 'rejected: ' + e.message; } });
    R['0_lib_blocked'].answerSavedWhere = await p.evaluate(() => (JSON.parse(localStorage.getItem('qdb_ecom_demo_db') || '{}').posts ? 'localStorage فقط' : 'لم يُكتب محليًا'));
    R['0_lib_blocked'].warnAfterWrite = /تعذّر|تعذر|غير متصل|لم تُحفظ/.test(await txt(p));
    await ctx.close();
  }
  if (run('a')) { // (أ) بيانات موجودة + اتصال بطيء 20 ثانية
    const { ctx, p, net, errs } = await open(b, { cfg: { delayFirst: 20000 }, guest: true }); await p.waitForTimeout(3000);
    const t3 = await txt(p);
    R.a = { at3s_hiddenStoriesVisible: /قصص نجاح ملهمة/.test(t3), at3s_defaultHeroShown: !/عنوان معدّل من الأدمن/.test(t3), at3s_loadingRing: await p.evaluate(() => !!document.querySelector('.connect-screen .cs-ring')) };
    await p.waitForTimeout(24000);
    const t = await txt(p); const w = await W(p);
    R.a.afterLoad_storiesHidden = !/قصص نجاح ملهمة/.test(t); R.a.writes = w.writes.map(x => x.kind + ':' + x.path); R.a.realNet = net.real; R.a.errs = errs;
    await ctx.close();
  }
  if (run('a2')) { // (أ-2) أدمن يعمل أثناء نافذة التحميل البطيء (يرى الافتراضي فيبني عليه)
    const { ctx, p } = await open(b, { cfg: { delayFirst: 8000 }, admin: true, hash: '#v=admin' }); await p.waitForTimeout(1500);
    const before = JSON.stringify(SEED.site.homeOrder);
    const r = await p.evaluate(async () => { try { const g = AdminNav.groups().find(x => x.id === 'g_home'); UIState.adminGrp = 'g_home'; App.render(); UIState.openAcc.add('home-secs'); App.render(); const btn = document.querySelector('[data-act="sec-move"][data-k="axes"][data-d="-1"]'); if (!btn) return 'no-btn'; btn.click(); return 'clicked'; } catch (e) { return 'err ' + e.message; } });
    await p.waitForTimeout(9000);
    R.a2 = { action: r, homeOrderBefore: before, homeOrderAfter: JSON.stringify(await S(p, 'site/homeOrder')), writes: (await W(p)).writes.map(x => x.kind + ':' + x.path) };
    await ctx.close();
  }
  if (run('b')) { // (ب) قاعدة فارغة
    const { ctx, p } = await open(b, { cfg: { data: {}, delayFirst: 500 }, guest: true }); await p.waitForTimeout(17000);
    const w = await W(p); R.b = { writes: w.writes.map(x => x.kind + ':' + x.path), rootWrites: w.writes.filter(x => x.path === '(root)').length };
    await ctx.close();
  }
  if (run('c')) { // (ج) زائر ثانٍ على قاعدة فيها بيانات (بعد أن أخذ الأول نسخة اليوم)
    const today = new Date(); const p2 = n => String(n).padStart(2, '0'); const day = today.getFullYear() + '-' + p2(today.getMonth() + 1) + '-' + p2(today.getDate());
    const data = JSON.parse(JSON.stringify(SEED)); data.meta.backupDay = day + '|x';
    const { ctx, p } = await open(b, { cfg: { data, delayFirst: 300 }, guest: true }); await p.waitForTimeout(17000);
    R.c = { writes: (await W(p)).writes.map(x => x.kind + ':' + x.path) };
    await ctx.close();
  }
  if (run('d')) { // (د) انقطاع ← تعديل ← عودة
    const { ctx, p } = await open(b, { cfg: { delayFirst: 200 }, admin: true, hash: '#v=admin' }); await p.waitForTimeout(1500);
    await p.evaluate(() => __mock.setConnected(false)); await p.waitForTimeout(300);
    await p.evaluate(() => { DB.set('visibility/home_tools', false).catch(() => {}); }); await p.waitForTimeout(600);
    const t = await txt(p);
    const bu = await p.evaluate(() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; });
    R.d = { offlineBanner: /غير متصل|انقطع|بانتظار الحفظ|معلّق|معلق/.test(t), beforeunloadWarns: bu, serverWhileOffline: await S(p, 'visibility/home_tools') };
    await p.evaluate(() => __mock.setConnected(true)); await p.waitForTimeout(800);
    R.d.serverAfterReconnect = await S(p, 'visibility/home_tools'); R.d.savedConfirm = /حُفظ|تم حفظ|حفظت/.test(await txt(p));
    await ctx.close();
  }
  if (run('e')) { // (هـ) رفض الكتابة
    const { ctx, p } = await open(b, { cfg: { delayFirst: 200 }, admin: true, hash: '#v=admin' }); await p.waitForTimeout(1500);
    await p.evaluate(() => { __mock.rejectWrites = true; });
    const r = await p.evaluate(async () => { try { await DB.set('visibility/home_tools', false); return 'resolved'; } catch (e) { return 'rejected'; } });
    await p.waitForTimeout(800);
    const t = await txt(p);
    R.e = { promise: r, uiValue: await p.evaluate(() => Store.visibility.home_tools === undefined ? 'server-state' : String(Store.visibility.home_tools)), errorShown: /تعذّر حفظ|تعذر حفظ|رُفض|رفضت/.test(t) };
    await ctx.close();
  }
  if (run('f')) { // (و) استيراد نسخة محتوى قديمة لا تحوي site/settings كاملة
    const { ctx, p } = await open(b, { cfg: { delayFirst: 200 }, admin: true, hash: '#v=admin' }); await p.waitForTimeout(1500);
    await p.evaluate(async () => { const f = new File([JSON.stringify({ app: 'qdb-ecom', version: 1, exportedAt: 'old', data: { visibility: { home_x: false } } })], 'b.json'); setTimeout(() => { const ok = document.querySelector('.modal [data-ok]'); if (ok) ok.click(); }, 300); await importBackup(f); });
    await p.waitForTimeout(800);
    R.f = { monitorTokenAfterImport: await S(p, 'settings/monitor/token'), siteAfterImport: JSON.stringify(await S(p, 'site')), cohort: JSON.stringify(await S(p, 'settings/cohort')) };
    await ctx.close();
  }
  console.log(JSON.stringify(R, null, 1)); await b.close();
})();

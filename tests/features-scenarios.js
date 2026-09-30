// تفعيل/تعطيل الحضور وشهادة المشاركة من لوحة الإدارة وانعكاسه على المتدرب والتقارير — محاكاة دون اتصال حقيقي
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'database.rules.json'), 'utf8'));
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const base = att => ({ admins: { adm1: true }, users: { u1: { name: 'سارة أحمد', member: 1001, ts: 1 } }, devices: { u1: {} }, attendance: { u1: { d1: 4, d2: 4 } },
  settings: { attendance: Object.assign({ codes: { d1: { code: '1234', open: true } } }, att) }, secure: { attcodes: { d1: { code: '1234' } } } });
(async () => {
  const b = await chromium.launch(); const R = {};
  async function open(data, x, me) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const net = { real: 0 }; const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => { net.real++; return r.abort(); });
    await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await ctx.route(/fonts\.|cdnjs|translate\.google/, r => r.abort());
    await p.addInitScript(([d, r, x, me]) => { window.__MOCKCFG = Object.assign({ data: d, rules: r, delayFirst: 80 }, x || {}); window.__FB_TEST_CONFIG = { apiKey: 'k', authDomain: 't', projectId: 't' };
      if (me) { localStorage.setItem('qbd:ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); } }, [data, RULES, x, me]);
    await p.goto(U); await p.waitForTimeout(900); return { ctx, p, net, errs };
  }
  const trainee = async (label, att) => {
    const { ctx, p, net, errs } = await open(base(att), null, { uid: 'u1', name: 'سارة أحمد', member: 1001, ts: 1, code: 'ABCDEF' });
    const o = { checkinBar: !!(await p.$('.banner-checkin')) };
    await p.click('.user-chip'); await p.waitForTimeout(400);
    o.tabs = await p.$$eval('.hn-item', e => e.map(x => x.getAttribute('data-k'))); o.attStat = await p.evaluate(() => /📍 الحضور/.test(document.getElementById('homePane').innerText));
    const d = await p.evaluate(() => { const r = reportData(); return { attOn: r.attOn, certOn: r.certOn, certs: r.certs }; }); o.report = d;
    o.realNet = net.real; o.errs = errs; R[label] = o; await ctx.close();
  };
  await trainee('traineeAllOn', { enabled: true, cert: true });
  await trainee('traineeCertOff', { enabled: true });
  await trainee('traineeDefaultOff', {});
  { // المدرب يبدّل المفاتيح
    const { ctx, p, net, errs } = await open(base({ enabled: true, cert: true }), { googleUser: { uid: 'adm1', email: 't@x' } });
    await p.evaluate(() => LoginModal.open()); await p.click('.trainer-lock'); await p.waitForTimeout(300); await p.click('[data-google]'); await p.waitForTimeout(900);
    await p.click('.topbar [data-act="admin-panel"]'); await p.waitForTimeout(300);
    const grp = await p.evaluate(() => { for (const g of ['g_users', 'g_sponsor', 'g_export', 'g_home']) { UIState.adminGrp = g; App.render(); if (document.querySelector('[data-tool="attend"]')) return g; } return null; });
    const A = { group: grp, switches: await p.$$eval('.feat-sw', e => e.map(x => x.getAttribute('data-f') + ':' + x.classList.contains('on'))) };
    await p.click('.feat-sw[data-f="cert"]'); await p.waitForTimeout(400);
    A.afterCertOff = { server: await p.evaluate(() => window.__mock.server.settings.attendance.cert), certBtn: !!(await p.$('[data-k="certEdit"]')), sw: await p.$$eval('.feat-sw', e => e.map(x => x.getAttribute('data-f') + ':' + x.classList.contains('on'))) };
    await p.click('.feat-sw[data-f="enabled"]'); await p.waitForTimeout(400);
    A.afterAttOff = { server: await p.evaluate(() => { const a = window.__mock.server.settings.attendance; return { enabled: a.enabled, d1open: a.codes.d1.open }; }), attBtns: !!(await p.$('[data-k="attCtl"]')), certSwDisabled: await p.$eval('.feat-sw[data-f="cert"]', e => e.disabled) };
    // التقارير والملفات والحضور معطّل: يجب أن تُنتج دون أخطاء
    const dls = []; p.on('download', dl => dls.push(dl.suggestedFilename()));
    A.exportsOff = await p.evaluate(async () => { const out = []; for (const f of [() => buildReportPdf('ar'), () => buildReportPdf('en'), () => exportReportCsv(), () => exportUsersCsv(), () => monitorBody()]) { try { await f(); out.push('ok'); } catch (e) { out.push('ERR ' + e.message); } } return out; });
    await p.waitForTimeout(1500); A.downloads = dls.slice(); A.modalErr = await p.evaluate(() => (document.querySelector('.modal') || {}).innerText || '');
    A.monitorNoAtt = await p.evaluate(() => !/متوسط الحضور|مستحقو الشهادة|الحضور حسب اليوم/.test(monitorBody()));
    // مكتبات PDF محجوبة في هذا الاختبار (لا شبكة) فتظهر رسالة تنبيه؛ نزيلها ونكمل
    await p.evaluate(() => document.querySelectorAll('.modal-back').forEach(e => e.remove()));
    await p.click('.feat-sw[data-f="enabled"]'); await p.waitForTimeout(400); await p.click('.feat-sw[data-f="cert"]'); await p.waitForTimeout(400);
    A.reenabled = await p.evaluate(() => { const a = window.__mock.server.settings.attendance; return { enabled: a.enabled, cert: a.cert }; });
    A.denied = await p.evaluate(() => window.__mock.denied); A.realNet = net.real; A.errs = errs; R.admin = A; await ctx.close();
  }
  console.log(JSON.stringify(R, null, 1)); await b.close();
})();

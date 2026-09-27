// فحص حقن الشيفرة (XSS): تُزرع حمولة في كل حقل يكتبه المتدرب (وحتى مفاتيح السجلات ورابط الصفحة)
// ثم تُفتح كل الشاشات كمتدرب وكمدرب وفي وضع العرض؛ أي تنفيذ يرفع العداد window.__xss
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'); const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, 'fbmock.js'), 'utf8');
const U = 'file://' + path.resolve(__dirname, '..', 'index.html');
const X = n => '<img src=x onerror="window.__xss=(window.__xss||[]).concat([\'' + n + '\'])">';
const BADKEY = 'k"><img src=x onerror=window.__xss=(window.__xss||[]).concat([\'key\'])>';
const uid = 'uV';
const post = n => ({ text: X('text-' + n), name: X('pname-' + n), role: X('prole-' + n), uid, ts: 2, summary: X('sum-' + n), answers: [X('ans0-' + n), X('ans1-' + n), 1, 0], members: { [uid]: true }, likes: { [uid]: true } });
const SEED = {
  admins: { adm1: true },
  users: { [uid]: { name: X('name'), role: X('role'), member: 1001, ts: 1, group: 1 }, [BADKEY]: { name: 'مفتاح', member: 1002, ts: 1 } },
  private: { [uid]: { f: { org: X('org'), email: X('email'), phone: X('phone'), sector: X('sector') }, consent: { privacy: 1 } } },
  posts: { a1e1: { [uid]: post('mcq') }, a1e3: { [uid]: post('text'), [BADKEY]: post('badkey') }, a1e4: { g1: Object.assign(post('fb'), { group: 1, by: uid }) }, a2e1: { g1: Object.assign(post('gtext'), { group: 1 }) }, a2e5: { [uid]: post('sim') }, act1: { [uid]: post('act') }, survey: { [uid]: Object.assign(post('survey'), { ratings: [5, 4], nps: 9 }) } },
  lab: { answers: { g1: { s1: { text: X('lab'), name: X('labname'), ts: 2 } } }, timers: { g1: { start: 1 } } },
  leads: { [uid]: { programs: [X('prog')], need: X('need'), contact: X('contact'), method: X('method'), name: X('lname'), org: X('lorg'), ts: 2 } },
  followups: { d30: { [uid]: { actions: X('fu'), win: X('win'), need: X('fneed'), sales: X('sales'), name: X('fname'), ts: 2 } } },
  assess: { pre: { [uid]: { answers: [0], done: true, name: X('asname'), ts: 2 } } },
  attendance: { [uid]: { d1: 4 } }, checkins: { d1: { [uid]: { code: X('code'), ts: 2 } } },
  assign: { [uid]: 1 }, storyLikes: { st1: { likes: { [uid]: true } } },
  meta: { memberCounter: 1002, schema: 2 }, stats: { registered: 2 },
  secure: { monitor: { enabled: true, token: 'tok' } },
  // ضابط إيجابي: محتوى يكتبه المدرب ويمر عبر المنظِّف (sanitize) — يكشف ضعف المنظِّف إن وُجد
  site: { home: { heroDesc: '<b>وصف</b>' + X('sanitizer-img') + '<a href="java&#115;cript:window.__xss=[1]">x</a><svg><a xlink:href="javascript:1"><text>y</text></a></svg>' } }
};
(async () => {
  const b = await chromium.launch(); const hits = new Set(); const R = { visited: [] };
  async function run(label, o, views) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 850 } }); const p = await ctx.newPage();
    await ctx.route(/firebaseio\.com|identitytoolkit|securetoken/, r => r.abort());
    await ctx.route(/firebase-app-compat\.js/, r => r.fulfill({ body: MOCK, contentType: 'application/javascript' }));
    await ctx.route(/firebase-(database|auth|app-check)-compat\.js/, r => r.fulfill({ body: '', contentType: 'application/javascript' }));
    await ctx.route(/fonts\.|cdnjs|translate\.google|^http:\/\/x\/|\/x$/, r => r.abort());
    await p.addInitScript(([d, x]) => { window.__MOCKCFG = Object.assign({ data: d, delayFirst: 50 }, x); }, [SEED, o.cfg || {}]);
    if (o.me) await p.addInitScript(me => { localStorage.setItem('ec_me', JSON.stringify(me)); localStorage.setItem('__mock_auth', JSON.stringify({ uid: me.uid, isAnonymous: true })); }, o.me);
    await p.goto(U + (o.hash || '')); await p.waitForTimeout(700);
    if (o.admin) { await p.click('[data-act="admin-enter"]'); await p.waitForTimeout(200); await p.click('[data-google]'); await p.waitForTimeout(900); }
    for (const v of views) { await p.evaluate(v => { if (typeof v === 'string') location.hash = v; }, v.hash || v); await p.waitForTimeout(350); if (v.run) { try { await p.evaluate(v.run); } catch (e) {} await p.waitForTimeout(350); } R.visited.push(label + ':' + (v.name || v.hash || v)); }
    (await p.evaluate(() => window.__xss || [])).forEach(x => hits.add(label + ' → ' + x)); await ctx.close();
  }
  const trainee = ['#v=home', '#v=landing', '#v=axis&id=a1', '#v=ex&id=a1e1', '#v=ex&id=a1e3', '#v=ex&id=a1e4', '#v=ex&id=a2e1', '#v=ex&id=a2e5', '#v=ex&id=act1', '#v=ex&id=survey', '#v=lab', '#v=account', '#v=assess&id=pre', '#v=story&id=st1', '#v=tools', '#v=followup&id=30'];
  await run('trainee', { me: { uid, name: 'x', member: 1001, ts: 5, code: 'AAAAAA' } }, trainee);
  await run('reflected-url', { hash: '#v=home&u=' + encodeURIComponent('"><img src=x onerror=window.__xss=["url"]>') }, ['#v=home', '#v=account']);
  const openAll = () => { UIState.openDrop = new Set(['users', 'ach', 'attSheet', 'asRes', 'leadsList', 'fuCtl', 'lbView', 'persons', 'cohList', 'bkList', 'attCtl']); ['g_users', 'g_sponsor', 'g_export', 'g_home', 'g_stories', 'g_axes', 'g_acts'].forEach(g => { UIState.adminGrp = g; App.render(); }); };
  const accs = () => { ['acts', 'survey', 'labAcc', 'a1', 'a2', 'a8'].forEach(k => UIState.openAcc.add(k)); UIState.adminGrp = 'g_axes'; App.render(); UIState.adminGrp = 'g_acts'; App.render(); };
  await run('trainer', { admin: true, cfg: { googleUser: { uid: 'adm1', email: 't@x' } } }, [{ hash: '#v=admin', name: 'admin-all-panels', run: openAll }, { hash: '#v=admin', name: 'admin-accordions', run: accs }, '#v=monitor&id=tok', '#v=ex&id=a1e3', '#v=ex&id=a1e4', '#v=lab', '#v=present', { hash: '#v=present', name: 'present-text', run: () => DB.set('settings/present', { ex: 'a1e3', q: 0 }) }, { hash: '#v=present', name: 'present-survey', run: () => DB.set('settings/present', { ex: 'survey', q: 0 }) }, { hash: '#v=present', name: 'present-lb', run: () => DB.set('settings/present', { ex: 'leaderboard', q: 0 }) }, { hash: '#v=admin', name: 'bell', run: () => { UIState.bellOpen = true; App.render(); } }]);
  R.xss = [...hits]; console.log(JSON.stringify(R, null, 1)); await b.close();
})();

'use strict';
/* =====================================================================
   تسريع التجارة الإلكترونية للمشاريع الصغيرة والمتوسطة — منصة تدريبية تفاعلية
   ملف واحد قائم بذاته (Vanilla JS) + Firebase Realtime Database
   ===================================================================== */

// ---------------------------------------------------------------------
// 1) إعدادات Firebase — التفعيل الحقيقي يعتمد على وجود databaseURL فقط
// ---------------------------------------------------------------------
const firebaseConfig = {
  databaseURL: "https://qbd-cdbc3-default-rtdb.firebaseio.com/",
  // لتفعيل دخول المدرب بحساب Firebase (Authentication): الصق هنا قيم تطبيق الويب من
  // Project settings ← Your apps ← Web app ← SDK setup and configuration ← Config
  apiKey: "AIzaSyAv5I2l27oF_ikZWOEI9kQHaqEuvHQUabo",
  authDomain: "qbd-cdbc3.firebaseapp.com",
  projectId: "qbd-cdbc3",
  appId: "1:333350563889:web:a9105017e189c6ac77a510"
};
// للاختبار الآلي فقط (محاكاة Firebase): لا يُستخدم في التشغيل العادي
try { if (window.__FB_TEST_CONFIG) Object.assign(firebaseConfig, window.__FB_TEST_CONFIG); } catch (e) {}
// ?demo=1 في الرابط يفرض وضع المحاكاة المحلي (للمعاينة دون لمس قاعدة البيانات الحقيقية)
const FORCE_DEMO = (function () { try { return /[?&]demo=1/.test(location.search); } catch (e) { return false; } })();
// وضع المحاكاة المحلي فقط عند طلبه صراحةً (?demo=1) أو عند غياب رابط القاعدة. إذا كان الرابط موجودًا
// فلا انتقال للتخزين المحلي أبدًا — حتى لو تعذر تحميل مكتبة Firebase أو تأخر الاتصال (يُعرض تنبيه وإعادة محاولة).
const DEMO_MODE = FORCE_DEMO || !firebaseConfig.databaseURL || firebaseConfig.databaseURL.indexOf('PASTE') !== -1;

const ADMIN_PASS = '3719'; // يُستخدم فقط في وضع المعاينة أو قبل تفعيل Firebase Authentication (عند غياب apiKey)
const BADGE_THRESHOLD = 0.8;          // 80% لفتح الوسام وتهنئة الإنجاز
const CONGRATS_DAYS_DEFAULT = 3;      // مدة بقاء التهنئة بعد انتهاء البرنامج
const MEMBER_NO_FLOOR = 0;            // حد أدنى صريح لرقم العضوية
const LAB_STAGE_MIN = 10;             // دقائق كل مرحلة في المختبر الختامي
const MAX_IMG_MB = 5;
const DEFAULT_GROUPS = 6;
const ATTEND_DAYS_DEFAULT = 2;        // أيام البرنامج
const ATTEND_HOURS_DEFAULT = 4;       // ساعات كل يوم
const CERT_THRESHOLD_DEFAULT = 90;    // نسبة الحضور المطلوبة لشهادة المشاركة

const AXIS_COLORS = ['#8A1538','#A8324F','#1F3A5F','#2F5D8A','#0E7C7B','#129C8E','#B5582A','#D07A32','#5B3A8A','#7652A8','#9A7412','#B8892A','#0F6E8C','#6B2D4A','#2B6E4F','#44506B'];
const UNIT_NAMES = {1:'اختيار منصات التجارة الإلكترونية المناسبة لنمو المشاريع',2:'الدفع الرقمي وتجارب إتمام الشراء الآمنة',3:'اللوجستيات والتنفيذ والتوصيل عبر الحدود',4:'التسويق المبني على البيانات واستقطاب العملاء',5:'بناء مسارات عمل قابلة للتوسع والكفاءة التشغيلية',6:'التحليلات ومتابعة الأداء وتخطيط النمو',7:'الذكاء الاصطناعي في التجارة الإلكترونية'};
const UNIT_KICKERS = {1:'الوحدة الأولى',2:'الوحدة الثانية',3:'الوحدة الثالثة',4:'الوحدة الرابعة',5:'الوحدة الخامسة',6:'الوحدة السادسة',7:'فصل خاص'};
const UNIT_IDS = [1, 2, 3, 4, 5, 6, 7];
const SLIDE_TYPES = {opening:'افتتاحية',hook:'افتتاحية بالأرقام',principle:'مبدأ علمي',framework:'إطار عمل',journey:'مسار ورحلة',numbers:'أرقام تهمّك',myth:'خرافة أم حقيقة',scenario:'موقف وقرار',versus:'قبل وبعد',examples:'أمثلة',tools:'أدوات',mistakes:'أخطاء وتصحيحات',checklist:'قائمة تحقق',summary:'خلاصة'};
const FORMATS = {text:'نصية حرة',mcq:'اختيار من متعدد',truefalse:'صح أم خطأ',fillblank:'إكمال الفراغ',comparePairs:'مقارنة نقيضين',sim:'محاكاة تفاعلية'};
const FORMAT_MODE = {mcq:'individual',truefalse:'individual',fillblank:'group',comparePairs:'group'};

// ---------------------------------------------------------------------
// 2) طبقات آمنة للتخزين والتاريخ (بعض البيئات المعزولة ترمي SecurityError)
// ---------------------------------------------------------------------
const memStore = {};
function mkSafeStore(getter) {
  return {
    get(k) { try { const s = getter(); return s ? s.getItem(k) : (k in memStore ? memStore[k] : null); } catch (e) { return k in memStore ? memStore[k] : null; } },
    set(k, v) { memStore[k] = v; try { const s = getter(); if (s) s.setItem(k, v); } catch (e) {} },
    del(k) { delete memStore[k]; try { const s = getter(); if (s) s.removeItem(k); } catch (e) {} }
  };
}
const SafeLS = mkSafeStore(() => window.localStorage);
const SafeSS = mkSafeStore(() => window.sessionStorage);
const Cookie = {
  get(k) { try { const m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : null; } catch (e) { return null; } },
  set(k, v, days = 365) { try { document.cookie = k + '=' + encodeURIComponent(v) + '; max-age=' + (days * 86400) + '; path=/; SameSite=Lax'; } catch (e) {} },
  del(k) { try { document.cookie = k + '=; max-age=0; path=/'; } catch (e) {} }
};
const SafeHist = {
  push(state, url) { try { history.pushState(state, '', url); return true; } catch (e) { SafeHist._fallback = state; return false; } },
  replace(state, url) { try { history.replaceState(state, '', url); return true; } catch (e) { SafeHist._fallback = state; return false; } },
  state() { try { return history.state || SafeHist._fallback || null; } catch (e) { return SafeHist._fallback || null; } }
};
function getHashParams() { try { const h = (location.hash || '').replace(/^#/, ''); const o = {}; h.split('&').forEach(p => { const [k, v] = p.split('='); if (k) o[k] = decodeURIComponent(v || ''); }); return o; } catch (e) { return {}; } }
function buildHash(params) { return '#' + Object.keys(params).filter(k => params[k] != null && params[k] !== '').map(k => k + '=' + encodeURIComponent(params[k])).join('&'); }

// ---------------------------------------------------------------------
// 3) أدوات عامة
// ---------------------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function stripHtml(s) { const d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
function genId(p = '') { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function arr(v) { if (!v) return []; if (Array.isArray(v)) return v.filter(x => x != null); if (typeof v === 'object') return Object.keys(v).sort((a, b) => (+a) - (+b)).map(k => v[k]).filter(x => x != null); return []; }
function ansList(v, n) { if (!v) return n ? new Array(n).fill(null) : []; const keys = Object.keys(v).map(Number).filter(k => !isNaN(k)); const len = n || (keys.length ? Math.max(...keys) + 1 : 0); const out = []; for (let i = 0; i < len; i++) { const x = v[i]; out.push(x === undefined ? null : x); } return out; }
function clean(o) { return o === undefined ? null : JSON.parse(JSON.stringify(o)); }
function clip(s, n) { s = String(s || ''); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 20)) + '…'; }
function pad4(n) { return String(n).padStart(4, '0'); }
function fmtDate(ts) { const d = new Date(ts || Date.now()); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
function fmtTime(ts) { const d = new Date(ts); const p = n => String(n).padStart(2, '0'); return p(d.getHours()) + ':' + p(d.getMinutes()) + ' — ' + fmtDate(ts); }
function ago(ts) { const s = Math.max(0, Math.round((Date.now() - ts) / 1000)); if (s < 60) return 'قبل ' + s + ' ث'; if (s < 3600) return 'قبل ' + Math.round(s / 60) + ' د'; if (s < 86400) return 'قبل ' + Math.round(s / 3600) + ' س'; return fmtDate(ts); }
function mmss(ms) { ms = Math.max(0, ms); const t = Math.ceil(ms / 1000); const m = Math.floor(t / 60), s = t % 60; return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); }
function initials(n) { n = (n || '?').trim(); return n.charAt(0); }
function shade(hex, amt) { // amt: -1..1
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  return '#' + [f(r), f(g), f(b)].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
function tint(hex, a) { let c = hex.replace('#', ''); const n = parseInt(c, 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
// ترتيب عشوائي ثابت لكل بذرة (لخلط أسئلة وخيارات التقييم لكل متدرب)
function seededOrder(n, seed) { let x = 7; for (const ch of String(seed)) x = (x * 31 + ch.charCodeAt(0)) % 1000003; const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; }; const o = []; for (let i = 0; i < n; i++) o.push(i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function loadScript(src) {
  loadScript.cache = loadScript.cache || {};
  if (loadScript.cache[src]) return loadScript.cache[src];
  loadScript.cache[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete loadScript.cache[src]; rej(new Error('تعذر تحميل المكتبة')); }; document.head.appendChild(s); });
  return loadScript.cache[src];
}
function downloadBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

// ---------------------------------------------------------------------
// 4) قاعدة البيانات — نفس الواجهة البرمجية للوضع الحقيقي ووضع المحاكاة
// ---------------------------------------------------------------------
const DB = (function () {
  const norm = p => String(p || '').replace(/^\/+|\/+$/g, '');
  // ---- حالة الاتصال والكتابات المعلقة (تعرضها الواجهة وتنبّه عند الإغلاق) ----
  const status = { ready: false, connected: false, pending: 0, wasOffline: false, lib: true, listeners: [] };
  const emit = () => status.listeners.forEach(fn => { try { fn(status); } catch (e) { console.error(e); } });
  // منع أي كتابة على جذر القاعدة، وأي تحديث متعدد المسارات يستبدل عقدة كاملة من المستوى الأعلى دون إذن صريح
  function guard(op, path, obj, o) {
    const p = norm(path);
    if (!p && op !== 'update') throw new Error('DB: ممنوع ' + op + ' على جذر القاعدة');
    if (op === 'update') Object.keys(obj || {}).forEach(k => {
      const full = norm((p ? p + '/' : '') + k); if (!full) throw new Error('DB: مفتاح فارغ في التحديث');
      if (!p && full.indexOf('/') === -1 && !(o && o.allowTopLevel)) throw new Error('DB: استبدال العقدة «' + full + '» كاملة غير مسموح هنا');
    });
    if (!status.ready && !(o && o.beforeReady)) { const e = new Error('لم تكتمل قراءة البيانات من الخادم بعد — انتظر لحظات ثم أعد المحاولة'); if (DB.onReject) DB.onReject(e, path); return Promise.reject(e); }
    return null;
  }
  function track(promise, desc, o) {
    status.pending++; emit();
    return promise.then(v => { status.pending--; if (!status.pending && status.wasOffline && status.connected) { status.wasOffline = false; if (DB.onSynced) DB.onSynced(); } emit(); return v; },
      e => { status.pending--; emit(); if (DB.onReject && !(o && o.quiet)) DB.onReject(e, desc); throw e; });
  }
  if (!DEMO_MODE) {
    if (typeof firebase === 'undefined') {
      // تعذر تحميل مكتبة الاتصال: لا تخزين محلي ولا كتابة — القراءة تنتظر، والكتابة تُرفض برسالة واضحة
      status.lib = false;
      const fail = () => Promise.reject(new Error('تعذر تحميل مكتبة الاتصال بقاعدة البيانات'));
      return { real: true, status, onStatus(fn) { status.listeners.push(fn); }, markReady() {}, watch() { return () => {}; }, get() { return new Promise(() => {}); }, set: fail, update: fail, remove: fail, push: fail, transaction: fail, now() { return Date.now(); } };
    }
    firebase.initializeApp(Object.fromEntries(Object.entries(firebaseConfig).filter(([, v]) => v)));
    const db = firebase.database();
    let offset = 0;
    db.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });
    db.ref('.info/connected').on('value', s => { const c = !!s.val(); if (!c && status.ready) status.wasOffline = true; status.connected = c; emit(); if (c && status.wasOffline && !status.pending) { status.wasOffline = false; if (DB.onSynced) DB.onSynced(); } });
    return {
      real: true, status,
      onStatus(fn) { status.listeners.push(fn); },
      markReady() { status.ready = true; emit(); },
      watch(path, cb, onErr) { const ref = db.ref(norm(path)); const fn = s => cb(s.val()); ref.on('value', fn, e => { console.warn('watch', path, e); if (onErr) onErr(e); }); return () => ref.off('value', fn); },
      get(path) { return db.ref(norm(path)).once('value').then(s => s.val()); },
      set(path, v, o) { const g = guard('set', path, null, o); if (g) return g; return track(db.ref(norm(path)).set(clean(v)), path, o); },
      update(path, obj, o) { const g = guard('update', path, obj, o); if (g) return g; return track(norm(path) ? db.ref(norm(path)).update(clean(obj)) : db.ref().update(clean(obj)), path || Object.keys(obj).join(','), o); },
      remove(path, o) { const g = guard('remove', path, null, o); if (g) return g; return track(db.ref(norm(path)).remove(), path, o); },
      push(path, v) { const g = guard('push', path); if (g) return g; const r = db.ref(norm(path)).push(); return track(r.set(clean(v)), path).then(() => r.key); },
      transaction(path, fn, o) { const g = guard('transaction', path, null, o); if (g) return g; return track(db.ref(norm(path)).transaction(fn).then(r => r.snapshot.val()), path, o); },
      now() { return Date.now() + offset; }
    };
  }
  // ---- وضع المحاكاة المحلي (localStorage) — يطلق المراقبات بشكل متزامن فور التسجيل ----
  const KEY = 'qdb_ecom_demo_db';
  let tree = {};
  try { tree = JSON.parse(SafeLS.get(KEY) || '{}') || {}; } catch (e) { tree = {}; }
  const watchers = [];
  const segs = p => norm(p).split('/').filter(Boolean);
  function getAt(p) { let n = tree; for (const s of segs(p)) { if (n == null || typeof n !== 'object') return null; n = n[s]; } return n === undefined ? null : n; }
  function setAt(p, v) {
    const s = segs(p); if (!s.length) { tree = v == null ? {} : clean(v); return; }
    let n = tree; for (let i = 0; i < s.length - 1; i++) { if (n[s[i]] == null || typeof n[s[i]] !== 'object') n[s[i]] = {}; n = n[s[i]]; }
    if (v == null) delete n[s[s.length - 1]]; else n[s[s.length - 1]] = clean(v);
    prune(tree);
  }
  function prune(o) { if (!o || typeof o !== 'object') return; Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object') { prune(o[k]); if (!Object.keys(o[k]).length) delete o[k]; } }); }
  function persist() { try { SafeLS.set(KEY, JSON.stringify(tree)); } catch (e) { console.warn('local db too large', e); } }
  function related(a, b) { a = norm(a); b = norm(b); return !a || !b || a === b || a.startsWith(b + '/') || b.startsWith(a + '/'); }
  function notify(changed) { watchers.slice().forEach(w => { if (w.alive && related(w.path, changed)) { try { w.cb(clone(getAt(w.path))); } catch (e) { console.error(e); } } }); }
  const clone = v => v == null ? null : JSON.parse(JSON.stringify(v));
  window.addEventListener('storage', e => { if (e.key === KEY) { try { tree = JSON.parse(e.newValue || '{}') || {}; } catch (er) {} notify(''); } });
  status.connected = true;
  const lguard = (op, path, obj, o) => { const p = norm(path); if (!p && op !== 'update') throw new Error('DB: ممنوع ' + op + ' على جذر القاعدة'); if (op === 'update') Object.keys(obj || {}).forEach(k => { const full = norm((p ? p + '/' : '') + k); if (!full) throw new Error('DB: مفتاح فارغ'); if (!p && full.indexOf('/') === -1 && !(o && o.allowTopLevel)) throw new Error('DB: استبدال العقدة «' + full + '» كاملة غير مسموح هنا'); }); };
  return {
    real: false, status,
    onStatus(fn) { status.listeners.push(fn); },
    markReady() { status.ready = true; },
    watch(path, cb) { const w = { path, cb, alive: true }; watchers.push(w); try { cb(clone(getAt(path))); } catch (e) { console.error(e); } return () => { w.alive = false; const i = watchers.indexOf(w); if (i > -1) watchers.splice(i, 1); }; },
    get(path) {
      // قراءة لمرة واحدة: علم بولياني منفصل بدل استدعاء دالة الإلغاء داخل تعريفها (تفادي TDZ)
      return new Promise(res => { let called = false; let un = null; un = this.watch(path, v => { if (called) return; called = true; res(v); if (un) un(); }); if (called && un) un(); });
    },
    set(path, v, o) { lguard('set', path, null, o); setAt(path, v); persist(); notify(path); return Promise.resolve(); },
    update(path, obj, o) { lguard('update', path, obj, o); const base = norm(path); Object.keys(obj || {}).forEach(k => setAt(base ? base + '/' + k : k, obj[k])); persist(); Object.keys(obj || {}).forEach(k => notify(base ? base + '/' + k : k)); return Promise.resolve(); },
    remove(path, o) { lguard('remove', path, null, o); setAt(path, null); persist(); notify(path); return Promise.resolve(); },
    push(path, v) { const k = genId('k'); return this.set(norm(path) + '/' + k, v).then(() => k); },
    transaction(path, fn) { const nv = fn(clone(getAt(path))); if (nv !== undefined) { setAt(path, nv); persist(); notify(path); } return Promise.resolve(clone(getAt(path))); },
    now() { return Date.now(); }
  };
})();

// ---------------------------------------------------------------------
// 5) نوافذ داخل الصفحة (بدل alert/confirm/prompt الأصلية) + إشعار سريع
// ---------------------------------------------------------------------
const UI = {
  modal(html, opts = {}) {
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog">' + html + '</div>';
    document.body.appendChild(back);
    const close = () => { back.remove(); if (opts.onClose) opts.onClose(); };
    if (!opts.sticky) back.addEventListener('click', e => { if (e.target === back) close(); });
    const api = { el: back.firstChild, close };
    if (opts.onMount) opts.onMount(api);
    return api;
  },
  alert(msg, title = 'تنبيه') {
    return new Promise(res => { const m = UI.modal('<h3>' + h(title) + '</h3><div>' + msg + '</div><div class="actions"><button class="btn btn-primary" data-ok>حسنًا</button></div>', { onClose: res }); $('[data-ok]', m.el).onclick = () => m.close(); });
  },
  confirm(msg, o = {}) {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      const m = UI.modal('<h3>' + h(o.title || 'تأكيد') + '</h3><div>' + msg + '</div><div class="actions"><button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + h(o.ok || 'تأكيد') + '</button><button class="btn btn-ghost" data-no>إلغاء</button></div>', { onClose: () => fin(false) });
      $('[data-ok]', m.el).onclick = () => { fin(true); m.close(); };
      $('[data-no]', m.el).onclick = () => m.close();
    });
  },
  prompt(msg, o = {}) {
    return new Promise(res => {
      let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      const m = UI.modal('<h3>' + h(o.title || '') + '</h3><div>' + msg + '</div><div class="field" style="margin-top:12px"><input data-in type="' + (o.type || 'text') + '" inputmode="' + (o.inputmode || 'text') + '" placeholder="' + h(o.placeholder || '') + '" value="' + h(o.value || '') + '"></div><div class="actions"><button class="btn btn-primary" data-ok>' + h(o.ok || 'متابعة') + '</button><button class="btn btn-ghost" data-no>إلغاء</button></div>', { onClose: () => fin(null) });
      const inp = $('[data-in]', m.el); setTimeout(() => inp.focus(), 50);
      const ok = () => { fin(inp.value); m.close(); };
      $('[data-ok]', m.el).onclick = ok; inp.onkeydown = e => { if (e.key === 'Enter') ok(); };
      $('[data-no]', m.el).onclick = () => m.close();
    });
  },
  toast(msg, ms = 2600) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
};

// محاكاة firebase-app-compat + database-compat + auth-compat (تُحقن بدل ملفات المكتبة عبر Playwright route)
// تطبّق قواعد Realtime Database الفعلية (قراءة وكتابة) بمقيّم تعابير، وتحاكي الاتصال البطيء والانقطاع والجلسات.
// التحكم: window.__MOCKCFG قبل التحميل، و window.__mock بعده.
(function () {
  const cfg = Object.assign({ delayFirst: 0, connected: true, data: {}, rejectWrites: false, ackDelay: 30, rules: null, authUsers: {}, googleUser: null }, window.__MOCKCFG || {});
  const clone = v => v == null ? null : JSON.parse(JSON.stringify(v));
  const segs = p => String(p || '').split('/').filter(Boolean);
  const getAt = (t, p) => { let n = t; for (const s of segs(p)) { if (n == null || typeof n !== 'object') return null; n = n[s]; } return n === undefined ? null : n; };
  const prune = o => { if (!o || typeof o !== 'object') return; Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object') { prune(o[k]); if (!Object.keys(o[k]).length) delete o[k]; } }); };
  const setAt = (t, p, v) => { const s = segs(p); if (!s.length) return v == null ? {} : clone(v); let n = t; for (let i = 0; i < s.length - 1; i++) { if (n[s[i]] == null || typeof n[s[i]] !== 'object') n[s[i]] = {}; n = n[s[i]]; } if (v == null) delete n[s[s.length - 1]]; else n[s[s.length - 1]] = clone(v); prune(t); return t; };
  // حالة الخادم مشتركة بين الصفحات عبر localStorage (لمحاكاة زائرين على نفس القاعدة)
  const SKEY = '__mock_server';
  let initial = clone(cfg.data) || {}; try { const s = localStorage.getItem(SKEY); if (s && cfg.shared) initial = JSON.parse(s); } catch (e) {}
  const M = window.__mock = { server: initial, pending: [], writes: [], attempts: [], denied: [], deniedReads: [], loaded: false, connected: cfg.connected, rejectWrites: cfg.rejectWrites, listeners: [], connListeners: [], authUser: null };
  const persistServer = () => { if (cfg.shared) try { localStorage.setItem(SKEY, JSON.stringify(M.server)); } catch (e) {} };
  function applyOp(t, op) { if (op.kind === 'set') return setAt(t, op.path, op.value); if (op.kind === 'update') { Object.keys(op.value).forEach(k => { t = setAt(t, (op.path ? op.path + '/' : '') + k, op.value[k]); }); } return t; }
  const view = () => { let t = clone(M.server) || {}; M.pending.forEach(op => { t = applyOp(t, op); }); return t; };

  // ---------- مقيّم القواعد ----------
  if (!String.prototype.beginsWith) Object.defineProperty(String.prototype, 'beginsWith', { value: function (x) { return this.startsWith(x); } });
  if (!String.prototype.matches) Object.defineProperty(String.prototype, 'matches', { value: function (re) { return re.test(String(this)); } });
  function Snap(tree, path) { this._t = tree; this._p = segs(path).join('/'); }
  Snap.prototype.val = function () { return clone(getAt(this._t, this._p)); };
  Snap.prototype.exists = function () { return getAt(this._t, this._p) != null; };
  Snap.prototype.child = function (p) { return new Snap(this._t, this._p + '/' + p); };
  Snap.prototype.hasChild = function (k) { return this.child(k).exists(); };
  Snap.prototype.isNumber = function () { return typeof getAt(this._t, this._p) === 'number'; };
  Snap.prototype.isString = function () { return typeof getAt(this._t, this._p) === 'string'; };
  function evalRule(expr, vars, ctx) {
    if (expr === true || expr === 'true') return true; if (expr == null || expr === false || expr === 'false') return false;
    const names = Object.keys(vars); try { return !!(new Function('auth', 'root', 'data', 'newData', ...names, 'return (' + expr + ');'))(ctx.auth, ctx.root, ctx.data, ctx.newData, ...names.map(n => vars[n])); } catch (e) { return false; }
  }
  function walk(path, kind, oldT, newT) {
    if (!cfg.rules) return true;
    const s = segs(path); let node = cfg.rules.rules; const vars = {}; const auth = M.authUser ? { uid: M.authUser.uid } : null;
    const at = i => { const p = s.slice(0, i).join('/'); return { auth, root: new Snap(oldT, ''), data: new Snap(oldT, p), newData: new Snap(newT || oldT, p) }; };
    if (node && evalRule(node[kind], vars, at(0))) return true;
    for (let i = 0; i < s.length; i++) {
      if (!node) return false; let next = node[s[i]];
      if (next === undefined) { const w = Object.keys(node).find(k => k.charAt(0) === '$'); if (!w) return false; vars[w] = s[i]; next = node[w]; }
      node = next; if (node && evalRule(node[kind], vars, at(i + 1))) return true;
    }
    return false;
  }
  function allowed(op) { const oldT = M.server; const newT = applyOp(clone(M.server) || {}, op); if (op.kind === 'update') return Object.keys(op.value).every(k => walk((op.path ? op.path + '/' : '') + k, '.write', oldT, newT)); return walk(op.path, '.write', oldT, newT); }
  const canRead = path => walk(path, '.read', M.server, null);

  function fire() { if (!M.loaded) return; const v = view(); M.listeners.forEach(l => { if (!canRead(l.path)) { if (!l.denied) { l.denied = true; M.deniedReads.push(l.path); if (l.err) l.err(Object.assign(new Error('permission_denied'), { code: 'PERMISSION_DENIED' })); } return; } l.denied = false; try { l.cb(snap(getAt(v, l.path), l.path)); } catch (e) { console.error(e); } }); }
  function fireConn() { M.connListeners.forEach(cb => cb(snap(M.connected && M.loaded))); }
  const snap = (v, path) => ({ val: () => clone(v), key: segs(path).pop() || null });
  function flush() {
    if (!M.connected || !M.loaded) return;
    const ops = M.pending.slice(); M.pending = [];
    ops.forEach(op => setTimeout(() => {
      if (M.rejectWrites || !allowed(op)) { M.denied.push(op.path + (op.kind === 'update' ? ' {' + Object.keys(op.value).join(',') + '}' : '')); fire(); op.reject(Object.assign(new Error('PERMISSION_DENIED: Permission denied'), { code: 'PERMISSION_DENIED' })); return; }
      M.server = applyOp(M.server, op); persistServer(); if (window.__srvPush) try { window.__srvPush(JSON.stringify(M.server)); } catch (e) {} M.writes.push({ kind: op.kind, path: op.path || '(root)', keys: op.kind === 'update' ? Object.keys(op.value) : null, t: Date.now() }); fire(); op.resolve();
    }, cfg.ackDelay));
  }
  function queue(kind, path, value) { return new Promise((resolve, reject) => { const op = { kind, path, value: clone(value), resolve, reject }; M.attempts.push({ kind, path: path || '(root)', t: Date.now() }); M.pending.push(op); fire(); flush(); }); }
  M.replace = json => { M.server = JSON.parse(json) || {}; fire(); };
  M.load = () => { M.loaded = true; fireConn(); fire(); flush(); };
  M.setConnected = c => { M.connected = c; fireConn(); if (c && !M.loaded) M.load(); else if (c) flush(); };
  setTimeout(() => { if (M.connected) M.load(); }, cfg.delayFirst);
  window.addEventListener('storage', e => { if (e.key === SKEY && cfg.shared) { try { M.server = JSON.parse(e.newValue || '{}'); } catch (er) {} fire(); } });
  function ref(path) {
    path = segs(path).join('/');
    return {
      key: segs(path).pop() || null,
      on(ev, cb, err) { if (path === '.info/connected') { M.connListeners.push(cb); cb(snap(M.connected && M.loaded)); return cb; } if (path === '.info/serverTimeOffset') { cb(snap(0)); return cb; } const l = { path, cb, err }; M.listeners.push(l); if (M.loaded) fire(); return cb; },
      off(ev, cb) { M.listeners = M.listeners.filter(l => !(l.path === path && (!cb || l.cb === cb))); M.connListeners = M.connListeners.filter(x => x !== cb); },
      once() { return new Promise((res, rej) => { const tick = () => { if (M.loaded && M.connected) { if (!canRead(path)) { M.deniedReads.push(path); return rej(Object.assign(new Error('permission_denied'), { code: 'PERMISSION_DENIED' })); } res(snap(getAt(view(), path), path)); } else setTimeout(tick, 50); }; tick(); }); },
      set(v) { return queue('set', path, v); },
      update(o) { return queue('update', path, o); },
      remove() { return queue('set', path, null); },
      push() { return ref(path + '/p' + Math.random().toString(36).slice(2, 10)); },
      transaction(fn) { return new Promise((res, rej) => { const run = () => { if (!(M.loaded && M.connected)) return setTimeout(run, 50); const cur = getAt(view(), path); const nv = fn(clone(cur)); if (nv === undefined) return res({ committed: false, snapshot: snap(cur, path) }); queue('set', path, nv).then(() => res({ committed: true, snapshot: snap(nv, path) }), rej); }; run(); }); }
    };
  }
  // ---------- محاكاة Firebase Authentication (تُحفظ الجلسة عبر إعادة التحميل مثل المكتبة الحقيقية) ----------
  const AKEY = '__mock_auth';
  try { const a = localStorage.getItem(AKEY); if (a) M.authUser = JSON.parse(a); } catch (e) {}
  const authCbs = [];
  const setUser = u => { M.authUser = u; try { if (u) localStorage.setItem(AKEY, JSON.stringify(u)); else localStorage.removeItem(AKEY); } catch (e) {} authCbs.forEach(cb => cb(u)); fire(); };
  const auth = {
    onAuthStateChanged(cb) { authCbs.push(cb); setTimeout(() => cb(M.authUser), 10); return () => {}; },
    signInAnonymously() { if (cfg.noAnonymous) return Promise.reject(Object.assign(new Error('op'), { code: 'auth/operation-not-allowed' })); const u = { uid: 'anon' + Math.random().toString(36).slice(2, 12), isAnonymous: true }; setTimeout(() => setUser(u), 5); return Promise.resolve({ user: u }); },
    signInWithEmailAndPassword(email, pass) { const u = (cfg.authUsers || {})[email]; if (!u || u.pass !== pass) return Promise.reject(Object.assign(new Error('bad'), { code: 'auth/invalid-credential' })); const x = { uid: u.uid, email, isAnonymous: false }; setUser(x); return Promise.resolve({ user: x }); },
    signOut() { setUser(null); return Promise.resolve(); },
    sendPasswordResetEmail() { return Promise.resolve(); },
    signInWithPopup() { const g = cfg.googleUser; if (!g) return Promise.reject(Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' })); const x = { uid: g.uid, email: g.email, isAnonymous: false }; setUser(x); return Promise.resolve({ user: x }); },
    signInWithRedirect() { return Promise.resolve(); }
  };
  function GoogleAuthProvider() { this.setCustomParameters = () => {}; }
  const authFn = () => auth; authFn.GoogleAuthProvider = GoogleAuthProvider;
  window.firebase = { initializeApp() { return {}; }, database() { return { ref: p => ref(p || '') }; }, auth: authFn };
})();

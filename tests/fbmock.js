// محاكاة firebase-app-compat + firebase-database-compat (تُحقن بدل ملفات المكتبة عبر Playwright route)
// التحكم عبر window.__MOCKCFG قبل التحميل وعبر window.__mock بعده
(function () {
  const cfg = Object.assign({ delayFirst: 0, connected: true, data: {}, rejectWrites: false, ackDelay: 30 }, window.__MOCKCFG || {});
  const clone = v => v == null ? null : JSON.parse(JSON.stringify(v));
  const segs = p => String(p || '').split('/').filter(Boolean);
  const getAt = (t, p) => { let n = t; for (const s of segs(p)) { if (n == null || typeof n !== 'object') return null; n = n[s]; } return n === undefined ? null : n; };
  const setAt = (t, p, v) => { const s = segs(p); if (!s.length) return v == null ? {} : clone(v); let n = t; for (let i = 0; i < s.length - 1; i++) { if (n[s[i]] == null || typeof n[s[i]] !== 'object') n[s[i]] = {}; n = n[s[i]]; } if (v == null) delete n[s[s.length - 1]]; else n[s[s.length - 1]] = clone(v); return t; };
  const M = window.__mock = { server: clone(cfg.data) || {}, pending: [], writes: [], attempts: [], loaded: false, connected: cfg.connected, rejectWrites: cfg.rejectWrites, listeners: [], connListeners: [], log: [] };
  const view = () => { let t = clone(M.server) || {}; M.pending.forEach(op => { t = applyOp(t, op); }); return t; };
  function applyOp(t, op) { if (op.kind === 'set') return setAt(t, op.path, op.value); if (op.kind === 'update') { Object.keys(op.value).forEach(k => { t = setAt(t, (op.path ? op.path + '/' : '') + k, op.value[k]); }); return t; } return t; }
  function fire() { if (!M.loaded) return; const v = view(); M.listeners.forEach(l => { try { l.cb(snap(getAt(v, l.path), l.path)); } catch (e) { console.error(e); } }); }
  function fireConn() { M.connListeners.forEach(cb => cb(snap(M.connected && M.loaded))); }
  const snap = (v, path) => ({ val: () => clone(v), key: segs(path).pop() || null });
  // مقيّم مبسّط لقواعد Realtime Database (.write فقط): true/false، شرط الأدمن، و!newData.exists()
  function ruleOk(expr, ctx) {
    if (expr === true || expr === 'true') return true; if (expr === false || expr === 'false' || expr == null) return false;
    let ok = true; const e = String(expr);
    if (/auth != null/.test(e)) ok = ok && !!M.authUser;
    if (/root\.child\('admins'\)\.child\(auth\.uid\)\.val\(\) === true/.test(e)) ok = ok && !!M.authUser && getAt(M.server, 'admins/' + M.authUser.uid) === true;
    if (/!newData\.exists\(\)/.test(e)) ok = ok && ctx.value == null;
    if (/\$node\.matches/.test(e)) { const m = e.match(/\^\((.*)\)\$/); ok = ok && m && m[1].split('|').indexOf(ctx.top) > -1; }
    return ok;
  }
  function canWrite(path, value) {
    if (!cfg.rules) return true; const s = segs(path); let node = cfg.rules.rules; const ctx = { value, top: s[0] };
    if (ruleOk(node['.write'], ctx)) return true;
    for (const seg of s) { if (!node) return false; const next = node[seg] !== undefined ? node[seg] : node[Object.keys(node).find(k => k.charAt(0) === '$')]; node = next; if (node && ruleOk(node['.write'], ctx)) return true; }
    return false;
  }
  function allowed(op) { if (op.kind === 'update') return Object.keys(op.value).every(k => canWrite((op.path ? op.path + '/' : '') + k, op.value[k])); return canWrite(op.path, op.value); }
  function flush() {
    if (!M.connected || !M.loaded) return;
    const ops = M.pending.slice(); M.pending = [];
    ops.forEach(op => setTimeout(() => {
      if (M.rejectWrites || !allowed(op)) { M.denied = (M.denied || []).concat([op.path + (op.kind === 'update' ? ' {' + Object.keys(op.value).join(',') + '}' : '')]); M.log.push('rejected ' + op.path); fire(); op.reject(Object.assign(new Error('PERMISSION_DENIED: Permission denied'), { code: 'PERMISSION_DENIED' })); return; }
      M.server = applyOp(M.server, op); M.writes.push({ kind: op.kind, path: op.path || '(root)', keys: op.kind === 'update' ? Object.keys(op.value) : null, t: Date.now() }); fire(); op.resolve();
    }, cfg.ackDelay));
  }
  function queue(kind, path, value) {
    return new Promise((resolve, reject) => { const op = { kind, path, value: clone(value), resolve, reject }; M.attempts.push({ kind, path: path || '(root)', t: Date.now() }); M.pending.push(op); fire(); flush(); });
  }
  M.setConnected = c => { M.connected = c; fireConn(); if (c) flush(); };
  M.load = () => { M.loaded = true; fireConn(); fire(); flush(); };
  setTimeout(() => { if (M.connected) M.load(); }, cfg.delayFirst);
  const origSet = M.setConnected; M.setConnected = c => { origSet(c); if (c && !M.loaded) M.load(); };
  function ref(path) {
    path = segs(path).join('/');
    return {
      key: segs(path).pop() || null,
      on(ev, cb) { if (path === '.info/connected') { M.connListeners.push(cb); cb(snap(M.connected && M.loaded)); return cb; } if (path === '.info/serverTimeOffset') { cb(snap(0)); return cb; } const l = { path, cb }; M.listeners.push(l); if (M.loaded) cb(snap(getAt(view(), path), path)); return cb; },
      off(ev, cb) { M.listeners = M.listeners.filter(l => !(l.path === path && (!cb || l.cb === cb))); M.connListeners = M.connListeners.filter(x => x !== cb); },
      once() { return new Promise(res => { const tick = () => { if (M.loaded && M.connected) res(snap(getAt(view(), path), path)); else setTimeout(tick, 50); }; tick(); }); },
      set(v) { return queue('set', path, v); },
      update(o) { return queue('update', path, o); },
      remove() { return queue('set', path, null); },
      push() { const k = 'p' + Math.random().toString(36).slice(2, 10); const r = ref(path + '/' + k); return r; },
      transaction(fn) { return new Promise((res, rej) => { const run = () => { if (!(M.loaded && M.connected)) return setTimeout(run, 50); const cur = getAt(view(), path); const nv = fn(clone(cur)); if (nv === undefined) return res({ committed: false, snapshot: snap(cur, path) }); queue('set', path, nv).then(() => res({ committed: true, snapshot: snap(nv, path) }), rej); }; run(); }); }
    };
  }
  // محاكاة Firebase Authentication (بريد وكلمة مرور)
  M.authUser = null; const authCbs = [];
  const auth = {
    onAuthStateChanged(cb) { authCbs.push(cb); setTimeout(() => cb(M.authUser), 10); return () => {}; },
    signInWithEmailAndPassword(email, pass) { const u = (cfg.authUsers || {})[email]; if (!u || u.pass !== pass) return Promise.reject(Object.assign(new Error('bad'), { code: 'auth/invalid-credential' })); M.authUser = { uid: u.uid, email }; authCbs.forEach(cb => cb(M.authUser)); return Promise.resolve({ user: M.authUser }); },
    signOut() { M.authUser = null; authCbs.forEach(cb => cb(null)); return Promise.resolve(); },
    sendPasswordResetEmail() { return Promise.resolve(); },
    signInWithPopup() { const g = cfg.googleUser; if (!g) return Promise.reject(Object.assign(new Error('closed'), { code: 'auth/popup-closed-by-user' })); M.authUser = { uid: g.uid, email: g.email }; authCbs.forEach(cb => cb(M.authUser)); return Promise.resolve({ user: M.authUser }); },
    signInWithRedirect() { return Promise.resolve(); }
  };
  function GoogleAuthProvider() { this.setCustomParameters = () => {}; }
  const authFn = () => auth; authFn.GoogleAuthProvider = GoogleAuthProvider;
  window.firebase = { initializeApp() { return {}; }, database() { return { ref: p => ref(p || '') }; }, auth: authFn };
})();

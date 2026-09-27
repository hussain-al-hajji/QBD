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
  function flush() {
    if (!M.connected || !M.loaded) return;
    const ops = M.pending.slice(); M.pending = [];
    ops.forEach(op => setTimeout(() => {
      if (M.rejectWrites) { M.log.push('rejected ' + op.path); fire(); op.reject(Object.assign(new Error('PERMISSION_DENIED: Permission denied'), { code: 'PERMISSION_DENIED' })); return; }
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
  window.firebase = { initializeApp() { return {}; }, database() { return { ref: p => ref(p || '') }; } };
})();

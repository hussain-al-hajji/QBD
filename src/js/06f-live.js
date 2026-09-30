// ---------------------------------------------------------------------
// الحضور الحي على صفحات التمارين + دعوة المدرب للانضمام إلى تمرين
// ---------------------------------------------------------------------
// عقد أُضيفت بعد النسخة الأولى من القواعد: رفض الكتابة فيها يعني غالبًا أن القواعد المنشورة قديمة
const NEW_RULE_NODES = ['presence', 'invite', 'removed'];
const RULES_HELP = 'غالبًا لأن قواعد Firebase المنشورة أقدم من هذه النسخة من المنصة.<br><b>الحل:</b> Firebase Console ← Realtime Database ← <b>Rules</b> ← الصق محتوى الملف <span dir="ltr">database.rules.json</span> كاملًا ← <b>Publish</b>.';
function rulesOutdatedAlert(node) { UI.alert('رفضت قاعدة البيانات الكتابة في «' + h(node) + '» — ' + RULES_HELP, 'القواعد تحتاج تحديثًا'); }

// كل زائر لصفحة تمرين يسجّل وجوده في presence/<exId>/<sessionId> ويُحذف تلقائيًا عند انقطاعه.
// المدرب وحده يقرأ العقدة، ولا يُسجَّل هو نفسه.
const PRESENCE_TTL = 6 * 3600 * 1000; // تُتجاهل التسجيلات الأقدم من 6 ساعات (بقايا جلسات لم تُحذف)
const Presence = {
  cur: null, key: '', sid: null, _conn: false,
  // معرّف الجلسة: رقم جلسة الدخول في Firebase (تفرضه القواعد)، أو معرّف عشوائي في الوضع المحلي
  sessionId() { if (AUTH.enabled) return authUid(); return Presence.sid || (Presence.sid = genId('s')); },
  payload() { const reg = Me.isReg(); return { n: reg ? String(Me.data.name || '').slice(0, 80) : '', u: reg ? String(Me.data.uid) : '', g: reg ? (Me.group() || 0) : 0, ts: DB.now() }; },
  // يُستدعى بعد كل رسم: يطابق التسجيل مع الصفحة الحالية والهوية الحالية
  sync() {
    const ex = App.dataReady && Router.cur.view === 'ex' && !Admin.ok() && Content.ex(Router.cur.id) ? Router.cur.id : null;
    const sid = ex ? Presence.sessionId() : null; const p = sid ? Presence.payload() : null;
    const key = p ? [ex, sid, p.n, p.u, p.g].join('|') : '';
    if (key === Presence.key) return;
    Presence.leave(); if (!key) return;
    Presence.key = key; Presence.cur = 'presence/' + ex + '/' + sid; Presence.write();
  },
  // الحذف عند الانقطاع يُسجَّل أولًا ثم الكتابة (ترتيب Firebase الموصى به)
  write() { const path = Presence.cur; if (!path) return; Promise.resolve(DB.onDisconnectRemove(path)).then(() => DB.set(path, Presence.payload(), { quiet: true, beforeReady: true })).catch(e => console.warn('presence', e)); },
  leave() { const path = Presence.cur; Presence.cur = null; Presence.key = ''; if (!path) return; DB.cancelDisconnect(path); DB.remove(path, { quiet: true, beforeReady: true }).catch(() => {}); },
  // عند عودة الاتصال يكون الخادم قد حذف التسجيل: نعيده
  onStatus(st) { if (st.connected && !Presence._conn && Presence.cur) Presence.write(); Presence._conn = !!st.connected; },
  list(ex) { const o = (Store.presence || {})[ex] || {}; const now = DB.now(); return Object.keys(o).map(k => o[k]).filter(x => x && now - (+x.ts || 0) < PRESENCE_TTL); },
  // عداد المدرب (صفحة التمرين وصف التمرين في لوحة التحكم)
  badge(ex) {
    if (!Admin.ok()) return '';
    if (Store.presenceDenied) return '<span class="live-count warn" title="' + h('انشر قواعد Firebase المحدّثة') + '">⚠️ العداد معطّل — انشر قواعد Firebase المحدّثة</span>';
    const n = Presence.list(ex).length;
    return '<button class="live-count' + (n ? ' on' : '') + '" data-act="presence-show" data-ex="' + h(ex) + '" title="من على صفحة التمرين الآن"><span class="live-dot"></span><b class="num">' + n + '</b> على الصفحة الآن</button>';
  },
  show(ex) {
    const l = Presence.list(ex); const named = l.filter(x => x.n).sort((a, b) => String(a.n).localeCompare(String(b.n), 'ar')); const guests = l.length - named.length;
    UI.alert((l.length ? '<ul class="pres-list">' + named.map(x => '<li><b>' + h(x.n) + '</b>' + (x.g ? ' <span class="muted">· ' + h(Groups.label(x.g)) + '</span>' : '') + '</li>').join('') + (guests ? '<li class="muted">(<span class="num">' + guests + '</span>) زائر</li>' : '') + '</ul>' : '<div class="empty">لا أحد على الصفحة الآن.</div>'), '👥 على صفحة «' + Content.exTitle(ex) + '» الآن');
  }
};

// دعوة المدرب: invite = { id, ex, title, ts } — الدعوة الجديدة تحل محل السابقة
const INVITE_TTL = 3 * 3600 * 1000;
const Invite = {
  active(ex) { const v = Store.invite; return !!(v && v.ex === ex && DB.now() - (+v.ts || 0) < INVITE_TTL); },
  btn(ex) {
    if (!Admin.ok()) return '';
    return Invite.active(ex) ? '<button class="btn btn-mint btn-xs invite-on" data-act="invite-cancel" data-ex="' + h(ex) + '" title="إلغاء الدعوة">📣 مدعوون الآن · إلغاء</button>'
      : '<button class="btn btn-soft btn-xs" data-act="invite" data-ex="' + h(ex) + '" title="دعوة المتدربين المسجلين إلى هذا التمرين الآن">📣 دعوة</button>';
  },
  async send(ex) {
    const e = Content.ex(ex); if (!e) return;
    try { await DB.set('invite', { id: genId('i'), ex, title: String(e.title || '').slice(0, 200), ts: DB.now() }, { quiet: true }); UI.toast('📣 أُرسلت الدعوة إلى المتدربين المسجلين'); }
    catch (er) { rulesOutdatedAlert('invite'); }
    App.render();
  },
  async cancel() { try { await DB.remove('invite', { quiet: true }); UI.toast('أُلغيت الدعوة'); } catch (er) { rulesOutdatedAlert('invite'); } App.render(); },
  // للمتدرب المسجل: نافذة واحدة لكل دعوة، لا تتكرر، ولا تظهر على صفحة التمرين نفسه أو لدعوة قديمة
  check() {
    const v = Store.invite; if (!v || !v.id || !Me.isReg() || Admin.ok() || Invite.m) return;
    if (DB.now() - (+v.ts || 0) >= INVITE_TTL) return;
    if (SafeLS.get('ec_inv_seen') === String(v.id)) return;
    const e = Content.ex(v.ex); if (!e || e._hidden) return;
    if (Router.cur.view === 'ex' && Router.cur.id === v.ex) { SafeLS.set('ec_inv_seen', String(v.id)); return; }
    SafeLS.set('ec_inv_seen', String(v.id));
    const m = Invite.m = UI.modal('<h3>📣 دعوة من المدرّب</h3><p style="font-family:var(--f-ui)">انضم الآن إلى <b>' + h(e.title || v.title || '') + '</b></p><div class="actions"><button class="btn btn-primary" data-ok>انتقل إلى التمرين</button><button class="btn btn-ghost" data-no>إغلاق</button></div>', { onClose: () => { Invite.m = null; } });
    m.el.classList.add('invite-modal');
    $('[data-ok]', m.el).onclick = () => { m.close(); Router.go('ex', { id: v.ex }); window.scrollTo(0, 0); };
    $('[data-no]', m.el).onclick = () => m.close();
  }
};

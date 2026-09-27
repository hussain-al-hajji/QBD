// ---------------------------------------------------------------------
// لوحة الإدارة بقائمة جانبية: عناوين تضم أدوات اللوحة، قابلة لإعادة التسمية والترتيب
// ونقل أي أداة من عنوان إلى آخر بالسحب (أو بقائمة «نقل إلى» على الجوال) — تُحفظ في site/adminNav
// ---------------------------------------------------------------------
const ADMIN_BLOCKS = {
  users: { icon: '👥', title: 'المسجّلون' }, groups: { icon: '🧩', title: 'إدارة المجموعات' }, preview: { icon: '👀', title: 'معاينة كمتدرب' },
  congrats: { icon: '🏆', title: 'تهنئة الإنجاز' }, regform: { icon: '📝', title: 'نموذج التسجيل والخصوصية' }, attend: { icon: '📍', title: 'الحضور وشهادة المشاركة' },
  assess: { icon: '📋', title: 'التقييم القبلي والبعدي' }, broadcast: { icon: '📣', title: 'بث رسالة مباشرة' },
  monitor: { icon: '👁', title: 'رابط متابعة للمشرف' }, leads: { icon: '🤝', title: 'المهتمون ببرامج البنك' }, followup: { icon: '📈', title: 'المتابعة بعد البرنامج' },
  gamify: { icon: '🏆', title: 'النقاط ولوحة الصدارة' }, tplTool: { icon: '📚', title: 'صندوق الأدوات والقوالب' }, cohorts: { icon: '📦', title: 'الدفعات والأرشيف' },
  pdf: { icon: '📄', title: 'ملف المحتوى PDF' }, guide: { icon: '📘', title: 'دليل المدرب' }, report: { icon: '📑', title: 'تقرير ختام البرنامج' },
  csv: { icon: '📊', title: 'تصدير المشاركات' }, person: { icon: '🗂️', title: 'مشاركات فردية' }, backup: { icon: '💾', title: 'النسخة الاحتياطية للمحتوى' },
  autobk: { icon: '🛟', title: 'نسخ يومي تلقائي للمدخلات' }, reset: { icon: '⚠️', title: 'إعادة ضبط شاملة' },
  homeUi: { icon: '🏠', title: 'الشريط العلوي والقسم البارز والتذييل', wide: true }, landing: { icon: '🛬', title: 'الصفحة التعريفية (قبل الدخول)', wide: true },
  homeSecs: { icon: '🧱', title: 'أقسام الصفحة الرئيسية', wide: true }, stories: { icon: '🌟', title: 'قصص النجاح', wide: true },
  units: { icon: '🗂', title: 'أسماء الوحدات', wide: true }, axes: { icon: '🗺️', title: 'المحاور وتمارينها', wide: true },
  acts: { icon: '⚡', title: 'قسم «أنشطة»', wide: true }, survey: { icon: '🎓', title: 'ختام البرنامج (الاستطلاع)', wide: true }, lab: { icon: '🧪', title: 'المختبر الختامي', wide: true }
};
const ADMIN_GROUPS_DEF = [
  { id: 'g_users', icon: '👥', title: 'إدارة المسجلين', blocks: ['users', 'groups', 'preview', 'congrats', 'regform', 'attend', 'assess', 'broadcast'] },
  { id: 'g_sponsor', icon: '🤝', title: 'الجهة الراعية والدفعات', blocks: ['monitor', 'leads', 'followup', 'gamify', 'tplTool', 'cohorts'] },
  { id: 'g_export', icon: '📤', title: 'التصدير والنسخ', blocks: ['pdf', 'guide', 'report', 'csv', 'person', 'backup', 'autobk', 'reset'] },
  { id: 'g_home', icon: '🏠', title: 'واجهة الصفحة الرئيسية', blocks: ['homeUi', 'landing', 'homeSecs'] },
  { id: 'g_stories', icon: '🌟', title: 'قصص النجاح', blocks: ['stories'] },
  { id: 'g_axes', icon: '🗺️', title: 'المحاور والتمارين', blocks: ['units', 'axes'] },
  { id: 'g_acts', icon: '⚡', title: 'الأنشطة والاستطلاع الختامي', blocks: ['acts', 'survey', 'lab'] }
];
const AdminNav = {
  groups() {
    const cfg = (Store.site && Store.site.adminNav) || null;
    let gs = cfg && arr(cfg.groups).length
      ? arr(cfg.groups).filter(g => g && g.id).map(g => ({ id: g.id, icon: g.icon || '📁', title: g.title || 'عنوان', blocks: arr((cfg.place || {})[g.id]) }))
      : ADMIN_GROUPS_DEF.map(g => ({ id: g.id, icon: g.icon, title: g.title, blocks: g.blocks.slice() }));
    const seen = new Set();
    gs.forEach(g => { g.blocks = g.blocks.filter(b => ADMIN_BLOCKS[b] && !seen.has(b) && seen.add(b)); });
    // أي أداة جديدة أو غير موزعة تعود إلى عنوانها الافتراضي (أو أول عنوان)
    Object.keys(ADMIN_BLOCKS).forEach(b => { if (seen.has(b)) return; const d = ADMIN_GROUPS_DEF.find(x => x.blocks.indexOf(b) > -1); const g = (d && gs.find(x => x.id === d.id)) || gs[0]; if (g) g.blocks.push(b); });
    return gs;
  },
  active(gs) { const k = UIState.adminGrp || SafeLS.get('ec_admin_grp'); return gs.find(g => g.id === k) || gs[0]; },
  save(gs) { const place = {}; gs.forEach(g => { place[g.id] = g.blocks; }); return DB.set('site/adminNav', { groups: gs.map(g => ({ id: g.id, icon: g.icon, title: g.title })), place }); },
  move(blk, toG, before) {
    const gs = AdminNav.groups(); gs.forEach(g => { g.blocks = g.blocks.filter(b => b !== blk); });
    const g = gs.find(x => x.id === toG); if (!g) return; const i = before ? g.blocks.indexOf(before) : -1;
    if (i > -1) g.blocks.splice(i, 0, blk); else g.blocks.push(blk);
    return AdminNav.save(gs);
  },
  blockTitle(b) { return ADMIN_BLOCKS[b].title; }
};
Views.admin.shell = function (blocks) {
  const gs = AdminNav.groups(); const cur = AdminNav.active(gs); const edit = !!UIState.adminEdit;
  const nav = '<aside class="adm-nav"><div class="adm-nav-top"><span>أقسام اللوحة</span><button class="btn btn-xs ' + (edit ? 'btn-primary' : 'btn-ghost') + '" data-act="adm-edit">' + (edit ? '✓ إنهاء التخصيص' : '✏️ تخصيص') + '</button></div><nav>' +
    gs.map((g, i) => edit
      ? '<div class="adm-nav-item edit ' + (g.id === cur.id ? 'active' : '') + '" data-adm-drop="' + h(g.id) + '"><input class="adm-ico-in" data-adm-icon="' + h(g.id) + '" data-keep="adm-i-' + h(g.id) + '" value="' + h(g.icon) + '" maxlength="4" aria-label="أيقونة"><input class="adm-title-in" data-adm-title="' + h(g.id) + '" data-keep="adm-t-' + h(g.id) + '" value="' + h(g.title) + '" aria-label="اسم العنوان"><span class="adm-count num">' + g.blocks.length + '</span>' +
        '<div class="adm-nav-tools"><button class="btn btn-ghost btn-xs" data-act="adm-grp" data-g="' + h(g.id) + '" title="عرض أدواته">👁</button><button class="btn btn-ghost btn-xs" data-act="adm-gmove" data-g="' + h(g.id) + '" data-d="-1" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="btn btn-ghost btn-xs" data-act="adm-gmove" data-g="' + h(g.id) + '" data-d="1" ' + (i === gs.length - 1 ? 'disabled' : '') + '>↓</button>' + (gs.length > 1 ? '<button class="btn btn-ghost btn-xs" data-act="adm-gdel" data-g="' + h(g.id) + '" title="حذف العنوان (تنتقل أدواته إلى عنوان آخر)">🗑</button>' : '') + '</div></div>'
      : '<button class="adm-nav-item ' + (g.id === cur.id ? 'active' : '') + '" data-act="adm-grp" data-g="' + h(g.id) + '"><span class="adm-ico">' + h(g.icon) + '</span><span class="adm-t">' + h(g.title) + '</span><span class="adm-count num">' + g.blocks.length + '</span></button>').join('') +
    '</nav>' + (edit ? '<div class="adm-nav-foot"><button class="btn btn-soft btn-xs" data-act="adm-gadd">➕ عنوان جديد</button><button class="btn btn-ghost btn-xs" data-act="adm-reset">↺ الترتيب الافتراضي</button></div>' : '') + '</aside>';
  let pane = '<div class="adm-pane"><div class="adm-pane-head"><span class="adm-ico big">' + h(cur.icon) + '</span><div><h2>' + h(cur.title) + '</h2><span class="muted"><span class="num">' + cur.blocks.length + '</span> أداة</span></div></div>';
  if (edit) {
    pane += '<p class="help muted adm-help">اسحب أي أداة وأفلتها على عنوان في القائمة الجانبية لنقلها إليه، أو فوق أداة أخرى لترتيبها. على الجوال استخدم قائمة «نقل إلى». عدّل اسم العنوان وأيقونته مباشرة من القائمة الجانبية.</p><div class="adm-cards">' +
      (cur.blocks.length ? cur.blocks.map(b => '<div class="adm-card" draggable="true" data-adm-blk="' + b + '"><span class="drag-handle">⠿</span><span class="adm-ico">' + ADMIN_BLOCKS[b].icon + '</span><b class="grow">' + h(AdminNav.blockTitle(b)) + '</b><select data-adm-to="' + b + '" aria-label="نقل إلى"><option value="">نقل إلى…</option>' + gs.filter(g => g.id !== cur.id).map(g => '<option value="' + h(g.id) + '">' + h(g.icon + ' ' + g.title) + '</option>').join('') + '</select></div>').join('') : '<div class="empty">لا توجد أدوات تحت هذا العنوان — اسحب إليه أدوات من عناوين أخرى.</div>') + '</div>';
  } else {
    let grid = []; const flush = () => { if (grid.length) { pane += '<div class="tools-grid">' + grid.join('') + '</div>'; grid = []; } };
    cur.blocks.forEach(b => { const html = blocks[b] || ''; if (ADMIN_BLOCKS[b].wide) { flush(); pane += '<div class="adm-wide" data-blk="' + b + '">' + html + '</div>'; } else grid.push(html); });
    flush();
    if (!cur.blocks.length) pane += '<div class="empty">لا توجد أدوات تحت هذا العنوان. اضغط «✏️ تخصيص» لنقل أدوات إليه.</div>';
  }
  pane += '</div>';
  return adminHeader('لوحة الإدارة') + '<div class="adm-shell' + (edit ? ' editing' : '') + '">' + nav + pane + '</div>';
};
Views.admin.afterNav = function (root) {
  if (!UIState.adminEdit) return;
  let dragBlk = null;
  $$('[data-adm-blk]', root).forEach(el => {
    el.addEventListener('dragstart', e => { dragBlk = el.getAttribute('data-adm-blk'); el.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', dragBlk); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
    el.addEventListener('dragend', () => { el.classList.remove('dragging'); $$('.drop-target', root).forEach(x => x.classList.remove('drop-target')); });
    el.addEventListener('dragover', e => { if (!dragBlk || dragBlk === el.getAttribute('data-adm-blk')) return; e.preventDefault(); el.classList.add('drop-target'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drop-target'); const target = el.getAttribute('data-adm-blk'); if (!dragBlk || dragBlk === target) return; const g = AdminNav.active(AdminNav.groups()); AdminNav.move(dragBlk, g.id, target); dragBlk = null; });
  });
  $$('[data-adm-drop]', root).forEach(el => {
    el.addEventListener('dragover', e => { if (!dragBlk) return; e.preventDefault(); el.classList.add('drop-target'); });
    el.addEventListener('dragleave', () => el.classList.remove('drop-target'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drop-target'); if (!dragBlk) return; const to = el.getAttribute('data-adm-drop'); const nm = AdminNav.blockTitle(dragBlk); const gt = (AdminNav.groups().find(g => g.id === to) || {}).title; AdminNav.move(dragBlk, to); UI.toast('نُقلت «' + nm + '» إلى «' + gt + '»'); dragBlk = null; });
  });
  $$('[data-adm-to]', root).forEach(sel => sel.addEventListener('change', () => { if (!sel.value) return; const b = sel.getAttribute('data-adm-to'); const gt = (AdminNav.groups().find(g => g.id === sel.value) || {}).title; AdminNav.move(b, sel.value); UI.toast('نُقلت «' + AdminNav.blockTitle(b) + '» إلى «' + gt + '»'); }));
  const saveField = (attr, key) => $$('[' + attr + ']', root).forEach(inp => inp.addEventListener('change', () => { const gs = AdminNav.groups(); const g = gs.find(x => x.id === inp.getAttribute(attr)); if (!g) return; g[key] = inp.value.trim() || (key === 'icon' ? '📁' : 'عنوان'); AdminNav.save(gs); UI.toast('✅ حُفظ'); }));
  saveField('data-adm-title', 'title'); saveField('data-adm-icon', 'icon');
};

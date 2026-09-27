// ---------------------------------------------------------------------
// الموجّه (History API) + الهيكل العام + مكوّنات مشتركة
// ---------------------------------------------------------------------
const UIState = { deck: {}, openAcc: new Set(), openDrop: new Set(), draft: {}, fbSel: {}, editing: {}, modelShown: {}, bellOpen: false };
const Admin = {
  ok() { return SafeSS.get('ec_admin') === '1'; },
  preview() { return SafeSS.get('ec_preview') === '1'; },
  ctl() { return Admin.ok() && !Admin.preview(); }
};

const Router = {
  cur: { view: 'home' },
  parse() {
    const st = SafeHist.state(); if (st && st.view) return st;
    const hp = getHashParams(); const o = { view: hp.v || 'home' }; if (hp.id) o.id = hp.id; if (hp.from) o.from = hp.from; if (hp.axis) o.axis = hp.axis; return o;
  },
  url(st) { const p = { u: Me.uid() || '', v: st.view !== 'home' ? st.view : '', id: st.id || '', from: st.from || '', axis: st.axis || '' }; return location.pathname + location.search + buildHash(p); },
  go(view, params = {}, o = {}) {
    const st = Object.assign({ view }, params);
    Router.cur = st;
    if (o.replace) SafeHist.replace(st, Router.url(st)); else SafeHist.push(st, Router.url(st));
    App.render(true);
    try { window.scrollTo({ top: 0, behavior: o.smooth ? 'smooth' : 'auto' }); } catch (e) { window.scrollTo(0, 0); }
  },
  syncHash() { SafeHist.replace(Router.cur, Router.url(Router.cur)); },
  // وجهة زر الرجوع المرئي تُشتق من بيانات العنصر الحالي نفسه
  backOf(st) {
    switch (st.view) {
      case 'ex': { const ax = Content.axisOfEx(st.id); return ax ? { view: 'axis', id: ax } : { view: 'home' }; }
      case 'axis': case 'lab': case 'account': case 'admin': case 'assess': case 'story': case 'tools': case 'followup': return { view: 'home' };
      case 'storyEdit': return { view: 'admin' };
      case 'secEdit': case 'labEdit': case 'assessEdit': return { view: 'admin' };
      case 'exEdit': return st.from === 'axisEdit' && st.axis ? { view: 'axisEdit', id: st.axis } : { view: 'admin' };
      case 'axisEdit': case 'actEdit': return { view: 'admin' };
      default: return null;
    }
  }
};
window.addEventListener('popstate', e => { Router.cur = (e.state && e.state.view) ? e.state : Router.parse(); App.render(true); });

// ---------- الهيكل العام ----------
const Layout = {
  topbar() {
    const s = Content.site(); const me = Me.data;
    return '<header class="topbar"><div class="wrap">' +
      '<div class="brand" data-go="home"><div class="brand-logo">' + iconSvg('store', 22, '#fff', 2.2) + '</div><div class="brand-text"><div class="brand-title" id="brandTitle">' + h(s.headerTitle) + '</div><div class="brand-sub">' + h(s.headerSub) + '</div></div></div>' +
      '<div class="top-actions">' +
      (me ? '<div class="user-chip" title="' + h(me.name) + '"><span class="av">' + h(initials(me.name)) + '</span><span class="nm">' + h(me.name) + '</span></div><button class="btn btn-soft btn-sm" data-go="account">' + iconSvg('user', 16) + '<span class="lbl">حسابي</span></button>' : (Me.guest ? '<span class="pill">👀 زائر</span>' : '')) +
      (!me && !Me.guest ? (!App.onLanding ? '' : '<button class="btn btn-primary btn-sm top-cta" data-act="open-login"><span class="cta-l">الدخول للمنصة التعليمية</span><span class="cta-s">الدخول</span> <span class="lp-arrow">←</span></button>') :
        (App.onLanding ? '<button class="btn btn-primary btn-sm top-cta" data-act="lp-enter"><span class="cta-l">الدخول للمنصة التعليمية</span><span class="cta-s">المنصة</span> <span class="lp-arrow">←</span></button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-act="switch-user" title="تسجيل مستخدم جديد (يعيدك إلى الصفحة التعريفية)">' + iconSvg('users', 16) + '<span class="lbl">مستخدم جديد</span></button>') +
      '<button class="btn btn-ghost btn-sm notranslate" translate="no" data-act="prefs" title="إعدادات العرض: الوضع الليلي وحجم الخط والتباين" aria-label="إعدادات العرض">Aa</button>' +
      Translate.button() +
      '<button class="icon-btn" data-act="admin-enter" title="لوحة الإدارة">' + iconSvg('gear', 18) + '</button>' +
      '</div></div></header>';
  },
  banners() {
    let out = '';
    if (App.inIframe) out += '<div class="banner banner-iframe">الصفحة معروضة داخل إطار مضمَّن؛ لتجربة أفضل افتحها مستقلة. <a class="btn btn-sm btn-primary" href="' + h(location.href) + '" target="_blank" rel="noopener">فتح في تبويب مستقل</a></div>';
    // تسجيل الحضور: شريط يظهر للمسجلين عندما يفتح المدرب تسجيل حضور يوم ما
    if (Me.isReg() && ADMIN_VIEWS.indexOf(Router.cur.view) === -1) Attend.openDays().forEach(d => {
      const done = Attend.hoursOf(Me.uid(), d) > 0;
      out += '<div class="banner banner-checkin">' + (done ? '✅ تم تسجيل حضورك في <b>اليوم ' + d + '</b>' : '📍 تسجيل الحضور مفتوح — <b>اليوم ' + d + '</b>: <input data-keep="checkin-' + d + '" id="checkin' + d + '" inputmode="numeric" maxlength="6" placeholder="رمز الحضور" class="num"><button class="btn btn-sm btn-primary" data-act="checkin" data-d="' + d + '">تسجيل</button>') + '</div>';
    });
    const b = Store.broadcast;
    if (b && b.text && SafeLS.get('ec_bc_closed') !== String(b.id)) out += '<div class="banner banner-broadcast">📣 <span>' + h(b.text) + '</span><button class="x" data-act="bc-close" data-id="' + h(b.id) + '" title="إغلاق">✕</button></div>';
    return out;
  },
  footer() {
    const s = Content.site();
    const url = s.footerUrl ? (/^https?:\/\//.test(s.footerUrl) ? s.footerUrl : 'https://' + s.footerUrl) : '';
    const soc = [];
    const wa = v => { if (/^https?:\/\//.test(v)) return v; const d = String(v).replace(/[^\d]/g, ''); return 'https://wa.me/' + d; };
    const mail = v => /^mailto:/.test(v) ? v : 'mailto:' + v.trim();
    const norm = v => /^https?:\/\//.test(v) ? v : 'https://' + v.replace(/^\/+/, '');
    if (s.linkedin) soc.push(['linkedin', norm(s.linkedin), 'LinkedIn']);
    if (s.x) soc.push(['xlogo', norm(s.x), 'X']);
    if (s.instagram) soc.push(['instagram', norm(s.instagram), 'Instagram']);
    if (s.whatsapp) soc.push(['whatsapp', wa(s.whatsapp), 'WhatsApp']);
    if (s.email) soc.push(['mail', mail(s.email), 'Email']);
    return '<footer class="footer"><div class="wrap"><div class="nm">' + h(s.footerName) + '</div><div class="bio">' + h(s.footerBio) + '</div>' +
      (url ? '<a href="' + h(url) + '" target="_blank" rel="noopener">' + h(s.footerUrl) + '</a>' : '') +
      (soc.length ? '<div class="socials">' + soc.map(x => '<a href="' + h(x[1]) + '" target="_blank" rel="noopener" title="' + x[2] + '">' + iconSvg(x[0], 18, '#fff') + '</a>').join('') + '</div>' : '') +
      '</div></footer>';
  },
  crumbs(extra = '') {
    const b = Router.backOf(Router.cur);
    return '<div class="crumbs">' + (b ? '<button class="back-btn" data-back>→ رجوع</button>' : '') + '<button class="back-btn" data-go="home">' + iconSvg('home', 15) + ' الرئيسية</button>' + extra + '</div>';
  }
};

// ---------- تفضيلات العرض لسهولة الوصول (تُحفظ على جهاز المستخدم فقط) ----------
const Prefs = {
  get() { try { return Object.assign({ theme: 'auto', fs: 'md', contrast: 'normal', motion: 'normal' }, JSON.parse(SafeLS.get('ec_prefs') || '{}')); } catch (e) { return { theme: 'auto', fs: 'md', contrast: 'normal', motion: 'normal' }; } },
  set(k, v) { const p = Prefs.get(); p[k] = v; SafeLS.set('ec_prefs', JSON.stringify(p)); Prefs.apply(); },
  apply() {
    const p = Prefs.get(); const r = document.documentElement; let dark = p.theme === 'dark';
    if (p.theme === 'auto') { try { dark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {} }
    r.setAttribute('data-theme', dark ? 'dark' : 'light'); r.setAttribute('data-fs', p.fs); r.setAttribute('data-contrast', p.contrast);
    let red = p.motion === 'reduce'; if (p.motion === 'normal') { try { red = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {} } r.setAttribute('data-motion', red ? 'reduce' : 'normal');
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#11141C' : '#8A1538');
  },
  menu() {
    const seg = (k, opts) => { const v = Prefs.get()[k]; return '<div class="sim-seg">' + opts.map(([val, l]) => '<label class="' + (v === val ? 'on' : '') + '" data-pref="' + k + '" data-v="' + val + '">' + l + '</label>').join('') + '</div>'; };
    const body = () => '<h3>Aa إعدادات العرض</h3><div class="prefs-grid"><div><b>المظهر</b><br>' + seg('theme', [['light', '☀️ فاتح'], ['dark', '🌙 داكن'], ['auto', '🖥 حسب الجهاز']]) + '</div><div><b>حجم الخط</b><br>' + seg('fs', [['sm', 'صغير'], ['md', 'عادي'], ['lg', 'كبير'], ['xl', 'كبير جدًا']]) + '</div><div><b>التباين</b><br>' + seg('contrast', [['normal', 'عادي'], ['high', 'عالٍ']]) + '</div><div><b>الحركة</b><br>' + seg('motion', [['normal', 'عادية'], ['reduce', 'مخففة']]) + '</div></div><p class="muted" style="font-size:12.5px;margin-top:12px">تُحفظ هذه الإعدادات على هذا الجهاز فقط.</p><div class="actions"><button class="btn btn-primary" data-x>تم</button></div>';
    const m = UI.modal(body()); const wire = () => { $$('[data-pref]', m.el).forEach(l => l.onclick = () => { Prefs.set(l.getAttribute('data-pref'), l.getAttribute('data-v')); m.el.innerHTML = body(); wire(); }); $('[data-x]', m.el).onclick = () => m.close(); }; wire();
  }
};
Prefs.apply();
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => Prefs.apply()); } catch (e) {}

// ---------- الترجمة الآلية (Google Translate) — تُحمَّل عند الطلب فقط ----------
// المحتوى الأصلي عربي بالكامل؛ الزر يترجم الصفحة الحالية وكل ما يُرسم لاحقًا، و«العربية» تعيدها كما كانت.
const Translate = {
  LANGS: [['en', 'English'], ['fr', 'Français'], ['ur', 'اردو'], ['hi', 'हिन्दी'], ['tl', 'Filipino'], ['ml', 'മലയാളം'], ['es', 'Español'], ['tr', 'Türkçe']],
  cur() { const m = (Cookie.get('googtrans') || '').match(/^\/ar\/([a-zA-Z-]+)$/); return m ? m[1] : 'ar'; },
  button() { const c = Translate.cur(); return '<button class="btn btn-ghost btn-sm notranslate" translate="no" data-act="translate" title="ترجمة آلية للمحتوى عبر Google Translate">🌐<span class="lbl">' + (c === 'ar' ? 'ترجمة' : 'العربية') + '</span></button>'; },
  load() {
    if (Translate._loaded) return; Translate._loaded = true;
    if (!document.getElementById('gt_el')) { const d = document.createElement('div'); d.id = 'gt_el'; d.style.display = 'none'; document.body.appendChild(d); }
    window.gtInit = () => { try { new google.translate.TranslateElement({ pageLanguage: 'ar', autoDisplay: false }, 'gt_el'); } catch (e) {} };
    loadScript('https://translate.google.com/translate_a/element.js?cb=gtInit').catch(() => { Translate._loaded = false; UI.alert('تعذر تحميل خدمة الترجمة. تحقق من الاتصال بالإنترنت.'); });
  },
  setCookie(v) {
    const host = location.hostname; const parts = host.split('.');
    const doms = ['', host]; if (parts.length > 1) doms.push('.' + parts.slice(-2).join('.'));
    doms.forEach(dm => { try { document.cookie = 'googtrans=' + (v || '') + ';path=/' + (dm ? ';domain=' + dm : '') + (v ? '' : ';max-age=0'); } catch (e) {} });
  },
  set(lang) {
    if (lang === 'ar') { Translate.setCookie(''); location.reload(); return; }
    Translate.setCookie('/ar/' + lang);
    const combo = document.querySelector('.goog-te-combo');
    if (combo) { combo.value = lang; combo.dispatchEvent(new Event('change')); UI.toast('🌐 جارٍ الترجمة…'); App.render(); }
    else { Translate.load(); UI.toast('🌐 جارٍ تحميل الترجمة…'); let n = 0; const t = setInterval(() => { const cb = document.querySelector('.goog-te-combo'); if (cb || ++n > 40) { clearInterval(t); if (cb) { cb.value = lang; cb.dispatchEvent(new Event('change')); } App.render(); } }, 250); }
  },
  menu() {
    const c = Translate.cur();
    const m = UI.modal('<h3>🌐 الترجمة الآلية</h3><p class="muted" style="font-family:var(--f-ui);font-size:13.5px">المحتوى الأصلي للمنصة باللغة العربية. اختر لغة لترجمة الصفحة آليًا عبر Google Translate (قد لا تكون الترجمة الآلية دقيقة تمامًا في المصطلحات).</p><div class="lang-grid notranslate" translate="no">' +
      '<button class="btn ' + (c === 'ar' ? 'btn-primary' : 'btn-soft') + '" data-lang="ar">العربية (الأصل)</button>' + Translate.LANGS.map(([k, n]) => '<button class="btn ' + (c === k ? 'btn-primary' : 'btn-ghost') + '" data-lang="' + k + '">' + n + '</button>').join('') + '</div>');
    $$('[data-lang]', m.el).forEach(b => b.onclick = () => { m.close(); Translate.set(b.getAttribute('data-lang')); });
  },
  boot() { if (Translate.cur() !== 'ar') Translate.load(); }
};

// ---------- إعادة رسم تحافظ على المدخلات والتركيز ----------
function preserveRender(root, html) {
  const keep = {}; $$('[data-keep]', root).forEach(el => { keep[el.getAttribute('data-keep')] = el.isContentEditable ? { html: el.innerHTML } : { v: el.value }; });
  const act = document.activeElement; const actKey = act && act.getAttribute && act.getAttribute('data-keep');
  let sel = null; if (actKey && act.selectionStart != null) sel = [act.selectionStart, act.selectionEnd];
  root.innerHTML = html;
  $$('[data-keep]', root).forEach(el => { const k = keep[el.getAttribute('data-keep')]; if (!k) return; if (k.html != null) el.innerHTML = k.html; else if (el.type !== 'file') el.value = k.v; });
  if (actKey) { const el = $('[data-keep="' + actKey + '"]', root); if (el) { el.focus(); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
}

// ---------- تنسيق نصوص الشرائح تلقائيًا ----------
function boldTerm(text) { // يبرز المصطلح قبل ":" أو "—" تلقائيًا
  const t = String(text || ''); const m = t.match(/^(.{2,70}?)(\s*[:：]\s*|\s+—\s+|\s+-\s+)(.+)$/);
  return m ? '<b>' + h(m[1]) + '</b>' + h(m[2]) + h(m[3]) : h(t);
}
function withLede(html) { // أول جملة من الفقرة بخط عريض
  if (!html) return '';
  const d = document.createElement('div'); d.innerHTML = html; const p = d.querySelector('p') || d;
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); const tn = walker.nextNode();
  if (!tn) return html;
  const m = tn.nodeValue.match(/^(.*?[.؟?!:،](?=\s|$))(\s*)([\s\S]*)$/);
  if (!m || m[1].length < 8) { if (p.firstChild === tn || true) { const b = document.createElement('span'); b.className = 'lede'; tn.parentNode.insertBefore(b, tn); b.appendChild(tn); } return d.innerHTML; }
  const b = document.createElement('span'); b.className = 'lede'; b.textContent = m[1];
  tn.parentNode.insertBefore(b, tn); tn.nodeValue = m[2] + m[3];
  return d.innerHTML;
}
function richHtml(v) { if (!v) return ''; return /<[a-z][\s\S]*>/i.test(v) ? sanitize(v) : h(v).replace(/\n/g, '<br>'); }
function sanitize(html) { // تنظيف بسيط لمحتوى المحرر
  const d = document.createElement('div'); d.innerHTML = html;
  $$('script,style,iframe,object,embed', d).forEach(x => x.remove());
  $$('*', d).forEach(el => { [...el.attributes].forEach(a => { if (/^on/i.test(a.name) || (a.name === 'href' && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name); }); });
  return d.innerHTML;
}

// ---------- الفيديو المضمَّن ----------
function toEmbed(url) {
  if (!url) return null; const u = String(url).trim(); let m;
  if ((m = u.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/))) return 'https://www.youtube.com/embed/' + m[1];
  if ((m = u.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/))) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
  if ((m = u.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([A-Za-z0-9_-]+)/))) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
  return null;
}
function mediaHtml(s) {
  let out = '';
  if (s.videoUrl) { const em = toEmbed(s.videoUrl); out += em ? '<div class="video-box"><iframe src="' + h(em) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' : '<div class="slide-links"><a class="btn btn-ghost btn-sm" href="' + h(s.videoUrl) + '" target="_blank" rel="noopener">' + iconSvg('play', 16) + ' مشاهدة الفيديو</a></div>'; }
  if (s.srcUrl) out += '<div class="slide-links"><a class="btn btn-soft btn-sm" href="' + h(/^https?:/.test(s.srcUrl) ? s.srcUrl : 'https://' + s.srcUrl) + '" target="_blank" rel="noopener">' + iconSvg('link', 15) + ' ' + h(s.srcLabel || 'مصدر للتوسع') + '</a></div>';
  return out;
}

// ---------- عرض شريحة ----------
function renderSlide(s, a, i, n, cur) {
  const col = Content.color(a); const type = SLIDE_TYPES[s.type] ? s.type : 'principle';
  const head = '<div class="slide-top"><span class="slide-type"><span class="st-ico">' + (SLIDE_ICONS[type] || '•') + '</span>' + h(SLIDE_TYPES[type]) + '</span><span class="slide-prog"><i style="width:' + ((i + 1) / n * 100).toFixed(1) + '%"></i></span><span class="slide-no num">' + String(i + 1).padStart(2, '0') + '<small>/' + String(n).padStart(2, '0') + '</small></span></div>';
  const wrap = (inner, cls) => '<div class="slide slide-' + type + (cur ? ' cur' : '') + (cls ? ' ' + cls : '') + '" style="--ac:' + col + ';--acg:' + tint(col, .1) + ';--acd:' + shade(col, -0.35) + '"><span class="slide-wm num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' + head +
    (s.image ? '<img class="slide-img" src=\"' + imgSrc(s.image) + '\" alt="">' : '') + '<h2>' + h(s.title) + '</h2>' + inner + '</div>';
  if (SK_TYPES.indexOf(type) > -1) {
    const chart = s.chart ? '<div class="slide-visual sk-chart">' + Charts.render(s.chart, col) + '</div>' : '';
    return wrap(SlideKit[type](s, a, i, col) + chart + mediaHtml(s));
  }
  let text = '', visual = '';
  const chart = s.chart ? Charts.render(s.chart, col) : '';
  const rule = s.rule ? '<div class="rule-box"><span class="lbl">' + (type === 'opening' || type === 'summary' ? '📌 قاعدة تذكّرها' : '💡 الفكرة الذهبية') + '</span>' + richHtml(s.rule) + '</div>' : '';
  if (type === 'opening' || type === 'summary') {
    text = '<div class="slide-text">' + withLede(richHtml(s.text)) + '</div>' + rule;
    const sc = Scenes.render(a.scene || 'idea', col, type === 'summary' ? { style: 'max-width:300px;margin:0 auto' } : {});
    visual = sc + (chart ? '<div style="margin-top:14px">' + chart + '</div>' : '');
  } else if (type === 'principle') {
    text = '<div class="slide-text">' + richHtml(s.intro) + '</div>' + (s.points && s.points.length ? '<ul class="points">' + s.points.map((p, k) => '<li style="--i:' + k + '"><span class="n num">' + (k + 1) + '</span><span>' + boldTerm(p) + '</span></li>').join('') + '</ul>' : '') + rule;
    visual = chart || Scenes.render('idea', col);
  } else {
    const cls = type === 'mistakes' ? 'mis' : type === 'tools' ? 'tool' : 'ex';
    text = '<div class="pairs ' + cls + '-list">' + (s.items || []).map((it, k) => { const j = String(it).indexOf('::'); const hd = j > -1 ? it.slice(0, j) : it, bd = j > -1 ? it.slice(j + 2) : ''; return '<div class="pair ' + cls + '" style="--i:' + k + '"><div class="h">' + (cls === 'mis' ? '<span class="pm">✕</span>' : cls === 'tool' ? '<span class="pm">🛠</span>' : '<span class="pm num">' + (k + 1) + '</span>') + '<span>' + h(hd.trim()) + '</span></div>' + (bd ? '<div class="b">' + (cls === 'mis' ? '<span class="pm ok">✓</span>' : '') + '<span>' + h(bd.trim()) + '</span></div>' : '') + '</div>'; }).join('') + '</div>' + rule;
    visual = chart || Scenes.render(type === 'mistakes' ? 'mistakes' : type === 'tools' ? 'tools' : (a.scene || 'idea'), col);
  }
  return wrap('<div class="slide-grid"><div>' + text + mediaHtml(s) + '</div><div class="slide-visual">' + visual + '</div></div>');
}

// ---------- محرر النص المنسّق (contenteditable) ----------
// نمط ثابت: تتبّع آخر نطاق تحديد داخل المحرر واستعادته عند استخدام أي أداة،
// دون أي preventDefault على عناصر التحكم الأصلية (القوائم المنسدلة، منتقي اللون...).
const RTE = {
  ranges: {},
  html(key, value, ph = '') {
    return '<div class="rte" data-rte="' + h(key) + '"><div class="rte-bar">' +
      '<select data-rte-cmd="fontSize" title="حجم الخط"><option value="">الحجم</option><option value="2">صغير</option><option value="3">عادي</option><option value="4">متوسط</option><option value="5">كبير</option><option value="6">كبير جدًا</option></select>' +
      '<input type="color" data-rte-cmd="foreColor" value="#8A1538" title="لون النص">' +
      '<span class="sep"></span><button type="button" data-rte-btn="bold" title="عريض"><b>B</b></button><button type="button" data-rte-btn="italic" title="مائل"><i>I</i></button><button type="button" data-rte-btn="underline" title="تسطير"><u>U</u></button>' +
      '<span class="sep"></span><button type="button" data-rte-btn="justifyRight" title="محاذاة يمين">⇥</button><button type="button" data-rte-btn="justifyCenter" title="توسيط">≡</button><button type="button" data-rte-btn="justifyLeft" title="محاذاة يسار">⇤</button>' +
      '<span class="sep"></span><button type="button" data-rte-btn="insertUnorderedList" title="قائمة نقطية">•</button><button type="button" data-rte-btn="insertOrderedList" title="قائمة رقمية">1.</button>' +
      '<span class="sep"></span><button type="button" data-rte-btn="removeFormat" title="مسح التنسيق">⌫</button>' +
      '</div><div class="rte-area" contenteditable="true" dir="rtl" data-rte-area="' + h(key) + '" data-ph="' + h(ph) + '">' + (value ? sanitize(richHtml(value)) : '') + '</div></div>';
  },
  track(area) { try { const sel = window.getSelection(); if (sel.rangeCount && area.contains(sel.anchorNode)) RTE.ranges[area.getAttribute('data-rte-area')] = sel.getRangeAt(0).cloneRange(); } catch (e) {} },
  restore(key, area) {
    const r = RTE.ranges[key]; area.focus();
    try { const sel = window.getSelection(); sel.removeAllRanges(); if (r) sel.addRange(r); else { const rr = document.createRange(); rr.selectNodeContents(area); rr.collapse(false); sel.addRange(rr); } } catch (e) {}
  },
  mount(root) {
    $$('[data-rte-area]', root).forEach(area => { ['keyup', 'mouseup', 'input', 'focus', 'touchend'].forEach(ev => area.addEventListener(ev, () => RTE.track(area))); });
    $$('[data-rte]', root).forEach(box => {
      const key = box.getAttribute('data-rte'); const area = $('[data-rte-area]', box);
      $$('[data-rte-btn]', box).forEach(b => b.addEventListener('click', () => { RTE.restore(key, area); try { document.execCommand(b.getAttribute('data-rte-btn'), false, null); if (b.getAttribute('data-rte-btn') === 'removeFormat') document.execCommand('unlink', false, null); } catch (e) {} RTE.track(area); }));
      $$('[data-rte-cmd]', box).forEach(ctrl => ctrl.addEventListener('change', () => { const v = ctrl.value; if (!v) return; RTE.restore(key, area); try { document.execCommand('styleWithCSS', false, ctrl.getAttribute('data-rte-cmd') === 'foreColor'); document.execCommand(ctrl.getAttribute('data-rte-cmd'), false, v); } catch (e) {} RTE.track(area); if (ctrl.tagName === 'SELECT') ctrl.value = ''; }));
    });
  },
  val(root, key) { const a = $('[data-rte-area="' + key + '"]', root); if (!a) return ''; const v = sanitize(a.innerHTML).trim(); return stripHtml(v) ? v : ''; }
};

// ---------- الصور: ضغط تلقائي عند الرفع + حفظ في مسار مستقل media/ يُحمَّل عند الحاجة ----------
// المحتوى يحمل مرجعًا قصيرًا «media:المعرف» بدل الصورة نفسها، فتبقى مزامنة المحتوى خفيفة وسريعة.
const MediaCache = {
  data: {}, pending: {},
  get(id) {
    if (MediaCache.data[id] !== undefined) return MediaCache.data[id];
    if (!MediaCache.pending[id]) { MediaCache.pending[id] = DB.get('media/' + id).then(v => { MediaCache.data[id] = v || ''; App.onData(); }); }
    return '';
  },
  async loadAll() { const all = (await DB.get('media')) || {}; Object.keys(all).forEach(k => { MediaCache.data[k] = all[k]; }); }
};
function imgSrc(v) { if (!v) return ''; v = String(v); return v.indexOf('media:') === 0 ? MediaCache.get(v.slice(6)) : v; }
function compressImage(file, o = {}) {
  const max = o.max || 1600, q = o.q || 0.82;
  return new Promise((res, rej) => {
    const rd = new FileReader(); rd.onerror = rej;
    rd.onload = () => { const im = new Image(); im.onerror = () => res(rd.result); im.onload = () => {
      const keepPng = /png|gif|svg/.test(file.type) && file.size < 350 * 1024 && im.width <= max; if (keepPng) return res(rd.result);
      const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d'); if (/png|gif/.test(file.type)) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); } x.drawImage(im, 0, 0, c.width, c.height);
      let out = c.toDataURL('image/webp', q); if (out.indexOf('data:image/webp') !== 0) out = c.toDataURL('image/jpeg', q); res(out.length < rd.result.length ? out : rd.result); }; im.src = rd.result; };
    rd.readAsDataURL(file);
  });
}
const ImgPick = {
  data: {},
  html(key, current) {
    ImgPick.data[key] = current || '';
    return '<div class="img-pick" data-img="' + h(key) + '"><img class="thumb" data-img-thumb alt=""><label class="btn btn-ghost btn-sm">📷 اختيار صورة<input type="file" accept="image/*" hidden data-img-file></label><button type="button" class="btn btn-danger btn-xs" data-img-clear>إزالة</button><span class="err" data-img-err></span></div>';
  },
  mount(root) {
    $$('[data-img]', root).forEach(box => {
      const key = box.getAttribute('data-img'); const th = $('[data-img-thumb]', box), err = $('[data-img-err]', box);
      const show = () => { const v = imgSrc(ImgPick.data[key]); if (v) { th.src = v; th.style.display = ''; } else { th.removeAttribute('src'); th.style.display = 'none'; } };
      show(); if (String(ImgPick.data[key] || '').indexOf('media:') === 0) setTimeout(show, 900);
      $('[data-img-file]', box).addEventListener('change', async e => {
        const f = e.target.files && e.target.files[0]; err.textContent = ''; if (!f) return;
        if (!/^image\//.test(f.type)) { err.textContent = 'نوع الملف غير صالح — الصور فقط.'; e.target.value = ''; return; }
        if (f.size > MAX_IMG_MB * 1024 * 1024) { err.textContent = 'تجاوز الحجم المسموح (' + MAX_IMG_MB + ' ميجابايت كحد أقصى).'; e.target.value = ''; return; }
        err.textContent = '⏳ جارٍ ضغط الصورة ورفعها…';
        try {
          const data = await compressImage(f, key === 'brandLogo' ? { max: 800 } : {});
          if (key === 'brandLogo') { ImgPick.data[key] = data; }
          else { const id = genId('img'); await DB.set('media/' + id, data); MediaCache.data[id] = data; ImgPick.data[key] = 'media:' + id; }
          err.textContent = '✅ ' + Math.round(f.size / 1024) + ' KB ← ' + Math.round(data.length * 0.75 / 1024) + ' KB بعد الضغط'; show();
        } catch (x) { err.textContent = 'تعذر معالجة الصورة.'; }
      });
      $('[data-img-clear]', box).addEventListener('click', () => { ImgPick.data[key] = ''; show(); });
    });
  },
  val(key) { return ImgPick.data[key] || ''; }
};

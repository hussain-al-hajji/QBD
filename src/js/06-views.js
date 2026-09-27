// ---------------------------------------------------------------------
// الشاشات العامة: الدخول، الرئيسية، المحور، التمرين، المختبر، حسابي
// ---------------------------------------------------------------------
const Views = {};

// ============ الرئيسية ============
function axisArt(a, big) {
  const col = Content.color(a);
  if (a.image) return '<div class="axis-art"><img src=\"' + imgSrc(a.image) + '\" alt=""></div>';
  return '<div class="axis-art" style="background:linear-gradient(135deg,' + col + ',' + shade(col, -0.35) + ')">' + decorShapes(a.id) + '<div class="axis-icon">' + iconSvg(a.icon || 'star', big ? 44 : 38, '#fff', 1.8) + '</div></div>';
}
function decorShapes(seed, op = .16) {
  let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) % 9973; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  let out = '<svg class="decor" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">';
  for (let i = 0; i < 7; i++) { const x = rnd() * 300, y = rnd() * 150, r = 10 + rnd() * 34; out += rnd() > .5 ? '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + r.toFixed(0) + '" fill="#fff" opacity="' + (op * (0.5 + rnd())).toFixed(2) + '"/>' : '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + (r * 1.4).toFixed(0) + '" height="' + (r * 1.4).toFixed(0) + '" rx="' + (r * .35).toFixed(0) + '" fill="#fff" opacity="' + (op * (0.5 + rnd())).toFixed(2) + '" transform="rotate(' + (rnd() * 40 - 20).toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + ')"/>'; }
  return out + '</svg>';
}
function secHead(sec, extra = '') { return '<div class="sec-head"><div>' + (sec.kicker ? '<div class="sec-kicker">' + h(sec.kicker) + '</div>' : '') + '<h2 class="sec-title">' + h(sec.title || '') + '</h2></div>' + extra + '</div>'; }
function assessCardHtml(ph) {
  const A = Content.assess(); const open = Assess.isOpen(ph); const r = Me.uid() ? Assess.rec(ph, Me.uid()) : null; const n = A.items.length;
  const lbl = ph === 'pre' ? 'التقييم القبلي' : 'التقييم البعدي'; const sub = ph === 'pre' ? 'قبل بدء التدريب' : 'بعد انتهاء التدريب';
  const st = r && r.done ? '<span class="pill ok-pill">✅ أنجزته' + (Assess.cfg().reveal ? ' · <span class="num">' + Assess.score(r.answers) + '/' + n + '</span>' : '') + '</span>' : open ? '<span class="pill open-pill">🟢 متاح الآن</span>' : '<span class="pill">🔒 مغلق حاليًا</span>';
  return '<button class="act-card assess-card ' + (open || (r && r.done) ? '' : 'dim') + '" data-go="assess" data-id="' + ph + '"><div class="act-ico">' + (ph === 'pre' ? '🧭' : '🏁') + '</div><div class="grow"><h3>' + lbl + '</h3><div class="muted" style="font-size:13.5px;font-family:var(--f-ui)">' + sub + ' · <span class="num">' + n + '</span> أسئلة اختيار من متعدد</div><div style="margin-top:6px">' + st + '</div></div></button>';
}
function storyCard(st) {
  const col = AXIS_COLORS[st.color % AXIS_COLORS.length];
  return '<button class="story-card" data-go="story" data-id="' + h(st.id) + '" style="--ac:' + col + '"><div class="story-art">' + (st.image ? '<img src=\"' + imgSrc(st.image) + '\" alt="">' : Scenes.render(st.scene || 'idea', col)) + '<span class="story-flag">' + h(st.flag || '') + ' ' + h(st.country || '') + '</span></div><div class="story-body"><span class="story-sector">' + h(st.sector || '') + (st.year ? ' · <span class="num">' + h(st.year) + '</span>' : '') + '</span><h3>' + h(st.title) + '</h3><p>' + h(clip(stripHtml(st.summary), 150)) + '</p><span class="story-more">اقرأ القصة ←</span></div></button>';
}
function homeSectionHtml(sec) {
  const k = sec.key;
  if (k === 'stories') { const list = Content.stories(); if (!list.length) return ''; return '<section class="section">' + secHead(sec, '<span class="pill">قصص حقيقية منشورة مع مصادرها</span>') + '<div class="story-grid">' + list.map(storyCard).join('') + '</div></section>'; }
  if (k === 'assess') { const A = Content.assess(); if (!A.items.length) return ''; return '<section class="section">' + secHead(sec) + '<div class="act-grid">' + assessCardHtml('pre') + assessCardHtml('post') + '</div></section>'; }
  if (k === 'activities') { const acts = Content.activities(); if (!acts.length) return ''; return '<section class="section">' + secHead(sec) + '<div class="act-grid">' + acts.map(e => '<button class="act-card" data-go="ex" data-id="' + h(e.id) + '"><div class="act-ico">' + h(e.icon || '✨') + '</div><div><h3>' + h(e.title) + '</h3><div class="muted" style="font-size:13.5px;font-family:var(--f-ui)">' + h(clip(stripHtml(e.scenario || e.task), 90)) + '</div></div></button>').join('') + '</div></section>'; }
  if (k === 'axes') {
    const axes = Content.axes(); if (!axes.length) return '';
    return '<section class="section">' + secHead(sec, '<span class="pill">اضغط أي محور لفتح شرائحه وتمارينه</span>') + '<div class="axis-grid">' +
      axes.map((a, i) => { const unitHead = (i === 0 || axes[i - 1].unit !== a.unit) ? '<div class="unit-head"><span class="unit-no">' + h(Content.unitKicker(a.unit) || 'محاور إضافية') + '</span><h3>' + h(Content.unitName(a.unit) || 'محاور أُضيفت للبرنامج') + '</h3></div>' : ''; const exs = Content.exercisesOf(a.id).length; const done = Me.isReg() && exs ? Content.exercisesOf(a.id).filter(e => Progress.exDone(e, Me.uid())).length : 0; return unitHead + '<button class="axis-card ' + (a._disabled ? 'disabled' : '') + '" data-act="open-axis" data-id="' + h(a.id) + '">' + (a._disabled ? '<span class="soon-badge">قريبًا</span>' : '') + axisArt(a) + '<span class="axis-no">' + h(Content.unitName(a.unit) || 'محور إضافي') + '</span><div class="axis-body"><div class="axis-title">' + h(a.title) + '</div>' + (a.classic ? '<div class="axis-classic">' + h(a.classic) + '</div>' : '') + '<div class="axis-desc">' + richHtml(a.desc) + '</div><div class="axis-meta"><span class="pill">🎞️ <span class="num">' + a.slides.length + '</span> شريحة</span><span class="pill">✍️ <span class="num">' + exs + '</span> تمرين</span>' + (a.duration ? '<span class="pill">⏱ ' + h(a.duration) + '</span>' : '') + (done ? '<span class="pill ok-pill">✔ <span class="num">' + done + '/' + exs + '</span></span>' : '') + '</div></div></button>'; }).join('') + '</div></section>';
  }
  if (k === 'lab') { const L = Content.lab(); if (!L.stages.length) return ''; return '<section class="section"><div class="lab-banner" data-go="lab"><div class="lab-ico">🧪</div><div class="grow"><div class="sec-kicker" style="color:#D9A62E">' + h(sec.kicker || '') + ' · <span class="num">' + (L.stages.length * L.minutes) + '</span> دقيقة</div><h3>' + h(sec.title || L.title) + '</h3><p><span class="num">' + L.stages.length + '</span> مراحل بمؤقّت حي لكل مجموعة، تجمع كل محاور البرنامج في خطة نمو واحدة.</p></div><span class="btn btn-primary">ادخل المختبر ←</span></div></section>'; }
  if (k === 'leaderboard') { if (!Points.cfg().enabled) return ''; return '<section class="section">' + secHead(sec) + leaderboardHtml(5) + '</section>'; }
  if (k === 'tools') return '<section class="section">' + secHead(sec) + '<div class="act-grid"><button class="act-card" data-go="tools"><div class="act-ico">🧮</div><div><h3>7 حاسبات عملية</h3><div class="muted" style="font-size:13.5px;font-family:var(--f-ui)">التكلفة الإجمالية للمنصة، رسوم بوابات الدفع، نقطة إعادة الطلب، التكلفة الواصلة للعميل الدولي، CAC وCLV وROAS، سعر التعادل، ومصفوفة اختيار المنصة.</div></div></button><button class="act-card" data-go="tools"><div class="act-ico">📚</div><div><h3>مكتبة القوالب</h3><div class="muted" style="font-size:13.5px;font-family:var(--f-ui)">إجراء تشغيل قياسي، قائمة إطلاق المتجر، خطة النمو، سياسة الاسترجاع، ومصفوفة المنصات — Word وPDF.</div></div></button></div></section>';
  if (k === 'survey') { const survey = Content.survey(); if (!survey) return ''; return '<section class="section">' + secHead(sec) + '<button class="act-card" style="width:100%" data-go="ex" data-id="' + h(survey.id) + '"><div class="act-ico">' + h(survey.icon || '💬') + '</div><div><h3>' + h(survey.title) + '</h3><div class="muted" style="font-family:var(--f-ui);font-size:14px">' + h(stripHtml(survey.task)) + '</div></div></button></section>'; }
  // الأقسام المخصّصة
  let body = '';
  if (sec.type === 'video') { const em = toEmbed(sec.videoUrl); body = em ? '<div class="video-box"><iframe src="' + h(em) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' : (sec.videoUrl ? '<a class="btn btn-soft" href="' + h(sec.videoUrl) + '" target="_blank" rel="noopener">' + iconSvg('play', 16) + ' مشاهدة الفيديو</a>' : ''); }
  if (sec.image) body = '<img class="sec-img" src=\"' + imgSrc(sec.image) + '\" alt="">' + body;
  if (sec.body) body += '<div class="custom-body">' + richHtml(sec.body) + '</div>';
  if (sec.btnUrl) body += '<div style="margin-top:12px"><a class="btn btn-primary" href="' + h(/^https?:|^mailto:|^tel:/.test(sec.btnUrl) ? sec.btnUrl : 'https://' + sec.btnUrl) + '" target="_blank" rel="noopener">' + h(sec.btnLabel || 'افتح الرابط') + ' ←</a></div>';
  return '<section class="section">' + secHead(sec) + '<div class="card pad custom-sec custom-' + h(sec.type || 'text') + '">' + body + '</div></section>';
}
Views.home = {
  html() {
    const s = Content.site(); const axes = Content.axes();
    const exCount = Content.eligibleAxes().reduce((n, a) => n + Content.exercisesOf(a.id).length, 0);
    let out = '<section class="hero"><div class="hero-cover">' + (s.heroImage ? '<img src=\"' + imgSrc(s.heroImage) + '\" alt="">' : Scenes.render('hero')) + '</div><div class="hero-body">' +
      '<h1>' + h(s.heroTitle) + '</h1><div class="hero-desc">' + richHtml(s.heroDesc) + '</div>' +
      '<div class="stats"><div class="stat"><b class="num">' + Content.eligibleAxes().map(a => a.unit).filter((u, i, x) => u && u !== 7 && x.indexOf(u) === i).length + '</b><span>وحدات</span></div><div class="stat"><b class="num">' + axes.length + '</b><span>محور</span></div><div class="stat"><b class="num">' + exCount + '</b><span>تمرين تفاعلي</span></div><div class="stat"><b class="num">' + (Number(Store.registered) || 0) + '</b><span>مسجّل حتى الآن</span></div></div></div></section>';
    const fu = followupCardsHtml(); if (fu) out += '<section class="section">' + fu + '</section>';
    if (HomeNav.layout() === 'sidebar') return out.replace('<section class="hero">', '<section class="hero hero-compact">') + HomeNav.html();
    Content.homeSections().forEach(sec => { try { out += homeSectionHtml(sec); } catch (e) { console.error(e); } });
    return out;
  }
};

// ============ تخطيط الرئيسية بالقائمة الجانبية (تجريبي — قابل للتبديل من لوحة الإدارة) ============
const HomeNav = {
  layout() { return (Store.site && Store.site.homeLayout) === 'classic' ? 'classic' : 'sidebar'; },
  label(sec) { return String(stripHtml(sec.title || '') || (sec.key === 'lab' ? Content.lab().title : '') || 'قسم').replace(/^[^\p{L}\p{N}]+/u, '').trim(); },
  icon(sec) { return sec.icon || (sec.type === 'video' ? '🎬' : sec.type === 'image' ? '🖼️' : sec.type === 'cta' ? '🔗' : '📝'); },
  count(sec) {
    const k = sec.key;
    if (k === 'stories') return Content.stories().length;
    if (k === 'assess') return 2;
    if (k === 'activities') return Content.activities().length;
    if (k === 'axes') return Content.axes().length;
    if (k === 'lab') return Content.lab().stages.length;
    if (k === 'tools') return TOOLS.length;
    return '';
  },
  html() {
    const items = [];
    Content.homeSections().forEach(sec => { let body = ''; try { body = homeSectionHtml(sec); } catch (e) { console.error(e); } if (body) items.push({ sec, body }); });
    if (!items.length) return '';
    let cur = UIState.homeSec || SafeLS.get('ec_home_sec');
    let i = items.findIndex(x => x.sec.key === cur); if (i < 0) i = 0;
    const next = items[i + 1];
    return '<div class="home-shell"><aside class="home-nav" aria-label="أقسام الصفحة الرئيسية"><div class="hn-title">أقسام البرنامج</div><nav>' +
      items.map((x, j) => { const c = HomeNav.count(x.sec); return '<button class="hn-item ' + (j === i ? 'active' : '') + '" data-act="home-sec" data-k="' + h(x.sec.key) + '" ' + (j === i ? 'aria-current="true"' : '') + '><span class="hn-ico">' + h(HomeNav.icon(x.sec)) + '</span><span class="hn-txt"><b>' + h(HomeNav.label(x.sec)) + '</b>' + (x.sec.kicker ? '<small>' + h(x.sec.kicker) + '</small>' : '') + '</span>' + (c !== '' ? '<span class="hn-count num">' + c + '</span>' : '') + '</button>'; }).join('') +
      '</nav></aside><div class="home-pane" id="homePane">' + items[i].body +
      (next ? '<button class="hn-next" data-act="home-sec" data-k="' + h(next.sec.key) + '"><span>القسم التالي</span><b>' + h(HomeNav.icon(next.sec)) + ' ' + h(HomeNav.label(next.sec)) + ' ←</b></button>' : '') + '</div></div>';
  }
};

// ============ صفحة قصة النجاح ============
Views.story = {
  html() {
    const st = Content.story(Router.cur.id);
    if (!st || (st._hidden && !Admin.ctl())) return Layout.crumbs() + '<div class="empty" style="margin-top:20px">هذه القصة غير متاحة.</div>';
    const col = AXIS_COLORS[st.color % AXIS_COLORS.length]; const list = Content.stories(); const i = list.findIndex(x => x.id === st.id);
    const prev = i > 0 ? list[i - 1] : null, next = i > -1 && i < list.length - 1 ? list[i + 1] : null; const ax = st.axis ? Content.axis(st.axis) : null;
    let out = Layout.crumbs('<span class="crumb-tag">قصص نجاح</span>') + '<article class="story-page" style="--ac:' + col + ';--acg:' + tint(col, .1) + '">' +
      '<div class="story-hero"><div class="story-hero-art">' + (st.image ? '<img src=\"' + imgSrc(st.image) + '\" alt="">' : Scenes.render(st.scene || 'idea', col)) + '</div><div class="story-hero-body"><span class="story-flag big">' + h(st.flag || '') + ' ' + h(st.country || '') + '</span><div class="story-sector">' + h(st.sector || '') + (st.year ? ' · تأسست <span class="num">' + h(st.year) + '</span>' : '') + '</div><h1>' + h(st.title) + '</h1><p class="story-summary">' + h(stripHtml(st.summary)) + '</p></div></div>' +
      (st.numbers.length ? '<div class="story-numbers">' + st.numbers.map(n => '<div><b class="' + (/[\u0600-\u06FF]/.test(n.v) ? '' : 'num') + '">' + h(n.v) + '</b><span>' + h(n.l) + '</span></div>').join('') + '</div>' : '') +
      '<div class="ex-block"><div class="lbl">📖 القصة</div><div class="story-text">' + richHtml(st.story) + '</div></div>' +
      (st.lessons.length ? '<div class="ex-block principle"><div class="lbl">💡 دروس لمشروعك</div><ul class="points">' + st.lessons.map((l, k) => '<li><span class="n num">' + (k + 1) + '</span><span>' + boldTerm(l) + '</span></li>').join('') + '</ul></div>' : '') +
      (ax && !ax._hidden ? '<div class="ex-block extract"><div class="lbl">🔗 المحور المرتبط</div><button class="btn btn-soft" data-act="open-axis" data-id="' + h(ax.id) + '">' + iconSvg(ax.icon || 'star', 16) + ' ' + h(ax.title) + '</button></div>' : '') +
      (st.sources.length ? '<div class="ex-block"><div class="lbl">📚 المصادر</div><ul class="story-sources">' + st.sources.map(x => '<li><a href="' + h(x.url) + '" target="_blank" rel="noopener">' + iconSvg('link', 14) + ' ' + h(x.label) + '</a></li>').join('') + '</ul><div class="muted" style="font-family:var(--f-ui);font-size:12px;margin-top:6px">الأرقام كما وردت في المصادر المنشورة وقت إعداد البرنامج، وقد تتغير لاحقًا.</div></div>' : '') +
      '<div class="row" style="margin-top:14px;justify-content:center">' + Likes.btn('storyLikes/' + st.id, (Store.storyLikes[st.id] || {}).likes).replace('👍', '👏 ألهمتني') + '</div>' +
      '<div class="nav-row"><button class="btn btn-ghost" ' + (prev ? 'data-go="story" data-id="' + h(prev.id) + '"' : 'disabled') + '>◀ القصة السابقة</button><button class="btn btn-dark" data-go="home">🏠 الرئيسية</button><button class="btn btn-ghost" ' + (next ? 'data-go="story" data-id="' + h(next.id) + '"' : 'disabled') + '>القصة التالية ▶</button></div></article>';
    return out;
  }
};

// ============ التقييم القبلي والبعدي ============
Views.assess = {
  html() {
    const ph = Router.cur.id === 'post' ? 'post' : 'pre'; const A = Content.assess(); const n = A.items.length; const cfg = Assess.cfg();
    const lbl = ph === 'pre' ? 'التقييم القبلي' : 'التقييم البعدي';
    let out = Layout.crumbs('<span class="crumb-tag">' + lbl + '</span>') + '<div class="ex-head"><div class="ico">' + (ph === 'pre' ? '🧭' : '🏁') + '</div><div><h1>' + lbl + '</h1><div class="row" style="margin-top:4px"><span class="pill">👤 فردي</span><span class="pill"><span class="num">' + n + '</span> أسئلة</span><span class="pill">' + (Assess.isOpen(ph) ? '🟢 متاح' : '🔒 مغلق') + '</span></div></div></div>';
    out += '<div class="ex-block scenario"><div class="lbl">📋 ' + h(A.title || '') + '</div>' + richHtml(A.intro) + '</div>';
    const r = Me.uid() ? Assess.rec(ph, Me.uid()) : null;
    if (r && r.done) {
      const sc = Assess.score(r.answers); const pre = ph === 'post' && Me.uid() ? Assess.rec('pre', Me.uid()) : null;
      out += '<div class="card pad center" style="margin-top:16px"><div style="font-size:42px">✅</div><h3>تم إرسال إجاباتك</h3>' +
        (cfg.reveal ? '<div class="big-pct num">' + sc + ' / ' + n + '</div>' + (pre && pre.done ? '<p class="muted" style="font-family:var(--f-ui)">نتيجتك القبلية: <span class="num">' + Assess.score(pre.answers) + ' / ' + n + '</span> · التغير: <b class="num">' + ((sc - Assess.score(pre.answers)) >= 0 ? '+' : '') + (sc - Assess.score(pre.answers)) + '</b></p>' : '') : '<p class="muted" style="font-family:var(--f-ui)">ستظهر نتيجتك والإجابات الصحيحة عندما يكشفها المدرّب.</p>') + '</div>';
      if (cfg.reveal) out += '<div class="answer-box" style="margin-top:14px">' + answersSummary(A, r.answers, true) + '</div>';
      return out;
    }
    if (!Assess.isOpen(ph) && !Admin.ctl()) return out + '<div class="empty" style="margin-top:16px">🔒 ' + lbl + ' غير متاح الآن — سيفتحه المدرّب ' + (ph === 'pre' ? 'قبل بدء التدريب' : 'بعد انتهاء التدريب') + '.</div>';
    if (!Me.isReg()) return out + '<div class="answer-box"><div class="locked-note">🔒 للمسجلين فقط</div></div>';
    const key = 'as_' + ph; let d = UIState.draft[key]; if (!d) { d = A.items.map(() => null); UIState.draft[key] = d; }
    out += '<div class="answer-box"><div class="status-note" style="margin-bottom:6px">أجب عن كل الأسئلة ثم اضغط «إرسال». يمكنك تغيير اختيارك قبل الإرسال فقط، ولا تظهر النتائج إلا بعد أن يكشفها المدرّب.</div>' +
      seededOrder(n, Me.uid() + ph).map((i, pos) => { const it = A.items[i]; return '<div class="q-card"><div class="qt"><span class="qn num">' + (pos + 1) + '</span><span>' + h(it.q) + '</span></div><div class="opts">' + seededOrder(it.options.length, Me.uid() + ph + i).map((k, kp) => { const o = it.options[k]; const sel = d[i] !== null && +d[i] === k; return '<button class="opt ' + (sel ? 'sel' : '') + '" data-act="as-pick" data-ph="' + ph + '" data-i="' + i + '" data-v="' + k + '"><span class="mk">' + (sel ? '✓' : '') + '</span><span><b>' + LETTERS[kp] + ')</b> ' + h(o) + '</span></button>'; }).join('') + '</div></div>'; }).join('') +
      '<div class="save-row"><button class="btn btn-primary" data-act="as-submit" data-ph="' + ph + '">📤 إرسال ' + lbl + '</button><span class="status-note num">' + d.filter(x => x !== null).length + ' / ' + n + '</span></div></div>';
    return out;
  }
};

// ============ صفحة المحور: الشرائح + التمارين ============
Views.axis = {
  html() {
    const a = Content.axis(Router.cur.id);
    if (!a || a._hidden) return Layout.crumbs() + '<div class="empty" style="margin-top:20px">هذا المحور غير متاح.</div>';
    if (a._disabled && !Admin.ctl()) return Layout.crumbs() + '<div class="empty" style="margin-top:20px">🔒 هذا المحور غير متاح بعد.</div>';
    const col = Content.color(a); const n = a.slides.length; const idx = Math.min(UIState.deck[a.id] || 0, Math.max(0, n - 1));
    const exs = Content.exercisesOf(a.id);
    const elig = Content.eligibleAxes(); const pos = elig.findIndex(x => x.id === a.id); const next = pos > -1 ? elig[pos + 1] : null;
    let out = Layout.crumbs('<span class="crumb-tag">' + h(Content.unitName(a.unit) || '') + '</span>') +
      '<div class="axis-hero" style="background:linear-gradient(135deg,' + col + ',' + shade(col, -0.4) + ')">' + '<div style="position:absolute;inset:0">' + decorShapes(a.id + 'h', .12) + '</div>' +
      '<div class="big-ico">' + iconSvg(a.icon || 'star', 36, '#fff', 1.8) + '</div><div style="position:relative"><div class="sub">' + h(a.classic || '') + '</div><h1>' + h(a.title) + '</h1>' + (a.duration ? '<div class="sub">⏱ ' + h(a.duration) + ' · <span class="num">' + n + '</span> شريحة · <span class="num">' + exs.length + '</span> تمرين</div>' : '') + '</div></div>';
    if (n) {
      out += deckHtml(a, idx);
      if (Admin.ctl()) out += '<div class="trainer-note" id="tnote">' + trainerNoteHtml(a, idx) + '</div>';
    } else out += '<div class="empty" style="margin-top:18px">لا توجد شرائح في هذا المحور بعد.</div>';
    out += '<section class="section" style="--ac:' + col + ';--acg:' + tint(col, .1) + '"><div class="sec-head"><h2 class="sec-title">✍️ تمارين هذا المحور</h2><span class="pill"><span class="num">' + exs.length + '</span> تمرين</span></div>' +
      (exs.length ? '<div class="ex-list">' + exs.map(e => '<button class="ex-item" data-go="ex" data-id="' + h(e.id) + '"><span class="ico">' + h(e.icon || '✍️') + '</span><span><h4>' + h(e.title) + '</h4><span class="muted" style="font-family:var(--f-ui);font-size:12.5px">' + (e.mode === 'group' ? '👥 جماعي' : '👤 فردي') + ' · ' + h(FORMATS[e.format] || '') + '</span></span>' + (Progress.exDone(e, Me.uid()) ? '<span class="done">✔</span>' : '') + '</button>').join('') + '</div>' : '<div class="empty">لا توجد تمارين لهذا المحور.</div>') +
      '<div class="nav-row"><button class="btn btn-dark" ' + (next ? 'data-act="open-axis" data-id="' + h(next.id) + '"' : 'disabled') + '>الفصل القادم ▶</button><button class="btn btn-ghost" data-go="home">🏠 الرئيسية</button></div></section>';
    if (Leads.cfg().axis === a.id) out += '<section class="section">' + leadFormHtml('axis') + '</section>';
    return out;
  },
  after(root) {
    const deck = $('[data-deck]', root); if (!deck) return;
    const id = deck.getAttribute('data-deck'); const vp = $('.deck-viewport', deck);
    Deck.fit(id); setTimeout(() => Deck.fit(id), 400); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => Deck.fit(id));
    $$('img', deck).forEach(img => { if (!img.complete) img.addEventListener('load', () => Deck.fit(id), { once: true }); });
    let sx = null, sy = null;
    vp.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    vp.addEventListener('touchend', e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) Deck.move(id, dx > 0 ? 1 : -1); }, { passive: true });
    let mx = null; vp.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') mx = e.clientX; });
    vp.addEventListener('pointerup', e => { if (mx == null) return; const dx = e.clientX - mx; mx = null; if (Math.abs(dx) > 80) Deck.move(id, dx > 0 ? 1 : -1); });
  }
};
function deckHtml(a, idx, mode) {
  const col = Content.color(a); const n = a.slides.length;
  return '<div class="deck' + (mode === 'show' ? ' deck-show' : '') + '" style="--ac:' + col + '" data-deck="' + h(a.id) + '"><div class="deck-bar"><div class="deck-dots">' + a.slides.map((_, i) => '<span class="deck-dot ' + (i <= idx ? 'on' : '') + '" data-slide="' + i + '"></span>').join('') + '</div><span class="deck-count num">' + (idx + 1) + ' / ' + n + '</span>' +
    (mode === 'show' ? '' : '<button class="deck-tool" data-act="deck-proj" title="عرض الشريحة على شاشة خارجية أو بروجكتر">📽️<span class="lbl">شاشة العرض</span></button>') +
    '<button class="deck-tool deck-fs-btn" data-act="deck-fs" title="ملء الشاشة (F)"><span class="fs-on">⛶<span class="lbl">ملء الشاشة</span></span><span class="fs-off">✕<span class="lbl">خروج من ملء الشاشة</span></span></button></div>' +
    '<div class="deck-viewport"><div class="deck-track" style="transform:translateX(' + (idx * 100) + '%)">' + a.slides.map((s, i) => renderSlide(s, a, i, n, i === idx)).join('') + '</div></div>' +
    '<div class="deck-nav"><button class="deck-arrow" data-deck-go="-1" ' + (idx === 0 ? 'disabled' : '') + ' title="السابقة">→</button><span class="swipe-hint">اسحب يمينًا أو يسارًا، أو استخدم الأسهم ومفتاح المسافة للتنقل</span><button class="deck-arrow" data-deck-go="1" ' + (idx >= n - 1 ? 'disabled' : '') + ' title="التالية">←</button></div></div>';
}
function trainerNoteHtml(a, i) { const sl = a.slides[i] || {}; return '<div class="tn-head">🎤 ملاحظات المدرب <span class="muted">(تظهر للأدمن فقط) · الشريحة <span class="num">' + (i + 1) + '</span></span></div><div class="tn-body">' + (sl.note ? h(sl.note) : '<span class="muted">لا توجد ملاحظة لهذه الشريحة — أضفها من تعديل المحور.</span>') + '</div>' + (a.outcome ? '<div class="tn-out">🎯 مخرج المحور: ' + h(a.outcome) + '</div>' : ''); }
// ---------- مشغّل الشرائح: مقاس الشاشة، ملء الشاشة، وشاشة العرض الخارجية ----------
const Deck = {
  bc: (() => { try { return new BroadcastChannel('ec_deck'); } catch (e) { return null; } })(),
  over: {},
  move(id, d) { const a = Content.axis(id); if (!a) return; const n = a.slides.length; Deck.to(id, Math.max(0, Math.min(n - 1, (UIState.deck[id] || 0) + d))); },
  to(id, i, o = {}) {
    UIState.deck[id] = i; SafeLS.set('ec_deck_' + id, String(i));
    if (!o.remote && Deck.bc) try { Deck.bc.postMessage({ t: 'to', id, i }); } catch (e) {}
    const deck = $('[data-deck="' + id + '"]'); if (!deck) return; const n = $$('.slide', deck).length;
    $('.deck-track', deck).style.transform = 'translateX(' + (i * 100) + '%)';
    $$('.slide', deck).forEach((s, k) => s.classList.toggle('cur', k === i));
    $$('.deck-dot', deck).forEach((d, k) => d.classList.toggle('on', k <= i));
    $('.deck-count', deck).textContent = (i + 1) + ' / ' + n;
    const [prev, next] = $$('[data-deck-go]', deck); if (prev) { prev.disabled = i === 0; next.disabled = i >= n - 1; }
    Deck.fitHeight(id);
    const tn = $('#tnote'); if (tn) { const a = Content.axis(id); if (a) tn.innerHTML = trainerNoteHtml(a, i); }
    if (!o.remote && Deck.mode(deck) === 'page') { const r = deck.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight + 2) deck.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  },
  // flow: الجوال (ارتفاع طبيعي) · page: اللابتوب (الشريحة بمقاس الشاشة) · fs: ملء الشاشة · show: نافذة العرض الخارجية
  mode(deck) { if (deck && document.fullscreenElement === deck) return 'fs'; if (deck && deck.classList.contains('deck-show')) return 'show'; return innerWidth >= 900 && innerHeight >= 500 ? 'page' : 'flow'; },
  avail(deck, m) {
    const bar = $('.deck-bar', deck).offsetHeight, nav = $('.deck-nav', deck).offsetHeight;
    if (m === 'fs' || m === 'show') return innerHeight - bar;
    const tb = ($('.topbar') || {}).offsetHeight || 64; return innerHeight - tb - bar - nav - 18;
  },
  fitSlide(s, H, base) {
    const inn = $('.slide-in', s); if (!inn) return true; s.style.height = H + 'px'; s.classList.remove('tight');
    s.style.setProperty('--vh-max', Math.max(180, H - 150) + 'px'); s.style.setProperty('--vh-scene', Math.max(160, H - 190) + 'px');
    const cs = getComputedStyle(s); const room = H - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 2;
    const fits = z => { inn.style.zoom = z; return inn.getBoundingClientRect().height <= room; };
    if (fits(base)) return true;
    let lo = 0.62, hi = base; if (!fits(lo)) { s.classList.add('tight'); return false; }
    for (let k = 0; k < 7; k++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    inn.style.zoom = lo.toFixed(3); return true;
  },
  fit(id) {
    const deck = $('[data-deck="' + id + '"]'); if (!deck) return; const m = Deck.mode(deck);
    deck.classList.toggle('fixed', m !== 'flow'); deck.classList.toggle('is-fs', m === 'fs');
    const slides = $$('.slide', deck);
    if (m === 'flow') { slides.forEach(s => { s.style.height = ''; s.classList.remove('tight'); const inn = $('.slide-in', s); if (inn) inn.style.zoom = ''; }); Deck.fitHeight(id); return; }
    const H = Math.max(300, Math.floor(Deck.avail(deck, m)));
    const base = m === 'page' ? 1 : Math.min(1.7, Math.max(1, deck.clientWidth / 1180, H / 640));
    Deck.over[id] = []; slides.forEach((s, k) => { if (!Deck.fitSlide(s, H, base)) Deck.over[id].push(k); });
    Deck.fitHeight(id);
  },
  fitHeight(id) { const deck = $('[data-deck="' + id + '"]'); if (!deck) return; const s = $$('.slide', deck)[UIState.deck[id] || 0]; if (s) $('.deck-viewport', deck).style.height = s.offsetHeight + 'px'; },
  refresh(id, idx) { // إعادة رسم شريحة واحدة بعد تفاعل داخلها
    const deck = $('[data-deck="' + id + '"]'); const a = Content.axis(id); if (!deck || !a) return; const slide = $$('.slide', deck)[idx]; if (!slide) return;
    const H0 = parseFloat(slide.style.height) || 0; const tmp = document.createElement('div'); tmp.innerHTML = renderSlide(a.slides[idx], a, idx, a.slides.length, idx === (UIState.deck[id] || 0)); slide.replaceWith(tmp.firstChild);
    if (Deck.mode(deck) === 'flow') Deck.fitHeight(id); else { const s = $$('.slide', deck)[idx]; const H = H0 || Math.floor(Deck.avail(deck, Deck.mode(deck))); Deck.fitSlide(s, H, Deck.mode(deck) === 'page' ? 1 : Math.min(1.7, Math.max(1, deck.clientWidth / 1180, H / 640))); Deck.fitHeight(id); }
  },
  async fullscreen(deck, screen) {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch (e) {} return; }
    if (!deck || !deck.requestFullscreen) { UI.alert('متصفحك لا يدعم ملء الشاشة لهذا العنصر.'); return; }
    try { await deck.requestFullscreen(screen ? { screen, navigationUI: 'hide' } : { navigationUI: 'hide' }); }
    catch (e) { UI.alert('تعذر تفعيل ملء الشاشة. جرّب الضغط على الزر مرة أخرى.'); }
  },
  showUrl(id) { return location.pathname + location.search + '#v=show&id=' + encodeURIComponent(id); },
  async projector(deck) {
    const id = deck.getAttribute('data-deck'); let sd = null;
    if ('getScreenDetails' in window) { try { sd = await window.getScreenDetails(); } catch (e) { sd = null; } }
    const ext = sd ? sd.screens.filter(x => x !== sd.currentScreen) : [];
    const nm = (x, k) => (x.label || (x.isInternal === false ? 'شاشة خارجية' : 'شاشة') + ' ' + (k + 1)) + ' · ' + x.width + '×' + x.height;
    let body = '<p class="muted" style="font-family:var(--f-ui);font-size:13.5px;margin-top:0">وصّل اللابتوب بالبروجكتر واختر «توسيع العرض» (Extend) في إعدادات الشاشة، ثم اختر طريقة العرض:</p><div class="proj-opts">';
    ext.forEach((x, k) => { body += '<button class="proj-opt" data-scr="' + k + '"><span class="pi">🖥️</span><span><b>ملء الشاشة على: ' + h(nm(x, k)) + '</b><small>تنتقل الشريحة وحدها إلى هذه الشاشة، ويعود كل شيء عند الخروج (Esc).</small></span></button>'; });
    body += '<button class="proj-opt" data-win="1"><span class="pi">🪟</span><span><b>نافذة عرض منفصلة للبروجكتر</b><small>تعرض الشريحة وحدها على الشاشة الخارجية، ويبقى اللابتوب معك للتحكم وقراءة ملاحظات المدرب. التنقل متزامن بين النافذتين.</small></span></button>';
    body += '<button class="proj-opt" data-here="1"><span class="pi">⛶</span><span><b>ملء هذه الشاشة</b><small>تعرض الشريحة على شاشة اللابتوب الحالية (أو المكررة على البروجكتر).</small></span></button></div>';
    if (!('getScreenDetails' in window)) body += '<div class="notice" style="margin-top:12px">اختيار الشاشة تلقائيًا متاح في متصفحي Chrome وEdge. في المتصفحات الأخرى افتح «نافذة العرض المنفصلة»، واسحبها إلى شاشة البروجكتر، ثم اضغط «ملء الشاشة» داخلها.</div>';
    else if (!sd) body += '<div class="notice" style="margin-top:12px">لإظهار الشاشات المتصلة، اسمح للمتصفح بـ«إدارة النوافذ» عند السؤال، ثم أعد فتح هذه النافذة.</div>';
    else if (!ext.length) body += '<div class="notice" style="margin-top:12px">لم نجد شاشة خارجية متصلة. تأكد من التوصيل ومن اختيار «توسيع العرض» (Extend) لا «التكرار» (Duplicate).</div>';
    const m = UI.modal('<h3>📽️ العرض على شاشة خارجية أو بروجكتر</h3>' + body + '<div class="actions"><button class="btn btn-ghost" data-x>إغلاق</button></div>', { wide: true });
    $('[data-x]', m.el).onclick = () => m.close();
    $$('[data-scr]', m.el).forEach(b => b.onclick = () => { m.close(); Deck.fullscreen(deck, ext[+b.getAttribute('data-scr')]); });
    $('[data-here]', m.el).onclick = () => { m.close(); Deck.fullscreen(deck); };
    $('[data-win]', m.el).onclick = () => {
      m.close(); const x = ext[0]; const f = x ? 'left=' + x.availLeft + ',top=' + x.availTop + ',width=' + x.availWidth + ',height=' + x.availHeight : 'width=1280,height=720';
      const w = window.open(Deck.showUrl(id), 'ec_show_' + id, 'popup,' + f);
      if (!w) UI.alert('منع المتصفح فتح النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع ثم أعد المحاولة.'); else UI.toast('🪟 فُتحت نافذة العرض — اضغط «ملء الشاشة» داخلها');
    };
  }
};
if (Deck.bc) Deck.bc.onmessage = ev => {
  const m = ev.data || {};
  if (m.t === 'to') { if (UIState.deck[m.id] !== m.i) Deck.to(m.id, m.i, { remote: true }); }
  else if (m.t === 'sk') { SlideKit.set(m.k, m.v); const i = UIState.deck[m.id] || 0; Deck.refresh(m.id, i); }
  else if (m.t === 'hello' && UIState.deck[m.id] != null && Router.cur.view === 'axis') try { Deck.bc.postMessage({ t: 'to', id: m.id, i: UIState.deck[m.id] }); } catch (e) {}
};
window.addEventListener('resize', debounce(() => { if (Router.cur.view === 'axis' || Router.cur.view === 'show') Deck.fit(Router.cur.id); }, 150));
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && App._pendingRender) { App._pendingRender = false; App.render(); return; } if (Router.cur.view === 'axis' || Router.cur.view === 'show') setTimeout(() => Deck.fit(Router.cur.id), 60); const hint = $('#showHint'); if (hint) hint.style.display = document.fullscreenElement ? 'none' : ''; });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act="deck-fs"],[data-act="deck-proj"]'); if (!t) return;
  const deck = t.closest('[data-deck]') || $('[data-deck]'); if (!deck) return;
  if (t.getAttribute('data-act') === 'deck-fs') Deck.fullscreen(deck); else Deck.projector(deck);
});
Views.show = {
  html() {
    const a = Content.axis(Router.cur.id); if (!a || !a.slides.length) return '<div class="empty" style="margin:40px">لا توجد شرائح لعرضها.</div>';
    const n = a.slides.length; const idx = Math.min(n - 1, Math.max(0, UIState.deck[a.id] != null ? UIState.deck[a.id] : +(SafeLS.get('ec_deck_' + a.id) || 0))); UIState.deck[a.id] = idx;
    return '<div class="show-wrap">' + deckHtml(a, idx, 'show') + '<div class="show-hint" id="showHint"><span>📽️ اسحب هذه النافذة إلى شاشة البروجكتر ثم:</span><button class="btn btn-primary btn-sm" data-act="deck-fs">⛶ ملء الشاشة</button></div></div>';
  },
  after(root) { Views.axis.after(root); const deck = $('[data-deck]', root); if (deck && Deck.bc) try { Deck.bc.postMessage({ t: 'hello', id: deck.getAttribute('data-deck') }); } catch (e) {} document.title = '📽️ ' + ((Content.axis(Router.cur.id) || {}).title || 'العرض'); }
};
// التنقل بلوحة المفاتيح وبأجهزة المؤشر (Presenter / Clicker) التي ترسل PageDown/PageUp عادةً، وبعضها أسهمًا أو مسافة.
// الأسهم الأفقية تتبع اتجاه القراءة العربي (← التالي، → السابق)، وB أو النقطة تُعتم الشاشة كما في العروض التقديمية.
const DECK_KEYS = { PageDown: 1, ArrowDown: 1, ArrowLeft: 1, ' ': 1, Enter: 1, PageUp: -1, ArrowUp: -1, ArrowRight: -1, Backspace: -1 };
document.addEventListener('keydown', e => {
  if ((Router.cur.view !== 'axis' && Router.cur.view !== 'show') || e.ctrlKey || e.metaKey || e.altKey || $('.modal-back')) return;
  const t = e.target || {}; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable) return;
  const blk = $('#blackout');
  if (blk) { e.preventDefault(); blk.remove(); return; }
  if (/^[bB.,ذز]$/.test(e.key)) { e.preventDefault(); (document.fullscreenElement || document.body).insertAdjacentHTML('beforeend', '<div id="blackout"></div>'); return; }
  if (/^[fFب]$/.test(e.key)) { e.preventDefault(); Deck.fullscreen($('[data-deck="' + Router.cur.id + '"]')); return; }
  let d = DECK_KEYS[e.key]; if (!d) return;
  if ((e.key === ' ' || e.key === 'Enter') && /BUTTON|A/.test(t.tagName || '')) return;
  if (e.shiftKey && e.key === ' ') d = -1;
  e.preventDefault();
  const deck = $('[data-deck="' + Router.cur.id + '"]'); if (!deck) return;
  Deck.move(Router.cur.id, d);
});
document.addEventListener('click', e => { if (e.target.id === 'blackout') e.target.remove(); });

// ============ صفحة التمرين ============
const DEFAULT_STEPS = {
  mcq: ['اقرأ كل سؤال بتمعّن.', 'اضغط الخيار الذي تراه صحيحًا — تُحفظ إجابتك فورًا دون زر حفظ.', 'تظهر نسبة اختيار كل خيار بين المتدربين، ويمكنك تغيير اختيارك في أي وقت بالضغط على خيار آخر.'],
  truefalse: ['اقرأ كل عبارة بدقة.', 'حدد «صح» أو «خطأ» لكل عبارة.', 'اضغط «حفظ الإجابات» ثم تابع إجابات زملائك مباشرة.'],
  fillblank: ['اختر مجموعتك أولًا من البطاقة أعلاه.', 'اضغط كلمة من البنك ثم اضغط الفراغ المناسب لها.', 'لتصحيح فراغ ممتلئ، اضغط عليه فيُفرَغ وتعود كلمته إلى البنك.', 'اضغط «حفظ وإرسال إجابات المجموعة».'],
  comparePairs: ['اختر مجموعتك أولًا من البطاقة أعلاه.', 'في كل زوج اختر العبارة الأدق: (أ) أو (ب).', 'اضغط «حفظ وإرسال إجابات المجموعة».'],
  sim: ['اقرأ الموقف وحدد هدفك.', 'غيّر الإعدادات وراقب أثرها المباشر على النتيجة والمعاينة.', 'جرّب أكثر من سيناريو، ثم احفظ أفضل نتيجة وقارنها بنتائج الآخرين.'],
  text: ['اقرأ الموقف جيدًا.', 'اكتب إجابتك في الصندوق.', 'اضغط «حفظ» وتابع مشاركات زملائك مباشرة.']
};
function exColor(e) { const ax = Content.axisOfEx(e.id); const a = ax && Content.axis(ax); return a ? Content.color(a) : (e.kind === 'survey' ? '#C8702A' : '#C8702A'); }
function postKey(e) { if (e.mode === 'group') { const g = Me.group(); return g ? 'g' + g : null; } return Me.uid(); }
function isRevealed(e) { return !!(Store.reveal && Store.reveal[e.id]); }
function bankOf(e) { // بنك كلمات بترتيب ثابت مخلوط حسب معرّف التمرين
  const words = e.items.map(i => i.answer); let s = 0; for (const ch of e.id) s = (s * 33 + ch.charCodeAt(0)) % 100003;
  const out = words.slice(); for (let i = out.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out;
}
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

function groupPickerHtml(e, o = {}) {
  const my = Me.group(); const assigned = Me.uid() ? Groups.assignedOf(Me.uid()) : null;
  let out = '<div class="group-picker"><div class="ex-block-lbl" style="font-family:var(--f-display);font-weight:700">👥 اختر مجموعتك</div>' + (o.note ? '<div class="muted" style="font-family:var(--f-ui);font-size:13px">' + o.note + '</div>' : '');
  if (assigned) out += '<div class="assign-hint">📌 عيّنك المدرّب في <b>' + h(Groups.label(assigned)) + '</b> — اختر مجموعتك المخصّصة لتجنّب الخطأ.</div>';
  out += '<div class="group-btns">' + Groups.list().map(n => '<button class="group-btn ' + (my === n ? 'on' : '') + '" data-act="pick-group" data-g="' + n + '" ' + (Me.isReg() ? '' : 'disabled') + '>' + h(Groups.label(n)) + '</button>').join('') + '</div>';
  if (!o.noMembers && my && Groups.anyAssign()) { const mem = Groups.membersOf(my).map(u => Store.users[u] && Store.users[u].name).filter(Boolean); if (mem.length) out += '<div class="members-line">👥 أعضاء ' + h(Groups.label(my)) + ': ' + mem.map(h).join('، ') + '</div>'; }
  if (!Me.isReg()) out += '<div class="locked-note" style="margin-top:8px">🔒 للمسجلين فقط</div>';
  return out + '</div>';
}

// ---- عرض الإجابات التفاعلية (للخلاصة والتغذية الحية) ----
function answersSummary(e, answers, reveal, compact) {
  answers = ansList(answers, e.items.length);
  if (e.format === 'mcq' || e.format === 'truefalse') {
    let score = 0;
    const rows = e.items.map((it, i) => {
      const a = answers[i]; const has = a !== undefined && a !== null && a !== '';
      const txt = !has ? '—' : e.format === 'mcq' ? (LETTERS[a] || '') + ') ' + (it.options[a] || '') : (a === true || a === 'true' ? 'صح' : 'خطأ');
      const ok = has && (e.format === 'mcq' ? +a === +it.answer : ((a === true || a === 'true') === !!it.answer)); if (ok) score++;
      const corr = e.format === 'mcq' ? (LETTERS[it.answer] + ') ' + it.options[it.answer]) : (it.answer ? 'صح' : 'خطأ');
      return '<div class="ga-item"><span class="qn num">' + (i + 1) + '</span><span class="' + (reveal && has ? (ok ? 'tag-ok' : 'tag-bad') : '') + '">' + h(txt) + (reveal ? (ok ? ' ✓' : (has ? ' ✗' : '')) : '') + '</span>' + (reveal && !ok ? '<span class="correct-note">(الصحيح: ' + h(corr) + ')</span>' : '') + '</div>';
    });
    return (reveal ? '<div class="pill" style="margin-bottom:4px">النتيجة: ' + score + ' من ' + e.items.length + '</div>' : '') + rows.join('');
  }
  if (e.format === 'fillblank') {
    return e.items.map((it, i) => { const a = answers[i]; const ok = a && a === it.answer; return '<div class="ga-item"><span class="qn num">' + (i + 1) + '</span><span>' + h(it.text).replace('___', '<b class="' + (reveal && a ? (ok ? 'tag-ok' : 'tag-bad') : '') + '">[' + h(a || '—') + ']</b>') + (reveal && !ok ? ' <span class="correct-note">(الصحيح: ' + h(it.answer) + ')</span>' : '') + '</span></div>'; }).join('');
  }
  if (e.format === 'comparePairs') {
    return e.items.map((it, i) => { const a = answers[i]; const ok = a && a === it.answer; const txt = a ? it[a] : '—'; return '<div class="ga-item"><span class="qn num">' + (i + 1) + '</span><div style="flex:1"><div class="cmp-opt compact ' + (reveal && a ? (ok ? 'right' : 'wrong') : (a ? 'sel' : '')) + '"><b>' + (a ? '(' + (a === 'a' ? 'أ' : 'ب') + ')' : '') + '</b>' + h(txt) + '</div>' + (reveal && !ok ? '<div class="correct-note">الصحيح: (' + (it.answer === 'a' ? 'أ' : 'ب') + ') ' + h(it[it.answer]) + '</div>' : '') + '</div></div>'; }).join('');
  }
  return '';
}

// ---- الاختيار من متعدد بأسلوب التصويت: الضغط على الخيار يحفظه فورًا وتظهر نسب الاختيار ----
function mcqStats(e) {
  const ps = Store.posts[e.id] || {}; const st = e.items.map(it => ({ total: 0, counts: it.options.map(() => 0) }));
  Object.keys(ps).forEach(k => { const a = ansList(ps[k] && ps[k].answers, e.items.length); a.forEach((v, i) => { if (v === null || v === '' || !st[i]) return; const n = +v; if (n >= 0 && n < st[i].counts.length) { st[i].counts[n]++; st[i].total++; } }); });
  return st;
}
function mcqPollHtml(e) {
  const reveal = isRevealed(e); const st = mcqStats(e);
  const mine = Me.isReg() ? ansList(((Store.posts[e.id] || {})[Me.uid()] || {}).answers, e.items.length) : [];
  return e.items.map((it, i) => {
    const my = mine[i]; const answered = my !== null && my !== undefined && my !== '';
    const showPct = answered || !Me.isReg() || Admin.ctl();
    return '<div class="q-card"><div class="qt"><span class="qn num">' + (i + 1) + '</span><span>' + h(it.q) + '</span></div><div class="opts">' +
      it.options.map((o, k) => {
        const sel = answered && +my === k; const c = st[i].counts[k]; const pct = st[i].total ? Math.round(c / st[i].total * 100) : 0;
        let cls = sel ? 'sel' : ''; if (reveal) { if (k === +it.answer) cls = 'right'; else if (sel) cls = 'wrong'; }
        return '<button class="opt poll ' + cls + '" data-act="vote" data-ex="' + h(e.id) + '" data-i="' + i + '" data-v="' + k + '" ' + (Me.isReg() ? '' : 'disabled') + '>' +
          (showPct ? '<span class="poll-bar" style="width:' + pct + '%"></span>' : '') +
          '<span class="mk">' + (sel ? '✓' : '') + '</span><span class="grow"><b>' + LETTERS[k] + ')</b> ' + h(o) + '</span>' +
          (showPct ? '<span class="poll-pct num">' + pct + '%</span>' : '') + '</button>';
      }).join('') + '</div>' + (showPct ? '<div class="poll-total">👥 <span class="num">' + st[i].total + '</span> ' + (st[i].total === 1 ? 'مشاركة' : 'مشاركات') + (reveal ? ' · 🔓 الإجابة الصحيحة: ' + LETTERS[it.answer] + ')' : '') + '</div>' : '') + '</div>';
  }).join('');
}

// ---- مكوّن الإجابة التفاعلية ----
function interactiveHtml(e, post, canAct, editing) {
  const reveal = isRevealed(e); const saved = post ? ansList(post.answers, e.items.length) : null;
  let draft = UIState.draft[e.id];
  if (!draft) { draft = saved ? saved.slice() : e.items.map(() => null); UIState.draft[e.id] = draft; }
  const active = canAct && (editing || !post);
  const show = active ? draft : (saved || draft);
  let out = '';
  if (e.format === 'mcq' || e.format === 'truefalse') {
    out += e.items.map((it, i) => {
      const opts = e.format === 'mcq' ? it.options.map((o, k) => [k, o]) : [[true, 'صح'], [false, 'خطأ']];
      return '<div class="q-card"><div class="qt"><span class="qn num">' + (i + 1) + '</span><span>' + h(it.q) + '</span></div><div class="' + (e.format === 'truefalse' ? 'tf-row' : 'opts') + '">' +
        opts.map(([v, label], k) => {
          const sel = show[i] !== null && show[i] !== undefined && String(show[i]) === String(v);
          let cls = sel ? 'sel' : '';
          if (reveal && !active && post) { const correct = e.format === 'mcq' ? k === +it.answer : v === !!it.answer; if (correct) cls = 'right'; else if (sel) cls = 'wrong'; }
          return '<button class="opt ' + cls + '" data-act="pick-opt" data-ex="' + h(e.id) + '" data-i="' + i + '" data-v="' + h(String(v)) + '" ' + (active ? '' : 'disabled') + '><span class="mk">' + (sel ? '✓' : '') + '</span><span>' + (e.format === 'mcq' ? '<b>' + LETTERS[k] + ')</b> ' : '') + h(label) + '</span></button>';
        }).join('') + '</div></div>';
    }).join('');
  } else if (e.format === 'fillblank') {
    const bank = bankOf(e); const used = {}; show.forEach(w => { if (w) used[w] = (used[w] || 0) + 1; }); const selW = UIState.fbSel[e.id];
    const usedCount = {};
    out += '<div class="bank">' + bank.map(w => { usedCount[w] = (usedCount[w] || 0) + 1; const isUsed = (used[w] || 0) >= usedCount[w]; return '<button class="chip ' + (isUsed ? 'used' : '') + (selW === w && !isUsed ? ' sel' : '') + '" data-act="fb-word" data-ex="' + h(e.id) + '" data-w="' + h(w) + '" ' + (active && !isUsed ? '' : 'disabled') + '>' + h(w) + '</button>'; }).join('') + '</div>';
    out += e.items.map((it, i) => {
      const w = show[i]; let cls = w ? 'filled' : ''; if (reveal && !active && post && w) cls += w === it.answer ? ' right' : ' wrong';
      const blank = '<button class="blank ' + cls + '" data-act="fb-blank" data-ex="' + h(e.id) + '" data-i="' + i + '" ' + (active ? '' : 'disabled') + '>' + (w ? h(w) : '&nbsp;…&nbsp;') + '</button>';
      return '<div class="q-card"><div class="qt"><span class="qn num">' + (i + 1) + '</span><span>' + h(it.text).replace('___', blank) + '</span></div>' + (reveal && !active && post && w && w !== it.answer ? '<div class="correct-note">الصحيح: ' + h(it.answer) + '</div>' : '') + '</div>';
    }).join('');
  } else if (e.format === 'comparePairs') {
    out += e.items.map((it, i) => '<div class="q-card"><div class="qt"><span class="qn num">' + (i + 1) + '</span><span>أي العبارتين أدق؟</span></div><div class="cmp-row">' +
      ['a', 'b'].map(k => { const sel = show[i] === k; let cls = sel ? 'sel' : ''; if (reveal && !active && post) { if (k === it.answer) cls = 'right'; else if (sel) cls = 'wrong'; } return '<button class="cmp-opt ' + cls + '" data-act="pick-cmp" data-ex="' + h(e.id) + '" data-i="' + i + '" data-v="' + k + '" ' + (active ? '' : 'disabled') + '><b>(' + (k === 'a' ? 'أ' : 'ب') + ')</b>' + h(it[k]) + '</button>'; }).join('') + '</div></div>').join('');
  }
  return out;
}

function answerBoxHtml(e) {
  const col = exColor(e);
  if (e.format === 'mcq') return '<div class="answer-box" style="--ac:' + col + ';--acg:' + tint(col, .1) + '">' + (Me.isReg() ? '<div class="status-note" style="margin-bottom:4px">👆 اضغط أي خيار لحفظ إجابتك فورًا، ويمكنك تغييرها في أي وقت.</div>' : '<div class="locked-note">🔒 للمسجلين فقط — يمكنك مشاهدة نتائج التصويت دون المشاركة.</div>') + mcqPollHtml(e) + '</div>';
  if (!Me.isReg()) return '<div class="answer-box"><div class="locked-note">🔒 للمسجلين فقط — صناديق الإجابة معطّلة في وضع التصفح كزائر.</div>' + (e.format !== 'text' ? '<div class="disabled-area">' + interactiveHtml(e, null, false, false) + '</div>' : '<textarea disabled placeholder="🔒 للمسجلين فقط"></textarea>') + '</div>';
  const isGroup = e.mode === 'group'; const key = postKey(e);
  if (isGroup && !key) {
    return '<div class="answer-box">' + (e.format !== 'text' ? '<div class="locked-note">👆 اختر مجموعتك أولًا لتتمكن من الإجابة — الأسئلة معروضة للاطلاع.</div><div class="disabled-area">' + interactiveHtml(e, null, false, false) + '</div>' : '<div class="locked-note">👆 اختر مجموعتك أولًا لتتمكن من كتابة إجابة المجموعة.</div>') + '</div>';
  }
  const post = (Store.posts[e.id] || {})[key]; const editing = !!UIState.editing[e.id];
  if (e.format === 'text') {
    if (post && !editing) return '<div class="answer-box"><div class="row" style="margin-bottom:8px"><b style="font-family:var(--f-display)">✅ ' + (isGroup ? 'إجابة ' + h(Groups.label(Me.group())) : 'إجابتك المحفوظة') + '</b><span class="grow"></span><button class="btn btn-soft btn-sm" data-act="edit-ans" data-ex="' + h(e.id) + '">✏️ تعديل</button></div><div class="answer-view">' + h(post.text) + '</div></div>';
    return '<div class="answer-box"><textarea data-keep="ans-' + h(e.id) + '" id="ans-' + h(e.id) + '" placeholder="' + (isGroup ? 'اكتب إجابة مجموعتك هنا…' : 'اكتب إجابتك هنا…') + '">' + (editing && post ? h(post.text) : '') + '</textarea><div class="save-row"><button class="btn btn-primary" data-act="save-text" data-ex="' + h(e.id) + '">💾 حفظ' + (isGroup ? ' إجابة المجموعة' : '') + '</button>' + (editing ? '<button class="btn btn-ghost" data-act="cancel-edit" data-ex="' + h(e.id) + '">إلغاء</button>' : '') + '<span class="status-note">تظهر إجابتك فورًا في مشاركات الجميع.</span></div></div>';
  }
  const active = !post || editing;
  return '<div class="answer-box" style="--ac:' + col + ';--acg:' + tint(col, .1) + '">' + (post && !editing ? '<div class="row" style="margin-bottom:6px"><b style="font-family:var(--f-display)">✅ ' + (isGroup ? 'أُرسلت إجابات ' + h(Groups.label(Me.group())) : 'تم حفظ إجاباتك') + '</b><span class="grow"></span><button class="btn btn-soft btn-sm" data-act="edit-ans" data-ex="' + h(e.id) + '">✏️ تعديل</button></div>' : '') +
    interactiveHtml(e, post, true, editing) +
    (active ? '<div class="save-row"><button class="btn btn-primary" data-act="save-inter" data-ex="' + h(e.id) + '">' + (isGroup ? '📤 حفظ وإرسال إجابات المجموعة' : '💾 حفظ الإجابات') + '</button>' + (editing ? '<button class="btn btn-ghost" data-act="cancel-edit" data-ex="' + h(e.id) + '">إلغاء</button>' : '') + '</div>' : '') + '</div>';
}

function feedHtml(e) {
  if (e.format === 'mcq') return ''; // نتائج التصويت تظهر داخل الخيارات نفسها
  const ps = Store.posts[e.id] || {}; const keys = Object.keys(ps).filter(k => ps[k]).sort((x, y) => (ps[y].ts || 0) - (ps[x].ts || 0));
  const reveal = isRevealed(e); const myKey = Me.isReg() ? postKey(e) : null;
  const del = k => Admin.ctl() ? '<button class="del-btn" data-act="del-post" data-ex="' + h(e.id) + '" data-k="' + h(k) + '" title="حذف هذه المشاركة">🗑 حذف</button>' : '';
  if (e.format !== 'text' && e.mode === 'group') {
    const gkeys = keys.slice().sort((x, y) => (+x.slice(1)) - (+y.slice(1)));
    return '<div class="feed"><div class="feed-head"><span class="live-dot"></span><h3>إجابات المجموعات</h3><span class="pill num">' + gkeys.length + '</span>' + (reveal ? '<span class="pill" style="background:#E6F7EE;color:#10573A">🔓 الإجابات مكشوفة</span>' : '') + '</div>' +
      (gkeys.length ? '<div class="group-answers">' + gkeys.map(k => '<div class="ga-card ' + (k === myKey ? 'mine' : '') + '"><h4>' + (k === myKey ? '⭐ ' : '') + h(Groups.label(+k.slice(1))) + '<span class="grow"></span>' + del(k) + '</h4>' + answersSummary(e, ps[k].answers, reveal) + '<div class="post-foot" style="margin-top:6px"><span class="muted" style="font-family:var(--f-ui);font-size:12px">آخر حفظ: ' + h(ps[k].name || '') + ' · ' + ago(ps[k].ts || 0) + '</span>' + Likes.btn('posts/' + e.id + '/' + k, ps[k].likes) + '</div></div>').join('') + '</div>' : '<div class="empty">لم ترسل أي مجموعة إجاباتها بعد.</div>') + '</div>';
  }
  return '<div class="feed"><div class="feed-head"><span class="live-dot"></span><h3>مشاركات الجميع مباشرة</h3><span class="pill num">' + keys.length + '</span>' + (reveal && e.format !== 'text' ? '<span class="pill" style="background:#E6F7EE;color:#10573A">🔓 الإجابات مكشوفة</span>' : '') + '</div>' +
    (keys.length ? '<div class="posts">' + keys.map(k => { const p = ps[k]; const isG = k.charAt(0) === 'g' && e.mode === 'group'; const who = isG ? Groups.label(+k.slice(1)) : (p.name || 'مشارك'); const sub = isG ? 'كتبها: ' + (p.name || '') : (p.role || '');
      return '<div class="post ' + (k === myKey ? 'mine' : '') + '"><div class="post-head"><span class="av">' + h(isG ? '👥' : initials(who)) + '</span><div><div class="who">' + h(who) + '</div><div class="role">' + h(sub) + ' · ' + ago(p.ts || 0) + '</div></div></div>' +
        (e.format === 'text' ? '<div class="post-body">' + h(p.text || '') + '</div>' : '<div>' + answersSummary(e, p.answers, reveal) + '</div>') +
        '<div class="post-foot">' + Likes.btn('posts/' + e.id + '/' + k, p.likes) + del(k) + '</div></div>'; }).join('') + '</div>' : '<div class="empty">لا توجد مشاركات بعد — كن أول المشاركين ✨</div>') + '</div>';
}

function exNavHtml(e) {
  const ax = Content.axisOfEx(e.id); if (!ax) return '';
  const list = Content.exercisesOf(ax); const i = list.findIndex(x => x.id === e.id);
  const prev = i > 0 ? list[i - 1] : null, next = i > -1 && i < list.length - 1 ? list[i + 1] : null;
  return '<div class="nav-row"><button class="btn btn-ghost" ' + (prev ? 'data-go="ex" data-id="' + h(prev.id) + '"' : 'disabled') + '>◀ التمرين السابق</button><button class="btn btn-soft" data-go="axis" data-id="' + h(ax) + '">📖 محتوى الفصل</button><button class="btn btn-ghost" ' + (next ? 'data-go="ex" data-id="' + h(next.id) + '"' : 'disabled') + '>التمرين التالي ▶</button></div><div class="nav-row" style="margin-top:8px"><button class="btn btn-dark" data-go="home">🏠 الرئيسية</button></div>';
}

Views.ex = {
  html() {
    const e = Content.ex(Router.cur.id);
    if (!e || e._hidden) return Layout.crumbs() + '<div class="empty" style="margin-top:20px">هذا التمرين غير متاح.</div>';
    const axId = Content.axisOfEx(e.id); const a = axId ? Content.axis(axId) : null;
    if (a && (a._hidden || (a._disabled && !Admin.ctl()))) return Layout.crumbs() + '<div class="empty" style="margin-top:20px">🔒 هذا التمرين غير متاح بعد.</div>';
    const col = exColor(e); const isSurvey = e.kind === 'survey';
    let out = '<div style="--ac:' + col + ';--acg:' + tint(col, .1) + '">' + Layout.crumbs(a ? '<span class="crumb-tag">' + h(a.title) + '</span>' : '<span class="crumb-tag">' + (isSurvey ? 'ختام البرنامج' : 'أنشطة') + '</span>') +
      (e.image ? '<img class="ex-img" src=\"' + imgSrc(e.image) + '\" alt="">' : '') +
      '<div class="ex-head"><div class="ico">' + h(e.icon || '✍️') + '</div><div><h1>' + h(e.title) + '</h1><div class="row" style="margin-top:4px"><span class="pill">' + (e.mode === 'group' ? '👥 جماعي' : '👤 فردي') + '</span>' + (e.format !== 'text' ? '<span class="pill">' + h(FORMATS[e.format]) + '</span>' : '') + '</div></div></div>';
    if (isSurvey) {
      out += '<div class="ex-block task"><div class="lbl">📝 قيّم تجربتك</div>' + richHtml(e.task) + '</div>' + '<div id="ansZone">' + surveyFormHtml(e) + '</div><div id="feedZone">' + surveyFeedHtml(e) + '</div></div>';
      return out;
    }
    if (e.scenario || e.chart) out += '<div class="ex-block scenario"><div class="lbl">🎬 الموقف</div>' + richHtml(e.scenario) + (e.chart ? '<div style="margin-top:12px">' + Charts.render(e.chart, col) + '</div>' : '') + '</div>';
    if (a) out += '<div class="ex-block extract"><div class="lbl">🧭 قبل أن تبدأ: مستخلص المحور</div><div style="font-family:var(--f-ui);font-weight:700">' + h(a.title) + (a.classic ? ' — <span class="muted">' + h(a.classic) + '</span>' : '') + '</div>' + (a.highlights.length ? '<ul style="margin-top:6px">' + a.highlights.map(x => '<li>' + h(x) + '</li>').join('') + '</ul>' : '') + '</div>';
    if (e.principle) out += '<div class="ex-block principle"><div class="lbl">🔬 المبدأ العلمي باختصار</div>' + richHtml(e.principle) + '</div>';
    const steps = e.steps && e.steps.length ? e.steps : (DEFAULT_STEPS[e.format] || DEFAULT_STEPS.text);
    out += '<div class="ex-block"><div class="lbl">🛠 كيف تنجز التمرين؟</div><ol class="steps-list">' + steps.map((s, i) => '<li><span class="n num">' + (i + 1) + '</span><span>' + h(s) + '</span></li>').join('') + '</ol></div>';
    if (e.mode === 'group') out += '<div id="groupZone">' + groupPickerHtml(e) + '</div>';
    if (e.format === 'text' || !e.hint) out += '<div class="ex-block task"><div class="lbl">📝 المطلوب منك</div>' + richHtml(e.task || 'اكتب إجابتك.') + '</div>';
    else out += '<div class="ex-block hint"><div class="lbl">💡 تلميح عام</div>' + richHtml(e.hint) + '</div>';
    out += e.format === 'sim' ? '<div id="simZone">' + Sims.html(e) + '</div><div id="feedZone">' + Sims.feed(e) + '</div>' : '<div id="ansZone">' + answerBoxHtml(e) + '</div><div id="feedZone">' + feedHtml(e) + '</div>';
    // النموذج المساعد (تلميح بمثال موجز) للتمارين النصية فقط؛ ويُحذف كليًا من النماذج التفاعلية
    const whyBox = '<div class="ex-block" style="margin-top:0"><div class="lbl">🎯 لماذا هذا النشاط؟</div>' + richHtml(e.why || 'لتطبيق مفاهيم المحور عمليًا.') + '</div>';
    if (e.format === 'text') out += '<div class="two-col">' + whyBox +
      '<div class="ex-block model-box" style="margin-top:0"><div class="lbl">🧩 نموذج مساعد</div>' + (UIState.modelShown[e.id] ? '<div class="model-body">' + richHtml(e.model || 'فكّر في مثال من تجربتك كمستخدم لتطبيق تجاري، ثم طبّق الفكرة نفسها على الموقف.') + '</div>' : '<button class="btn btn-soft btn-sm" data-act="show-model" data-ex="' + h(e.id) + '">👁 أظهر النموذج المساعد</button>') + '</div></div>';
    else out += '<div style="margin-top:22px">' + whyBox + '</div>';
    out += exNavHtml(e) + '</div>';
    return out;
  }
};

// ============ تقييم البرنامج (نجوم + توصية + رأي) ============
function starsHtml(v, attrs, dis) { return '<span class="stars">' + [1, 2, 3, 4, 5].map(n => '<button class="star ' + (v >= n ? 'on' : '') + '" ' + attrs + ' data-v="' + n + '" ' + dis + ' title="' + n + '">★</button>').join('') + '</span>'; }
function surveyFormHtml(e) {
  if (!Me.isReg()) return '<div class="answer-box"><div class="locked-note">🔒 للمسجلين فقط</div></div>';
  const post = (Store.posts[e.id] || {})[Me.uid()]; const editing = !!UIState.editing[e.id];
  if (post && !editing) return '<div class="answer-box"><div class="row" style="margin-bottom:8px"><b style="font-family:var(--f-display)">✅ شكرًا لتقييمك</b><span class="grow"></span><button class="btn btn-soft btn-sm" data-act="edit-ans" data-ex="' + h(e.id) + '">✏️ تعديل</button></div>' +
    e.rates.map((r, i) => '<div class="rate-row"><span>' + h(r) + '</span>' + starsHtml(+((post.ratings || {})[i]) || 0, '', 'disabled') + '</div>').join('') + (post.nps != null ? '<div class="rate-row"><span>التوصية</span><b class="num">' + post.nps + ' / 10</b></div>' : '') + (post.text ? '<div class="answer-view" style="margin-top:8px">' + h(post.text) + '</div>' : '') + '</div>';
  let d = UIState.draft.sv; if (!d) { d = { ratings: Object.assign({}, (post && post.ratings) || {}), nps: post && post.nps != null ? post.nps : null }; UIState.draft.sv = d; }
  return '<div class="answer-box">' + e.rates.map((r, i) => '<div class="rate-row"><span>' + h(r) + '</span>' + starsHtml(+d.ratings[i] || 0, 'data-act="sv-rate" data-i="' + i + '"', '') + '</div>').join('') +
    (e.nps ? '<div class="field" style="margin-top:12px"><label>' + h(e.nps) + '</label><div class="nps-row">' + Array.from({ length: 11 }).map((_, n) => '<button class="nps-btn ' + (d.nps === n ? 'on' : '') + ' ' + (n <= 6 ? 'd' : n <= 8 ? 'p' : 'g') + '" data-act="sv-nps" data-v="' + n + '"><span class="num">' + n + '</span></button>').join('') + '</div><div class="nps-legend"><span>0 = لن أوصي أبدًا</span><span>10 = سأوصي بالتأكيد</span></div></div>' : '') +
    '<div class="field"><label>رأيك ومقترحاتك</label><textarea data-keep="sv-text" id="svText" placeholder="الفكرة التي ستطبقها أولًا، وما تقترح تحسينه…">' + (post ? h(post.text || '') : '') + '</textarea></div>' +
    '<div class="save-row"><button class="btn btn-primary" data-act="sv-save" data-ex="' + h(e.id) + '">📤 إرسال التقييم</button>' + (editing ? '<button class="btn btn-ghost" data-act="cancel-edit" data-ex="' + h(e.id) + '">إلغاء</button>' : '') + '</div></div>';
}
function surveyFeedHtml(e) {
  const st = SurveyStats.of(Store.posts[e.id], e); if (!st.n) return '<div class="feed"><div class="empty">لا توجد تقييمات بعد.</div></div>';
  const del = k => Admin.ctl() ? '<button class="del-btn" data-act="del-post" data-ex="' + h(e.id) + '" data-k="' + h(k) + '">🗑</button>' : '';
  const ps = Store.posts[e.id] || {}; const keys = Object.keys(ps).filter(k => ps[k] && ps[k].text).sort((a, b) => (ps[b].ts || 0) - (ps[a].ts || 0));
  return '<div class="feed"><div class="feed-head"><span class="live-dot"></span><h3>نتائج التقييم مباشرة</h3><span class="pill num">' + st.n + '</span></div>' +
    '<div class="sv-stats"><div class="sv-kpi"><b class="num">' + (st.overall ? st.overall.toFixed(1) : '—') + '</b><span>متوسط الرضا من 5</span></div><div class="sv-kpi"><b class="num">' + (st.nps == null ? '—' : (st.nps > 0 ? '+' : '') + st.nps) + '</b><span>صافي التوصية NPS</span></div></div>' +
    '<div class="sv-bars">' + st.rates.map((r, i) => '<div class="sv-bar"><span>' + h(r) + '</span><i><em style="width:' + ((st.avgs[i] || 0) / 5 * 100) + '%"></em></i><b class="num">' + (st.avgs[i] ? st.avgs[i].toFixed(1) : '—') + '</b></div>').join('') + '</div>' +
    (keys.length ? '<div class="posts" style="margin-top:12px">' + keys.map(k => { const p = ps[k]; return '<div class="post ' + (k === Me.uid() ? 'mine' : '') + '"><div class="post-head"><span class="av">' + h(initials(p.name)) + '</span><div><div class="who">' + h(p.name || '') + '</div><div class="role">' + h(p.role || '') + ' · ' + ago(p.ts || 0) + '</div></div></div><div class="post-body">' + h(p.text) + '</div><div class="post-foot">' + Likes.btn('posts/' + e.id + '/' + k, p.likes) + del(k) + '</div></div>'; }).join('') + '</div>' : '') + '</div>';
}

// ============ المختبر الختامي ============
function labElapsed(t) { if (!t || !t.start) return 0; const now = t.pausedAt || DB.now(); return Math.max(0, now - t.start - (t.pausedTotal || 0)); }
Views.lab = {
  html() {
    const L = Content.lab(); const g = Me.group(); const t = g ? Store.labTimers['g' + g] : null; const el = labElapsed(t); const total = L.stages.length * Content.lab().minutes * 60000;
    let out = Layout.crumbs('<span class="crumb-tag">المختبر الختامي</span>') + '<div class="ex-head"><div class="ico">🧪</div><div><h1>' + h(L.title) + '</h1><div class="row" style="margin-top:4px"><span class="pill">👥 جماعي</span><span class="pill">⏱ <span class="num">60</span> دقيقة · <span class="num">' + L.stages.length + '</span> مراحل</span></div></div></div>' +
      '<div class="ex-block scenario"><div class="lbl">🎬 الحالة</div>' + richHtml(L.intro) + (L.chart ? '<div style="margin-top:12px">' + Charts.render(L.chart, '#8A1538') + '</div>' : '') + '</div>';
    out += '<div id="labGroupZone">' + groupPickerHtml({ id: 'lab' }, { noMembers: true, note: 'الوقت محفوظ لكل مجموعة ويبقى صحيحًا حتى لو حدّث أي عضو الصفحة أو دخل من جهاز آخر.' }) + '</div>';
    if (g && Me.isReg()) {
      if (!t || !t.start) out += '<div class="lab-timer" style="margin-top:14px"><div class="grow"><div style="font-family:var(--f-display);font-weight:800;font-size:18px">جاهزون؟</div><div class="muted">لن تظهر صناديق الإجابة قبل بدء الوقت.</div></div><button class="btn btn-primary" data-act="lab-start">🚀 ابدأ الوقت</button></div>';
      else out += '<div class="lab-timer" style="margin-top:14px"><div><div class="muted">الوقت المتبقي · ' + h(Groups.label(g)) + '</div><div class="clock" id="labClock">' + mmss(total - el) + '</div></div><span class="grow"></span>' +
        (t.pausedAt ? '<button class="btn btn-primary btn-sm" data-act="lab-resume">▶ استمرار</button>' : '<button class="btn btn-ghost btn-sm" data-act="lab-pause">⏸ إيقاف مؤقت</button>') + '<button class="btn btn-danger btn-sm" data-act="lab-reset">↺ إعادة ضبط</button></div>';
    }
    out += '<div id="labStages">' + Views.lab.stagesHtml() + '</div>';
    out += '<section class="section"><div class="feed-head"><span class="live-dot"></span><h3 style="font-size:19px">متابعة كل المجموعات</h3></div>' + Views.lab.allHtml() + '</section>';
    return out;
  },
  stagesHtml() {
    const L = Content.lab(); const g = Me.group(); const t = g ? Store.labTimers['g' + g] : null; const started = !!(t && t.start); const el = labElapsed(t);
    const ans = g ? (Store.labAnswers['g' + g] || {}) : {};
    return L.stages.map((s, i) => {
      const openAt = i * Content.lab().minutes * 60000; const open = started && el >= openAt; const a = ans['s' + i]; const ek = 'lab' + i;
      let body = '';
      if (!Me.isReg()) body = '<div class="locked-note">🔒 للمسجلين فقط</div>';
      else if (!g) body = '<div class="lock-note">👆 اختر مجموعتك أولًا</div>';
      else if (!started) body = '<div class="lock-note">🔒 تُتاح بعد الضغط على «ابدأ الوقت»' + (i ? ' ومرور ' + (i * Content.lab().minutes) + ' دقيقة' : '') + '</div>';
      else if (!open) body = '<div class="lock-note" data-lock-at="' + openAt + '">🔒 باقي <span class="num">' + mmss(openAt - el) + '</span> على إتاحتها</div>';
      else if (a && !UIState.editing[ek]) body = '<div class="answer-view" style="margin-top:8px">' + h(a.text) + '</div><div class="save-row"><button class="btn btn-soft btn-sm" data-act="edit-ans" data-ex="' + ek + '">✏️ تعديل</button><span class="status-note">آخر حفظ: ' + h(a.name || '') + '</span></div>';
      else body = '<div class="answer-box" style="margin-top:8px"><textarea data-keep="lab-' + i + '" id="labAns' + i + '" placeholder="اكتبوا مخرج هذه المرحلة…">' + (a ? h(a.text) : '') + '</textarea><div class="save-row"><button class="btn btn-primary btn-sm" data-act="lab-save" data-i="' + i + '">💾 حفظ المرحلة</button>' + (UIState.editing[ek] ? '<button class="btn btn-ghost btn-sm" data-act="cancel-edit" data-ex="' + ek + '">إلغاء</button>' : '') + '</div></div>';
      return '<div class="stage ' + (open || !started ? '' : 'locked') + '"><h3><span class="no num">' + (i + 1) + '</span>' + h(s.icon) + ' ' + h(s.title) + '</h3><p style="margin-top:6px;color:var(--ink-2)">' + h(s.task) + '</p>' + body + '</div>';
    }).join('');
  },
  allHtml() {
    const L = Content.lab(); const keys = Object.keys(Store.labAnswers || {}).filter(k => Store.labAnswers[k]).sort((a, b) => (+a.slice(1)) - (+b.slice(1)));
    if (!keys.length) return '<div class="empty">لم تحفظ أي مجموعة إجاباتها بعد.</div>';
    return '<div class="lab-groups">' + keys.map(k => { const ga = Store.labAnswers[k]; return '<div class="lab-group ' + (Me.group() && k === 'g' + Me.group() ? 'ga-card mine' : '') + '"><h4>👥 ' + h(Groups.label(+k.slice(1))) + '</h4>' +
      L.stages.map((s, i) => { const a = ga['s' + i]; if (!a) return ''; return '<div class="lab-ans"><div class="st">' + (i + 1) + '. ' + h(s.title) + '</div><div style="white-space:pre-wrap">' + h(a.text) + '</div><div class="post-foot" style="margin-top:4px">' + Likes.btn('lab/answers/' + k + '/s' + i, a.likes) + (Admin.ctl() ? '<button class="del-btn" data-act="del-lab" data-k="' + k + '" data-i="' + i + '">🗑</button>' : '') + '</div></div>'; }).join('') + '</div>'; }).join('') + '</div>';
  }
};

// ============ حسابي ============
function medalSvg(a, size = 84) {
  const col = Content.color(a); const id = 'm' + a.id.replace(/\W/g, '');
  return '<svg class="medal" viewBox="0 0 100 100" width="' + size + '" height="' + size + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + shade(col, .25) + '"/><stop offset="1" stop-color="' + shade(col, -.35) + '"/></linearGradient></defs>' +
    '<path d="M30 4 L42 34 L50 30 L38 2Z" fill="' + shade(col, -.2) + '"/><path d="M70 4 L58 34 L50 30 L62 2Z" fill="' + shade(col, .1) + '"/>' +
    '<circle cx="50" cy="60" r="34" fill="url(#' + id + ')"/><circle cx="50" cy="60" r="27" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="3 3"/>' +
    '<g transform="translate(35 45)">' + iconSvg(a.icon || 'star', 30, '#fff', 2).replace('<svg ', '<svg x="0" y="0" ') + '</g></svg>';
}
function congratsInner(name, kind) {
  const c = Content.doc(kind); const rep = s => String(s || '').replace(/\{\{name\}\}/g, name).replace(/\{\{courseTitle\}\}/g, Content.courseTitle()).replace(/\{\{date\}\}/g, fmtDate(Date.now()));
  return '<div class="emo">' + h(c.emoji) + '</div><h2>' + h(rep(c.title)) + '</h2><div class="nm">' + h(name) + '</div>' +
    c.paragraphs.map(p => '<p style="margin-top:10px;font-size:16px;color:var(--ink-2)">' + h(rep(p)) + '</p>').join('') +
    '<div class="congrats-foot"><span>' + h(rep(c.footerRight)) + '</span><span>' + h(rep(c.footerLeft)) + '</span></div>';
}
// مشاركات المتدرب نفسه (للمراجعة في «حسابي»)
function myPostOf(e, uid) {
  const ps = Store.posts[e.id] || {};
  if (e.mode === 'group') { const g = Me.group() || Groups.assignedOf(uid); const k = Object.keys(ps).find(k => ps[k] && ps[k].members && ps[k].members[uid]) || (g && ps['g' + g] ? 'g' + g : null); return k ? { p: ps[k], group: +k.slice(1) } : null; }
  return ps[uid] ? { p: ps[uid] } : null;
}
function myPostsHtml(uid) {
  const groups = [];
  Content.eligibleAxes().forEach(a => { const list = Content.exercisesOf(a.id).map(e => ({ e, r: myPostOf(e, uid) })); groups.push({ title: a.title, color: Content.color(a), list }); });
  const acts = Content.activities().map(e => ({ e, r: myPostOf(e, uid) })); if (acts.length) groups.push({ title: 'الأنشطة', color: '#1F3A5F', list: acts });
  const sv = Content.survey(); if (sv) groups.push({ title: 'ختام البرنامج', color: '#C8702A', list: [{ e: sv, r: myPostOf(sv, uid) }] });
  const f = UIState.myFilter || 'all';
  return '<div class="row" style="margin-bottom:10px">' + [['all', 'الكل'], ['done', 'أنجزتها'], ['todo', 'لم أنجزها']].map(([k, l]) => '<button class="btn btn-xs ' + (f === k ? 'btn-primary' : 'btn-ghost') + '" data-act="my-filter" data-k="' + k + '">' + l + '</button>').join('') + '</div>' +
    groups.map(g => { const items = g.list.filter(x => f === 'all' || (f === 'done' ? x.r : !x.r)); if (!items.length) return ''; const dn = g.list.filter(x => x.r).length;
      const op = UIState.openAcc.has('my-' + g.title);
      return '<div class="acc ' + (op ? 'open' : '') + '" style="--ac:' + g.color + ';--acg:' + tint(g.color, .07) + '"><div class="acc-head" data-act="acc" data-k="my-' + h(g.title) + '"><h3>' + h(g.title) + ' <span class="pill num">' + dn + ' / ' + g.list.length + '</span></h3><span class="arrow">◀</span></div><div class="acc-body">' + (op ? items.map(({ e, r }) =>
        '<div class="my-post ' + (r ? '' : 'todo') + '"><div class="row"><span style="font-size:18px">' + h(e.icon || '✍️') + '</span><b class="grow">' + h(e.title) + '</b><span class="pill">' + (e.mode === 'group' ? '👥 جماعي' : '👤 فردي') + ' · ' + h(FORMATS[e.format] || '') + '</span><button class="btn btn-soft btn-xs" data-go="ex" data-id="' + h(e.id) + '">' + (r ? 'فتح / تعديل' : 'ابدأ الآن') + '</button></div>' +
        (r ? '<div class="muted" style="font-family:var(--f-ui);font-size:12px;margin:4px 0">' + (r.group ? '(ضمن ' + h(Groups.label(r.group)) + ') · ' : '') + ago(r.p.ts || 0) + ' · 👍 <span class="num">' + Object.keys(r.p.likes || {}).length + '</span></div>' + (e.format === 'text' ? '<div class="answer-view">' + h(r.p.text || '') + '</div>' : e.format === 'sim' ? '<div class="answer-view">🎮 ' + h(r.p.summary || '') + '</div>' : '<div>' + answersSummary(e, r.p.answers, isRevealed(e)) + '</div>') : '<div class="muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:4px">لم تشارك بعد</div>') + '</div>').join('') : '') + '</div></div>'; }).join('');
}
Views.account = {
  html() {
    if (!Me.isReg()) return Layout.crumbs() + '<div class="empty" style="margin-top:20px">صفحة «حسابي» متاحة للمسجلين فقط.</div>';
    const me = Me.data; const pr = Progress.forUser(me.uid); const pct = Math.round(pr.pct * 100); const unlocked = pr.pct >= BADGE_THRESHOLD; const c = Content.congrats(); const pdf = Content.pdf();
    const member = me.member || (Store.users[me.uid] && Store.users[me.uid].member);
    const att = Attend.pct(me.uid); const ac = Attend.cfg(); const A = Content.assess(); const pre = Assess.rec('pre', me.uid), post = Assess.rec('post', me.uid); const rv = Assess.cfg().reveal;
    const scoreTxt = r => !r || !r.done ? '—' : rv ? Assess.score(r.answers) + '/' + A.items.length : '✔';
    let out = Layout.crumbs('<span class="crumb-tag">حسابي</span>') +
      '<div class="card pad" style="margin-top:8px"><div class="row" style="align-items:flex-start"><div class="grow"><div class="sec-kicker">نسبة الإنجاز الإجمالية</div><div class="big-pct num">' + pct + '%</div><div class="muted" style="font-family:var(--f-ui)">أنجزت <span class="num">' + pr.done + '</span> من <span class="num">' + pr.total + '</span> تمرينًا</div></div>' +
      '<div style="text-align:center"><div class="sec-kicker">رقم العضوية</div><div class="num notranslate" translate="no" style="font-family:var(--f-display);font-weight:800;font-size:30px;letter-spacing:2px">' + (member ? pad4(member) : '—') + '</div></div></div><div class="progress" style="margin-top:12px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="mini-stats"><div><span>📍 الحضور</span><b class="num">' + att + '%</b></div><div><span>🧭 التقييم القبلي</span><b class="num">' + scoreTxt(pre) + '</b></div><div><span>🏁 التقييم البعدي</span><b class="num">' + scoreTxt(post) + '</b></div><div><span>🏅 الأوسمة</span><b class="num">' + pr.axes.filter(x => x.pct >= BADGE_THRESHOLD).length + '/' + pr.axes.length + '</b></div></div></div>';
    const urec = Object.assign({}, Store.users[me.uid] || {}, { name: me.name, role: me.role }); const cons = urec.consent || {};
    out += '<div class="card pad" style="margin-top:16px"><h3 style="margin-bottom:12px">✏️ بياناتي</h3><div class="grid2">' + RegFields.visible().map(f => RegFields.input(f, RegFields.val(urec, f.key), 'acc_')).join('') + '</div>' +
      '<label class="consent"><input type="checkbox" id="accFollow" ' + (cons.followup ? 'checked' : '') + '> <span>' + h(Content.privacy().followup) + '</span></label>' +
      '<div class="row"><button class="btn btn-primary btn-sm" data-act="acc-save">💾 حفظ التعديلات</button><button class="btn btn-ghost btn-sm" data-act="save-card">🪪 حفظ بطاقة رقم العضوية</button><span class="grow"></span><a href="#" class="btn btn-ghost btn-sm" data-act="privacy-show">🔒 إشعار الخصوصية</a><button class="btn btn-danger btn-sm" data-act="delete-me">🗑 احذف بياناتي</button></div></div>';
    out += '<section class="section"><div class="sec-head"><h2 class="sec-title">📝 مشاركاتي في التمارين</h2><span class="pill">راجع إجاباتك وافتح أي تمرين لتعديلها</span></div>' + myPostsHtml(me.uid) + '</section>';
    out += '<section class="section"><div class="sec-head"><h2 class="sec-title">🏅 أوسمتي</h2><span class="pill">يُفتح الوسام عند إنجاز <span class="num">80%</span> من تمارين المحور</span></div><div class="badges">' +
      pr.axes.map(x => { const ok = x.pct >= BADGE_THRESHOLD; return '<div class="badge ' + (ok ? '' : 'locked') + '">' + (ok ? '' : '<span class="lock">🔒</span>') + medalSvg(x.a) + '<h5>' + h(x.a.title) + '</h5><div class="pct num">' + Math.round(x.pct * 100) + '% · ' + x.done + ' من ' + x.total + '</div></div>'; }).join('') + '</div></section>';
    const fuc = followupCardsHtml(); if (fuc) out += '<section class="section"><div class="sec-head"><h2 class="sec-title">📈 متابعة ما بعد البرنامج</h2></div>' + fuc + '</section>';
    if (Points.cfg().enabled) { const pt = Points.table(); const mine = pt.map[me.uid] || { pts: 0 }; const rank = pt.list.findIndex(x => x.uid === me.uid) + 1; const bd = Points.badges(me.uid);
      out += '<section class="section"><div class="sec-head"><h2 class="sec-title">⭐ نقاطي</h2><span class="pill">المركز <span class="num">' + (rank || '—') + '</span> من <span class="num">' + pt.list.length + '</span></span></div><div class="card pad"><div class="row"><div class="big-pct num">' + mine.pts + '</div><div class="muted" style="font-family:var(--f-ui)">نقطة · <span class="num">' + (mine.ex || 0) + '</span> تمرين · <span class="num">' + (mine.likes || 0) + '</span> إعجاب · <span class="num">' + (mine.att || 0) + '</span> يوم حضور</div></div>' + (bd.length ? '<div class="sp-badges">' + bd.map(b => '<div class="sp-badge"><span>' + b[0] + '</span><b>' + h(b[1]) + '</b><em>' + h(b[2]) + '</em></div>').join('') + '</div>' : '<div class="muted" style="font-family:var(--f-ui);margin-top:8px">شارك مبكرًا واحصل على إعجابات لتفتح الشارات الخاصة.</div>') + '</div></section>'; }
    out += '<section class="section"><div class="card pad row plan-cta"><div class="grow"><h3>🚀 خطتي للنمو (PDF)</h3><p class="muted" style="font-family:var(--f-ui);font-size:14px">ملف أنيق يجمع خطة نمو مشروعك وخريطة قنواتك وأولويات الإطلاق وأتمتتك الأولى ونتائج محاكياتك ومخرجات مجموعتك في المختبر، مع جدول عمل 30/60/90 يومًا.</p></div><button class="btn btn-primary" data-act="plan-pdf">📘 إنشاء خطتي</button><button class="btn btn-ghost" data-go="tools">🧰 صندوق الأدوات</button></div></section>';
    out += '<section class="section">' + leadFormHtml('acc') + '</section>';
    // شهادة المشاركة (بالحضور)
    const cc = Content.cert();
    out += '<section class="section"><div class="sec-head"><h2 class="sec-title">🎓 شهادة المشاركة</h2><span class="pill">تُمنح عند حضور <span class="num">' + ac.threshold + '%</span> من مدة البرنامج</span></div>';
    if (!Attend.eligible(me.uid)) out += '<div class="card pad center"><div style="font-size:44px;filter:grayscale(1);opacity:.5">🎓</div><h3>نسبة حضورك الحالية <span class="num">' + att + '%</span></h3><p class="muted" style="font-family:var(--f-ui)">يسجّل المدرّب الحضور في كل يوم تدريبي (<span class="num">' + ac.days + '</span> أيام × <span class="num">' + ac.hours + '</span> ساعات). تُفتح الشهادة تلقائيًا عند بلوغ <span class="num">' + ac.threshold + '%</span>.</p><div class="progress" style="max-width:420px;margin:10px auto 0"><i style="width:' + Math.min(100, att / Math.max(1, ac.threshold) * 100) + '%"></i></div></div>';
    else out += '<div class="congrats-card cert-card">' + congratsInner(me.name, 'cert') + '</div><div class="row" style="margin-top:12px"><button class="btn btn-primary" data-act="congrats-pdf" data-kind="cert">📥 تحميل الشهادة PDF</button></div><div class="notice">ℹ️ ' + h(cc.notice) + '</div>';
    out += '</section>';
    out += '<section class="section"><div class="sec-head"><h2 class="sec-title">🎉 تهنئة إنجاز</h2></div>';
    if (!unlocked) out += '<div class="card pad center"><div style="font-size:44px;filter:grayscale(1);opacity:.5">🔒</div><h3>تُفتح التهنئة عند إنجاز <span class="num">80%</span> من التمارين</h3><p class="muted" style="font-family:var(--f-ui)">إنجازك الحالي <span class="num">' + pct + '%</span></p><div class="progress" style="max-width:420px;margin:10px auto 0"><i style="width:' + Math.min(100, pct / 0.8) + '%"></i></div></div>';
    else out += '<div class="congrats-card">' + congratsInner(me.name, 'congrats') + '</div><div class="row" style="margin-top:12px"><button class="btn btn-primary" data-act="congrats-pdf" data-kind="congrats">📥 تحميل / حفظ كـ PDF</button><button class="btn btn-ghost" data-act="congrats-mail">✉️ إرسال نسخة لبريدي</button></div><div class="notice">⏳ ' + h(c.notice) + '</div>';
    out += '</section>';
    if (pdf.enabled !== false) out += '<section class="section"><div class="card pad row"><div class="grow"><h3>📄 استخراج المحتوى (PDF)</h3><p class="muted" style="font-family:var(--f-ui);font-size:14px">ملف مصمَّم بمقاس A5 يضم كل شرائح البرنامج بأحدث نسخة، جاهز للطباعة.</p></div><button class="btn btn-dark" data-act="content-pdf">📄 استخراج المحتوى (PDF)</button></div></section>';
    return out;
  }
};

// ============ لوحة المشرف (قراءة فقط) ============
Views.monitor = {
  html() {
    const c = Monitor.cfg(); const tok = Router.cur.id || '';
    if (!Admin.ok() && (!c.enabled || !c.token || tok !== c.token)) return '<div class="empty" style="margin-top:30px">🔒 رابط المتابعة غير صالح أو غير مفعّل. اطلب رابطًا محدثًا من إدارة البرنامج.</div>';
    const d = reportData(); const pct = v => v == null ? '—' : Math.round(v) + '%';
    const kpi = (l, v, s) => '<div class="mon-kpi"><span>' + l + '</span><b class="num">' + v + '</b>' + (s ? '<em>' + s + '</em>' : '') + '</div>';
    const bars = (items, max, col) => '<div class="mon-bars">' + items.map(x => '<div class="mon-bar"><span>' + h(x.l) + '</span><i><em style="width:' + Math.max(0, Math.min(100, (x.v || 0) / (max || 1) * 100)) + '%;background:' + (x.c || col || 'var(--brand)') + '"></em></i><b class="num">' + h(x.t != null ? x.t : x.v) + '</b></div>').join('') + '</div>';
    const dist = o => { const k = Object.keys(o).sort((a, b) => o[b] - o[a]); return k.length ? bars(k.map(x => ({ l: x, v: o[x] })), Math.max(...k.map(x => o[x])), '#1F3A5F') : '<div class="muted">لا توجد بيانات</div>'; };
    const ev = Bell.events().slice(0, 12);
    return '<div class="mon-head"><div><span class="live-dot"></span> <b>لوحة متابعة مباشرة</b> · ' + h(d.cohort.name) + '</div><div class="row"><span class="pill">👁 قراءة فقط</span><button class="btn btn-primary btn-sm" data-act="report-pdf" data-lang="ar">📑 التقرير (عربي)</button><button class="btn btn-soft btn-sm" data-act="report-pdf" data-lang="en">📑 Report (EN)</button></div></div>' +
      '<div class="mon-kpis">' + kpi('المسجّلون', d.uids.length) + kpi('متوسط الحضور', d.attAvg + '%') + kpi('مستحقو الشهادة', d.certs) + kpi('التقييم القبلي', pct(d.preAvg), d.pre.length + ' مشارك') + kpi('التقييم البعدي', pct(d.postAvg), d.post.length + ' مشارك') + kpi('متوسط التحسن', d.gain == null ? '—' : (d.gain >= 0 ? '+' : '') + Math.round(d.gain)) + kpi('الرضا', d.survey.overall ? d.survey.overall.toFixed(1) + '/5' : '—') + kpi('NPS', d.survey.nps == null ? '—' : d.survey.nps) + kpi('مهتمون ببرامج البنك', d.leads.length) + '</div>' +
      '<div class="mon-grid"><div class="card pad"><h3>المشاركة في المحاور</h3>' + bars(d.axes.map(x => ({ l: x.a.title, v: Math.round(x.rate * 100), t: Math.round(x.rate * 100) + '%' })), 100) + '</div>' +
      '<div class="card pad"><h3>الحضور حسب اليوم</h3>' + bars(d.perDay.map((v, i) => ({ l: 'اليوم ' + (i + 1), v, t: v + '/' + d.uids.length })), Math.max(1, d.uids.length), '#0E7C7B') + '<h3 style="margin-top:14px">قطاعات المشاركين</h3>' + dist(d.sector) + '</div>' +
      '<div class="card pad"><h3>التقييم القبلي مقابل البعدي لكل سؤال</h3>' + d.A.items.map((it, i) => '<div class="mon-q"><span class="num">' + (i + 1) + '</span>' + bars([{ l: 'قبلي', v: d.pq[i] || 0, t: pct(d.pq[i]), c: '#C98A9C' }, { l: 'بعدي', v: d.qq[i] || 0, t: pct(d.qq[i]), c: '#8A1538' }], 100) + '</div>').join('') + '</div>' +
      '<div class="card pad"><h3>الرضا لكل بند</h3>' + bars(d.survey.rates.map((r, i) => ({ l: r, v: d.survey.avgs[i] || 0, t: d.survey.avgs[i] ? d.survey.avgs[i].toFixed(1) : '—' })), 5, '#E0A526') + '<h3 style="margin-top:14px">الاهتمام ببرامج البنك</h3>' + dist(d.byProg) + '</div>' +
      '<div class="card pad"><h3>💡 توصيات آلية</h3>' + (d.recs.length ? '<ul class="mon-recs">' + d.recs.map(r => '<li>' + h(r.ar) + '</li>').join('') + '</ul>' : '<div class="muted">تظهر عند توفر بيانات كافية.</div>') + '</div>' +
      '<div class="card pad"><h3>آخر النشاطات</h3>' + (ev.length ? ev.map(e => '<div class="bell-item"><div class="grow">' + e.html + '<div class="t">' + ago(e.ts) + '</div></div></div>').join('') : '<div class="muted">لا نشاط بعد.</div>') + '</div></div>';
  }
};

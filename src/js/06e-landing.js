// ---------------------------------------------------------------------
// صفحة الهبوط: أول ما يراه الزائر قبل الدخول — نبذة، أهداف، مزايا، محتوى، رحلة، مخرجات
// النصوص قابلة للتعديل من لوحة الإدارة (site/landing) مع إظهار وإخفاء وترتيب الأقسام
// العناصر تُكتب سطرًا لكل عنصر بصيغة: أيقونة | عنوان | وصف
// ---------------------------------------------------------------------
const LANDING_KEYS = ['hero', 'logos', 'about', 'objectives', 'features', 'content', 'journey', 'outcomes', 'audience', 'cta'];
const LANDING_NAMES = { hero: 'الواجهة الافتتاحية', logos: 'شريط المنصات والأدوات', about: 'نبذة عن البرنامج', objectives: 'الأهداف', features: 'المزايا', content: 'المحتوى (من المحاور تلقائيًا)', journey: 'مراحل الرحلة', outcomes: 'المخرجات', audience: 'الفئة المستهدفة', cta: 'دعوة الختام' };
const DEFAULT_LANDING = {
  hero: { kicker: 'بنك قطر للتنمية · إدارة تنمية ريادة الأعمال', title: '', sub: 'برنامج تطبيقي مكثّف يأخذ مشروعك من اختيار المنصة المناسبة إلى متجر إلكتروني يبيع داخل قطر وخارجها — بالدفع الآمن، والتوصيل الذكي، والتسويق المبني على البيانات، والعمليات القابلة للتوسع.', cta: 'الدخول للمنصة التعليمية', cta2: 'اكتشف البرنامج' },
  logos: { title: 'منصات وأدوات ستتعامل معها', items: 'Shopify\nWooCommerce\nسلة\nزد\nNoon\nAmazon\nسنونو\nQPay\nSkipCash\nTap\nMyFatoorah\nStripe\nPayPal\nAramex\nDHL\nGoogle Analytics\nMeta Ads\nTikTok Shop' },
  about: { kicker: 'نبذة عن البرنامج', title: 'من فكرة متجر… إلى نموٍّ قابل للتوسع', sub: 'صُمّم البرنامج لأصحاب المشاريع الصغيرة والمتوسطة في مختلف مراحل نضجهم الرقمي. يركّز على التطبيق قبل النظرية: كل مفهوم يتحول إلى تمرين حي أو محاكاة أو قرار على مشروعك الحقيقي، لتخرج بأدوات عملية وخارطة طريق واضحة لتسريع مبيعاتك الإلكترونية.',
    items: '🎯 | تطبيقي أولًا | عروض قصيرة يتبعها تطبيق فوري على حالات ومشاريع حقيقية\n🇶🇦 | مصمم للسوق القطري | بوابات دفع محلية، شركاء توصيل، وقصص نجاح من قطر والخليج\n📈 | يقيس أثره | تقييم قبلي وبعدي يكشف مقدار تقدمك بالأرقام' },
  objectives: { kicker: 'أهداف البرنامج', title: 'ماذا ستُتقن بنهاية البرنامج؟', sub: '', items: '' },
  features: { kicker: 'مزايا التجربة', title: 'تجربة تعلّم تفاعلية لا تشبه القاعات التقليدية', sub: 'منصة تعليمية حية تعمل من جوالك طوال البرنامج وبعده.',
    items: '⚡ | تمارين حية ونتائج لحظية | صوّت وأجب وشاهد إجابات زملائك تظهر مباشرة على شاشة القاعة\n🛠️ | ثلاثة محاكيات تطبيقية | أعدّ متجرك، صمّم صفحة إتمام الشراء، ووزّع ميزانية التسويق\n🌟 | قصص نجاح حقيقية | رفيق وسنونو وسلة وتاب وغيرها — بمصادرها ودروسها\n🧪 | مختبر نمو ختامي | مشروع جماعي بمؤقّت حي يجمع كل المحاور في خطة واحدة\n🧮 | حاسبات وقوالب جاهزة | التكلفة الإجمالية، رسوم الدفع، نقطة إعادة الطلب، CAC وCLV وROAS\n🏅 | نقاط وأوسمة وشهادة | لوحة صدارة تحفيزية وشهادة مشاركة عند إتمام الحضور' },
  content: { kicker: 'محتوى البرنامج', title: 'وحدات مترابطة تغطي رحلة المتجر كاملة', sub: 'اختر وحدة لترى محاورها.' },
  journey: { kicker: 'مراحل الرحلة', title: 'رحلتك خطوة بخطوة', sub: '',
    items: '🧭 | التسجيل والتقييم القبلي | انضم للمنصة وقِس نقطة انطلاقك بعشرة أسئلة تطبيقية\n🏗️ | اليوم الأول: البناء | اختيار المنصة، الدفع الآمن، التنفيذ والشحن داخل قطر وخارجها\n🚀 | اليوم الثاني: النمو | قصص النجاح، التسويق بالبيانات، الأتمتة، التحليلات والذكاء الاصطناعي\n🧪 | مختبر النمو الختامي | فرق عمل تبني خطة نمو متكاملة لحالة واقعية\n🏁 | التقييم البعدي والشهادة | قِس تقدمك واحصل على شهادة المشاركة وخطة عملك الشخصية\n🤝 | متابعة 30/60/90 يومًا | تذكيرات ومتابعة لما طبّقته فعلًا بعد البرنامج' },
  outcomes: { kicker: 'المخرجات', title: 'ماذا تأخذ معك بعد البرنامج؟', sub: '',
    items: '🗺️ | قرار منصة مدروس | مصفوفة موزونة وتكلفة تشغيل إجمالية لمشروعك\n💳 | بوابة دفع مناسبة | مقارنة فعلية للرسوم ومدة التسوية ووسائل الدفع المحلية\n🚚 | خطة تنفيذ وشحن | نقطة إعادة الطلب ومسار المرتجعات والتكلفة الواصلة للعميل الدولي\n📣 | خطة تسويق بالأرقام | توزيع ميزانية يُحكم عليه بالعائد وقيمة العميل الدائمة\n⚙️ | إجراءات وأتمتة | إجراء تشغيل قياسي وأول أتمتة لمتجرك\n📄 | خطة عمل شخصية PDF | خطة نمو من خمس ركائز مع برنامج الدعم المناسب من بنك قطر للتنمية' },
  audience: { kicker: 'لمن هذا البرنامج؟', title: 'صُمّم لمن يريد أن يبيع أونلاين بجدية', sub: '',
    items: '👤 | أصحاب المشاريع ورواد الأعمال | الساعون للتوسع في المبيعات الإلكترونية\n🤝 | المؤسسون والشركاء المؤسسون | لمشاريع قائمة على المنتجات أو الخدمات\n🏪 | المستعدون لإطلاق متجرهم | من يجهّز لافتتاح واجهته الرقمية الأولى\n👥 | فرق التحول والتسويق والعمليات | المسؤولون عن التحول الرقمي داخل المشروع' },
  cta: { title: 'جاهز لتسريع متجرك الإلكتروني؟', sub: 'سجّل خلال ثوانٍ باسمك، وابدأ التمارين الحية مع زملائك.', cta: 'الدخول للمنصة التعليمية' }
};
const Landing = {
  raw() { return (Store.site && Store.site.landing) || {}; },
  sec(k) { const o = Landing.raw()[k] || {}; const s = Object.assign({}, DEFAULT_LANDING[k] || {}, o); s._modified = !!Landing.raw()[k]; return s; },
  hidden(k) { return !!((Landing.raw()._hidden || {})[k]); },
  order() { const saved = arr(Landing.raw()._order).filter(k => LANDING_KEYS.indexOf(k) > -1); return saved.concat(LANDING_KEYS.filter(k => saved.indexOf(k) === -1)); },
  items(s, k) {
    let txt = s.items;
    if (k === 'objectives' && !String(txt || '').trim()) return Content.guide().objectives.map((t, i) => ({ icon: String(i + 1), title: t, desc: '' }));
    return String(txt || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const p = l.split('|').map(x => x.trim()); return p.length === 1 ? { icon: '', title: p[0], desc: '' } : { icon: p[0], title: p[1] || '', desc: p.slice(2).join(' | ') }; });
  },
  objectivesText() { return Content.guide().objectives.join('\n'); }
};
function lpHead(s, light) { return '<div class="lp-head rv">' + (s.kicker ? '<span class="lp-kicker">' + h(s.kicker) + '</span>' : '') + '<h2 class="lp-h2' + (light ? ' light' : '') + '">' + h(s.title || '') + '</h2>' + (s.sub ? '<p class="lp-sub">' + h(s.sub) + '</p>' : '') + '</div>'; }
function lpCta(label, cls) { return '<button class="lp-btn ' + (cls || '') + '" data-act="' + (Me.isReg() || Me.guest || Admin.ok() ? 'lp-enter' : 'open-login') + '"><span>' + h(label || 'الدخول للمنصة التعليمية') + '</span><span class="lp-arrow">←</span></button>'; }
const LandingSections = {
  hero(s) {
    const axes = Content.axes(); const units = Content.eligibleAxes().map(a => a.unit).filter((u, i, x) => u && u !== 7 && x.indexOf(u) === i).length;
    const exCount = Content.eligibleAxes().reduce((n, a) => n + Content.exercisesOf(a.id).length, 0);
    const title = s.title || Content.site().heroTitle;
    const stat = (n, l) => '<div class="lp-stat"><b class="num" data-count="' + n + '">' + n + '</b><span>' + l + '</span></div>';
    return '<section class="lp-hero"><div class="lp-aurora"><i></i><i></i><i></i></div><div class="lp-grid-bg"></div>' +
      '<div class="lp-hero-in"><div class="lp-hero-txt">' + (s.kicker ? '<span class="lp-badge"><span class="dot"></span>' + h(s.kicker) + '</span>' : '') +
      '<h1 class="lp-h1">' + h(title) + '</h1><p class="lp-lead">' + h(s.sub || '') + '</p>' +
      '<div class="lp-actions">' + lpCta(s.cta, 'gold') + (s.cta2 ? '<button class="lp-btn ghost" data-act="lp-scroll"><span>' + h(s.cta2) + '</span><span class="lp-arrow down">↓</span></button>' : '') + '</div>' +
      '<div class="lp-stats">' + stat(units, 'وحدات') + stat(axes.length, 'محورًا') + stat(exCount, 'تمرينًا تفاعليًا') + stat(Content.stories().length, 'قصص نجاح') + '</div></div>' +
      '<div class="lp-visual" aria-hidden="true"><div class="lp-orbit"><span></span><span></span></div>' +
      '<div class="lp-device"><div class="lp-dev-top"><i></i><i></i><i></i><b>متجري.qa</b></div><div class="lp-dev-body">' +
      '<div class="lp-dev-kpis"><div><small>المبيعات</small><b class="num">QAR 48,200</b></div><div><small>التحويل</small><b class="num">3.8%</b></div></div>' +
      '<div class="lp-bars">' + [38, 52, 45, 64, 58, 76, 70, 92].map((v, i) => '<i style="--h:' + v + '%;--d:' + (i * 0.09).toFixed(2) + 's"></i>').join('') + '</div>' +
      '<svg class="lp-line" viewBox="0 0 200 60" preserveAspectRatio="none"><path d="M0 50 C25 44 35 30 60 34 S100 20 120 22 S160 8 200 6" fill="none" stroke="#FFD98A" stroke-width="2.5" stroke-linecap="round"/></svg>' +
      '<div class="lp-dev-rows"><div><span>🛍️</span><em></em><b class="num">+24</b></div><div><span>🚚</span><em></em><b class="num">98%</b></div></div></div></div>' +
      '<div class="lp-chip c1"><span>🛒</span><div><b>طلب جديد <span class="num">#1042</span></b><small class="num">QAR 340 · الدوحة</small></div></div>' +
      '<div class="lp-chip c2"><span>✅</span><div><b>تم الدفع بنجاح</b><small>QPay · Apple Pay</small></div></div>' +
      '<div class="lp-chip c3"><span>🚚</span><div><b>شحنة في الطريق</b><small>الرياض · <span class="num">48</span> ساعة</small></div></div>' +
      '<div class="lp-chip c4"><span>📈</span><div><b class="num">+38%</b><small>معدل الإتمام</small></div></div>' +
      '</div></div><button class="lp-scroll-hint" data-act="lp-scroll" aria-label="انزل للأسفل"><span></span></button></section>';
  },
  logos(s) {
    const it = Landing.items(s, 'logos'); if (!it.length) return '';
    const row = it.map(x => '<span class="notranslate" translate="no">' + h(x.title) + '</span>').join('<i>✦</i>');
    return '<section class="lp-logos">' + (s.title ? '<div class="lp-logos-t">' + h(s.title) + '</div>' : '') + '<div class="lp-marquee"><div class="lp-track">' + row + '<i>✦</i>' + row + '<i>✦</i></div></div></section>';
  },
  about(s) {
    const it = Landing.items(s, 'about');
    return '<section class="lp-sec lp-about"><div class="lp-wrap lp-about-in"><div>' + lpHead(s) + '</div><div class="lp-pillars">' + it.map((x, i) => '<div class="lp-pillar rv" style="--i:' + i + '"><span class="lp-ico">' + h(x.icon) + '</span><div><b>' + h(x.title) + '</b><p>' + h(x.desc) + '</p></div></div>').join('') + '</div></div></section>';
  },
  objectives(s) {
    const it = Landing.items(s, 'objectives'); if (!it.length) return '';
    return '<section class="lp-sec lp-obj"><div class="lp-wrap">' + lpHead(s) + '<div class="lp-obj-grid">' + it.map((x, i) => '<div class="lp-obj-card rv" style="--i:' + (i % 4) + '"><span class="lp-obj-n num">' + String(i + 1).padStart(2, '0') + '</span><p>' + (x.icon && !/^\d+$/.test(x.icon) ? h(x.icon) + ' ' : '') + h(x.title) + (x.desc ? ' — <span class="muted">' + h(x.desc) + '</span>' : '') + '</p></div>').join('') + '</div></div></section>';
  },
  features(s) {
    const it = Landing.items(s, 'features');
    return '<section class="lp-sec lp-feat"><div class="lp-wrap">' + lpHead(s, true) + '<div class="lp-feat-grid">' + it.map((x, i) => '<div class="lp-feat-card rv" style="--i:' + (i % 3) + '"><span class="lp-ico big">' + h(x.icon) + '</span><h3>' + h(x.title) + '</h3><p>' + h(x.desc) + '</p></div>').join('') + '</div></div></section>';
  },
  content(s) {
    const axes = Content.axes(); if (!axes.length) return '';
    const groups = []; axes.forEach(a => { let g = groups.find(x => x.unit === a.unit); if (!g) { g = { unit: a.unit, axes: [] }; groups.push(g); } g.axes.push(a); });
    const cur = Math.min(groups.length - 1, Math.max(0, UIState.lpUnit || 0)); const g = groups[cur];
    return '<section class="lp-sec lp-content"><div class="lp-wrap">' + lpHead(s) + '<div class="lp-units rv"><div class="lp-unit-tabs" role="tablist">' + groups.map((x, i) => '<button role="tab" class="lp-unit-tab ' + (i === cur ? 'on' : '') + '" data-act="lp-unit" data-i="' + i + '"><small>' + h(Content.unitKicker(x.unit) || 'محاور إضافية') + '</small><b>' + h(Content.unitName(x.unit) || 'محاور أُضيفت للبرنامج') + '</b></button>').join('') + '</div>' +
      '<div class="lp-unit-pane" id="lpUnitPane">' + g.axes.map((a, i) => { const col = Content.color(a); return '<div class="lp-axis" style="--ac:' + col + ';--i:' + i + '"><span class="lp-axis-ico" style="background:linear-gradient(135deg,' + col + ',' + shade(col, -0.35) + ')">' + iconSvg(a.icon || 'star', 22, '#fff', 1.9) + '</span><div><b>' + h(a.title) + '</b>' + (a.classic ? '<small>' + h(a.classic) + '</small>' : '') + '<p>' + h(clip(stripHtml(a.desc || ''), 150)) + '</p><div class="lp-axis-meta"><span>🎞️ <span class="num">' + a.slides.length + '</span> شريحة</span><span>✍️ <span class="num">' + Content.exercisesOf(a.id).length + '</span> تمرين</span>' + (a.duration ? '<span>⏱ ' + h(a.duration) + '</span>' : '') + '</div></div></div>'; }).join('') + '</div></div></div></section>';
  },
  journey(s) {
    const it = Landing.items(s, 'journey'); if (!it.length) return '';
    return '<section class="lp-sec lp-journey"><div class="lp-wrap">' + lpHead(s) + '<div class="lp-timeline"><div class="lp-tl-line"><i></i></div>' + it.map((x, i) => '<div class="lp-step rv" style="--i:' + i + '"><div class="lp-step-dot"><span>' + h(x.icon) + '</span></div><div class="lp-step-card"><span class="lp-step-n num">' + String(i + 1).padStart(2, '0') + '</span><b>' + h(x.title) + '</b><p>' + h(x.desc) + '</p></div></div>').join('') + '</div></div></section>';
  },
  outcomes(s) {
    const it = Landing.items(s, 'outcomes'); if (!it.length) return '';
    return '<section class="lp-sec lp-out"><div class="lp-wrap">' + lpHead(s) + '<div class="lp-out-grid">' + it.map((x, i) => '<div class="lp-out-card rv" style="--i:' + (i % 3) + '"><span class="lp-ico">' + h(x.icon) + '</span><div><b>' + h(x.title) + '</b><p>' + h(x.desc) + '</p></div><span class="lp-check">✓</span></div>').join('') + '</div></div></section>';
  },
  audience(s) {
    const it = Landing.items(s, 'audience'); if (!it.length) return '';
    return '<section class="lp-sec lp-aud"><div class="lp-wrap">' + lpHead(s) + '<div class="lp-aud-grid">' + it.map((x, i) => '<div class="lp-aud-card rv" style="--i:' + i + '"><span class="lp-ico big">' + h(x.icon) + '</span><b>' + h(x.title) + '</b><p>' + h(x.desc) + '</p></div>').join('') + '</div></div></section>';
  },
  cta(s) {
    return '<section class="lp-final"><div class="lp-aurora"><i></i><i></i><i></i></div><div class="lp-wrap lp-final-in rv"><h2>' + h(s.title || '') + '</h2>' + (s.sub ? '<p>' + h(s.sub) + '</p>' : '') + lpCta(s.cta, 'gold big') + '</div></section>';
  }
};
Views.landing = {
  html() {
    let out = '<div class="lp' + (Views.landing._played ? ' played' : '') + '">';
    Landing.order().forEach(k => { if (Landing.hidden(k) || !LandingSections[k]) return; try { out += LandingSections[k](Landing.sec(k)); } catch (e) { console.error(e); } });
    return out + '</div>';
  },
  after(root) {
    const L = Views.landing; const seen = L._seen || (L._seen = new Set());
    setTimeout(() => { L._played = true; }, 2500); // بعد أول عرض لا تتكرر حركات الدخول عند إعادة الرسم
    const els = $$('.lp .rv', root); els.forEach((e, i) => { e.setAttribute('data-rv', i); if (seen.has(i)) e.classList.add('in'); });
    const reduce = document.documentElement.getAttribute('data-motion') === 'reduce';
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); }
    else {
      if (L._io) L._io.disconnect();
      const io = L._io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); seen.add(+x.target.getAttribute('data-rv')); io.unobserve(x.target); } }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      els.forEach(e => { if (!e.classList.contains('in')) io.observe(e); });
    }
    // خط الرحلة يمتد مع التمرير
    const tl = $('.lp-timeline', root);
    if (tl && !Views.landing._scrollBound) {
      Views.landing._scrollBound = true;
      window.addEventListener('scroll', () => { const t = document.querySelector('.lp-timeline'); if (!t) return; const r = t.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (innerHeight * 0.7 - r.top) / r.height)); t.style.setProperty('--prog', p.toFixed(3)); }, { passive: true });
    }
    // عدّاد الأرقام مرة واحدة
    if (!reduce && !L._played && !L._counted) {
      L._counted = true;
      $$('.lp-stat b[data-count]', root).forEach(b => { const n = +b.getAttribute('data-count'); const t0 = performance.now(); const step = t => { const p = Math.min(1, (t - t0) / 1400); b.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }; b.textContent = '0'; requestAnimationFrame(step); });
    }
    // حركة خفيفة للبطاقات العائمة مع المؤشر
    const vis = $('.lp-visual', root);
    if (vis && !reduce && !vis._bound) { vis._bound = true; const hero = vis.closest('.lp-hero'); hero.addEventListener('mousemove', e => { const r = hero.getBoundingClientRect(); vis.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)); vis.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); }); }
  }
};

// ---------- نافذة الدخول (نموذج التسجيل الحالي داخل نافذة منبثقة) ----------
function loginFormHtml() {
  const pv = Content.privacy();
  return '<div class="login-pop"><div class="lpop-head"><span class="lpop-ico">' + iconSvg('store', 24, '#fff', 2.1) + '</span><div><span class="sec-kicker">أهلًا بك في البرنامج التدريبي</span><h3>' + h(Content.site().heroTitle) + '</h3></div><button class="lpop-x" data-x aria-label="إغلاق">✕</button></div>' +
    '<p class="muted" style="margin-top:0">سجّل لتشارك في التقييمات والتمارين الحية وترى مشاركات زملائك لحظيًا، وتتابع إنجازك وحضورك وشهادتك.</p>' +
    '<div class="reg-grid">' + RegFields.visible().map(f => RegFields.input(f, '', 'reg_')).join('') + '</div>' +
    '<label class="consent"><input type="checkbox" id="regConsent"> <span>' + h(pv.consent) + ' — <a href="#" data-act="privacy-show">اقرأ إشعار الخصوصية</a></span></label>' +
    '<label class="consent"><input type="checkbox" id="regFollow"> <span>' + h(pv.followup) + ' <span class="muted">(اختياري)</span></span></label>' +
    '<button class="btn btn-primary btn-block" data-act="register">ابدأ 🚀</button>' +
    '<button class="btn btn-mint btn-block" style="margin-top:10px" data-act="member-login">مسجّل مسبقًا؟ الدخول برقم العضوية</button>' +
    '<div class="or-line">أو</div><button class="btn btn-ghost btn-block" data-act="guest">👀 تصفح كزائر (مشاهدة فقط)</button>' +
    // دخول المدرب: قفل صغير باهت في الأسفل (يتضح عند المرور أو التركيز)
    '<div class="trainer-lock-row"><button class="trainer-lock" data-act="admin-enter" title="دخول المدرب" aria-label="دخول المدرب">' + iconSvg('lock', 14) + '</button></div></div>';
}
const LoginModal = {
  m: null,
  open() {
    if (LoginModal.m) return;
    LoginModal.m = UI.modal(loginFormHtml(), { wide: true, onClose: () => { LoginModal.m = null; } });
    LoginModal.m.el.classList.add('login-modal');
    $('[data-x]', LoginModal.m.el).onclick = () => LoginModal.close();
    // الأزرار داخل النافذة تمر عبر معالج النقرات العام (المستمع على المستند)
    const el = LoginModal.m.el; const first = $('input,select', el); if (first) setTimeout(() => { try { if (!el.contains(document.activeElement)) first.focus({ preventScroll: true }); } catch (e) {} }, 60); // لا نسحب التركيز إن بدأ المستخدم الكتابة في حقل آخر
  },
  close() { if (LoginModal.m) { const m = LoginModal.m; LoginModal.m = null; m.close(); } }
};

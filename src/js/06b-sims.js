// ---------------------------------------------------------------------
// المحاكيات التفاعلية: إعداد متجر، مصمّم صفحة إتمام الشراء، لعبة ميزانية التسويق
// نماذج تعليمية تقريبية مبنية على اتجاهات الدراسات والممارسات، لا توقعات دقيقة.
// ---------------------------------------------------------------------
const SIM_TYPES = { store: 'محاكي إعداد متجر', checkout: 'مصمّم صفحة إتمام الشراء', budget: 'لعبة ميزانية التسويق' };
const QAR = n => Math.round(n).toLocaleString('en-US');

// ================= 1) محاكي إعداد المتجر =================
const STORE_CATS = ['عطور وبخور', 'أزياء وعبايات', 'قهوة وتمور', 'إلكترونيات وإكسسوارات', 'منتجات منزلية', 'مستحضرات عناية'];
const StoreSim = {
  def() { return { step: 0, name: '', cat: STORE_CATS[0], lang: 'both', cur2: true, title: '', price: '', compare: '', sku: '', variants: '', bullets: '', img: 'both', zones: { doha: true }, shipShow: 'late', freeFrom: '', pay: { card: true }, returns: '', privacy: false, domain: false, licence: false, tracking: false, testOrder: false }; },
  checks(s) {
    const bl = String(s.bullets || '').split('\n').map(x => x.trim()).filter(Boolean);
    const pays = Object.keys(s.pay || {}).filter(k => s.pay[k]);
    return [
      { ok: String(s.name).trim().length >= 3, t: 'اسم متجر واضح', tip: 'اسم قصير يسهل تذكره وكتابته.' },
      { ok: s.lang === 'both', t: 'واجهة بالعربية والإنجليزية', tip: 'يخدم العملاء المحليين والمقيمين والزوار.' },
      { ok: String(s.title).trim().length >= 25 && /\d/.test(s.title), t: 'عنوان منتج بمعادلة كاملة (نوع + خاصية + حجم)', tip: 'مثال: «عطر عود طبيعي للرجال، ثبات طويل، 100 مل».' },
      { ok: +s.price > 0, t: 'سعر محدد', tip: 'أدخل السعر بالريال القطري.' },
      { ok: String(s.sku).trim().length >= 3, t: 'رمز SKU فريد', tip: 'رمز ثابت لكل منتج وخيار.' },
      { ok: bl.length >= 3, t: '3 نقاط بيع على الأقل تبدأ بالفائدة', tip: 'سطر لكل نقطة.' },
      { ok: s.img === 'both', t: 'صور بخلفية نظيفة + صور استخدام', tip: 'الأولى للوضوح، والثانية لتخيّل الاستخدام.' },
      { ok: s.shipShow === 'early', t: 'تكلفة الشحن ظاهرة مبكرًا', tip: 'أكبر سبب للتخلي عن السلة هو التكاليف المفاجئة.' },
      { ok: +s.freeFrom > 0, t: 'حد للشحن المجاني', tip: 'يرفع متوسط قيمة الطلب.' },
      { ok: !!(s.pay && s.pay.debit), t: 'بطاقات الخصم المحلية (QPay)', tip: 'شريحة كبيرة من العملاء تعتمد عليها.' },
      { ok: pays.length >= 3, t: '3 وسائل دفع أو أكثر', tip: 'مثل البطاقات والمحافظ الرقمية.' },
      { ok: +s.returns >= 7, t: 'سياسة استرجاع واضحة (7 أيام أو أكثر)', tip: 'تطمئن العميل قبل الشراء.' },
      { ok: !!s.privacy, t: 'سياسة خصوصية منشورة', tip: 'متطلب قانوني وعنصر ثقة.' },
      { ok: !!s.licence && !!s.domain, t: 'رخصة تجارة إلكترونية ونطاق .qa', tip: 'متطلبات رخصة وزارة التجارة والصناعة.' },
      { ok: !!s.tracking, t: 'أدوات التحليل والتتبع مربوطة', tip: 'اربطها قبل أول زيارة.' },
      { ok: !!s.testOrder, t: 'طلب تجريبي كامل ناجح', tip: 'لا تطلق قبل تجربة الرحلة كاملة بنفسك.' }
    ];
  },
  score(s) { const c = StoreSim.checks(s); return Math.round(c.filter(x => x.ok).length / c.length * 100); },
  steps: ['الهوية', 'المنتج', 'الشحن والدفع', 'السياسات والإطلاق'],
  form(s, id, dis) {
    const f = (k, l, extra = '') => '<div class="field"><label>' + l + '</label><input data-keep="sim-' + h(id) + '-' + k + '" data-sim-f="' + k + '" data-ex="' + h(id) + '" value="' + h(s[k] || '') + '" ' + extra + ' ' + dis + '></div>';
    const cb = (path, l) => { const [a, b] = path.split('.'); const v = b ? (s[a] || {})[b] : s[a]; return '<label class="sim-cb"><input type="checkbox" data-sim-f="' + path + '" data-ex="' + h(id) + '" ' + (v ? 'checked' : '') + ' ' + dis + '> ' + l + '</label>'; };
    const sel = (k, opts) => '<select data-sim-f="' + k + '" data-ex="' + h(id) + '" ' + dis + '>' + opts.map(([v, l]) => '<option value="' + h(v) + '" ' + (String(s[k]) === String(v) ? 'selected' : '') + '>' + h(l) + '</option>').join('') + '</select>';
    const st = s.step || 0;
    let out = '<div class="sim-steps">' + StoreSim.steps.map((t, i) => '<button class="sim-step ' + (i === st ? 'on' : i < st ? 'done' : '') + '" data-act="sim-step" data-ex="' + h(id) + '" data-i="' + i + '"><span class="num">' + (i + 1) + '</span>' + t + '</button>').join('') + '</div>';
    if (st === 0) out += f('name', 'اسم المتجر', 'placeholder="مثال: دار المسك"') + '<div class="grid2"><div class="field"><label>الفئة</label>' + sel('cat', STORE_CATS.map(x => [x, x])) + '</div><div class="field"><label>لغة الواجهة</label>' + sel('lang', [['ar', 'العربية فقط'], ['en', 'الإنجليزية فقط'], ['both', 'العربية والإنجليزية']]) + '</div></div>' + cb('cur2', 'عرض الأسعار بعملات إضافية للعملاء الخليجيين');
    if (st === 1) out += f('title', 'عنوان المنتج', 'placeholder="العلامة — النوع، الخاصية، الحجم"') + '<div class="grid2">' + f('price', 'السعر (ر.ق)', 'type="number" min="0"') + f('compare', 'السعر قبل الخصم (اختياري)', 'type="number" min="0"') + f('sku', 'رمز المنتج SKU', 'placeholder="MSK-OUD-100"') + f('variants', 'الخيارات (اختياري)', 'placeholder="50 مل، 100 مل"') + '</div><div class="field"><label>نقاط البيع (سطر لكل نقطة، ابدأ بالفائدة)</label><textarea data-keep="sim-' + h(id) + '-bullets" data-sim-f="bullets" data-ex="' + h(id) + '" rows="4" ' + dis + '>' + h(s.bullets || '') + '</textarea></div><div class="field"><label>أسلوب الصور</label>' + sel('img', [['clean', 'خلفية نظيفة فقط'], ['life', 'صور استخدام فقط'], ['both', 'خلفية نظيفة + صور استخدام']]) + '</div>';
    if (st === 2) out += '<div class="field"><label>مناطق التوصيل</label><div class="sim-cbs">' + cb('zones.doha', 'الدوحة') + cb('zones.qatar', 'باقي مناطق قطر') + cb('zones.gcc', 'دول الخليج') + '</div></div><div class="grid2"><div class="field"><label>متى تظهر تكلفة الشحن؟</label>' + sel('shipShow', [['early', 'في صفحة المنتج والسلة'], ['late', 'في آخر خطوة من الدفع']]) + '</div>' + f('freeFrom', 'شحن مجاني للطلبات فوق (ر.ق)', 'type="number" min="0"') + '</div><div class="field"><label>وسائل الدفع</label><div class="sim-cbs">' + cb('pay.debit', 'بطاقات الخصم المحلية (QPay)') + cb('pay.card', 'بطاقات الائتمان') + cb('pay.wallet', 'Apple Pay / Google Pay') + cb('pay.cod', 'الدفع عند الاستلام') + cb('pay.bnpl', 'التقسيط') + '</div></div>';
    if (st === 3) out += '<div class="grid2">' + f('returns', 'مدة الاسترجاع (أيام)', 'type="number" min="0"') + '</div><div class="sim-cbs col">' + cb('privacy', 'نشرت سياسة الخصوصية والشروط') + cb('licence', 'حصلت على رخصة التجارة الإلكترونية') + cb('domain', 'النطاق ينتهي بـ .qa أو .com.qa') + cb('tracking', 'ربطت أدوات التحليل وبكسل الإعلانات') + cb('testOrder', 'أتممت طلبًا تجريبيًا كاملًا من الجوال والحاسوب') + '</div>';
    out += '<div class="row" style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="sim-step" data-ex="' + h(id) + '" data-i="' + Math.max(0, st - 1) + '" ' + (st === 0 ? 'disabled' : '') + '>→ السابق</button><button class="btn btn-soft btn-sm" data-act="sim-step" data-ex="' + h(id) + '" data-i="' + Math.min(3, st + 1) + '" ' + (st === 3 ? 'disabled' : '') + '>التالي ←</button></div>';
    return out;
  },
  live(s) {
    const sc = StoreSim.score(s); const c = StoreSim.checks(s); const bl = String(s.bullets || '').split('\n').map(x => x.trim()).filter(Boolean);
    const pays = [['debit', 'QPay'], ['card', 'VISA'], ['wallet', 'Apple Pay'], ['cod', 'COD'], ['bnpl', 'تقسيط']].filter(([k]) => (s.pay || {})[k]);
    const preview = '<div class="pp-mock"><div class="pp-top"><b>' + h(s.name || 'اسم المتجر') + '</b><span>' + (s.lang === 'both' ? 'ع | EN' : s.lang === 'en' ? 'EN' : 'ع') + (s.cur2 ? ' · QAR ▾' : '') + '</span></div>' +
      '<div class="pp-img ' + h(s.img) + '">' + (s.img !== 'clean' ? '<span class="pp-life">📸 صورة استخدام</span>' : '') + '<span class="pp-prod">🧴</span></div>' +
      '<div class="pp-body"><div class="pp-title">' + h(s.title || 'عنوان المنتج') + '</div><div class="pp-price"><b class="num">' + (s.price ? QAR(s.price) : '—') + ' ر.ق</b>' + (+s.compare > +s.price ? ' <s class="num">' + QAR(s.compare) + '</s>' : '') + '</div>' +
      (s.variants ? '<div class="pp-vars">' + String(s.variants).split(/[،,]/).map(v => '<span>' + h(v.trim()) + '</span>').join('') + '</div>' : '') +
      (bl.length ? '<ul class="pp-bl">' + bl.slice(0, 5).map(b => '<li>' + h(b) + '</li>').join('') + '</ul>' : '') +
      (s.shipShow === 'early' ? '<div class="pp-ship">🚚 التوصيل: ' + ['doha', 'qatar', 'gcc'].filter(z => (s.zones || {})[z]).map(z => ({ doha: 'الدوحة', qatar: 'قطر', gcc: 'الخليج' })[z]).join('، ') + (+s.freeFrom ? ' · مجاني فوق <span class="num">' + QAR(s.freeFrom) + '</span> ر.ق' : '') + '</div>' : '') +
      '<div class="pp-btn">أضف إلى السلة</div><div class="pp-pay">' + pays.map(([, l]) => '<span>' + l + '</span>').join('') + '</div>' + (+s.returns ? '<div class="pp-ret">↩ استرجاع خلال <span class="num">' + +s.returns + '</span> أيام</div>' : '') + '</div></div>';
    return '<div class="sim-live"><div class="sim-score"><div class="gauge" style="--p:' + sc + '"><b class="num">' + sc + '%</b></div><div><b>جاهزية الإطلاق</b><div class="muted" style="font-size:13px">' + (sc >= 90 ? '🚀 جاهز للإطلاق' : sc >= 60 ? '🛠 قريب، أكمل البنود الناقصة' : '📋 يحتاج إعدادًا أكثر') + '</div></div></div>' + preview +
      '<ul class="sim-checks">' + c.map(x => '<li class="' + (x.ok ? 'ok' : '') + '"><span>' + (x.ok ? '✅' : '⬜') + '</span><div><b>' + h(x.t) + '</b>' + (x.ok ? '' : '<div class="tip">' + h(x.tip) + '</div>') + '</div></li>').join('') + '</ul></div>';
  },
  summary(s) { return StoreSim.score(s) + '% جاهزية · ' + (s.name || 'متجر') + ' · ' + (s.title || ''); },
  metric(s) { return StoreSim.score(s); }
};

// ================= 2) مصمّم صفحة إتمام الشراء =================
const CHECKOUT_BASE = 42;
const CheckoutSim = {
  def() { return { account: 'forced', fields: 14, ship: 'late', pay: { card: true }, trust: {}, progress: false, autofill: false, summary: false, inlineErr: false, coupon: 'big', upsell: true }; },
  factors(s) {
    const pays = s.pay || {}; const tr = s.trust || {}; const out = [];
    const add = (v, t) => out.push({ v, t });
    add(s.account === 'guest' ? 6 : s.account === 'optional' ? 4 : -8, s.account === 'guest' ? 'الشراء كضيف متاح' : s.account === 'optional' ? 'الحساب اختياري بعد الشراء' : 'إجبار إنشاء حساب');
    add(-Math.max(0, (+s.fields || 0) - 7) * 1.2, 'عدد الحقول: ' + s.fields);
    add(s.ship === 'early' ? 7 : -9, s.ship === 'early' ? 'تكلفة الشحن ظاهرة مبكرًا' : 'مفاجأة الشحن في آخر خطوة');
    if (pays.debit) add(5, 'بطاقات الخصم المحلية'); else add(-4, 'غياب بطاقات الخصم المحلية');
    if (pays.wallet) add(4, 'المحافظ الرقمية'); if (pays.cod) add(2, 'الدفع عند الاستلام'); if (pays.bnpl) add(1.5, 'التقسيط');
    const trn = ['badges', 'returns', 'contact'].filter(k => tr[k]).length; add(trn * 2.5 - (trn ? 0 : 3), trn ? 'عناصر ثقة (' + trn + ')' : 'لا عناصر ثقة');
    if (s.progress) add(2, 'مؤشر خطوات واضح'); if (s.autofill) add(3, 'إكمال تلقائي للعنوان'); if (s.summary) add(2, 'ملخص الطلب ظاهر'); if (s.inlineErr) add(2.5, 'رسائل خطأ واضحة بجانب الحقل');
    if (s.coupon === 'big') add(-2, 'حقل كوبون بارز يدفع للبحث عن كوبونات'); else add(0.5, 'حقل الكوبون مطوي');
    if (s.upsell) add(-3, 'نافذة عروض منبثقة قبل الدفع');
    return out;
  },
  rate(s) { return Math.max(15, Math.min(88, Math.round(CHECKOUT_BASE + CheckoutSim.factors(s).reduce((a, f) => a + f.v, 0)))); },
  form(s, id, dis) {
    const cb = (path, l) => { const [a, b] = path.split('.'); const v = b ? (s[a] || {})[b] : s[a]; return '<label class="sim-cb"><input type="checkbox" data-sim-f="' + path + '" data-ex="' + h(id) + '" ' + (v ? 'checked' : '') + ' ' + dis + '> ' + l + '</label>'; };
    const rad = (k, opts) => '<div class="sim-seg">' + opts.map(([v, l]) => '<label class="' + (String(s[k]) === v ? 'on' : '') + '"><input type="radio" name="' + h(id + k) + '" data-sim-f="' + k + '" data-ex="' + h(id) + '" value="' + v + '" ' + (String(s[k]) === v ? 'checked' : '') + ' ' + dis + '>' + l + '</label>').join('') + '</div>';
    return '<div class="field"><label>الحساب</label>' + rad('account', [['forced', 'إجباري'], ['optional', 'اختياري بعد الشراء'], ['guest', 'شراء كضيف']]) + '</div>' +
      '<div class="field"><label>عدد الحقول: <b class="num" data-sim-out="fields" data-ex="' + h(id) + '">' + s.fields + '</b></label><input type="range" min="5" max="18" data-sim-f="fields" data-ex="' + h(id) + '" value="' + s.fields + '" ' + dis + '></div>' +
      '<div class="field"><label>تكلفة الشحن</label>' + rad('ship', [['late', 'في آخر خطوة'], ['early', 'مبكرًا في السلة']]) + '</div>' +
      '<div class="field"><label>وسائل الدفع</label><div class="sim-cbs">' + cb('pay.card', 'بطاقات الائتمان') + cb('pay.debit', 'الخصم المحلي QPay') + cb('pay.wallet', 'Apple/Google Pay') + cb('pay.cod', 'عند الاستلام') + cb('pay.bnpl', 'تقسيط') + '</div></div>' +
      '<div class="field"><label>عناصر الثقة</label><div class="sim-cbs">' + cb('trust.badges', 'شعارات الدفع والحماية') + cb('trust.returns', 'سياسة الاسترجاع') + cb('trust.contact', 'بيانات تواصل') + '</div></div>' +
      '<div class="field"><label>تفاصيل التجربة</label><div class="sim-cbs">' + cb('progress', 'مؤشر خطوات') + cb('autofill', 'إكمال تلقائي للعنوان') + cb('summary', 'ملخص الطلب ظاهر') + cb('inlineErr', 'أخطاء بجانب الحقل') + cb('upsell', 'نافذة عروض قبل الدفع') + '</div></div>' +
      '<div class="field"><label>حقل الكوبون</label>' + rad('coupon', [['big', 'بارز'], ['collapsed', 'مطوي']]) + '</div>';
  },
  live(s) {
    const r = CheckoutSim.rate(s); const fs = CheckoutSim.factors(s).filter(f => f.v).sort((a, b) => b.v - a.v);
    const pays = s.pay || {};
    const mock = '<div class="co-mock">' + (s.progress ? '<div class="co-prog"><span class="on">السلة</span><span class="on">العنوان</span><span>الدفع</span><span>التأكيد</span></div>' : '') +
      (s.account === 'forced' ? '<div class="co-block warn">🔐 أنشئ حسابًا للمتابعة</div>' : '<div class="co-block">👤 ' + (s.account === 'guest' ? 'تابع كضيف' : 'تابع كضيف · أنشئ حسابًا لاحقًا') + '</div>') +
      '<div class="co-fields">' + Array.from({ length: Math.min(+s.fields, 18) }).map((_, i) => '<i style="width:' + (i % 3 ? 46 : 96) + '%"></i>').join('') + '</div>' + (s.autofill ? '<div class="co-note">📍 اقتراح العنوان تلقائيًا</div>' : '') +
      (s.summary ? '<div class="co-block">🧾 المجموع · الشحن <span class="num">' + (s.ship === 'early' ? '15' : '?') + '</span> ر.ق</div>' : '') + (s.ship === 'late' ? '<div class="co-block warn">⚠️ +25 ر.ق شحن</div>' : '') +
      (s.coupon === 'big' ? '<div class="co-block">🏷 أدخل الكوبون ____</div>' : '<div class="co-note">لديك كوبون؟ ▾</div>') +
      '<div class="co-pay">' + [['card', 'VISA'], ['debit', 'QPay'], ['wallet', 'Apple Pay'], ['cod', 'COD'], ['bnpl', 'تقسيط']].filter(([k]) => pays[k]).map(([, l]) => '<span>' + l + '</span>').join('') + '</div>' +
      '<div class="co-btn">ادفع الآن</div>' + (Object.keys(s.trust || {}).some(k => s.trust[k]) ? '<div class="co-note">🔒 دفع آمن · ↩ استرجاع · ☎ تواصل</div>' : '') + (s.upsell ? '<div class="co-pop">🎁 عرض خاص! لا تفوّت…</div>' : '') + '</div>';
    return '<div class="sim-live"><div class="sim-score"><div class="gauge" style="--p:' + r + '"><b class="num">' + r + '%</b></div><div><b>معدل الإتمام المتوقع</b><div class="muted" style="font-size:13px">من العملاء الذين يبدؤون الدفع · البداية <span class="num">' + CHECKOUT_BASE + '%</span></div></div></div>' + mock +
      '<ul class="sim-factors">' + fs.map(f => '<li class="' + (f.v > 0 ? 'up' : 'down') + '"><span class="num">' + (f.v > 0 ? '+' : '') + (Math.round(f.v * 10) / 10) + '</span>' + h(f.t) + '</li>').join('') + '</ul><div class="muted" style="font-size:12px">نموذج تعليمي تقريبي مبني على اتجاهات دراسات تجربة الدفع (مثل Baymard)، وليس توقعًا دقيقًا لمتجر بعينه.</div></div>';
  },
  summary(s) { return 'معدل إتمام متوقع ' + CheckoutSim.rate(s) + '%'; },
  metric(s) { return CheckoutSim.rate(s); }
};

// ================= 3) لعبة ميزانية التسويق =================
const BUDGET_TOTAL = 10000, BUDGET_AOV = 180, BUDGET_MARGIN = 0.35, BUDGET_REPEAT = 0.4;
const CHANNELS = [
  { k: 'meta', n: 'إعلانات إنستغرام وفيسبوك', cpc: 1.6, cr: 0.014, sat: 6000, newC: 0.85 },
  { k: 'google', n: 'إعلانات بحث وتسوق Google', cpc: 2.4, cr: 0.032, sat: 3500, newC: 0.8 },
  { k: 'tiktok', n: 'تيك توك وسناب شات', cpc: 0.9, cr: 0.008, sat: 5000, newC: 0.95 },
  { k: 'influ', n: 'مؤثرون محليون', cpc: 1.2, cr: 0.012, sat: 3000, newC: 0.9 },
  { k: 'market', n: 'إعلانات السوق الإلكتروني (Noon)', cpc: 1.1, cr: 0.045, sat: 2000, newC: 0.7 },
  { k: 'crm', n: 'رسائل للعملاء الحاليين (بريد/واتساب)', cpc: 0.35, cr: 0.06, sat: 800, newC: 0, cap: 800 },
  { k: 'content', n: 'محتوى وتحسين ظهور', cpc: 3.5, cr: 0.02, sat: 4000, newC: 0.9 }
];
const BudgetSim = {
  def() { const a = {}; CHANNELS.forEach(c => { a[c.k] = 0; }); return { alloc: a }; },
  spent(s) { return CHANNELS.reduce((t, c) => t + (+((s.alloc || {})[c.k]) || 0), 0); },
  calc(s) {
    const rows = CHANNELS.map(c => {
      const b = +((s.alloc || {})[c.k]) || 0; if (!b) return { c, b, clicks: 0, orders: 0, rev: 0, newC: 0 };
      const eff = b / (1 + b / c.sat); // عوائد متناقصة كلما زاد الإنفاق على القناة نفسها
      let clicks = eff / c.cpc; if (c.cap) clicks = Math.min(clicks, c.cap * 1.6);
      const orders = clicks * c.cr; return { c, b, clicks, orders, rev: orders * BUDGET_AOV, newC: orders * c.newC };
    });
    const spend = BudgetSim.spent(s), orders = rows.reduce((t, r) => t + r.orders, 0), rev = rows.reduce((t, r) => t + r.rev, 0), newC = rows.reduce((t, r) => t + r.newC, 0);
    const gross = rev * BUDGET_MARGIN - spend; const cac = newC ? spend / newC : 0; const roas = spend ? rev / spend : 0;
    const clv = BUDGET_AOV * BUDGET_MARGIN * (1 + BUDGET_REPEAT * 6); // قيمة تقريبية للعميل خلال سنة
    const futureValue = newC * clv * 0.5;
    return { rows, spend, orders, rev, newC, gross, cac, roas, clv, futureValue, score: Math.round(gross + futureValue) };
  },
  form(s, id, dis) {
    const sp = BudgetSim.spent(s); const left = BUDGET_TOTAL - sp;
    return '<div class="budget-left ' + (left < 0 ? 'over' : left === 0 ? 'done' : '') + '">المتبقي من الميزانية: <b class="num">' + QAR(left) + '</b> ر.ق من <span class="num">' + QAR(BUDGET_TOTAL) + '</span></div>' +
      CHANNELS.map(c => '<div class="budget-row"><label>' + h(c.n) + ' <b class="num" data-sim-out="alloc.' + c.k + '" data-ex="' + h(id) + '">' + QAR((s.alloc || {})[c.k] || 0) + '</b></label><input type="range" min="0" max="' + BUDGET_TOTAL + '" step="250" data-sim-f="alloc.' + c.k + '" data-ex="' + h(id) + '" value="' + ((s.alloc || {})[c.k] || 0) + '" ' + dis + '></div>').join('') +
      '<div class="muted" style="font-size:12.5px;margin-top:6px">المنتج: قهوة مختصة · متوسط الطلب <span class="num">' + BUDGET_AOV + '</span> ر.ق · الهامش <span class="num">35%</span> · <span class="num">40%</span> من العملاء يعيدون الشراء شهريًا · قائمة عملاء حاليين <span class="num">800</span> وافقوا على الرسائل.</div>';
  },
  live(s) {
    const r = BudgetSim.calc(s); const mx = Math.max(1, ...r.rows.map(x => x.orders));
    return '<div class="sim-live"><div class="kpi-grid"><div><span>الطلبات</span><b class="num">' + Math.round(r.orders) + '</b></div><div><span>الإيرادات</span><b class="num">' + QAR(r.rev) + '</b></div><div><span>العائد على الإنفاق</span><b class="num">' + r.roas.toFixed(2) + '</b></div><div><span>عملاء جدد</span><b class="num">' + Math.round(r.newC) + '</b></div><div><span>تكلفة الاستحواذ</span><b class="num">' + (r.cac ? QAR(r.cac) : '—') + '</b></div><div><span>ربح الشهر بعد الإعلان</span><b class="num ' + (r.gross < 0 ? 'neg' : '') + '">' + QAR(r.gross) + '</b></div></div>' +
      '<div class="bud-bars">' + r.rows.filter(x => x.b).map(x => '<div class="bud-bar"><span>' + h(x.c.n) + '</span><i style="width:' + (x.orders / mx * 100) + '%"></i><b class="num">' + Math.round(x.orders) + '</b></div>').join('') + '</div>' +
      '<div class="bud-score">🏆 نقاط الفريق = ربح الشهر + نصف قيمة العملاء الجدد خلال سنة = <b class="num">' + QAR(r.score) + '</b></div><div class="muted" style="font-size:12px">نموذج تعليمي مبسط بعوائد متناقصة لكل قناة: مضاعفة الإنفاق على قناة واحدة لا تضاعف نتائجها.</div></div>';
  },
  summary(s) { const r = BudgetSim.calc(s); return 'طلبات ' + Math.round(r.orders) + ' · عائد ' + r.roas.toFixed(2) + ' · نقاط ' + QAR(r.score); },
  metric(s) { return BudgetSim.calc(s).score; }
};

const SIMS = { store: StoreSim, checkout: CheckoutSim, budget: BudgetSim };
const Sims = {
  of(e) { return SIMS[e.sim] || StoreSim; },
  fmt(S, v) { return S.fmt ? S.fmt(v) : v + '%'; },
  mine(e) { const key = postKey(e); return key ? (Store.posts[e.id] || {})[key] : null; },
  // محاكيات التصنيف تُقفل بعد كشف المدرب
  locked(e) { return Sims.of(e).kind === 'classify' && isRevealed(e); },
  state(e) {
    const S = Sims.of(e); let st = UIState.sim && UIState.sim[e.id];
    if (!st) { UIState.sim = UIState.sim || {}; const post = Sims.mine(e); st = Object.assign(S.def(), post && post.state ? JSON.parse(JSON.stringify(post.state)) : {}); UIState.sim[e.id] = st; }
    return st;
  },
  html(e) {
    const S = Sims.of(e); const col = exColor(e); const reveal = isRevealed(e); const cls = S.kind === 'classify'; const locked = Sims.locked(e);
    const post = Sims.mine(e);
    // بعد الكشف يُعرض التصنيف المحفوظ نفسه مصحَّحًا (لا مسودة غير محفوظة)
    if (locked) { UIState.sim = UIState.sim || {}; UIState.sim[e.id] = Object.assign(S.def(), post && post.state ? JSON.parse(JSON.stringify(post.state)) : {}); }
    const can = Me.canPost() && (e.mode !== 'group' || Me.group() || Admin.ok()) && !locked; const dis = can ? '' : 'disabled';
    const s = Sims.state(e); const o = { reveal: cls && reveal };
    return '<div class="answer-box sim-box' + (cls ? ' cls-box' : '') + '" style="--ac:' + col + ';--acg:' + tint(col, .1) + '">' + (!Me.canPost() ? '<div class="locked-note">🔒 للمسجلين فقط — يمكنك التجربة بعد التسجيل.</div>' : e.mode === 'group' && !Me.group() && !Admin.ok() ? '<div class="locked-note">👆 اختر مجموعتك أولًا.</div>' : '') +
      (post ? '<div class="status-note" style="margin-bottom:6px">✅ آخر حفظ: ' + h(post.name || '') + ' · ' + ago(post.ts || 0) + (locked ? '' : ' — يمكنك التعديل والحفظ مجددًا.') + '</div>' : '') +
      '<div class="sim-grid"><div class="sim-form">' + S.form(s, e.id, dis, o) + '</div><div id="simLive-' + h(e.id) + '">' + S.live(s, o) + '</div></div>' +
      (locked ? '<div class="locked-note" style="margin-top:10px">🔒 كشف المدرب الإجابات — التصنيف مقفل ولا يمكن تعديله أو حفظه.</div>'
        : '<div class="save-row"><button class="btn btn-primary" data-act="sim-save" data-ex="' + h(e.id) + '" ' + dis + '>💾 حفظ ' + (cls ? 'التصنيف' : 'النتيجة') + (e.mode === 'group' ? ' للمجموعة' : '') + '</button><button class="btn btn-ghost btn-sm" data-act="sim-reset" data-ex="' + h(e.id) + '" ' + dis + '>↺ البدء من جديد</button></div>') + '</div>' +
      (reveal && S.optimal ? Sims.modelHtml(e) : '');
  },
  // «✅ الحل النموذجي»: نفس النموذج للقراءة فقط + نتيجته، مقارنة بنتيجة المتدرب
  modelHtml(e) {
    const S = Sims.of(e); const best = S.optimal(); if (!best) return '';
    const post = Sims.mine(e); const yours = post && post.state ? post.state : (UIState.sim || {})[e.id]; const mid = e.id + '__model';
    const bm = S.metric(best), ym = yours ? S.metric(yours) : null;
    const form = e.sim === 'store' ? StoreSim.steps.map((t, i) => '<div class="sim-ro-step"><b>' + (i + 1) + '. ' + h(t) + '</b>' + S.form(Object.assign({}, best, { step: i }), mid, 'disabled') + '</div>').join('') : S.form(best, mid, 'disabled');
    return '<section class="sim-model"><div class="feed-head"><h3>✅ الحل النموذجي</h3></div>' +
      '<div class="sim-cmp"><div><span>' + (e.mode === 'group' && !Admin.ok() ? 'نتيجة مجموعتك' : 'نتيجتك') + '</span><b class="num">' + (ym == null ? '—' : Sims.fmt(S, ym)) + '</b></div><div class="best"><span>الحل النموذجي</span><b class="num">' + Sims.fmt(S, bm) + '</b></div>' + (ym != null ? '<div><span>الفرق</span><b class="num">' + (ym >= bm ? '🎯 وصلت للأفضل' : Sims.fmt(S, Math.round((bm - ym) * 10) / 10)) + '</b></div>' : '') + '</div>' +
      '<div class="sim-grid sim-ro" inert><div class="sim-form">' + form + '</div><div>' + S.live(best, {}) + '</div></div>' +
      '<div class="muted sim-note">حُسب الحل بالبحث في كل التركيبات الممكنة داخل نموذج المحاكاة نفسه (ضمن القيود).</div></section>';
  },
  refresh(exId) { const e = Content.ex(exId); if (!e) return; const box = document.getElementById('simLive-' + exId); if (box) box.innerHTML = Sims.of(e).live(Sims.state(e), { reveal: Sims.of(e).kind === 'classify' && isRevealed(e) }); },
  rerender(exId) { const e = Content.ex(exId); const z = document.getElementById('simZone'); if (e && z) z.innerHTML = Sims.html(e); },
  set(exId, path, val) {
    const e = Content.ex(exId); if (!e || Sims.locked(e)) return; const S = Sims.of(e); const s = Sims.state(e); const [a, b] = path.split('.');
    if (S.coerce && !b) val = S.coerce(a, val);
    const prev = JSON.parse(JSON.stringify(s));
    if (b) { s[a] = Object.assign({}, s[a] || {}); s[a][b] = val; } else s[a] = val;
    // onSet: فرض القيود (سعة، ميزانية، مخاطرة) ثم إعادة الرسم
    const msg = S.check ? S.check(s) : '';
    if (msg) { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, prev); UI.toast(msg, 3500); Sims.rerender(exId); return; }
    if (e.sim === 'budget' && a === 'alloc') { // لا يتجاوز مجموع الميزانية 10,000
      const others = BudgetSim.spent(s) - (+s.alloc[b] || 0); if (others + (+val) > BUDGET_TOTAL) s.alloc[b] = Math.max(0, BUDGET_TOTAL - others);
      const inp = document.querySelector('[data-sim-f="alloc.' + b + '"][data-ex="' + CSS.escape(exId) + '"]'); if (inp && +inp.value !== s.alloc[b]) inp.value = s.alloc[b];
      const left = document.querySelector('.budget-left'); if (left) { const l = BUDGET_TOTAL - BudgetSim.spent(s); left.className = 'budget-left ' + (l === 0 ? 'done' : ''); left.querySelector('b').textContent = QAR(l); }
    }
    const ctl = S.cfg && S.cfg.controls ? S.cfg.controls.find(c => c.k === path) : null;
    $$('[data-sim-out="' + path + '"][data-ex="' + CSS.escape(exId) + '"]').forEach(o => { o.textContent = b && a === 'alloc' ? QAR(s.alloc[b]) : ctl && ctl.fmt ? ctl.fmt(val) : val; });
    $$('#simZone .sim-seg label').forEach(l => { const i = l.querySelector('input'); if (i) l.classList.toggle('on', i.checked); });
    Sims.refresh(exId);
  },
  pick(exId, i, v) { const e = Content.ex(exId); if (!e || Sims.locked(e) || !Me.canPost()) return; const s = Sims.state(e); s.a = Object.assign({}, s.a || {}); s.a[i] = s.a[i] === v ? null : v; if (!s.a[i]) delete s.a[i]; App.render(); },
  // o.public: عرض للجمهور (وضع العرض) — لا درجات ولا ترتيب لمحاكيات التصنيف قبل الكشف حتى للمدرب
  feed(e, o = {}) {
    const S = Sims.of(e); const ps = Store.posts[e.id] || {}; const myKey = Me.canPost() ? postKey(e) : null;
    const showScore = S.kind !== 'classify' || isRevealed(e) || (Admin.ok() && !o.public);
    const keys = Object.keys(ps).filter(k => ps[k] && ps[k].state).sort((a, b) => showScore ? (S.metric(ps[b].state) - S.metric(ps[a].state)) : ((ps[b].ts || 0) - (ps[a].ts || 0)));
    const del = k => Admin.ctl() && !o.public ? '<button class="del-btn" data-act="del-post" data-ex="' + h(e.id) + '" data-k="' + h(k) + '">🗑</button>' : '';
    if (!keys.length) return '<div class="feed"><div class="feed-head"><span class="live-dot"></span><h3>' + (e.mode === 'group' ? 'مقارنة المجموعات' : 'نتائج الجميع') + '</h3></div><div class="empty">لا توجد نتائج محفوظة بعد.</div></div>';
    if (e.sim === 'budget') {
      return '<div class="feed"><div class="feed-head"><span class="live-dot"></span><h3>🏆 لوحة مقارنة المجموعات</h3><span class="pill num">' + keys.length + '</span></div><div class="table-wrap"><table class="att-table bud-table"><thead><tr><th>#</th><th>' + (e.mode === 'group' ? 'المجموعة' : 'المشارك') + '</th><th>الطلبات</th><th>العائد</th><th>تكلفة الاستحواذ</th><th>الربح</th><th>النقاط</th><th></th></tr></thead><tbody>' +
        keys.map((k, i) => { const r = BudgetSim.calc(ps[k].state); return '<tr class="' + (k === myKey ? 'mine' : '') + '"><td class="num">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1) + '</td><td><b>' + h(k === ADMIN_ID ? ADMIN_NAME : /^g\d+$/.test(k) ? Groups.label(+k.slice(1)) : (ps[k].name || 'مشارك')) + '</b><div class="muted" style="font-size:11.5px">' + CHANNELS.filter(c => +ps[k].state.alloc[c.k]).map(c => c.n.split(' ')[0] + ' ' + QAR(ps[k].state.alloc[c.k])).join(' · ') + '</div></td><td class="num">' + Math.round(r.orders) + '</td><td class="num">' + r.roas.toFixed(2) + '</td><td class="num">' + (r.cac ? QAR(r.cac) : '—') + '</td><td class="num">' + QAR(r.gross) + '</td><td class="num"><b>' + QAR(r.score) + '</b></td><td>' + Likes.btn('posts/' + e.id + '/' + k, ps[k].likes) + del(k) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    }
    return '<div class="feed"><div class="feed-head"><span class="live-dot"></span><h3>نتائج الجميع</h3><span class="pill num">' + keys.length + '</span>' + (S.kind === 'classify' && !showScore ? '<span class="pill">🔒 النتائج بعد الكشف</span>' : '') + '</div><div class="posts">' + keys.map(k => { const p = ps[k]; const isG = e.mode === 'group' && k.charAt(0) === 'g'; const who = k === ADMIN_ID ? ADMIN_NAME : isG ? Groups.label(+k.slice(1)) : (p.name || '');
      return '<div class="post ' + (k === myKey ? 'mine' : '') + '"><div class="post-head"><span class="av">' + h(isG ? '👥' : initials(who)) + '</span><div><div class="who">' + h(who) + '</div><div class="role">' + h(isG ? 'كتبها: ' + (p.name || '') : (p.role || '')) + ' · ' + ago(p.ts || 0) + '</div></div><span class="grow"></span>' + (showScore ? '<span class="sim-badge num">' + h(Sims.fmt(S, S.metric(p.state))) + '</span>' : '') + '</div><div class="post-body">' + h(S.summary(p.state)) + '</div><div class="post-foot">' + Likes.btn('posts/' + e.id + '/' + k, p.likes) + del(k) + '</div></div>'; }).join('') + '</div></div>';
  },
  async save(exId) {
    const e = Content.ex(exId); const key = postKey(e); if (!key || !Me.canPost()) return; const S = Sims.of(e); const s = Sims.state(e); const me = Me.actor();
    if (Sims.locked(e)) { UI.alert('كشف المدرب الإجابات؛ لم يعد الحفظ متاحًا.'); return; }
    if (S.kind === 'classify' && !S.answered(s)) { UI.alert('صنّف بندًا واحدًا على الأقل قبل الحفظ.'); return; }
    if (e.sim === 'budget' && BudgetSim.spent(s) < BUDGET_TOTAL * 0.9) { if (!(await UI.confirm('لم توزعوا إلا ' + QAR(BudgetSim.spent(s)) + ' ر.ق من الميزانية. حفظ النتيجة رغم ذلك؟', { ok: 'حفظ' }))) return; }
    const upd = { state: JSON.parse(JSON.stringify(s)), metric: S.metric(s), summary: S.summary(s), name: me.name, role: me.role || '', ts: DB.now() };
    if (e.mode === 'group' && !Admin.ok()) { upd.group = Me.group(); upd.by = me.uid; upd['members/' + me.uid] = true; } else upd.uid = me.uid;
    await DB.update('posts/' + exId + '/' + key, upd); UI.toast('✅ ' + (S.kind === 'classify' ? 'حُفظ التصنيف' : 'حُفظت النتيجة')); App.render();
  }
};
document.addEventListener('input', ev => { const t = ev.target; const f = t.getAttribute && t.getAttribute('data-sim-f'); if (!f) return; const v = t.type === 'checkbox' ? t.checked : t.type === 'range' || t.type === 'number' ? (t.value === '' ? '' : +t.value) : t.value; Sims.set(t.getAttribute('data-ex'), f, v); });
document.addEventListener('change', ev => { const t = ev.target; const f = t.getAttribute && t.getAttribute('data-sim-f'); if (!f || t.type === 'range' || t.tagName === 'TEXTAREA' || t.type === 'text') return; if (t.type === 'radio' && !t.checked) return; const v = t.type === 'checkbox' ? t.checked : t.value; Sims.set(t.getAttribute('data-ex'), f, v); });

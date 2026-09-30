// ---------------------------------------------------------------------
// قوالب المحاكاة المشتركة + محاكاة لكل محور
//   factorSim  : إعدادات تضيف أو تطرح من نتيجة حية، مع معاينة وأثر كل عامل وعدّادات بقيود
//   classifySim: عناصر تُوضع في خانات؛ التصحيح وأسبابه لا يظهر إلا بعد كشف المدرب
// الحل النموذجي يُحسب بالبحث داخل نموذج المحاكاة نفسه (حصر شامل، أو صعود إحداثي إن كبرت المساحة).
// كل الأرقام نموذج تعليمي تقريبي لا توقع دقيق.
// ---------------------------------------------------------------------
const SIM_NOTE = '<div class="muted sim-note">⚖️ نموذج تعليمي تقريبي لتوضيح الاتجاهات والمفاضلات، وليس توقعًا دقيقًا لمشروع بعينه.</div>';
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const simGet = (s, path) => path.split('.').reduce((n, k) => (n == null ? undefined : n[k]), s);
function simSetPath(s, path, v) { const [a, b] = path.split('.'); if (b) { s[a] = Object.assign({}, s[a] || {}); s[a][b] = v; } else s[a] = v; }
const simClone = s => JSON.parse(JSON.stringify(s));
const rangeVals = (min, max, step) => { const o = []; for (let v = min; v <= max + 1e-9; v += step) o.push(Math.round(v * 100) / 100); return o; };

// البحث عن أفضل حالة: dom = [{ path, values }]، ev(s) = { score, ok, cost }
function simSearch(base, dom, ev) {
  let best = null, bestR = null;
  const better = r => r.ok !== false && (!bestR || r.score > bestR.score + 1e-9 || (Math.abs(r.score - bestR.score) <= 1e-9 && (r.cost || 0) < (bestR.cost || 0)));
  const total = dom.reduce((a, d) => a * d.values.length, 1);
  if (total <= 60000) {
    const idx = dom.map(() => 0); const s = simClone(base);
    for (let n = 0; n < total; n++) {
      dom.forEach((d, i) => simSetPath(s, d.path, d.values[idx[i]]));
      const r = ev(s); if (better(r)) { best = simClone(s); bestR = r; }
      for (let i = 0; i < idx.length; i++) { idx[i]++; if (idx[i] < dom[i].values.length) break; idx[i] = 0; }
    }
  } else { // صعود إحداثي: كل مرة نجرب كل قيم عامل واحد مع تثبيت البقية حتى لا يتحسن شيء
    let s = simClone(base); let r0 = ev(s); if (r0.ok !== false) { best = simClone(s); bestR = r0; }
    for (let pass = 0; pass < 8; pass++) {
      let moved = false;
      dom.forEach(d => d.values.forEach(v => { const t = simClone(best || s); simSetPath(t, d.path, v); const r = ev(t); if (better(r)) { best = t; bestR = r; moved = true; } }));
      if (!moved) break;
    }
  }
  return { s: best, r: bestR };
}

// ================= قالب «محاكي عوامل» =================
function factorSim(cfg) {
  const S = {
    kind: 'factor', cfg,
    def() { const o = {}; cfg.controls.forEach(c => { o[c.k] = c.def !== undefined ? c.def : c.type === 'cb' ? false : c.type === 'range' ? c.min : c.opts[0][0]; }); return o; },
    calc(s) {
      s = Object.assign(S.def(), s || {});
      if (cfg.calc) return cfg.calc(s);
      const fs = cfg.factors(s); const counters = cfg.counters ? cfg.counters(s) : [];
      return { score: Math.round(clampN(cfg.base + fs.reduce((a, f) => a + f.v, 0), cfg.min, cfg.max)), factors: fs, counters };
    },
    ok(r) { return (r.counters || []).every(c => c.max == null || c.v <= c.max + 1e-9); },
    fmt(v) { return cfg.fmt ? cfg.fmt(v) : QAR(v) + (cfg.unit || ''); },
    // قيد: يمنع تغييرًا يتجاوز حدود العدّادات (سعة/ميزانية/مخاطرة)
    check(s) { const r = S.calc(s); const c = (r.counters || []).find(x => x.max != null && x.v > x.max + 1e-9); return c ? '⛔ تجاوزت الحد: ' + c.t + ' (' + S.cfmt(c, c.v) + ' من ' + S.cfmt(c, c.max) + ')' : ''; },
    cfmt(c, v) { return (c.fmt ? c.fmt(v) : QAR(v)) + (c.unit || ''); },
    form(s, id, dis) {
      s = Object.assign(S.def(), s || {});
      return cfg.controls.map(c => {
        const v = s[c.k]; const name = h(id + '-' + c.k);
        if (c.type === 'cb') return '<label class="sim-cb fs-cb"><input type="checkbox" data-sim-f="' + c.k + '" data-ex="' + h(id) + '" ' + (v ? 'checked' : '') + ' ' + dis + '> <span>' + h(c.label) + (c.hint ? '<small>' + h(c.hint) + '</small>' : '') + '</span></label>';
        if (c.type === 'range') return '<div class="field"><label>' + h(c.label) + ': <b class="num" data-sim-out="' + c.k + '" data-ex="' + h(id) + '">' + (c.fmt ? c.fmt(v) : v) + '</b>' + (c.unit ? ' ' + h(c.unit) : '') + '</label><input type="range" min="' + c.min + '" max="' + c.max + '" step="' + (c.step || 1) + '" data-sim-f="' + c.k + '" data-ex="' + h(id) + '" value="' + v + '" ' + dis + '>' + (c.hint ? '<div class="muted fs-hint">' + h(c.hint) + '</div>' : '') + '</div>';
        return '<div class="field"><label>' + h(c.label) + '</label><div class="sim-seg">' + c.opts.map(([ov, ol]) => '<label class="' + (String(v) === String(ov) ? 'on' : '') + '"><input type="radio" name="' + name + '" data-sim-f="' + c.k + '" data-ex="' + h(id) + '" value="' + h(String(ov)) + '" ' + (String(v) === String(ov) ? 'checked' : '') + ' ' + dis + '>' + h(ol) + '</label>').join('') + '</div>' + (c.hint ? '<div class="muted fs-hint">' + h(c.hint) + '</div>' : '') + '</div>';
      }).join('');
    },
    // قيم الأشرطة رقمية، والأزرار المقطعية قد تكون أرقامًا: نعيدها لنوعها الأصلي
    coerce(k, v) { const c = cfg.controls.find(x => x.k === k); if (!c || c.type !== 'seg') return v; const o = c.opts.find(x => String(x[0]) === String(v)); return o ? o[0] : v; },
    live(s) {
      const r = S.calc(s); const pct = cfg.gauge ? clampN((r.score - cfg.min) / ((cfg.max - cfg.min) || 1) * 100, 0, 100) : null;
      const fs = (r.factors || []).filter(f => Math.abs(f.v) >= 0.05).sort((a, b) => b.v - a.v);
      return '<div class="sim-live"><div class="sim-score">' + (pct != null ? '<div class="gauge" style="--p:' + Math.round(pct) + '"><b class="num">' + S.fmt(r.score) + '</b></div>' : '<div class="sim-big num">' + S.fmt(r.score) + '</div>') +
        '<div><b>' + h(cfg.label) + '</b><div class="muted" style="font-size:13px">' + h(cfg.verdict ? cfg.verdict(r.score, r) : '') + '</div></div></div>' +
        (cfg.preview ? cfg.preview(Object.assign(S.def(), s || {}), r) : '') +
        ((r.counters || []).length ? '<div class="sim-counters">' + r.counters.map(c => { const p = c.max ? clampN(c.v / c.max * 100, 0, 100) : 0; return '<div class="sim-counter ' + (c.max != null && c.v > c.max ? 'over' : p >= 85 ? 'near' : '') + '"><span>' + h(c.t) + '</span>' + (c.max != null ? '<i><em style="width:' + p + '%"></em></i>' : '<i class="nobar"></i>') + '<b class="num">' + S.cfmt(c, c.v) + (c.max != null ? ' / ' + S.cfmt(c, c.max) : '') + '</b></div>'; }).join('') + '</div>' : '') +
        (fs.length ? '<ul class="sim-factors">' + fs.map(f => '<li class="' + (f.v > 0 ? 'up' : 'down') + '"><span class="num">' + (f.v > 0 ? '+' : '') + (cfg.ffmt ? cfg.ffmt(f.v) : Math.round(f.v * 10) / 10) + '</span>' + h(f.t) + '</li>').join('') + '</ul>' : '') + SIM_NOTE + '</div>';
    },
    summary(s) { return cfg.label + ': ' + S.fmt(S.calc(s).score); },
    metric(s) { return S.calc(s).score; },
    optimal() {
      if (S._best) return S._best;
      const dom = cfg.controls.map(c => ({ path: c.k, values: c.type === 'cb' ? [false, true] : c.type === 'range' ? rangeVals(c.min, c.max, c.step || 1) : c.opts.map(o => o[0]) }));
      const res = simSearch(S.def(), dom, st => { const r = S.calc(st); return { score: r.score, ok: S.ok(r), cost: (r.counters || []).reduce((a, c) => a + (+c.v || 0), 0) }; });
      return (S._best = res.s);
    }
  };
  return S;
}

// ================= قالب «محاكي تصنيف» =================
function classifySim(cfg) {
  const S = {
    kind: 'classify', cfg,
    def() { return { a: {} }; },
    answered(s) { const a = (s && s.a) || {}; return cfg.items.filter((_, i) => a[i]).length; },
    correct(s) { const a = (s && s.a) || {}; return cfg.items.filter((it, i) => a[i] === it.bin).length; },
    binLabel(k) { const b = cfg.bins.find(x => x[0] === k); return b ? b[1] : ''; },
    form(s, id, dis, o = {}) {
      const a = (s && s.a) || {};
      return '<div class="cls-bins-key">' + cfg.bins.map(b => '<span class="cls-key"><b>' + h(b[2] || '') + '</b> ' + h(b[1]) + '</span>').join('') + '</div>' +
        cfg.items.map((it, i) => {
          const v = a[i]; const ok = v === it.bin;
          return '<div class="cls-item' + (o.reveal ? (v ? (ok ? ' right' : ' wrong') : ' miss') : '') + '"><div class="cls-t"><span class="qn num">' + (i + 1) + '</span><span>' + h(it.t) + '</span></div><div class="cls-opts">' +
            cfg.bins.map(b => '<button class="cls-opt' + (v === b[0] ? ' sel' : '') + (o.reveal && b[0] === it.bin ? ' key' : '') + '" data-act="cls-pick" data-ex="' + h(id) + '" data-i="' + i + '" data-v="' + h(b[0]) + '" ' + dis + '>' + (b[2] ? '<b>' + h(b[2]) + '</b> ' : '') + h(b[1]) + '</button>').join('') + '</div>' +
            (o.reveal ? '<div class="cls-why">' + (v ? (ok ? '✅ صحيح' : '❌ اخترت «' + h(S.binLabel(v)) + '» — الأنسب: «' + h(S.binLabel(it.bin)) + '»') : '⬜ لم تصنّفه — الأنسب: «' + h(S.binLabel(it.bin)) + '»') + '<div class="muted">' + h(it.why) + '</div></div>' : '') + '</div>';
        }).join('');
    },
    live(s, o = {}) {
      const n = S.answered(s), N = cfg.items.length;
      return '<div class="sim-live"><div class="sim-score"><div class="gauge" style="--p:' + Math.round(n / N * 100) + '"><b class="num">' + n + '/' + N + '</b></div><div><b>' + (o.reveal ? 'نتيجتك: ' + S.correct(s) + ' من ' + N : 'صنّفت ' + n + ' من ' + N) + '</b><div class="muted" style="font-size:13px">' + (o.reveal ? 'كُشفت الإجابات — راجع سبب كل بند.' : 'يظهر التصحيح وأسبابه بعد أن يكشف المدرب الإجابات.') + '</div></div></div>' + (cfg.note ? '<div class="muted sim-note">' + h(cfg.note) + '</div>' : '') + '</div>';
    },
    // لا نسرّب النتيجة في الملخص؛ الدرجة في metric فقط
    summary(s) { return 'أجاب على ' + S.answered(s) + ' من ' + cfg.items.length; },
    metric(s) { return S.correct(s); },
    fmt(v) { return v + '/' + cfg.items.length; }
  };
  return S;
}

// =====================================================================
// محاكيات المحاور
// =====================================================================
// المحور 1: أين يبدأ هذا المشروع البيع؟
const ChannelFitSim = classifySim({
  bins: [['mkt', 'سوق إلكتروني (نون، أمازون)', '🏬'], ['own', 'متجر مستقل على منصة جاهزة', '🛍️'], ['social', 'تجارة اجتماعية (إنستغرام وواتساب)', '💬'], ['b2b', 'منصة بيع للشركات B2B', '🏭']],
  items: [
    { t: 'بائع إكسسوارات جوال بأسعار منافسة وبلا علامة معروفة، يريد مبيعات من الأسبوع الأول.', bin: 'mkt', why: 'السوق الإلكتروني يجلب مشترين يبحثون ويقارنون الأسعار الآن؛ بناء جمهور لمتجر مستقل يحتاج وقتًا وميزانية.' },
    { t: 'علامة عطور محلية بهوية قوية وعملاء يعودون، تريد تملك بيانات عملائها وتجربتهم.', bin: 'own', why: 'المتجر المستقل يمنح ملكية بيانات العملاء والهوية والتجربة، ويبني الولاء بعيدًا عن مقارنة الأسعار.' },
    { t: 'حلويات منزلية تُصنع بالطلب في مدينة واحدة، تبيع بالصور وتوصيات المعارف.', bin: 'social', why: 'منتج بصري وطلب محلي صغير يُباع بالمحادثة؛ التكلفة الأقل والتواصل المباشر أهم من متجر كامل في البداية.' },
    { t: 'مورّد مستلزمات تغليف للمطاعم والمقاهي بكميات كبيرة وأسعار متدرجة.', bin: 'b2b', why: 'المشتري شركة: طلبات كبيرة متكررة وأسعار حسب الكمية وفواتير وشروط دفع — وهذه طبيعة منصات B2B.' },
    { t: 'تاجر إلكترونيات يريد الوصول لمشترين في عدة دول خليجية دون بناء لوجستيات خاصة.', bin: 'mkt', why: 'الأسواق الكبرى تقدم الوصول لعدة دول مع التخزين والشحن والتحصيل جاهزًا.' },
    { t: 'مصنع أغذية يبيع للمتاجر والفنادق بعقود توريد شهرية.', bin: 'b2b', why: 'عقود توريد وحسابات شركات وطلبات دورية؛ الأدوات المناسبة هي كتالوج أسعار للشركات وطلبات متكررة.' },
    { t: 'مشروع شموع يدوية لم يختبر الطلب بعد، ويريد تجربة الفكرة بأقل تكلفة.', bin: 'social', why: 'اختبر الطلب أولًا بأقل تكلفة وجهد؛ حين تثبت المبيعات انتقل إلى متجر أو سوق.' },
    { t: 'متجر قهوة مختصة يعتمد على اشتراكات شهرية وبرنامج ولاء.', bin: 'own', why: 'الاشتراكات وبرامج الولاء تحتاج بيانات العميل وأدوات تحكم لا تتيحها الأسواق عادة.' }
  ],
  note: 'قد يجمع المشروع أكثر من قناة لاحقًا؛ المطلوب هنا نقطة البداية الأنسب.'
});

// المحور 3: مزيج وسائل الدفع (صافي الإيراد لكل 100 سلة تبدأ الدفع)
const PAY_AOV = 250;
const PayMixSim = factorSim({
  label: 'صافي الإيراد لكل 100 سلة تبدأ الدفع', unit: ' ر.ق',
  controls: [
    { k: 'gw', type: 'seg', label: 'مزوّد الدفع', opts: [['local', 'محلي (رسوم أقل، عملة واحدة)'], ['intl', 'دولي (عملات أكثر، رسوم أعلى)'], ['both', 'الاثنان معًا']] },
    { k: 'debit', type: 'cb', label: 'بطاقات الخصم المحلية', def: false },
    { k: 'card', type: 'cb', label: 'بطاقات الائتمان', def: true },
    { k: 'wallet', type: 'cb', label: 'المحافظ الرقمية (Apple Pay / Google Pay)' },
    { k: 'bnpl', type: 'cb', label: 'اشترِ الآن وادفع لاحقًا (تقسيط)' },
    { k: 'cod', type: 'cb', label: 'الدفع عند الاستلام' },
    { k: 'fx', type: 'cb', label: 'عرض الأسعار والدفع بعملات الخليج', hint: 'يحتاج مزوّدًا دوليًا' }
  ],
  calc(s) {
    const fs = []; const add = (v, t) => fs.push({ v, t });
    let p = 38; // نسبة الإتمام الأساسية
    if (s.card) { p += 10; add(10, 'بطاقات الائتمان'); }
    if (s.debit) { p += 12; add(12, 'بطاقات الخصم المحلية — أكثر وسيلة استخدامًا'); } else { p -= 6; add(-6, 'غياب بطاقات الخصم المحلية'); }
    if (s.wallet) { p += 6; add(6, 'المحافظ الرقمية تختصر الإدخال'); }
    if (s.bnpl) { p += 3; add(3, 'التقسيط لقيمة طلب مرتفعة نسبيًا'); }
    if (s.cod) { p += 5; add(5, 'الدفع عند الاستلام: طلبات إضافية ممن لا يدفع مسبقًا'); }
    const intl = s.gw !== 'local';
    if (s.fx && intl) { p += 4; add(4, 'عملاء الخليج يدفعون بعملتهم'); } else if (s.fx) add(0, 'العملات تحتاج مزوّدًا دوليًا — لا أثر');
    p = clampN(p, 5, 92);
    const fee = (s.gw === 'local' ? 1.9 : s.gw === 'intl' ? 3.1 : 2.3) + (s.bnpl ? 1.2 : 0) + (s.gw === 'both' ? 0.3 : 0); // % من الإيراد
    // الدفع عند الاستلام يجذب نحو 30% من الطلبات (بعضها كان سيدفع مسبقًا)، ويُرفض ربعها عند الباب: لا إيراد وشحن ذهابًا وإيابًا
    const codOrders = s.cod ? p * 0.3 : 0; const refused = codOrders * 0.25; const orders = p - refused;
    const codCost = codOrders * 7 + refused * 40;
    const gross = orders * PAY_AOV; const net = gross * (1 - fee / 100) - codCost - (s.gw === 'both' ? 120 : 0);
    add(-(gross * fee / 100) / PAY_AOV, 'رسوم المعالجة ' + fee.toFixed(1) + '%'); if (s.cod) { add(-refused, 'طلبات مرفوضة عند الباب (' + refused.toFixed(1) + ')'); add(-codCost / PAY_AOV, 'رسوم التحصيل وشحن المرفوضات'); } if (s.gw === 'both') add(-120 / PAY_AOV, 'تكلفة تشغيل مزوّدين');
    return { score: Math.round(net), factors: fs.filter(f => f.t), counters: [{ t: 'نسبة إتمام الدفع', v: Math.round(p), unit: '%' }, { t: 'متوسط الرسوم', v: Math.round(fee * 10) / 10, unit: '%', fmt: v => v.toFixed(1) }], p, fee };
  },
  ffmt: v => (Math.round(v * 10) / 10),
  verdict: (v, r) => 'يُتم الدفع ' + Math.round(r.p) + ' من كل 100 · متوسط الطلب ' + PAY_AOV + ' ر.ق',
  preview(s) { return '<div class="co-mock"><div class="co-pay">' + [['card', 'VISA'], ['debit', 'خصم محلي'], ['wallet', 'Apple Pay'], ['bnpl', 'تقسيط'], ['cod', 'عند الاستلام']].filter(([k]) => s[k]).map(([, l]) => '<span>' + l + '</span>').join('') + '</div>' + (s.fx && s.gw !== 'local' ? '<div class="co-note">💱 QAR · SAR · AED · KWD</div>' : '') + '<div class="co-btn">ادفع الآن</div></div>'; }
});

// المحور 5: مخطط المخزون — نقطة إعادة الطلب والكمية والمورّد على 60 يومًا
const INV_DEMAND = (() => { const d = []; let seed = 7; for (let i = 0; i < 60; i++) { seed = (seed * 9301 + 49297) % 233280; const noise = (seed / 233280 - 0.5) * 4; const weekend = (i % 7 === 5 || i % 7 === 6) ? 5 : 0; const promo = i >= 38 && i <= 44 ? 9 : 0; d.push(Math.max(0, Math.round(10 + weekend + promo + noise))); } return d; })();
function invRun(s) {
  const lead = s.sup === 'local' ? 2 : 9; const unitCost = s.sup === 'local' ? 54 : 50; const price = 90;
  let stock = 120, pending = [], sold = 0, lost = 0, orders = 0, hold = 0; const tl = [];
  for (let d = 0; d < 60; d++) {
    pending = pending.filter(o => { if (o.at === d) { stock += o.q; return false; } return true; });
    const dem = INV_DEMAND[d]; const sell = Math.min(stock, dem); sold += sell; lost += dem - sell; stock -= sell;
    if (stock <= s.rop && !pending.length) { pending.push({ at: d + lead, q: s.qty }); orders++; }
    hold += stock; tl.push({ stock, out: dem > sell });
  }
  const profit = sold * (price - unitCost) - hold * 0.35 - orders * 150;
  return { sold, lost, orders, hold, tl, profit, lead, unitCost };
}
const InventorySim = factorSim({
  label: 'صافي الربح خلال 60 يومًا', unit: ' ر.ق',
  controls: [
    { k: 'sup', type: 'seg', label: 'المورّد', opts: [['import', 'استيراد (أرخص، التوريد 9 أيام)'], ['local', 'محلي (أغلى 8%، التوريد يومان)']] },
    { k: 'rop', type: 'range', label: 'نقطة إعادة الطلب', min: 0, max: 200, step: 10, unit: 'وحدة', def: 30, hint: 'حين ينخفض المخزون إلى هذا الرقم نطلب دفعة جديدة' },
    { k: 'qty', type: 'range', label: 'كمية كل طلب توريد', min: 50, max: 500, step: 50, unit: 'وحدة', def: 100 }
  ],
  calc(s) {
    const r = invRun(s);
    return { score: Math.round(r.profit), r, factors: [{ v: r.sold * (90 - r.unitCost) / 100, t: 'ربح المبيعات (' + r.sold + ' وحدة)' }, { v: -r.hold * 0.35 / 100, t: 'تكلفة التخزين' }, { v: -r.orders * 150 / 100, t: 'تكلفة ' + r.orders + ' طلبات توريد' }, { v: -r.lost * (90 - r.unitCost) / 100, t: 'مبيعات ضائعة بنفاد المخزون (' + r.lost + ' وحدة)' }],
      counters: [{ t: 'أيام نفاد المخزون', v: r.tl.filter(x => x.out).length, unit: ' يوم' }] };
  },
  ffmt: v => (v > 0 ? '' : '') + QAR(v * 100),
  verdict: (v, r) => r.r.lost ? 'ضاع ' + r.r.lost + ' وحدة من الطلب بسبب النفاد' : 'لا مبيعات ضائعة — راقب تكلفة التخزين',
  preview(s, r) { const tl = r.r.tl; const mx = Math.max(1, ...tl.map(x => x.stock)); return '<div class="inv-tl" aria-label="مستوى المخزون يوميًا">' + tl.map((x, i) => '<i class="' + (x.out ? 'out' : '') + (i >= 38 && i <= 44 ? ' promo' : '') + '" style="height:' + Math.max(3, x.stock / mx * 100) + '%" title="يوم ' + (i + 1) + ': ' + x.stock + '"></i>').join('') + '</div><div class="muted inv-leg"><span><i class="k"></i> المخزون اليومي</span><span><i class="k out"></i> يوم نفاد</span><span><i class="k promo"></i> أسبوع العرض</span></div>'; }
});

// المحور 6: اختر نمط الشحن الدولي
const CrossBorderSim = classifySim({
  bins: [['express', 'شحن سريع لكل طلب', '✈️'], ['eco', 'شحن اقتصادي مجمّع', '🚢'], ['local', 'مخزون في السوق الهدف', '🏢'], ['hold', 'توقّف وراجع المتطلبات أولًا', '⛔']],
  items: [
    { t: 'طلبات متفرقة لساعات فاخرة، قيمة الطلب مرتفعة والعميل ينتظر خلال 3 أيام.', bin: 'express', why: 'القيمة العالية تتحمل تكلفة السرعة، والتتبع والتأمين أهم للعميل.' },
    { t: 'منتجات منزلية ثقيلة ورخيصة، 300 طلب شهريًا ثابتة إلى السعودية.', bin: 'local', why: 'الطلب الثابت والوزن الثقيل يجعلان الشحن لكل طلب مكلفًا؛ مخزون هناك يقلل التكلفة ويسرّع التوصيل.' },
    { t: 'عينات لمعرض تجاري بعد شهرين.', bin: 'eco', why: 'لا استعجال: الشحن المجمّع أرخص ويترك وقتًا كافيًا للتخليص.' },
    { t: 'مستحضر تجميل قد يحتاج تسجيلًا لدى جهة الغذاء والدواء في بلد العميل.', bin: 'hold', why: 'بعض الفئات مقيدة أو تحتاج تسجيلًا مسبقًا؛ الشحن قبل التحقق يعني احتجازًا أو إعادة أو غرامات.' },
    { t: 'أول 20 طلبًا من الكويت لمنتج لم يُختبر هناك بعد.', bin: 'express', why: 'اختبار السوق بطلبات قليلة لا يبرر مخزونًا هناك؛ الشحن لكل طلب يكشف الطلب دون التزام.' },
    { t: 'بطاريات ليثيوم منفصلة (غير مركبة داخل جهاز).', bin: 'hold', why: 'بضائع خطرة لها قيود تغليف وتوثيق ونقل خاصة، ويرفضها كثير من الناقلين.' },
    { t: 'قطع غيار بسيطة يطلبها عملاء في عُمان بشكل متقطع ولا يستعجلونها.', bin: 'eco', why: 'طلب متقطع غير مستعجل: التجميع الاقتصادي يحمي الهامش.' },
    { t: 'متجر ملابس يبيع 1500 طلب شهريًا في الإمارات ويعاني مرتجعات مقاسات كثيرة.', bin: 'local', why: 'المرتجعات العابرة للحدود بطيئة ومكلفة؛ مخزون ومرتجعات محلية تحمي الهامش وتجربة العميل.' }
  ],
  note: 'القرار يوازن بين القيمة والوزن والاستعجال وحجم الطلب والقيود التنظيمية.'
});

// المحور 7: صفحة منتج في السوق الإلكتروني (ربح شهري متوقع)
const ListingSim = factorSim({
  label: 'الربح الشهري المتوقع من المنتج', unit: ' ر.ق',
  controls: [
    { k: 'title', type: 'seg', label: 'عنوان المنتج', opts: [['brand', 'اسم العلامة فقط'], ['stuffed', 'كلمات مفتاحية مكررة'], ['formula', 'العلامة + النوع + الخاصية + الحجم']] },
    { k: 'imgs', type: 'range', label: 'عدد الصور', min: 1, max: 8, step: 1, def: 2 },
    { k: 'white', type: 'cb', label: 'الصورة الرئيسية بخلفية بيضاء نظيفة' },
    { k: 'video', type: 'cb', label: 'فيديو قصير للمنتج' },
    { k: 'bullets', type: 'range', label: 'نقاط البيع', min: 0, max: 5, step: 1, def: 1 },
    { k: 'price', type: 'seg', label: 'السعر مقارنة بالمنافسين', opts: [['high', 'أعلى 10%'], ['same', 'مماثل'], ['low5', 'أقل 5%'], ['low15', 'أقل 15%']], def: 'same' },
    { k: 'reviews', type: 'cb', label: 'طلب التقييمات والرد عليها بانتظام' },
    { k: 'fbm', type: 'cb', label: 'التخزين والشحن عبر السوق (شارة توصيل سريع)', hint: 'رسوم تنفيذ على كل وحدة' },
    { k: 'stuff', type: 'cb', label: 'تكرار الكلمات المفتاحية في الوصف والكلمات المخفية' }
  ],
  calc(s) {
    const fs = []; const vis = { brand: 0.6, stuffed: 0.75, formula: 1 }[s.title] * (s.fbm ? 1.25 : 1) * (s.stuff ? 0.6 : 1);
    const pr = { high: [0.8, 0.85, 13], same: [1, 1, 0], low5: [1.12, 1.06, -6.5], low15: [1.2, 1.1, -19.5] }[s.price];
    const ctr = 0.03 * (s.white ? 1.2 : 1) * pr[0] * (s.reviews ? 1.15 : 1);
    const cvr = 0.09 * Math.min(1, 0.55 + s.imgs * 0.07) * (s.video ? 1.08 : 1) * (0.8 + s.bullets * 0.05) * pr[1] * (s.reviews ? 1.12 : 1);
    const units = 20000 * vis * ctr * cvr; const margin = 40 + pr[2] - (s.fbm ? 6 : 0) - (s.reviews ? 0.5 : 0);
    const profit = units * margin;
    fs.push({ v: (vis - 1) * 100, t: 'الظهور في البحث: ' + Math.round(vis * 100) + '%' + (s.stuff ? ' (عقوبة تكرار الكلمات)' : '') });
    fs.push({ v: (ctr / 0.03 - 1) * 100, t: 'نسبة النقر على المنتج' });
    fs.push({ v: (cvr / 0.09 - 1) * 100, t: 'التحويل داخل الصفحة' });
    fs.push({ v: margin - 40, t: 'الهامش لكل وحدة: ' + margin.toFixed(1) + ' ر.ق' });
    return { score: Math.round(profit), factors: fs, counters: [{ t: 'وحدات مباعة شهريًا', v: Math.round(units) }], units, margin };
  },
  ffmt: v => Math.round(v) + '%',
  verdict: (v, r) => Math.round(r.units) + ' وحدة شهريًا · هامش ' + r.margin.toFixed(1) + ' ر.ق للوحدة',
  preview(s) { return '<div class="pp-mock lst-mock"><div class="pp-img ' + (s.white ? 'clean' : 'life') + '"><span class="pp-prod">🎧</span>' + (s.fbm ? '<span class="lst-badge">🚀 توصيل سريع</span>' : '') + '</div><div class="pp-body"><div class="pp-title">' + ({ brand: 'نوفا', stuffed: 'سماعات سماعة بلوتوث سماعات لاسلكية سماعة', formula: 'نوفا — سماعات لاسلكية بعزل ضوضاء، بطارية 30 ساعة، أسود' })[s.title] + '</div><div class="lst-meta">' + (s.reviews ? '★★★★☆ <span class="num">(214)</span>' : '★★★☆☆ <span class="num">(9)</span>') + ' · ' + s.imgs + ' صور' + (s.video ? ' · ▶︎ فيديو' : '') + '</div>' + (s.bullets ? '<ul class="pp-bl">' + ['عزل ضوضاء نشط', 'بطارية 30 ساعة', 'شحن سريع USB‑C', 'مقاومة للرذاذ', 'ضمان سنتين'].slice(0, s.bullets).map(b => '<li>' + b + '</li>').join('') + '</ul>' : '') + '</div></div>'; }
});

// المحور 9: مدير أولويات الأتمتة (سعة 6 دورات تطوير)
const AUTO_ITEMS = [
  { k: 'sync', t: 'ربط المخزون تلقائيًا بين المتجر والسوق الإلكتروني', c: 2, v: 8, n: 'يمنع البيع دون مخزون' },
  { k: 'notify', t: 'رسائل تأكيد الطلب والتتبع تلقائيًا', c: 1, v: 5, n: 'يقلل أسئلة «أين طلبي؟»' },
  { k: 'faq', t: 'ردود جاهزة للأسئلة المتكررة في واتساب', c: 1, v: 4 },
  { k: 'books', t: 'فواتير وقيود محاسبية تلقائية', c: 2, v: 3 },
  { k: 'bot', t: 'روبوت يرد على كل الشكاوى دون تدخل بشري', c: 2, v: -2, n: 'يوفر وقتًا لكنه يخسر عملاء غاضبين' },
  { k: 'report', t: 'تقرير مبيعات أسبوعي تلقائي', c: 1, v: 1.5 },
  { k: 'low', t: 'تنبيه تلقائي عند انخفاض المخزون', c: 1, v: 3 },
  { k: 'reco', t: 'توصيات منتجات بالذكاء الاصطناعي', c: 3, v: 3.5 },
  { k: 'cart', t: 'رسائل تلقائية للسلات المتروكة', c: 1, v: 4.5 }
];
const AUTO_CAP = 6;
const AutomationSim = factorSim({
  label: 'الأثر الأسبوعي (ساعات موفرة + أثر المبيعات)', unit: ' س',
  fmt: v => (Math.round(v * 10) / 10) + ' س',
  controls: AUTO_ITEMS.map(x => ({ k: x.k, type: 'cb', label: x.t + ' — ' + x.c + (x.c === 1 ? ' دورة' : ' دورات'), hint: x.n })),
  calc(s) {
    const on = AUTO_ITEMS.filter(x => s[x.k]); const used = on.reduce((a, x) => a + x.c, 0);
    const syn = s.sync && s.low ? 1 : 0; // التنبيه مع الربط أفضل من كل منهما منفردًا
    const val = on.reduce((a, x) => a + x.v, 0) + syn;
    return { score: Math.round(val * 10) / 10, factors: on.map(x => ({ v: x.v, t: x.t })).concat(syn ? [{ v: 1, t: 'تكامل الربط مع تنبيه المخزون' }] : []), counters: [{ t: 'دورات التطوير المستخدمة', v: used, max: AUTO_CAP }] };
  },
  verdict: (v, r) => 'السعة المتاحة ' + AUTO_CAP + ' دورات تطوير هذا الربع',
  ffmt: v => Math.round(v * 10) / 10
});

// المحور 10: أتمت أم وثّق أم أسند أم تبقى قرارًا للمالك؟
const SopSim = classifySim({
  bins: [['auto', 'أتمتة', '⚙️'], ['sop', 'إجراء قياسي موثّق (SOP)', '📋'], ['out', 'إسناد لشريك', '🤝'], ['owner', 'قرار يبقى لدى المالك', '🧭']],
  items: [
    { t: 'إرسال رسالة تأكيد الطلب ورقم التتبع لكل عميل.', bin: 'auto', why: 'متكررة بقواعد ثابتة وحجم كبير — مثال مثالي للأتمتة.' },
    { t: 'تجهيز الطلب وتغليفه قبل تسليمه للمندوب.', bin: 'sop', why: 'عمل يدوي متكرر يجب أن يخرج بالجودة نفسها أيًّا كان الموظف: خطوات وصور مرجعية.' },
    { t: 'التعامل مع شكوى عميل غاضب وتعويضه.', bin: 'sop', why: 'يحتاج حكمًا بشريًا داخل إطار واضح: صلاحيات تعويض محددة وخطوات تصعيد.' },
    { t: 'اختيار السوق التالي للتوسع.', bin: 'owner', why: 'قرار استراتيجي نادر وبعيد الأثر.' },
    { t: 'تخزين وشحن 2000 طلب شهريًا في موسم الذروة.', bin: 'out', why: 'الحجم المتذبذب والتخصص اللوجستي يجعلان الشريك (3PL) أكفأ من بناء القدرة داخليًا.' },
    { t: 'تحديث المخزون بين المتجر والسوق الإلكتروني بعد كل بيع.', bin: 'auto', why: 'تكرار عالٍ وخطأ الإدخال اليدوي مكلف (بيع دون مخزون).' },
    { t: 'تصوير المنتجات الجديدة باحتراف كل شهر.', bin: 'out', why: 'مهارة متخصصة غير يومية؛ الإسناد أسرع وأجود.' },
    { t: 'اعتماد تغيير الأسعار بأكثر من 20%.', bin: 'owner', why: 'يمس الهامش وصورة العلامة؛ يبقى قرارًا للمالك مع بيانات داعمة.' }
  ],
  note: 'القاعدة: كرّر وقِس ← أتمت · تكرّر ويحتاج حكمًا ← وثّق · تخصص غير يومي ← أسند · نادر ومصيري ← المالك.'
});

// المحور 11: القمع — أين أكبر تسرّب؟ (3 رموز تحسين)
const FUNNEL = [
  { k: 'f1', t: 'زيارة ← مشاهدة منتج', r: 0.42, bm: 0.55 },
  { k: 'f2', t: 'مشاهدة ← إضافة للسلة', r: 0.085, bm: 0.10 },
  { k: 'f3', t: 'السلة ← بدء الدفع', r: 0.50, bm: 0.55 },
  { k: 'f4', t: 'بدء الدفع ← شراء', r: 0.32, bm: 0.55 }
];
const FUNNEL_VISITS = 30000, FUNNEL_TOKENS = 3;
function funnelRates(s) { return FUNNEL.map(f => { const n = +s[f.k] || 0; let r = f.r; for (let i = 0; i < n; i++) r += (f.bm - r) * 0.45; return r; }); }
const FunnelSim = factorSim({
  label: 'الطلبات الشهرية', unit: ' طلب',
  controls: FUNNEL.map(f => ({ k: f.k, type: 'range', label: 'رموز تحسين: ' + f.t, min: 0, max: FUNNEL_TOKENS, step: 1, def: 0 })),
  calc(s) {
    const rs = funnelRates(s); const base = FUNNEL.reduce((a, f) => a * f.r, FUNNEL_VISITS); const orders = rs.reduce((a, r) => a * r, FUNNEL_VISITS);
    const used = FUNNEL.reduce((a, f) => a + (+s[f.k] || 0), 0);
    return { score: Math.round(orders), rs, base, factors: FUNNEL.map((f, i) => ({ v: (rs[i] - f.r) * 100, t: f.t + ': ' + (rs[i] * 100).toFixed(1) + '%' })), counters: [{ t: 'رموز التحسين', v: used, max: FUNNEL_TOKENS }] };
  },
  ffmt: v => '+' + (Math.round(v * 10) / 10) + ' نقطة',
  verdict: (v, r) => 'بدون تحسين: ' + Math.round(r.base) + ' طلب · كل رمز يغلق 45% من الفجوة مع المعيار',
  preview(s, r) { let n = FUNNEL_VISITS; const rows = [['زيارات', n]]; FUNNEL.forEach((f, i) => { n = n * r.rs[i]; rows.push([f.t.split('← ')[1], n]); }); return '<div class="fn-mock">' + rows.map((x, i) => '<div class="fn-row"><span>' + h(x[0]) + '</span><i style="width:' + Math.max(2, Math.sqrt(x[1] / FUNNEL_VISITS) * 100) + '%"></i><b class="num">' + QAR(x[1]) + '</b>' + (i ? '<small class="num">' + (r.rs[i - 1] * 100).toFixed(1) + '% · المعيار ' + (FUNNEL[i - 1].bm * 100) + '%</small>' : '') + '</div>').join('') + '</div>'; }
});

// المحور 12: خطة النمو — السوق والقناة والسرعة ضمن حدود النقد والمخاطرة
const GROW_CASH = 250, GROW_RISK = 60;
const GrowthSim = factorSim({
  label: 'نمو الإيراد المتوقع خلال 12 شهرًا', unit: '%', fmt: v => '+' + v + '%',
  controls: [
    { k: 'mkt', type: 'seg', label: 'وجهة النمو', opts: [['deep', 'تعميق السوق المحلي (فئات جديدة)'], ['ksa', 'السعودية أولًا'], ['gcc', 'كل الخليج دفعة واحدة'], ['eu', 'أوروبا مباشرة']] },
    { k: 'ch', type: 'seg', label: 'القناة في السوق الجديد', opts: [['mkt', 'سوق إلكتروني'], ['own', 'متجر مستقل'], ['both', 'الاثنان']] },
    { k: 'pace', type: 'seg', label: 'السرعة', opts: [['pilot', 'تجربة صغيرة ثم توسع'], ['fast', 'إطلاق واسع فوري']] },
    { k: 'loc', type: 'cb', label: 'توطين كامل (لغة وعملة ودفع محلي)' },
    { k: 'tpl', type: 'cb', label: 'شريك لوجستي في السوق الهدف' },
    { k: 'fund', type: 'cb', label: 'الاستفادة من برنامج دعم أو تمويل' }
  ],
  calc(s) {
    const M = { deep: [18, 40, 12], ksa: [45, 110, 30], gcc: [55, 280, 70], eu: [35, 260, 75] }[s.mkt]; // نمو، نقد (ألف ر.ق)، مخاطرة
    const nMk = s.mkt === 'gcc' ? 3 : 1; // تكلفة التوطين والشريك تتضاعف مع عدد الأسواق
    let g = M[0], cash = M[1], risk = M[2]; const fs = [{ v: M[0], t: 'إمكانات السوق المختار' }];
    const ch = { mkt: [0, -20, -8], own: [-6, 20, 6], both: [-2, 35, 4] }[s.ch]; g += ch[0]; cash += ch[1]; risk += ch[2]; fs.push({ v: ch[0], t: s.ch === 'mkt' ? 'السوق الإلكتروني يختصر بناء الجمهور' : s.ch === 'own' ? 'متجر مستقل يحتاج بناء جمهور من الصفر' : 'قناتان في سوق جديد: تشتيت للجهد' });
    if (s.pace === 'fast') { g += 3; cash += 60; risk += 22; fs.push({ v: 3, t: 'إطلاق واسع: وصول أسرع بأخطاء أغلى ومخاطرة أعلى' }); } else { g += 5; risk -= 6; fs.push({ v: 5, t: 'تجربة صغيرة تكشف ما يلزم تعديله قبل التوسع' }); }
    const abroad = s.mkt !== 'deep';
    if (s.loc) { if (abroad) { g += 12; cash += 15 * nMk; risk -= 8; fs.push({ v: 12, t: 'التوطين يرفع التحويل ويخفض المرتجعات' }); } else { cash += 5; fs.push({ v: 0, t: 'التوطين لا يضيف في السوق المحلي' }); } }
    else if (abroad) { g -= 10; fs.push({ v: -10, t: 'غياب التوطين يضعف التحويل' }); }
    if (s.tpl) { if (abroad) { g += 8; cash += 10 * nMk + (nMk > 1 ? 10 : 0); risk -= 10; fs.push({ v: 8, t: 'شريك لوجستي محلي: توصيل أسرع ومرتجعات أسهل' }); } else { cash += 10; fs.push({ v: 0, t: 'الشريك اللوجستي الخارجي لا يلزم محليًا' }); } }
    else if (abroad) { g -= 8; fs.push({ v: -8, t: 'الشحن من الداخل: توصيل أبطأ ومرتجعات أصعب' }); }
    if (s.fund) { cash -= 80; risk -= 4; fs.push({ v: 0, t: 'برنامج الدعم يخفف الضغط على النقد' }); }
    return { score: Math.round(g), factors: fs, counters: [{ t: 'النقد المطلوب', v: Math.max(0, cash), max: GROW_CASH, unit: ' ألف ر.ق' }, { t: 'درجة المخاطرة', v: clampN(risk, 0, 100), max: GROW_RISK }] };
  },
  verdict: () => 'حدود الخطة: نقد ' + GROW_CASH + ' ألف ر.ق · مخاطرة ' + GROW_RISK + ' كحد أقصى'
});

// المحور 13: رادار الانحرافات — حساسية تنبيهات المساعد الذكي على بيانات 30 يومًا
const RADAR_DAYS = (() => { const v = []; let seed = 11; const anomalies = { 9: 0.45, 17: 1.85, 23: 0.55 }; for (let d = 0; d < 30; d++) { seed = (seed * 9301 + 49297) % 233280; const noise = 1 + (seed / 233280 - 0.5) * 0.14; const weekend = (d % 7 === 5 || d % 7 === 6) ? 1.45 : 1; v.push(Math.round(100 * weekend * (1 + d * 0.004) * noise * (anomalies[d] || 1))); } return { v, anomalies: Object.keys(anomalies).map(Number) }; })();
function radarRun(s) {
  const v = RADAR_DAYS.v; const out = [];
  for (let d = 1; d < 30; d++) {
    let base = null;
    if (s.base === 'yday') base = v[d - 1];
    else if (s.base === 'week') { const prev = [d - 7, d - 14, d - 21].filter(x => x >= 0).map(x => v[x]); if (prev.length) base = prev.sort((a, b) => a - b)[Math.floor(prev.length / 2)]; }
    else { const w = v.slice(Math.max(0, d - 7), d); base = w.reduce((a, x) => a + x, 0) / w.length; }
    if (base == null) continue; const dev = Math.abs(v[d] - base) / base * 100;
    if (dev >= s.thr) out.push({ d, real: RADAR_DAYS.anomalies.indexOf(d) > -1 });
  }
  const tp = out.filter(x => x.real).length, fp = out.length - tp, miss = RADAR_DAYS.anomalies.length - tp;
  return { alerts: out, tp, fp, miss, score: tp * 10 - fp * 4 - miss * 6 };
}
const RadarSim = factorSim({
  label: 'جودة التنبيهات', unit: ' نقطة', fmt: v => v + ' نقطة',
  controls: [
    { k: 'base', type: 'seg', label: 'يقارن كل يوم بـ', opts: [['yday', 'اليوم السابق'], ['avg7', 'متوسط آخر 7 أيام'], ['week', 'اليوم نفسه في الأسابيع السابقة']] },
    { k: 'thr', type: 'range', label: 'حد التنبيه (انحراف %)', min: 10, max: 80, step: 5, def: 15 }
  ],
  calc(s) {
    const r = radarRun(s);
    return { score: r.score, r, factors: [{ v: r.tp * 10, t: 'إنذار صحيح (' + r.tp + ') ×10' }, { v: -r.fp * 4, t: 'إنذار كاذب (' + r.fp + ') ×4' }, { v: -r.miss * 6, t: 'حدث فائت (' + r.miss + ') ×6' }], counters: [{ t: 'تنبيهات أُرسلت لك', v: r.alerts.length }] };
  },
  ffmt: v => (v > 0 ? '+' : '') + v,
  verdict: (v, r) => r.r.tp + ' من ' + RADAR_DAYS.anomalies.length + ' أحداث حقيقية · ' + r.r.fp + ' إنذار كاذب',
  preview(s, r) { const v = RADAR_DAYS.v; const mx = Math.max(...v); const al = {}; r.r.alerts.forEach(a => { al[a.d] = a.real ? 'tp' : 'fp'; }); return '<div class="rd-chart">' + v.map((x, d) => '<i class="' + (al[d] || '') + ((d % 7 === 5 || d % 7 === 6) ? ' we' : '') + (RADAR_DAYS.anomalies.indexOf(d) > -1 && !al[d] ? ' missed' : '') + '" style="height:' + (x / mx * 100) + '%" title="يوم ' + (d + 1) + '"></i>').join('') + '</div><div class="muted inv-leg"><span><i class="k tp"></i> إنذار صحيح</span><span><i class="k fp"></i> إنذار كاذب</span><span><i class="k missed"></i> حدث فائت</span><span><i class="k we"></i> نهاية الأسبوع</span></div>'; }
});

Object.assign(SIMS, { channel: ChannelFitSim, paymix: PayMixSim, inventory: InventorySim, crossborder: CrossBorderSim, listing: ListingSim, automation: AutomationSim, sop: SopSim, funnel: FunnelSim, growth: GrowthSim, radar: RadarSim });
Object.assign(SIM_TYPES, { channel: 'أين يبدأ المشروع البيع؟ (تصنيف)', paymix: 'مزيج وسائل الدفع', inventory: 'مخطط المخزون', crossborder: 'نمط الشحن الدولي (تصنيف)', listing: 'صفحة منتج في السوق', automation: 'مدير أولويات الأتمتة', sop: 'أتمت أم وثّق أم أسند؟ (تصنيف)', funnel: 'القمع: أكبر تسرّب', growth: 'خطة النمو', radar: 'رادار الانحرافات' });

// ---- الحل النموذجي للمحاكيات القائمة (بالبحث داخل نموذج كل منها) ----
CheckoutSim.kind = 'factor';
CheckoutSim.optimal = function () {
  if (this._best) return this._best;
  const b = ['card', 'debit', 'wallet', 'cod', 'bnpl'].map(k => ({ path: 'pay.' + k, values: [false, true] })).concat(['badges', 'returns', 'contact'].map(k => ({ path: 'trust.' + k, values: [false, true] })), ['progress', 'autofill', 'summary', 'inlineErr', 'upsell'].map(k => ({ path: k, values: [false, true] })));
  const dom = [{ path: 'account', values: ['forced', 'optional', 'guest'] }, { path: 'fields', values: rangeVals(5, 18, 1) }, { path: 'ship', values: ['late', 'early'] }, { path: 'coupon', values: ['big', 'collapsed'] }].concat(b);
  const r = simSearch(CheckoutSim.def(), dom, s => ({ score: CheckoutSim.rate(s) + CheckoutSim.factors(s).reduce((a, f) => a + f.v, 0) / 1000, ok: true, cost: -(+s.fields) })); // الكسر يفضّل الأعلى قبل القص عند 88%
  return (this._best = r.s);
};
StoreSim.kind = 'factor';
StoreSim.optimal = function () {
  if (this._best) return this._best;
  const base = Object.assign(StoreSim.def(), { name: 'دار المسك', title: 'دار المسك — عطر عود طبيعي للرجال، ثبات طويل، 100 مل', price: 250, sku: 'MSK-OUD-100', variants: '50 مل، 100 مل', bullets: 'ثبات يدوم طوال اليوم\nعود طبيعي من مصادر موثوقة\nعبوة هدية جاهزة', freeFrom: 200, returns: 14 });
  const dom = [{ path: 'lang', values: ['ar', 'en', 'both'] }, { path: 'img', values: ['clean', 'life', 'both'] }, { path: 'shipShow', values: ['late', 'early'] }].concat(['debit', 'card', 'wallet', 'cod', 'bnpl'].map(k => ({ path: 'pay.' + k, values: [false, true] })), ['privacy', 'licence', 'domain', 'tracking', 'testOrder'].map(k => ({ path: k, values: [false, true] })));
  const r = simSearch(base, dom, s => ({ score: StoreSim.score(s), ok: true, cost: Object.keys(s.pay || {}).filter(k => s.pay[k]).length }));
  return (this._best = r.s);
};
BudgetSim.kind = 'factor';
BudgetSim.optimal = function () { // جشع بخطوات 250 ر.ق: العوائد متناقصة لكل قناة فالجشع يصل إلى الأمثل
  if (this._best) return this._best;
  const s = BudgetSim.def();
  while (BudgetSim.spent(s) + 250 <= BUDGET_TOTAL) {
    const cur = BudgetSim.calc(s).score; let bk = null, bg = 0;
    CHANNELS.forEach(c => { const t = simClone(s); t.alloc[c.k] = (+t.alloc[c.k] || 0) + 250; const g = BudgetSim.calc(t).score - cur; if (g > bg) { bg = g; bk = c.k; } });
    if (!bk) break; s.alloc[bk] += 250;
  }
  return (this._best = s);
};
BudgetSim.fmt = v => QAR(v) + ' نقطة';
StoreSim.fmt = v => v + '%'; CheckoutSim.fmt = v => v + '%';

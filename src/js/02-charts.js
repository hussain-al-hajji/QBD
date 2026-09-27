// ---------------------------------------------------------------------
// مكتبة الرسوم البيانية SVG — كل نص عربي داخل foreignObject مع div حقيقي
// (التفاف تلقائي + محاذاة يمين صريحة + عرض كامل للصندوق)
// ---------------------------------------------------------------------
const Charts = (function () {
  const W = 600;
  const FONT = "'IBM Plex Sans Arabic','Noto Sans Arabic',sans-serif";
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function parseItem(raw) {
    let t = String(raw || '').trim(), danger = false, hi = false;
    if (t.endsWith('!')) { danger = true; t = t.slice(0, -1).trim(); }
    if (t.endsWith('*')) { hi = true; t = t.slice(0, -1).trim(); }
    let label = t, desc = '';
    const i = t.indexOf('::'); if (i > -1) { label = t.slice(0, i).trim(); desc = t.slice(i + 2).trim(); }
    return { label, desc, danger, hi };
  }
  // تقدير عدد الأسطر (تقدير محافظ لعرض الحرف العربي)
  function lines(text, width, fs) { const cpl = Math.max(4, Math.floor((width - 16) / (fs * 0.56))); let n = 0; String(text || '').split('\n').forEach(p => { n += Math.max(1, Math.ceil(p.length / cpl)); }); return n; }
  function fo(x, y, w, hh, inner, o = {}) {
    const fs = o.fs || 15, color = o.color || '#1C2340', weight = o.weight || 600, align = o.align || 'right';
    return '<foreignObject x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(10, w).toFixed(1) + '" height="' + Math.max(10, hh).toFixed(1) + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" dir="rtl" style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:' + (o.valign || 'center') + ';box-sizing:border-box;padding:' + (o.pad == null ? '4px 10px' : o.pad) + ';font-family:' + FONT + ';font-size:' + fs + 'px;line-height:1.55;color:' + color + ';font-weight:' + weight + ';overflow:hidden">' +
      '<div style="width:100%;text-align:' + align + ';word-wrap:break-word">' + inner + '</div></div></foreignObject>';
  }
  function svgWrap(hh, body, c) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Math.ceil(hh) + '" width="100%" role="img" style="display:block;overflow:visible">' +
      '<defs><marker id="ah' + c.id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="' + c.dark + '"/></marker></defs>' + body + '</svg>';
  }
  let uid = 0;
  function ctx(color) { color = color || '#8A1538'; uid++; return { id: 'c' + uid + Math.random().toString(36).slice(2, 5), color, dark: shadeC(color, -0.25), light: tintC(color, 0.12), mid: tintC(color, 0.28) }; }
  function shadeC(hex, amt) { let c = hex.replace('#', ''); const n = parseInt(c, 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))); return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')'; }
  function tintC(hex, a) { let c = hex.replace('#', ''); const n = parseInt(c, 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  const arrow = (x1, y1, x2, y2, c, dash) => '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + c.dark + '" stroke-width="2.4"' + (dash ? ' stroke-dasharray="5 5"' : '') + ' marker-end="url(#ah' + c.id + ')"/>';
  const rect = (x, y, w, hh, fill, stroke, r = 14, extra = '') => '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="' + r + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.6"' : '') + extra + '/>';
  const badge = (cx, cy, n, c, r = 13) => '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + c.color + '" stroke="#fff" stroke-width="2.5"/>' + '<text x="' + cx + '" y="' + (cy + 4.8) + '" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#fff">' + n + '</text>';
  const fmtNum = v => { const n = Number(v); return isFinite(n) ? n.toLocaleString('en-US') : esc(v); };
  const itemHtml = (it, fs) => esc(it.label) + (it.desc ? '<div style="font-weight:400;color:#4A5470;font-size:' + (fs - 2) + 'px;margin-top:2px">' + esc(it.desc) + '</div>' : '');
  const boxFill = (it, c) => it.danger ? ['#FDECEC', '#E5484D'] : it.hi ? [c.color, c.color] : ['#FFFFFF', c.mid];
  const boxInk = (it) => it.hi ? '#FFFFFF' : it.danger ? '#A12A2E' : '#1C2340';

  // ---------- flow (أفقي متعرّج من اليمين) ----------
  function flow(items, c) {
    const its = items.map(parseItem); const n = its.length;
    const long = its.some(i => (i.label + i.desc).length > 22);
    const per = n <= 4 ? n : (long ? 3 : 4);
    const gap = 34, bw = (W - 20 - gap * (per - 1)) / per;
    const bh = Math.max(66, ...its.map(i => lines(i.label, bw, 15) * 23 + (i.desc ? lines(i.desc, bw, 13) * 20 : 0) + 22));
    const rows = Math.ceil(n / per), rg = 36;
    let body = '', pos = [];
    its.forEach((it, i) => {
      const r = Math.floor(i / per), k = i % per; const rtl = r % 2 === 0;
      const col = rtl ? k : (per - 1 - k);
      const x = W - 10 - bw - col * (bw + gap); const y = 14 + r * (bh + rg);
      pos.push({ x, y });
      const [fill, stroke] = boxFill(it, c);
      body += rect(x, y, bw, bh, fill, stroke, 16);
      body += fo(x, y, bw, bh, itemHtml(it, 15), { color: boxInk(it), fs: 15, pad: '6px 12px 6px 10px' });
      body += badge(x + bw - 4, y + 2, i + 1, c, 11);
    });
    for (let i = 0; i < n - 1; i++) {
      const a = pos[i], b = pos[i + 1];
      if (Math.abs(a.y - b.y) < 1) { const goLeft = b.x < a.x; body += goLeft ? arrow(a.x - 3, a.y + bh / 2, b.x + bw + 5, b.y + bh / 2, c) : arrow(a.x + bw + 3, a.y + bh / 2, b.x - 5, b.y + bh / 2, c); }
      else body += arrow(a.x + bw / 2, a.y + bh + 3, b.x + bw / 2, b.y - 5, c);
    }
    return svgWrap(28 + rows * bh + (rows - 1) * rg, body, c);
  }
  // ---------- vflow (عمودي) ----------
  function vflow(items, c) {
    const its = items.map(parseItem); const bw = 440, x = (W - bw) / 2; let y = 8, body = '';
    its.forEach((it, i) => {
      const bh = Math.max(52, lines(it.label, bw - 40, 16) * 25 + (it.desc ? lines(it.desc, bw - 40, 13) * 20 : 0) + 18);
      const [fill, stroke] = boxFill(it, c);
      body += rect(x, y, bw, bh, fill, stroke, 16);
      body += fo(x, y, bw - 34, bh, itemHtml(it, 16), { fs: 16, color: boxInk(it), pad: '4px 14px 4px 10px' });
      body += badge(x + bw - 20, y + bh / 2, i + 1, c, 12);
      y += bh;
      if (i < its.length - 1) { body += arrow(W / 2, y + 3, W / 2, y + 27, c); y += 32; }
    });
    return svgWrap(y + 8, body, c);
  }
  // ---------- funnel ----------
  function funnel(items, c) {
    const its = items.map(parseItem); const n = its.length; const vals = its.map(i => parseFloat(String(i.desc).replace(/,/g, '')));
    const hasVals = vals.every(v => isFinite(v)); const max = hasVals ? Math.max(...vals) : 1;
    const rh = 50, gap = 8; let body = '';
    its.forEach((it, i) => {
      const ratio = hasVals ? Math.max(0.28, vals[i] / max) : (1 - i * (0.62 / Math.max(1, n - 1)));
      const w = 560 * ratio, x = (W - w) / 2, y = 6 + i * (rh + gap);
      const col = shadeC(c.color, -0.05 + i * (0.5 / n) - 0.1);
      body += '<path d="M' + x.toFixed(1) + ' ' + y + 'H' + (x + w).toFixed(1) + 'L' + (x + w - 10).toFixed(1) + ' ' + (y + rh) + 'H' + (x + 10).toFixed(1) + 'Z" fill="' + (i === n - 1 ? c.dark : col) + '" opacity="' + (1 - i * 0.04) + '"/>';
      let pct = '';
      if (hasVals && i > 0 && vals[i - 1] > 0) pct = ' <span style="opacity:.85;font-weight:500">(' + Math.round(vals[i] / vals[i - 1] * 100) + '%)</span>';
      const val = hasVals ? '<b style="direction:ltr;unicode-bidi:isolate">' + fmtNum(vals[i]) + '</b> · ' : '';
      body += fo(x + 8, y, w - 16, rh, val + esc(it.label) + pct, { color: '#fff', fs: 14.5, align: 'center', pad: '2px 6px' });
    });
    return svgWrap(12 + n * (rh + gap), body, c);
  }
  // ---------- cards ----------
  function cards(items, c) {
    const its = items.map(parseItem); const n = its.length;
    const cols = n <= 4 ? n : (n === 5 || n === 6 ? 3 : (n <= 8 ? 4 : 5));
    const gap = 12, cw = (W - 12 - gap * (cols - 1)) / cols;
    const split = it => { const m = it.label.match(/^(\S+)\s+(.*)$/); if (m && /[^؀-ۿa-zA-Z0-9]/.test(m[1]) && !/[؀-ۿ]/.test(m[1])) return { emo: m[1], text: m[2] }; return { emo: '', text: it.label }; };
    const ch = Math.max(92, ...its.map(it => { const s = split(it); return (s.emo ? 40 : 10) + lines(s.text, cw, 15) * 23 + (it.desc ? lines(it.desc, cw, 13) * 20 : 0) + 18; }));
    const rows = Math.ceil(n / cols); let body = '';
    its.forEach((it, i) => {
      const r = Math.floor(i / cols), k = i % cols; const x = W - 6 - cw - k * (cw + gap), y = 6 + r * (ch + gap);
      const s = split(it);
      body += rect(x, y, cw, ch, c.light, c.mid, 18);
      body += rect(x, y, cw, 6, c.color, null, 3);
      const inner = (s.emo ? '<div style="font-size:26px;line-height:1.2;margin-bottom:4px">' + esc(s.emo) + '</div>' : '') + '<div style="font-weight:700">' + esc(s.text) + '</div>' + (it.desc ? '<div style="font-weight:400;font-size:13px;color:#4A5470">' + esc(it.desc) + '</div>' : '');
      body += fo(x, y + 4, cw, ch - 4, inner, { fs: 15, pad: '6px 12px' });
    });
    return svgWrap(12 + rows * ch + (rows - 1) * gap, body, c);
  }
  // ---------- compare (عمودان متقابلان) ----------
  function compare(items, c) {
    const groups = items.map(g => { const i = g.indexOf('::'); return { title: (i > -1 ? g.slice(0, i) : g).trim(), list: (i > -1 ? g.slice(i + 2) : '').split(';').map(s => s.trim()).filter(Boolean) }; }).slice(0, 2);
    while (groups.length < 2) groups.push({ title: '', list: [] });
    const cw = 262, vs = 36; const xs = [W - 6 - cw, 6];
    const cols2 = [c.color, '#1C2340'];
    let body = '', maxH = 0;
    groups.forEach((g, gi) => {
      const x = xs[gi]; let y = 58;
      g.list.forEach(t => { const bh = lines(t, cw - 16, 14.5) * 22 + 14; y += bh + 6; });
      maxH = Math.max(maxH, y);
    });
    groups.forEach((g, gi) => {
      const x = xs[gi]; const col = cols2[gi];
      body += rect(x, 4, cw, maxH + 6, gi === 0 ? c.light : '#F0F4F6', gi === 0 ? c.mid : '#DDE6EA', 20);
      body += rect(x, 4, cw, 46, col, null, 20) + rect(x, 30, cw, 20, col, null, 0);
      body += fo(x, 4, cw, 46, esc(g.title), { color: '#fff', fs: 16, weight: 700, pad: '4px 14px' });
      let y = 58;
      g.list.forEach(t => { const bh = lines(t, cw - 16, 14.5) * 22 + 14; body += rect(x + 8, y, cw - 16, bh, '#fff', null, 12); body += fo(x + 8, y, cw - 16, bh, esc(t), { fs: 14.5, weight: 500, pad: '4px 12px' }); y += bh + 6; });
    });
    const cy = 4 + (maxH + 6) / 2;
    body += '<circle cx="' + (W / 2) + '" cy="' + cy + '" r="' + (vs / 2 + 4) + '" fill="#fff" stroke="' + c.mid + '" stroke-width="2"/>';
    body += fo(W / 2 - 24, cy - 16, 48, 32, 'مقابل', { fs: 11.5, weight: 700, align: 'center', pad: '0', color: c.dark });
    return svgWrap(maxH + 16, body, c);
  }
  // ---------- hub (عنصر مركزي + عمودان يمين ويسار) ----------
  function hub(items, c) {
    const center = parseItem(items[0]); const its = items.slice(1).map(parseItem);
    const R = 62, SAFE = R + 20; const cx = W / 2;
    const colW = W / 2 - SAFE - 6;
    const right = its.filter((_, i) => i % 2 === 0), left = its.filter((_, i) => i % 2 === 1);
    const bhOf = it => Math.max(46, lines(it.label, colW, 14.5) * 22 + 16);
    const colH = list => list.reduce((s, it) => s + bhOf(it) + 10, -10);
    const H = Math.max(2 * R + 30, colH(right), colH(left)) + 20; const cy = H / 2;
    let body = '';
    const place = (list, xBox, side) => {
      let y = (H - colH(list)) / 2;
      list.forEach(it => {
        const bh = bhOf(it); const midY = y + bh / 2;
        const ex = side === 'r' ? xBox : xBox + colW; const ang = Math.atan2(midY - cy, ex - cx);
        body += '<line x1="' + (cx + Math.cos(ang) * (R + 2)).toFixed(1) + '" y1="' + (cy + Math.sin(ang) * (R + 2)).toFixed(1) + '" x2="' + ex.toFixed(1) + '" y2="' + midY.toFixed(1) + '" stroke="' + c.mid + '" stroke-width="2" stroke-dasharray="4 4"/>';
        const [fill, stroke] = boxFill(it, c);
        body += rect(xBox, y, colW, bh, fill, stroke, 14);
        body += fo(xBox, y, colW, bh, itemHtml(it, 14.5), { fs: 14.5, color: boxInk(it) });
        y += bh + 10;
      });
    };
    place(right, cx + SAFE, 'r'); place(left, 6, 'l');
    body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + 8) + '" fill="' + c.light + '"/>';
    body += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + c.color + '"/>';
    body += fo(cx - R + 8, cy - R + 8, 2 * R - 16, 2 * R - 16, esc(center.label), { color: '#fff', fs: center.label.length > 14 ? 13 : 17, weight: 800, align: 'center', pad: '0' });
    return svgWrap(H, body, c);
  }
  // ---------- cycle (مسار حلقي بعمودين بدل التوزيع الدائري) ----------
  function cycle(items, c) {
    const its = items.map(parseItem); const n = its.length;
    const rightN = Math.ceil(n / 2); const right = its.slice(0, rightN), left = its.slice(rightN).reverse();
    const colW = 220, bh = 50, gap = 14; const rows = rightN;
    const H = 30 + rows * (bh + gap);
    const xr = W - 20 - colW, xl = 20;
    let body = '';
    const tx1 = xl + colW / 2, tx2 = xr + colW / 2;
    body += '<rect x="' + tx1 + '" y="' + (18 + bh / 2) + '" width="' + (tx2 - tx1) + '" height="' + ((rows - 1) * (bh + gap)) + '" rx="30" fill="none" stroke="' + c.mid + '" stroke-width="10"/>';
    const midY = 18 + bh / 2 + ((rows - 1) * (bh + gap)) / 2;
    body += '<circle cx="' + (W / 2) + '" cy="' + midY + '" r="34" fill="' + c.color + '"/>';
    body += '<path d="M' + (W / 2 + 14) + ' ' + (midY - 8) + 'a15 15 0 1 1 -4 -9" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><path d="M' + (W / 2 + 8) + ' ' + (midY - 22) + 'l6 5-7 4" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>';
    const draw = (it, x, y, num) => { body += rect(x, y, colW, bh, '#fff', c.color, 14); body += fo(x, y, colW - 30, bh, esc(it.label), { fs: lines(it.label, colW - 30, 14.5) > 2 ? 12.5 : 14.5 }); body += badge(x + colW - 16, y + bh / 2, num, c, 12); };
    right.forEach((it, i) => draw(it, xr, 18 + i * (bh + gap), i + 1));
    const off = rows - left.length;
    left.forEach((it, i) => draw(it, xl, 18 + (i + off) * (bh + gap), n - i));
    // أسهم الاتجاه على المسار
    body += arrow(tx2 + 18, 18 + bh + 2, tx2 + 18, 18 + bh + gap - 1, c);
    return svgWrap(H + 10, body, c);
  }
  // ---------- steps (قائمة خطوات مرقّمة) ----------
  function steps(items, c) {
    const its = items.map(parseItem); const n = its.length; const cols = n > 4 ? 2 : 1;
    const gap = 12, cw = (W - 12 - gap * (cols - 1)) / cols;
    const bhOf = it => Math.max(54, lines(it.label, cw - 56, 15) * 23 + (it.desc ? lines(it.desc, cw - 56, 13.5) * 21 : 0) + 18);
    const rows = Math.ceil(n / cols); let body = '', y = 6;
    for (let r = 0; r < rows; r++) {
      const rowItems = its.slice(r * cols, r * cols + cols); const rh = Math.max(...rowItems.map(bhOf));
      rowItems.forEach((it, k) => {
        const x = W - 6 - cw - k * (cw + gap);
        body += rect(x, y, cw, rh, '#fff', c.mid, 16);
        body += rect(x + cw - 46, y, 46, rh, c.light, null, 16);
        body += badge(x + cw - 23, y + rh / 2, r * cols + k + 1, c, 14);
        body += fo(x, y, cw - 50, rh, '<div style="font-weight:700">' + esc(it.label) + '</div>' + (it.desc ? '<div style="font-weight:400;color:#4A5470;font-size:13.5px">' + esc(it.desc) + '</div>' : ''), { fs: 15, pad: '4px 12px' });
      });
      y += rh + gap;
    }
    return svgWrap(y, body, c);
  }
  // ---------- bars (أعمدة أفقية تدعم القيم السالبة) ----------
  function bars(items, c) {
    const its = items.map(parseItem); const vals = its.map(i => parseFloat(i.desc) || 0);
    const neg = vals.some(v => v < 0); const maxAbs = Math.max(1, ...vals.map(Math.abs));
    const labW = 170, area = W - labW - 70, rh = 38, gap = 10; let body = '';
    const zeroX = neg ? 50 + area / 2 : 50 + area;
    its.forEach((it, i) => {
      const y = 6 + i * (rh + gap), v = vals[i];
      const len = (Math.abs(v) / maxAbs) * (neg ? area / 2 : area);
      body += fo(W - labW, y, labW, rh, esc(it.label), { fs: 14 });
      const x = v >= 0 ? zeroX - len : zeroX;
      const col = v < 0 ? '#E5484D' : c.color;
      body += rect(neg ? x : zeroX - len, y + 6, Math.max(2, len), rh - 12, col, null, 8);
      const tx = (v >= 0 ? zeroX - len : zeroX + len);
      const vtxt = (v > 0 && neg ? '+' : '') + v;
      body += '<text x="' + (v >= 0 ? tx - 6 : tx + 6).toFixed(1) + '" y="' + (y + rh / 2 + 5) + '" text-anchor="' + (v >= 0 ? 'end' : 'start') + '" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="' + col + '">' + esc(vtxt) + (neg ? '%' : '') + '</text>';
    });
    if (neg) body += '<line x1="' + zeroX + '" y1="0" x2="' + zeroX + '" y2="' + (its.length * (rh + gap)) + '" stroke="#7D879C" stroke-width="1.5" stroke-dasharray="3 3"/>';
    return svgWrap(8 + its.length * (rh + gap), body, c);
  }
  // ---------- matrix 2×2 ----------
  function matrix(items, c) {
    const xl = items[0], yl = items[1]; const q = items.slice(2, 6).map(parseItem);
    const gx = 60, gy = 10, cw = (W - gx - 10) / 2, chh = 110; let body = '';
    const pos = [[gx + cw, gy], [gx, gy], [gx + cw, gy + chh], [gx, gy + chh]];
    q.forEach((it, i) => {
      const [x, y] = pos[i]; const good = /✓/.test(it.label);
      body += rect(x + 4, y + 4, cw - 8, chh - 8, good ? c.color : (i < 2 ? c.light : '#F0F4F6'), good ? null : c.mid, 16);
      body += fo(x + 4, y + 4, cw - 8, chh - 8, esc(it.label), { color: good ? '#fff' : '#1C2340', fs: 15, weight: 700, align: 'center' });
    });
    body += arrow(W - 6, gy + 2 * chh + 16, gx + 4, gy + 2 * chh + 16, c);
    body += fo(gx, gy + 2 * chh + 20, W - gx - 6, 30, esc(xl) + ' ←', { fs: 13, weight: 700, color: c.dark, align: 'center' });
    body += arrow(40, gy + 2 * chh - 2, 40, gy + 4, c);
    body += '<g transform="rotate(-90 22 ' + (gy + chh) + ')">' + fo(22 - chh, gy + chh - 14, 2 * chh, 28, esc(yl) + ' ←', { fs: 13, weight: 700, color: c.dark, align: 'center', pad: '0' }) + '</g>';
    return svgWrap(gy + 2 * chh + 56, body, c);
  }
  // ---------- balance (ميزان) ----------
  function balance(items, c) {
    const a = parseItem(items[0]), b = parseItem(items[1] || ''); let body = '';
    body += '<path d="M300 40 L300 190" stroke="#1C2340" stroke-width="6" stroke-linecap="round"/><path d="M250 196 H350" stroke="#1C2340" stroke-width="8" stroke-linecap="round"/>';
    body += '<path d="M110 62 L490 62" stroke="#1C2340" stroke-width="5" stroke-linecap="round"/><circle cx="300" cy="40" r="12" fill="' + c.color + '"/>';
    body += '<path d="M150 62 L100 130 M150 62 L200 130 M450 62 L400 130 M450 62 L500 130" stroke="#7D879C" stroke-width="2"/>';
    body += '<path d="M80 130 Q150 170 220 130 Z" fill="' + c.color + '"/><path d="M380 130 Q450 170 520 130 Z" fill="#1C2340"/>';
    body += fo(40, 150, 220, 70, esc(a.label), { fs: 16, weight: 700, align: 'center', color: c.dark });
    body += fo(340, 150, 220, 70, esc(b.label), { fs: 16, weight: 700, align: 'center' });
    body += '<text x="300" y="120" text-anchor="middle" font-size="26">⚖️</text>';
    return svgWrap(226, body, c);
  }
  // ---------- timeline (مبكر/مناسب/متأخر) ----------
  function timeline(items, c) {
    const its = items.map(parseItem); const n = its.length; let body = '';
    body += '<line x1="30" y1="70" x2="570" y2="70" stroke="#DDE6EA" stroke-width="10" stroke-linecap="round"/>';
    its.forEach((it, i) => {
      const cxp = W - 60 - i * ((W - 120) / Math.max(1, n - 1));
      body += '<circle cx="' + cxp + '" cy="70" r="' + (it.hi ? 22 : 15) + '" fill="' + (it.hi ? c.color : '#E5484D') + '" stroke="#fff" stroke-width="4"/>';
      body += fo(cxp - 90, 8, 180, 44, esc(it.label), { fs: it.hi ? 16 : 14.5, weight: 700, align: 'center', color: it.hi ? c.dark : '#A12A2E' });
      body += fo(cxp - 90, 96, 180, 48, esc(it.desc), { fs: 13.5, weight: 500, align: 'center', color: '#4A5470' });
    });
    return svgWrap(150, body, c);
  }
  // ---------- gap (المتوقع مقابل الفعلي) ----------
  function gap(items, c) {
    const [top, g, bottom, result] = items.map(s => parseItem(s).label); let body = '';
    body += rect(150, 10, 430, 48, c.color, null, 14) + fo(150, 10, 430, 48, esc(top), { color: '#fff', fs: 16, weight: 700 });
    body += rect(290, 120, 290, 48, '#1C2340', null, 14) + fo(290, 120, 290, 48, esc(bottom), { color: '#fff', fs: 16, weight: 700 });
    body += '<line x1="220" y1="64" x2="220" y2="114" stroke="#E5484D" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#ah' + c.id + ')"/>';
    body += fo(10, 66, 200, 46, '↕ ' + esc(g), { color: '#E5484D', fs: 15, weight: 800 });
    if (result) { body += arrow(284, 144, 200, 144, c); body += rect(10, 120, 186, 48, '#FDECEC', '#E5484D', 14) + fo(10, 120, 186, 48, esc(result), { color: '#A12A2E', fs: 14, weight: 700 }); }
    return svgWrap(176, body, c);
  }
  // ---------- equation ----------
  function equation(items, c) {
    const its = items.map(s => String(s).trim()); const res = its.filter(s => s.startsWith('=')).map(s => s.replace(/^=\s*/, ''))[0] || '';
    const parts = its.filter(s => !s.startsWith('='));
    const n = parts.length; const opW = 26; const bw = Math.min(150, (W - 12 - opW * (n - 1)) / n);
    const bh = Math.max(56, ...parts.map(p => lines(p, bw, 15) * 23 + 14)); let body = '';
    const total = n * bw + (n - 1) * opW; let x = W - (W - total) / 2 - bw;
    parts.forEach((p, i) => {
      body += rect(x, 8, bw, bh, c.light, c.mid, 14) + fo(x, 8, bw, bh, esc(p), { fs: 15, weight: 700, align: 'center' });
      if (i < n - 1) body += '<text x="' + (x - opW / 2) + '" y="' + (8 + bh / 2 + 8) + '" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700" fill="' + c.dark + '">+</text>';
      x -= bw + opW;
    });
    const rw = 360, rh = Math.max(56, lines(res, rw, 17) * 26 + 14);
    body += '<text x="300" y="' + (bh + 44) + '" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="' + c.dark + '">=</text>';
    body += rect((W - rw) / 2, bh + 56, rw, rh, c.color, null, 16) + fo((W - rw) / 2, bh + 56, rw, rh, esc(res), { color: '#fff', fs: 17, weight: 800, align: 'center' });
    return svgWrap(bh + 64 + rh, body, c);
  }
  // ---------- tree (شجرة قرار) ----------
  function tree(items, c) {
    const root = parseItem(items[0]).label; const br = items.slice(1).map(parseItem); const n = br.length;
    const bw = (W - 12 - 12 * (n - 1)) / n; const rw = 300; let body = '';
    body += rect((W - rw) / 2, 6, rw, 50, '#1C2340', null, 16) + fo((W - rw) / 2, 6, rw, 50, esc(root), { color: '#fff', fs: 16, weight: 800, align: 'center' });
    const bh = Math.max(46, ...br.map(b => lines(b.label, bw, 14.5) * 22 + 14)); const rh2 = Math.max(56, ...br.map(b => lines(b.desc, bw, 14) * 22 + 14));
    br.forEach((b, i) => {
      const x = W - 6 - bw - i * (bw + 12); const mx = x + bw / 2;
      body += '<path d="M300 56 C300 80 ' + mx + ' 70 ' + mx + ' 100" fill="none" stroke="' + c.mid + '" stroke-width="2.5"/>';
      body += rect(x, 100, bw, bh, c.light, c.mid, 14) + fo(x, 100, bw, bh, esc(b.label), { fs: 14.5, weight: 700, align: 'center' });
      body += arrow(mx, 100 + bh + 2, mx, 100 + bh + 22, c);
      body += rect(x, 126 + bh, bw, rh2, c.color, null, 14) + fo(x, 126 + bh, bw, rh2, esc(b.desc), { color: '#fff', fs: 14, weight: 700, align: 'center' });
    });
    return svgWrap(132 + bh + rh2, body, c);
  }
  // ---------- table (HTML) ----------
  function table(items, c) {
    const rows = items.map(r => r.split(';').map(s => s.trim()));
    const head = rows[0], body = rows.slice(1);
    return '<div class="chart-table" style="overflow-x:auto"><table style="width:100%;border-collapse:separate;border-spacing:0;font-family:' + FONT + ';font-size:14.5px;border-radius:16px;overflow:hidden;border:1px solid ' + c.mid + '">' +
      '<thead><tr>' + head.map(x => '<th style="background:' + c.color + ';color:#fff;padding:10px 12px;text-align:right;font-weight:700">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      body.map((r, i) => '<tr>' + r.map((x, j) => '<td style="padding:9px 12px;text-align:right;background:' + (i % 2 ? '#fff' : c.light) + ';' + (j === 0 ? 'font-weight:700;' : '') + (j === r.length - 1 && r.length === 2 ? 'color:' + c.dark + ';font-weight:600;' : '') + '">' + esc(x) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table></div>';
  }
  // ---------- donut (توزيع نسب مع مفتاح) ----------
  function donut(items, c) {
    const its = items.map(parseItem); const vals = its.map(i => Math.max(0, parseFloat(String(i.desc).replace(/[^\d.]/g, '')) || 0)); const tot = vals.reduce((a, b) => a + b, 0) || 1;
    const cx = 150, cy = 130, R = 104, r = 62; let a0 = -Math.PI / 2, body = '';
    const pal = k => k === 0 ? c.color : shadeC(c.color, k % 2 ? 0.35 + k * 0.06 : -0.25 + k * 0.05);
    its.forEach((it, k) => {
      const a1 = a0 + vals[k] / tot * Math.PI * 2; const big = a1 - a0 > Math.PI ? 1 : 0;
      const p = (ang, rr) => (cx + rr * Math.cos(ang)).toFixed(1) + ' ' + (cy + rr * Math.sin(ang)).toFixed(1);
      body += '<path d="M' + p(a0, R) + ' A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + p(a1, R) + ' L' + p(a1, r) + ' A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + p(a0, r) + 'Z" fill="' + pal(k) + '" stroke="#fff" stroke-width="3"/>';
      a0 = a1;
    });
    const main = its[0]; body += fo(cx - 58, cy - 34, 116, 68, '<b style="font-size:26px;direction:ltr;unicode-bidi:isolate">' + Math.round(vals[0] / tot * 100) + '%</b><div style="font-size:12px;font-weight:500">' + esc(main ? main.label : '') + '</div>', { align: 'center', fs: 14, pad: '0' });
    const lx = 300, lh = 36; const y0 = cy - (its.length * lh) / 2;
    its.forEach((it, k) => { const y = y0 + k * lh; body += rect(W - 20 - 14, y + 10, 14, 14, pal(k), null, 4) + fo(lx, y, W - 40 - lx, lh, esc(it.label) + ' <b style="direction:ltr;unicode-bidi:isolate">' + Math.round(vals[k] / tot * 100) + '%</b>', { fs: 14, weight: 600 }); });
    return svgWrap(Math.max(262, its.length * lh + 20), body, c);
  }
  // ---------- pyramid (مستويات من القمة إلى القاعدة) ----------
  function pyramid(items, c) {
    const its = items.map(parseItem); const n = its.length; const lh = 62, gap = 6, topW = 150, baseW = 560; let body = '';
    its.forEach((it, k) => {
      const w1 = topW + (baseW - topW) * (k / n), w2 = topW + (baseW - topW) * ((k + 1) / n); const y = 6 + k * (lh + gap);
      const col = it.hi ? c.color : shadeC(c.color, -0.2 + k * (0.75 / n));
      body += '<path d="M' + ((W - w1) / 2).toFixed(1) + ' ' + y + 'H' + ((W + w1) / 2).toFixed(1) + 'L' + ((W + w2) / 2).toFixed(1) + ' ' + (y + lh) + 'H' + ((W - w2) / 2).toFixed(1) + 'Z" fill="' + col + '"/>';
      const ink = k / n < 0.5 || it.hi ? '#fff' : '#1C2340';
      body += fo((W - w2) / 2 + 22, y, w2 - 44, lh, '<b>' + esc(it.label) + '</b>' + (it.desc ? '<div style="font-weight:400;font-size:12.5px;opacity:.9">' + esc(it.desc) + '</div>' : ''), { align: 'center', fs: 14.5, color: ink, pad: '2px 4px' });
    });
    return svgWrap(12 + n * (lh + gap), body, c);
  }
  // ---------- venn (نقطة التقاء) ----------
  function venn(items, c) {
    const center = (items.find(x => String(x).trim().startsWith('=')) || '').replace(/^\s*=\s*/, ''); const its = items.filter(x => !String(x).trim().startsWith('=')).map(parseItem).slice(0, 3);
    const three = its.length === 3; const R = three ? 108 : 118; const pts = three ? [[220, 120], [380, 120], [300, 250]] : [[225, 140], [375, 140]];
    const fills = [c.color, shadeC(c.color, 0.45), '#1C2340']; let body = '';
    pts.forEach((p, k) => { body += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" fill="' + fills[k] + '" fill-opacity="' + (k === 2 ? .16 : .2) + '" stroke="' + fills[k] + '" stroke-width="2.5"/>'; });
    const lp = three ? [[118, 64], [342, 64], [230, 282]] : [[105, 108], [355, 108]];
    its.forEach((it, k) => { body += fo(lp[k][0], lp[k][1], 140, 64, '<b>' + esc(it.label) + '</b>' + (it.desc ? '<div style="font-weight:400;font-size:12px">' + esc(it.desc) + '</div>' : ''), { align: 'center', fs: 14.5, color: k === 2 ? '#1C2340' : c.dark, pad: '0' }); });
    const cy = three ? 165 : 140;
    if (center) body += rect(300 - 62, cy - 22, 124, 44, c.color, null, 22) + fo(300 - 62, cy - 22, 124, 44, esc(center), { align: 'center', fs: 13.5, weight: 800, color: '#fff', pad: '0 6px' });
    return svgWrap(three ? 370 : 270, body, c);
  }
  const KINDS = { flow, vflow, funnel, cards, compare, hub, cycle, steps, bars, matrix, balance, timeline, gap, equation, tree, table, donut, pyramid, venn };
  function render(chart, color) {
    if (!chart || !KINDS[chart.kind]) return '';
    try { return KINDS[chart.kind](chart.items || [], ctx(color)); } catch (e) { console.error('chart', chart, e); return ''; }
  }
  return { render, KINDS, parseItem };
})();

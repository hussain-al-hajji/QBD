// ---------------------------------------------------------------------
// مكتبة المشاهد التعبيرية (Scenes) — أسلوب مسطّح موحّد: هاتف + شخصية + عناصر رمزية
// لا تحتوي على أي نص، فقط أشكال — لتبقى سليمة في كل الأحجام وفي ملفات PDF
// ---------------------------------------------------------------------
const Scenes = (function () {
  const SK = '#F2C9A5', SKD = '#D9A57F', HAIR = '#2B2F45', INK = '#1C2340';
  function lt(hex, a) { const n = parseInt(hex.replace('#', ''), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function dk(hex, amt) { const n = parseInt(hex.replace('#', ''), 16); const f = v => Math.round(v * (1 - amt)); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; }
  const bg = (c, alt) => '<rect width="400" height="260" fill="' + lt(c, .08) + '"/>' +
    '<path d="M' + (alt ? '40' : '20') + ' 190 C 60 90 170 40 260 60 S 400 120 380 210 S 200 270 120 250 S 0 250 20 190Z" fill="' + lt(c, .14) + '"/>' +
    '<circle cx="' + (alt ? 350 : 60) + '" cy="46" r="22" fill="' + lt(c, .18) + '"/><circle cx="' + (alt ? 40 : 360) + '" cy="220" r="12" fill="' + lt(c, .22) + '"/>' +
    '<g fill="' + lt(c, .25) + '">' + [0, 1, 2, 3].map(i => '<circle cx="' + (300 + i * 12) + '" cy="' + (alt ? 222 : 30) + '" r="2.5"/>').join('') + '</g>';
  const ground = () => '<ellipse cx="200" cy="238" rx="150" ry="10" fill="rgba(28,35,64,.07)"/>';
  function phone(x, y, s, screen, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="0" y="0" width="92" height="170" rx="16" fill="' + INK + '"/>' +
      '<rect x="6" y="10" width="80" height="150" rx="10" fill="#fff"/>' +
      '<rect x="34" y="4" width="24" height="3" rx="1.5" fill="#3A4460"/>' +
      '<g transform="translate(6 10)">' + (screen || '') + '</g></g>';
  }
  function person(x, y, c, o = {}) {
    const shirt = o.shirt || c; const flip = o.flip ? -1 : 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + flip + ' 1)">' +
      '<rect x="-17" y="60" width="13" height="52" rx="6" fill="' + INK + '"/><rect x="3" y="60" width="13" height="52" rx="6" fill="' + INK + '"/>' +
      '<rect x="-25" y="12" width="50" height="60" rx="20" fill="' + shirt + '"/>' +
      '<rect x="-8" y="2" width="16" height="16" rx="6" fill="' + SKD + '"/>' +
      '<circle cx="0" cy="-10" r="17" fill="' + SK + '"/>' +
      '<path d="M-17 -12 C-18 -32 18 -34 17 -12 C12 -22 -6 -24 -17 -12Z" fill="' + HAIR + '"/>' +
      '<circle cx="-5" cy="-9" r="1.8" fill="' + INK + '"/><circle cx="6" cy="-9" r="1.8" fill="' + INK + '"/>' +
      (o.mood === 'sad' ? '<path d="M-5 1 Q0 -3 5 1" stroke="' + INK + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>' : '<path d="M-5 -1 Q0 4 5 -1" stroke="' + INK + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>') +
      (o.arm === 'up' ? '<path d="M20 22 Q38 6 34 -14" stroke="' + shirt + '" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="34" cy="-16" r="6" fill="' + SK + '"/>'
        : o.arm === 'point' ? '<path d="M20 24 Q40 26 52 14" stroke="' + shirt + '" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="54" cy="12" r="6" fill="' + SK + '"/>'
          : '<path d="M20 24 Q34 40 26 54" stroke="' + shirt + '" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="25" cy="56" r="6" fill="' + SK + '"/>') +
      '<path d="M-20 24 Q-32 44 -22 56" stroke="' + shirt + '" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="-21" cy="57" r="6" fill="' + SK + '"/>' +
      '</g>';
  }
  const miniPhone = (x, y, c) => '<g transform="translate(' + x + ' ' + y + ')"><rect width="20" height="34" rx="5" fill="' + INK + '"/><rect x="2.5" y="4" width="15" height="26" rx="3" fill="' + lt(c, .5) + '"/></g>';
  const cardsList = c => [0, 1, 2].map(i => '<rect x="6" y="' + (26 + i * 36) + '" width="68" height="30" rx="6" fill="' + lt(c, .12) + '"/><rect x="10" y="' + (30 + i * 36) + '" width="22" height="22" rx="5" fill="' + lt(c, .45) + '"/><rect x="36" y="' + (33 + i * 36) + '" width="32" height="5" rx="2.5" fill="' + lt(c, .5) + '"/><rect x="36" y="' + (42 + i * 36) + '" width="20" height="5" rx="2.5" fill="' + lt(c, .3) + '"/>').join('');
  const header = c => '<rect x="0" y="0" width="80" height="20" rx="8" fill="' + c + '"/><rect x="8" y="7" width="30" height="6" rx="3" fill="#fff" opacity=".8"/>';
  const btn = (c, y = 128) => '<rect x="8" y="' + y + '" width="64" height="16" rx="8" fill="' + c + '"/>';
  const cart = (x, y, c, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0h8l7 30h30l6-22H12" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="14" y="4" width="30" height="20" rx="4" fill="' + c + '"/><circle cx="18" cy="38" r="4.5" fill="' + INK + '"/><circle cx="40" cy="38" r="4.5" fill="' + INK + '"/></g>';
  const bubble = (x, y, c, w = 60, icon = '') => '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="30" rx="12" fill="#fff" stroke="' + lt(c, .5) + '" stroke-width="2"/><path d="M14 30 l-4 9 12-9z" fill="#fff"/><rect x="10" y="9" width="' + (w - 30) + '" height="5" rx="2.5" fill="' + lt(c, .6) + '"/><rect x="10" y="17" width="' + (w - 42) + '" height="5" rx="2.5" fill="' + lt(c, .35) + '"/>' + icon + '</g>';
  const warn = (x, y, s = 1) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M14 0 L28 24 H0Z" fill="#D9A62E" stroke="#1C2340" stroke-width="2" stroke-linejoin="round"/><rect x="12.6" y="8" width="2.8" height="8" rx="1.4" fill="#1C2340"/><circle cx="14" cy="19.5" r="1.6" fill="#1C2340"/></g>';
  const check = (x, y, r, c) => '<g transform="translate(' + x + ' ' + y + ')"><circle r="' + r + '" fill="' + c + '"/><path d="M' + (-r * .45) + ' 0 L' + (-r * .1) + ' ' + (r * .35) + ' L' + (r * .5) + ' ' + (-r * .35) + '" fill="none" stroke="#fff" stroke-width="' + (r * .22) + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  const shieldS = (x, y, s, c) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M30 0 L58 10 V30 C58 50 30 62 30 62 C30 62 2 50 2 30 V10Z" fill="' + c + '"/><path d="M30 6 L52 14 V30 C52 45 30 55 30 55Z" fill="#fff" opacity=".18"/><rect x="21" y="26" width="18" height="15" rx="3" fill="#fff"/><path d="M24 26 v-4 a6 6 0 0 1 12 0 v4" fill="none" stroke="#fff" stroke-width="3"/></g>';
  const barsS = (x, y, c, vals = [18, 30, 24, 40]) => '<g transform="translate(' + x + ' ' + y + ')">' + vals.map((v, i) => '<rect x="' + (i * 14) + '" y="' + (44 - v) + '" width="10" height="' + v + '" rx="3" fill="' + (i === vals.length - 1 ? c : lt(c, .45)) + '"/>').join('') + '</g>';
  const pin = (x, y, c) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0 C-10 -10 -10 -24 0 -24 C10 -24 10 -10 0 0Z" fill="' + c + '"/><circle cx="0" cy="-15" r="4" fill="#fff"/></g>';
  const gear = (x, y, r, c) => { let t = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; t += '<rect x="' + (-r * .18) + '" y="' + (-r * 1.25) + '" width="' + (r * .36) + '" height="' + (r * .5) + '" rx="2" fill="' + c + '" transform="rotate(' + (i * 45) + ')"/>'; } return '<g transform="translate(' + x + ' ' + y + ')">' + t + '<circle r="' + r + '" fill="' + c + '"/><circle r="' + (r * .4) + '" fill="#fff"/></g>'; };
  const magnifier = (x, y, s, c) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="0" cy="0" r="18" fill="' + lt(c, .15) + '" stroke="' + INK + '" stroke-width="5"/><path d="M13 13 L28 28" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/></g>';

  const S = {};
  S.browse = c => bg(c) + ground() + phone(150, 40, 1, header(c) + cardsList(c) + btn(c), c) +
    person(290, 118, c, { arm: 'point' }) + bubble(260, 44, c, 64) + '<g opacity=".95">' + warn(96, 70) + '</g>' +
    '<path d="M80 200 q30 -30 60 -10" stroke="' + lt(c, .6) + '" stroke-width="3" stroke-dasharray="4 5" fill="none"/>' +
    '<g transform="translate(40 150)"><rect width="34" height="50" rx="4" fill="' + INK + '"/><rect x="4" y="4" width="26" height="42" rx="2" fill="' + lt(c, .35) + '"/><circle cx="24" cy="26" r="2.2" fill="#fff"/></g>';
  S.journey = c => bg(c, 1) + ground() + '<path d="M40 200 C 110 120, 170 230, 240 150 S 330 90, 370 60" stroke="' + lt(c, .5) + '" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M40 200 C 110 120, 170 230, 240 150 S 330 90, 370 60" stroke="#fff" stroke-width="3" stroke-dasharray="8 8" fill="none"/>' +
    pin(40, 196, lt(c, .6)) + pin(135, 176, lt(c, .75)) + pin(240, 146, c) + '<g transform="translate(356 36)">' + check(0, 0, 18, '#138A5E') + '</g>' + person(190, 110, c, { arm: 'up', shirt: dk(c, .1) }) + '<g transform="translate(290 140)">' + miniPhone(0, 0, c) + '</g>';
  S.friction = c => bg(c) + ground() + '<path d="M20 210 H380" stroke="' + INK + '" stroke-width="16" stroke-linecap="round"/><path d="M30 210 H370" stroke="#fff" stroke-width="2" stroke-dasharray="14 12"/>' +
    warn(110, 176, 1.1) + warn(230, 176, 1.1) + warn(320, 176, 1.1) + person(60, 88, c, { arm: 'point', mood: 'sad' }) + magnifier(250, 90, 1.3, c) + '<circle cx="250" cy="90" r="9" fill="' + c + '" opacity=".6"/>';
  S.megaphone = c => bg(c) + ground() + phone(210, 40, 1, header(c) + bubble(4, 30, c, 72) + bubble(4, 80, c, 60), c) +
    '<g transform="translate(70 100) rotate(-14)"><path d="M0 20 L60 0 V70 L0 50Z" fill="' + c + '"/><rect x="-18" y="18" width="20" height="34" rx="5" fill="' + INK + '"/><path d="M70 10 q14 25 0 50" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M84 0 q24 35 0 70" stroke="' + lt(c, .5) + '" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
    '<g transform="translate(330 60)"><circle r="16" fill="#FF3D5A"/><path d="M-6 4 h12 l-2 -3 v-5 a4 4 0 0 0 -8 0 v5z" fill="#fff"/></g>' + person(345, 128, c, { flip: true });
  S.target = c => bg(c, 1) + ground() + '<g transform="translate(130 120)"><circle r="78" fill="#fff"/><circle r="78" fill="none" stroke="' + lt(c, .5) + '" stroke-width="14"/><circle r="50" fill="none" stroke="' + c + '" stroke-width="14"/><circle r="20" fill="' + INK + '"/>' +
    '<path d="M70 -70 L4 -4" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M70 -70 l14 -4 -4 14z M62 -78 l10 -2" fill="' + c + '" stroke="' + c + '" stroke-width="3"/></g>' + person(300, 116, c, { arm: 'up' }) + '<g transform="translate(250 50)">' + bubble(0, 0, c, 70) + '</g>';
  S.measure = c => bg(c) + ground() + '<g transform="translate(40 60)"><rect width="190" height="140" rx="16" fill="#fff" stroke="' + lt(c, .4) + '" stroke-width="2"/>' + barsS(22, 60, c, [16, 26, 22, 36, 44, 58]) + '<path d="M20 70 L60 55 L100 62 L140 30 L172 20" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="172" cy="20" r="5" fill="' + c + '"/></g>' +
    person(300, 112, c, { arm: 'point', flip: true }) + magnifier(250, 60, .9, c);
  S.architecture = c => bg(c, 1) + ground() + '<g transform="translate(40 40)">' +
    '<rect x="110" y="0" width="80" height="34" rx="10" fill="' + c + '"/>' + [0, 1, 2].map(i => '<rect x="' + (20 + i * 90) + '" y="70" width="80" height="30" rx="9" fill="' + lt(c, .35) + '"/><path d="M150 34 V52 H' + (60 + i * 90) + ' V70" fill="none" stroke="' + INK + '" stroke-width="2.5"/>').join('') +
    [0, 1, 2, 3].map(i => '<rect x="' + (40 + i * 60) + '" y="130" width="46" height="26" rx="8" fill="#fff" stroke="' + lt(c, .5) + '" stroke-width="2"/>').join('') + '<path d="M60 100 V130 M150 100 V130 M240 100 V130" stroke="' + INK + '" stroke-width="2.5"/></g>' + person(345, 130, c, { flip: true, arm: 'point' });
  S.content = c => bg(c) + ground() + phone(80, 36, 1.05, header(c) + '<rect x="8" y="26" width="64" height="44" rx="8" fill="' + lt(c, .35) + '"/><circle cx="40" cy="48" r="12" fill="' + c + '" opacity=".6"/><rect x="8" y="76" width="50" height="6" rx="3" fill="' + INK + '"/><rect x="8" y="88" width="30" height="8" rx="4" fill="' + c + '"/><rect x="8" y="102" width="64" height="4" rx="2" fill="' + lt(c, .3) + '"/><rect x="8" y="110" width="56" height="4" rx="2" fill="' + lt(c, .3) + '"/>' + btn(c, 130), c) +
    '<g transform="translate(200 60)">' + [0, 1, 2].map(i => '<rect x="' + (i * 10) + '" y="' + (i * 40) + '" width="130" height="30" rx="10" fill="#fff" stroke="' + (i === 0 ? c : lt(c, .4)) + '" stroke-width="2.5"/><rect x="' + (12 + i * 10) + '" y="' + (11 + i * 40) + '" width="' + (80 - i * 20) + '" height="8" rx="4" fill="' + (i === 0 ? c : lt(c, .4)) + '"/>').join('') + '</g>' + '<path d="M180 80 H196" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
  S.navigation = c => bg(c, 1) + ground() + '<g fill="none" stroke-linecap="round"><path d="M40 60 H200 V120 H90 V190 H360" stroke="' + lt(c, .3) + '" stroke-width="20"/><path d="M40 60 H200 V120 H90 V190 H360" stroke="' + c + '" stroke-width="4" stroke-dasharray="2 10"/><path d="M200 60 H300 V110" stroke="#E5484D" stroke-width="4" stroke-dasharray="6 6"/></g>' +
    '<g transform="translate(300 116)"><path d="M-10 -10 L10 10 M10 -10 L-10 10" stroke="#E5484D" stroke-width="5" stroke-linecap="round"/></g>' + pin(40, 56, c) + '<g transform="translate(360 190)">' + check(0, 0, 16, '#138A5E') + '</g>' + person(250, 130, c, { arm: 'up', flip: true }) + '<g transform="translate(20 90)">' + gear(20, 20, 12, lt(c, .5)) + '</g>';
  S.checkout = c => bg(c) + ground() + phone(210, 40, 1, header(c) + '<rect x="8" y="30" width="64" height="40" rx="8" fill="' + c + '"/><rect x="14" y="40" width="30" height="6" rx="3" fill="#fff"/><rect x="14" y="54" width="44" height="5" rx="2.5" fill="#fff" opacity=".7"/>' + [0, 1].map(i => '<rect x="8" y="' + (80 + i * 18) + '" width="64" height="12" rx="6" fill="' + lt(c, .15) + '"/>').join('') + btn(c, 128), c) +
    cart(80, 150, c, 1.3) + person(140, 118, c, { arm: 'point' }) + '<g transform="translate(330 60)"><circle r="18" fill="#D9A62E"/><path d="M-6 -2 h12 M-6 4 h12 M0 -9 v18" stroke="#1C2340" stroke-width="2.6" stroke-linecap="round"/></g>';
  S.trust = c => bg(c, 1) + ground() + shieldS(160, 50, 1.6, c) + person(90, 120, c, { arm: 'up' }) + '<g transform="translate(300 90)"><rect width="70" height="44" rx="8" fill="' + INK + '"/><rect y="10" width="70" height="8" fill="#3A4460"/><rect x="8" y="26" width="22" height="6" rx="3" fill="#D9A62E"/></g>' + check(330, 170, 16, '#138A5E');
  S.complete = c => bg(c) + ground() + phone(90, 40, 1, '<rect x="0" y="0" width="80" height="150" fill="' + lt(c, .1) + '"/>' + check(40, 50, 22, '#138A5E') + '<rect x="12" y="84" width="56" height="7" rx="3.5" fill="' + INK + '"/><rect x="18" y="98" width="44" height="5" rx="2.5" fill="' + lt(c, .5) + '"/>' + btn(c, 126), c) +
    '<g transform="translate(220 150)"><rect width="90" height="46" rx="8" fill="' + c + '"/><path d="M90 14 h26 l14 16 v16 h-40z" fill="' + dk(c, .15) + '"/><rect x="96" y="18" width="16" height="12" rx="2" fill="#fff" opacity=".8"/><circle cx="22" cy="50" r="10" fill="' + INK + '"/><circle cx="110" cy="50" r="10" fill="' + INK + '"/><circle cx="22" cy="50" r="4" fill="#fff"/><circle cx="110" cy="50" r="4" fill="#fff"/></g>' +
    '<path d="M200 170 h-14 M205 182 h-24 M200 194 h-12" stroke="' + lt(c, .6) + '" stroke-width="4" stroke-linecap="round"/>' + '<g transform="translate(300 50)"><rect width="60" height="60" rx="8" fill="#D9A57F"/><path d="M0 18 H60 M30 0 V60" stroke="#B98760" stroke-width="4"/></g>';
  S.data = c => bg(c, 1) + ground() + '<g transform="translate(30 36)"><rect width="230" height="170" rx="18" fill="#fff" stroke="' + lt(c, .35) + '" stroke-width="2"/>' +
    '<rect x="16" y="16" width="60" height="36" rx="8" fill="' + lt(c, .15) + '"/><rect x="86" y="16" width="60" height="36" rx="8" fill="' + lt(c, .15) + '"/><rect x="156" y="16" width="60" height="36" rx="8" fill="' + c + '"/>' +
    [100, 80, 58, 40, 26].map((w, i) => '<rect x="' + (115 - w) + '" y="' + (66 + i * 18) + '" width="' + (w * 2) + '" height="13" rx="6" fill="' + (i === 4 ? c : lt(c, .25 + i * .12)) + '"/>').join('') + '</g>' + person(320, 112, c, { flip: true, arm: 'point' });
  S.anomaly = c => bg(c) + ground() + '<g transform="translate(30 50)"><rect width="250" height="150" rx="18" fill="#fff" stroke="' + lt(c, .35) + '" stroke-width="2"/><path d="M16 110 H234" stroke="' + lt(c, .25) + '" stroke-width="2" stroke-dasharray="6 5"/>' +
    '<path d="M16 90 L50 84 L84 88 L118 80 L152 86 L170 128 L200 90 L234 84" stroke="' + c + '" stroke-width="4" fill="none" stroke-linejoin="round"/><circle cx="170" cy="128" r="10" fill="none" stroke="#E5484D" stroke-width="3"/><circle cx="170" cy="128" r="4" fill="#E5484D"/></g>' +
    '<g transform="translate(330 70)"><circle r="40" fill="' + lt(c, .15) + '" stroke="' + c + '" stroke-width="3"/><circle r="24" fill="none" stroke="' + lt(c, .5) + '" stroke-width="2"/><path d="M0 0 L28 -28" stroke="' + INK + '" stroke-width="3"/><circle cx="14" cy="-8" r="4" fill="#E5484D"/></g>' + person(330, 150, c, { flip: true, arm: 'up' });
  S.loop = c => bg(c, 1) + ground() + '<g transform="translate(140 120)"><circle r="78" fill="none" stroke="' + lt(c, .3) + '" stroke-width="18"/><path d="M78 0 A78 78 0 0 1 -60 50" stroke="' + c + '" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M-72 30 l10 26 22 -14z" fill="' + c + '"/></g>' +
    gear(140, 120, 26, INK) + gear(172, 92, 14, c) + person(310, 118, c, { flip: true, arm: 'point' }) + '<g transform="translate(260 50)">' + check(0, 0, 13, '#138A5E') + '</g>';
  S.ai = c => bg(c) + ground() + '<g transform="translate(90 70)"><rect x="-4" y="-30" width="8" height="18" fill="' + INK + '"/><circle cx="0" cy="-34" r="7" fill="' + c + '"/><rect x="-46" y="-14" width="92" height="74" rx="24" fill="#fff" stroke="' + INK + '" stroke-width="4"/><rect x="-32" y="4" width="64" height="30" rx="15" fill="' + INK + '"/><circle cx="-14" cy="19" r="6" fill="' + c + '"/><circle cx="14" cy="19" r="6" fill="' + c + '"/><rect x="-36" y="66" width="72" height="60" rx="18" fill="' + c + '"/><path d="M-8 90 l6 -10 6 10 -6 10z" fill="#fff"/></g>' +
    '<g transform="translate(200 90)"><path d="M0 0 H40" stroke="' + lt(c, .6) + '" stroke-width="4" stroke-dasharray="4 6" stroke-linecap="round"/><path d="M40 0 l-8 -6 v12z" fill="' + lt(c, .6) + '"/></g>' + person(310, 110, c, { flip: true, arm: 'up', shirt: dk(c, .2) }) +
    '<g transform="translate(236 40)"><path d="M12 0 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill="#D9A62E"/></g><g transform="translate(40 180)"><path d="M8 0 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="' + c + '"/></g>';
  S.mistakes = c => bg(c, 1) + ground() + phone(80, 40, 1, header('#E5484D') + '<rect x="8" y="30" width="64" height="30" rx="6" fill="#FDECEC"/>' + warn(26, 70, 1) + '<rect x="8" y="104" width="64" height="8" rx="4" fill="#FDECEC"/>' + btn('#E5484D', 128), c) +
    '<g transform="translate(200 80)"><path d="M0 40 H60" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M60 40 l-12 -9 v18z" fill="' + INK + '"/></g>' + phone(280, 40, 0.9, header('#138A5E') + check(40, 60, 22, '#138A5E') + btn('#138A5E', 128), c);
  S.tools = c => bg(c) + ground() + '<g transform="translate(70 70)"><rect width="200" height="130" rx="18" fill="' + INK + '"/><rect x="10" y="-18" width="70" height="26" rx="10" fill="' + INK + '"/>' +
    '<rect x="16" y="20" width="168" height="94" rx="12" fill="' + lt(c, .9) + '"/>' + gear(60, 66, 18, '#fff') + '<g transform="translate(110 40)"><rect width="60" height="10" rx="5" fill="#fff"/><rect y="20" width="44" height="10" rx="5" fill="#fff" opacity=".7"/><rect y="40" width="52" height="10" rx="5" fill="#fff" opacity=".5"/></g></g>' +
    '<g transform="translate(320 90) rotate(35)"><rect x="-6" y="0" width="12" height="90" rx="6" fill="#D9A57F"/><rect x="-18" y="-24" width="36" height="30" rx="6" fill="' + INK + '"/></g>';
  S.idea = c => bg(c) + ground() + '<g transform="translate(200 100)"><circle r="54" fill="#FFE8A3"/><circle r="40" fill="#D9A62E"/><rect x="-18" y="46" width="36" height="22" rx="6" fill="' + INK + '"/><path d="M-12 4 L0 -14 L12 4 M0 -14 V26" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    [0, 1, 2, 3, 4, 5].map(i => '<path d="M0 -76 V-66" transform="rotate(' + (i * 60 - 150) + ')" stroke="#D9A62E" stroke-width="5" stroke-linecap="round"/>').join('') + '</g>' + person(80, 120, c) + person(320, 120, c, { flip: true, shirt: dk(c, .25) });
  // واجهة متجر: مبنى متجر + شاشة متجر إلكتروني + صناديق شحن
  S.store = c => bg(c) + ground() +
    '<g transform="translate(40 70)"><rect x="0" y="40" width="170" height="120" rx="10" fill="#fff" stroke="' + lt(c, .4) + '" stroke-width="2"/>' +
    '<path d="M-6 44 L10 6 H160 L176 44Z" fill="' + c + '"/>' + [0, 1, 2, 3, 4].map(i => '<path d="M' + (-6 + i * 36.4) + ' 44 q18 18 36.4 0" fill="' + (i % 2 ? dk(c, .15) : lt(c, .7)) + '"/>').join('') +
    '<rect x="16" y="78" width="60" height="50" rx="6" fill="' + lt(c, .18) + '"/><rect x="96" y="78" width="56" height="82" rx="6" fill="' + lt(c, .35) + '"/><circle cx="142" cy="120" r="3" fill="' + INK + '"/></g>' +
    phone(250, 44, .95, header(c) + cardsList(c) + btn(c), c) +
    '<g transform="translate(330 176)"><rect width="46" height="40" rx="5" fill="#D9A57F"/><path d="M0 12 H46 M23 0 V40" stroke="' + dk('#D9A57F', .2) + '" stroke-width="3"/></g>' +
    '<g transform="translate(206 110)"><path d="M0 0 H34" stroke="' + lt(c, .6) + '" stroke-width="4" stroke-dasharray="4 6" stroke-linecap="round"/><path d="M34 0 l-8 -6 v12z" fill="' + lt(c, .6) + '"/></g>';
  // الشحن عبر الحدود: كرة أرضية + مسارات + طائرة + طرد
  S.globe = c => bg(c, 1) + ground() +
    '<g transform="translate(150 118)"><circle r="82" fill="' + lt(c, .12) + '" stroke="' + c + '" stroke-width="4"/>' +
    '<ellipse rx="36" ry="82" fill="none" stroke="' + lt(c, .55) + '" stroke-width="2.5"/><path d="M-82 0 H82 M-72 -38 H72 M-72 38 H72" stroke="' + lt(c, .55) + '" stroke-width="2.5"/>' +
    '<path d="M-40 -46 q14 -10 28 0 q6 14 -10 18 q-18 6 -18 -18z M10 10 q22 -8 34 6 q-4 22 -24 20 q-14 -4 -10 -26z" fill="' + lt(c, .45) + '"/></g>' +
    '<path d="M150 118 C 210 30, 300 30, 350 80" stroke="' + INK + '" stroke-width="3" stroke-dasharray="6 7" fill="none"/>' + pin(150, 122, '#D9A62E') + pin(350, 84, c) +
    '<g transform="translate(262 42) rotate(20)"><path d="M0 8 L34 4 L44 -6 L50 -4 L44 8 L60 12 L44 16 L50 28 L44 30 L34 20 L0 16Z" fill="' + INK + '"/></g>' +
    '<g transform="translate(300 160)"><rect width="56" height="48" rx="6" fill="#D9A57F"/><path d="M0 14 H56 M28 0 V48" stroke="' + dk('#D9A57F', .2) + '" stroke-width="3"/><rect x="8" y="24" width="18" height="12" rx="2" fill="#fff"/></g>' +
    person(60, 130, c, { arm: 'up' }).replace('translate(60 130)', 'translate(60 130) scale(.8)');
  // غلاف الدورة: رحلة من الاهتمام إلى الإتمام داخل الهاتف
  S.hero = () => {
    const c = '#8A1538', p = '#C8702A', a = '#D9A62E';
    return '<rect width="1200" height="380" fill="url(#hg)"/><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6E6EB"/><stop offset=".55" stop-color="#FFF0E0"/><stop offset="1" stop-color="#FFF6DB"/></linearGradient></defs>' +
      '<circle cx="1080" cy="60" r="120" fill="' + lt(c, .08) + '"/><circle cx="120" cy="330" r="150" fill="' + lt(p, .08) + '"/><circle cx="640" cy="-40" r="110" fill="' + lt(a, .12) + '"/>' +
      '<path d="M80 300 C 260 160, 380 330, 560 220 S 860 90, 1120 140" stroke="' + lt(c, .25) + '" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M80 300 C 260 160, 380 330, 560 220 S 860 90, 1120 140" stroke="#fff" stroke-width="4" stroke-dasharray="12 14" fill="none"/>' +
      '<g transform="translate(150 230)"><circle r="30" fill="#fff"/>' + '<path d="M-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0" fill="' + lt(c, .3) + '"/><circle r="6" fill="' + c + '"/></g>' +
      '<g transform="translate(360 262)"><circle r="30" fill="#fff"/><path d="M-12 -6 h24 l-4 18 h-16z" fill="' + p + '"/><path d="M-6 -6 a6 6 0 0 1 12 0" stroke="' + p + '" stroke-width="3" fill="none"/></g>' +
      '<g transform="translate(760 150)"><circle r="30" fill="#fff"/><rect x="-15" y="-10" width="30" height="20" rx="4" fill="' + a + '"/><rect x="-15" y="-5" width="30" height="4" fill="#1C2340"/></g>' +
      '<g transform="translate(1110 138)"><circle r="34" fill="#138A5E"/><path d="M-14 0 L-4 10 L15 -10" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g transform="translate(520 40)"><rect width="150" height="290" rx="28" fill="#1C2340"/><rect x="10" y="18" width="130" height="262" rx="18" fill="#fff"/><rect x="58" y="8" width="34" height="5" rx="2.5" fill="#3A4460"/>' +
      '<rect x="20" y="30" width="110" height="30" rx="10" fill="url(#pg)"/><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="' + c + '"/><stop offset="1" stop-color="' + p + '"/></linearGradient></defs>' +
      '<rect x="20" y="72" width="110" height="70" rx="12" fill="' + lt(c, .12) + '"/><circle cx="75" cy="107" r="22" fill="' + lt(p, .35) + '"/><rect x="20" y="152" width="80" height="9" rx="4.5" fill="#1C2340"/><rect x="20" y="168" width="50" height="12" rx="6" fill="' + a + '"/>' +
      '<rect x="20" y="192" width="110" height="7" rx="3.5" fill="' + lt(c, .2) + '"/><rect x="20" y="206" width="90" height="7" rx="3.5" fill="' + lt(c, .2) + '"/><rect x="20" y="236" width="110" height="28" rx="14" fill="url(#pg)"/></g>' +
      '<g transform="translate(700 250)"><rect width="120" height="54" rx="16" fill="#fff" stroke="' + lt(c, .3) + '" stroke-width="2"/>' + [14, 24, 20, 34].map((v, i) => '<rect x="' + (16 + i * 16) + '" y="' + (44 - v) + '" width="10" height="' + v + '" rx="3" fill="' + (i === 3 ? c : lt(c, .4)) + '"/>').join('') + '<path d="M88 34 l10 -14 10 6" stroke="' + p + '" stroke-width="3" fill="none"/></g>' +
      '<g transform="translate(400 70)"><rect width="100" height="44" rx="16" fill="#fff" stroke="' + lt(p, .4) + '" stroke-width="2"/><path d="M22 44 l-6 12 16-12z" fill="#fff"/><rect x="14" y="12" width="60" height="7" rx="3.5" fill="' + lt(p, .6) + '"/><rect x="14" y="25" width="40" height="7" rx="3.5" fill="' + lt(p, .3) + '"/></g>' +
      '<g transform="translate(880 250) scale(1.25)">' + person(0, 0, c, { arm: 'up' }).replace(/^<g transform="translate\(0 0\) scale\(1 1\)">/, '<g>') + '</g>' +
      '<g transform="translate(280 150) scale(1.1)">' + person(0, 0, p, { arm: 'point' }) + '</g>' +
      [[960, 70], [230, 90], [1040, 300], [450, 330]].map(([x, y], i) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M10 0 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="' + [a, c, p, a][i] + '"/></g>').join('');
  };
  function render(key, color, o = {}) {
    const fn = S[key] || S.idea;
    const vb = key === 'hero' ? '0 0 1200 380' : '0 0 400 260';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" width="100%" role="img" aria-hidden="true" style="display:block' + (o.style ? ';' + o.style : '') + '">' + fn(color || '#8A1538') + '</svg>';
  }
  return { render, keys: Object.keys(S) };
})();

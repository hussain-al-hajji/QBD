// ---------------------------------------------------------------------
// قاموس الأيقونات الخام — كل استخدام يبني <svg> ذاتي الاكتفاء (بلا <use>)
// حتى تظهر الأيقونات داخل صفحات PDF الملتقطة بـ html2canvas.
// ---------------------------------------------------------------------
const ICONS = {
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  megaphone: '<path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z"/><path d="M16 8a5 5 0 0 1 0 8"/><path d="M19 5a9 9 0 0 1 0 14"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 17a10 10 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.6"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m8 12.5 2.8 2.8L16.5 9"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18.5 5.5"/><circle cx="16" cy="9" r="1.2"/>',
  loop: '<path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M18.5 2v4h-4"/><path d="M5.5 22v-4h4"/>',
  sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/><path d="M5 2.5l.6 1.4L7 4.5l-1.4.6L5 6.5l-.6-1.4L3 4.5l1.4-.6z"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L22 8H6"/>',
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3"/><path d="M7 5H4v2a3 3 0 0 0 3 3"/>',
  rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0"/><path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  swap: '<path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M8 21H3v-5"/><path d="M3 21l7-7"/>',
  arrowR: '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  play: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  x: '<path d="M4 4l16 16"/><path d="M20 4 4 20"/>',
  xlogo: '<path d="M4 4h4.5L20 20h-4.5z"/><path d="M20 4l-6.6 7.3"/><path d="M4 20l6.6-7.3"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><path d="M17.5 6.5h.01"/>',
  whatsapp: '<path d="M3 21l1.7-4.8A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c.3 1.9 2.6 4.3 4.5 4.9l1.2-1.2 2 1-.4 1.5c-3.5.5-7.6-3.6-7.3-7.2l1.5-.4 1 2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/><path d="M10 21v-5h4v5"/>',
  truck: '<path d="M1 5h13v11H1z"/><path d="M14 9h4l4 4v3h-8"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  wallet: '<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 13h2"/><path d="M6 6V4h12v2"/>',
  clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2"/><path d="m9 13 2 2 4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>'
};
const AXIS_ICON_CHOICES = ['store','truck','box','wallet','globe','clipboard','calendar','award','grid','eye','route','alert','megaphone','target','gauge','layers','file','compass','card','shield','check','chart','radar','loop','sparkles','cart','phone','bag','bolt','users','bulb','trophy','rocket','heart','star'];
AXIS_ICON_CHOICES.splice(0, AXIS_ICON_CHOICES.length, ...new Set(AXIS_ICON_CHOICES.filter(k => ICONS[k])));
function iconSvg(name, size = 22, color = 'currentColor', sw = 2) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex:none">' + (ICONS[name] || ICONS.star) + '</svg>';
}

// ---------------------------------------------------------------------
// أيقونات الواجهة بدل الإيموجي: كل إيموجي معروف في الواجهة (أو رمز :name:) يُستبدل عند العرض
// بأيقونة خطية من ICONS بلون النص المحيط، فتنسجم مع مكانها ومع الوضع الداكن.
// للتخصيص حسب المشروع: عدّل ICONS أو EMOJI_ICON أدناه، أو اختر الأيقونة من لوحة الإدارة.
// ---------------------------------------------------------------------
Object.assign(ICONS, {
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-1"/>',
  pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  notebook: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M18.4 2.6a2.17 2.17 0 0 1 3 3L16 11l-4 1 1-4Z"/>',
  presentation: '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>',
  pointer: '<path d="M10 11V4.5a2 2 0 0 1 4 0V11"/><path d="M14 10.5a2 2 0 0 1 4 0V12"/><path d="M18 12a2 2 0 0 1 4 0v2a8 8 0 0 1-8 8h-1.5a8 8 0 0 1-6.3-3.1L3.5 15.6a2 2 0 0 1 3-2.6L10 16"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  timer: '<path d="M10 2h4"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
  clapper: '<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
  maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  gradCap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
  party: '<path d="M5.8 11.3 2 22l10.7-3.8"/><path d="M11 13c1.9 1.9 2.8 4.2 2 5-.8.8-3.1-.1-5-2s-2.8-4.2-2-5c.8-.8 3.1.1 5 2Z"/><path d="M15 2h.01"/><path d="M22 8h.01"/><path d="M22 20h.01"/><path d="m22 2-2.2.8a2.9 2.9 0 0 0-2 3.1c.1.9-.6 1.6-1.5 1.6h-.4c-.9 0-1.6.6-1.8 1.4L14 10"/><path d="m22 13-.8-.3c-.9-.3-1.8.2-2 1.1-.1.7-.7 1.2-1.4 1.2H17"/>',
  dot: '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>',
  flask: '<path d="M9 2v6L4 18a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3L15 8V2"/><path d="M8 2h8"/><path d="M6.5 15h11"/>',
  books: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
  bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  thumbsUp: '<path d="M7 10v12"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',
  appWindow: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20"/><path d="M6 4v5"/><path d="M10 4v5"/>',
  trendUp: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  map: '<path d="M14.1 4.3 9.9 2.2a2 2 0 0 0-1.8 0L3.1 4.7A2 2 0 0 0 2 6.5v13.1a1 1 0 0 0 1.5.9l4.6-2.3a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l5-2.5A2 2 0 0 0 22 16V3a1 1 0 0 0-1.5-.9l-4.6 2.3a2 2 0 0 1-1.8 0z"/><path d="M15 5.8v15"/><path d="M9 3.2v15"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.8l-1.8-.9a2 2 0 0 1-1.1-1.8V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a3 3 0 0 0-4.2 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.9l.5.3a2 2 0 0 0 1.4.3L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
  hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4A2 2 0 0 0 17 6.2V2"/>',
  wifiOff: '<path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M10.7 5c4-.4 8.1.9 11.3 3.8"/><path d="M16.9 11.3a10 10 0 0 1 2.2 1.7"/><path d="M5 13a10 10 0 0 1 5.2-2.8"/><path d="m2 2 20 20"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  brain: '<path d="M12 5a3 3 0 1 0-6 .1 4 4 0 0 0-2.5 5.8 4 4 0 0 0 .6 6.6A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 6 .1 4 4 0 0 1 2.5 5.8 4 4 0 0 1-.6 6.6A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  barChart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  blocks: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M13 7h4a4 4 0 0 1 4 4"/><path d="M11 17H7a4 4 0 0 1-4-4"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M16 14v4"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  scale: '<path d="m16 16 3-8 3 8c-.9.6-1.9 1-3 1s-2.1-.4-3-1Z"/><path d="m2 16 3-8 3 8c-.9.6-1.9 1-3 1s-2.1-.4-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/>',
  eyeOff: '<path d="M9.9 9.9a3 3 0 1 0 4.2 4.2"/><path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7"/><path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/>',
  eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  files: '<path d="M15.5 2H8.6a1.6 1.6 0 0 0-1.6 1.6v12.8A1.6 1.6 0 0 0 8.6 18h9.8a1.6 1.6 0 0 0 1.6-1.6V6.5z"/><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/><path d="M15 2v5h5"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16"/><path d="M8 16H3v5"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  lifebuoy: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.3 4.3"/><path d="m14.8 9.2 4.3-4.3"/><path d="m14.8 14.8 4.3 4.3"/><path d="m9.2 14.8-4.3 4.3"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
  gamepad: '<path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="4"/>',
  bot: '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>',
  medal: '<path d="M7.2 15 2.7 7.2A2 2 0 0 1 2.9 5L4.3 3a2 2 0 0 1 1.6-1h12.2a2 2 0 0 1 1.6.8L21.1 5a2 2 0 0 1 .1 2.1L16.8 15"/><path d="M11 12 5.1 2.2"/><path d="m13 12 5.9-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/>'
});
// إيموجي ← اسم أيقونة (الإيموجي غير المذكور هنا، كالأعلام والميداليات، يبقى كما هو)
const EMOJI_ICON = {
  '🔒': 'lock', '🔐': 'lock', '🔓': 'unlock', '👥': 'users', '👤': 'user', '✏': 'pencil', '✍': 'pen', '📝': 'notebook', '🗒': 'notebook', '✅': 'checkCircle', '✔': 'check',
  '🧭': 'compass', '📽': 'presentation', '👆': 'pointer', '💾': 'save', '🗑': 'trash', '🏁': 'flag', '⏱': 'timer', '🎬': 'clapper', '💡': 'bulb', '🏠': 'home',
  '📤': 'share', '⛶': 'maximize', '⭐': 'star', '🌟': 'star', '★': 'star', '🚀': 'rocket', '🏅': 'medal', '🎓': 'gradCap', '🎉': 'party', '📄': 'file', '📃': 'file',
  '🟢': 'dot', '✨': 'sparkles', '🧪': 'flask', '📚': 'books', '🔗': 'link', '📖': 'bookOpen', '📘': 'bookOpen', '👍': 'thumbsUp', '🎯': 'target', '🪟': 'appWindow',
  '👁': 'eye', '👀': 'eye', '📈': 'trendUp', '📥': 'download', '📋': 'clipboard', '⚡': 'bolt', '🗺': 'map', '🧰': 'briefcase', '📌': 'pin', '🤝': 'handshake',
  '🌐': 'globe', '🌍': 'globe', '⏳': 'hourglass', '📡': 'wifiOff', '📍': 'mapPin', '📣': 'megaphone', '☀': 'sun', '🌙': 'moon', '🖥': 'monitor', '🛠': 'wrench',
  '📷': 'camera', '📸': 'camera', '⚠': 'alert', '🧠': 'brain', '🔎': 'search', '🔍': 'search', '📊': 'barChart', '🧩': 'blocks', '🔁': 'loop', '🛤': 'route', '🎤': 'mic',
  '🧮': 'calculator', '🏆': 'trophy', '💳': 'card', '📦': 'box', '❌': 'xCircle', '⚖': 'scale', '↩': 'undo', '💖': 'heart', '❤': 'heart', '🏗': 'building', '🛍': 'bag',
  '🛒': 'cart', '🎞': 'film', '🏪': 'store', '🚚': 'truck', '⚙': 'gear', '🙈': 'eyeOff', '🧹': 'eraser', '🧬': 'copy', '📑': 'files', '🔑': 'key', '🔄': 'refresh',
  '🗂': 'folder', '📁': 'folder', '🛟': 'lifebuoy', '🛬': 'layout', '🧱': 'layout', '➕': 'plus', '👋': 'hand', '⏸': 'pause', '✉': 'mail', '📧': 'mail', '🎮': 'gamepad',
  '🤖': 'bot', '💬': 'message', '📲': 'phone', '📱': 'phone', '☎': 'phone', '🏷': 'tag', '🧾': 'receipt', '🎁': 'gift', '🧴': 'droplet', '🔔': 'bell', '📅': 'calendar',
  '🗓': 'calendar', '🛡': 'shield', '💰': 'wallet', '👛': 'wallet', '🎨': 'sparkles', '🏬': 'store', '🔀': 'swap', '▶': 'play', '🎥': 'film', '🖼': 'appWindow'
};
const EmojiIcons = {
  re: null,
  build() {
    const keys = Object.keys(EMOJI_ICON).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    EmojiIcons.re = new RegExp('(' + keys.join('|') + ')\\uFE0F?|:([a-zA-Z][a-zA-Z0-9]{1,20}):', 'gu');
  },
  // اسم الأيقونة لقيمة: اسم مباشر، أو :اسم:، أو إيموجي معروف
  nameOf(v) { v = String(v || '').trim().replace(/️/g, ''); const m = v.match(/^:?([a-zA-Z][a-zA-Z0-9]*):?$/); if (m && ICONS[m[1]]) return m[1]; return EMOJI_ICON[v] || null; },
  svg(name) { return '<svg class="ei ei-' + name + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>'; },
  skip: 'textarea,input,select,option,script,style,svg,[contenteditable="true"],.no-ei,#pdfHost',
  convertText(node) {
    const t = node.nodeValue; if (!t || !EmojiIcons.re) return; EmojiIcons.re.lastIndex = 0; if (!EmojiIcons.re.test(t)) return;
    const p = node.parentElement; if (!p || p.closest(EmojiIcons.skip)) return;
    EmojiIcons.re.lastIndex = 0; let last = 0, m, html = '', hit = false;
    while ((m = EmojiIcons.re.exec(t))) { const name = m[1] ? EMOJI_ICON[m[1]] : (ICONS[m[2]] ? m[2] : null); if (!name) continue; hit = true; html += h(t.slice(last, m.index)) + EmojiIcons.svg(name); last = m.index + m[0].length; }
    if (!hit) return; html += h(t.slice(last)); const tpl = document.createElement('template'); tpl.innerHTML = html; node.replaceWith(tpl.content);
  },
  convert(root) {
    if (!root || !EmojiIcons.re) return; if (root.nodeType === 3) { EmojiIcons.convertText(root); return; } if (root.nodeType !== 1 || root.closest && root.closest(EmojiIcons.skip)) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const list = []; let n; while ((n = w.nextNode())) list.push(n); list.forEach(EmojiIcons.convertText);
  },
  start() {
    EmojiIcons.build(); if (typeof MutationObserver === 'undefined') return;
    EmojiIcons.convert(document.body);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(EmojiIcons.convert))).observe(document.body, { childList: true, subtree: true });
  }
};

// منتقي الأيقونات في لوحة الإدارة: زر بجانب أي حقل [data-iconpick] يفتح شبكة الأيقونات، ويكتب في الحقل
// الإيموجي المقابل للأيقونة المختارة (فتبقى البيانات متوافقة) — أو :اسم: إن لم يكن لها إيموجي
const IconPick = {
  names() { const seen = new Set(); Object.values(EMOJI_ICON).forEach(n => seen.add(n)); (typeof AXIS_ICON_CHOICES !== 'undefined' ? AXIS_ICON_CHOICES : []).forEach(n => seen.add(n)); return [...seen].filter(n => ICONS[n] && n !== 'dot'); },
  token(name) { const e = Object.keys(EMOJI_ICON).find(k => EMOJI_ICON[k] === name); return e || ':' + name + ':'; },
  btn(v) { const n = EmojiIcons.nameOf(v); return '<button type="button" class="icon-pick-btn" data-act="icon-pick" title="اختر أيقونة" aria-label="اختر أيقونة">' + (n ? EmojiIcons.svg(n) : '＋') + '</button>'; },
  open(btn) {
    const inp = btn.parentElement && btn.parentElement.querySelector('[data-iconpick]'); if (!inp) return;
    const cur = EmojiIcons.nameOf(inp.value);
    const m = UI.modal('<h3>اختر أيقونة</h3><p class="muted" style="font-family:var(--f-ui);font-size:12.5px;margin-top:0">تأخذ الأيقونة لون المكان الذي توضع فيه تلقائيًا.</p><div class="icon-grid">' + IconPick.names().map(n => '<button type="button" class="icon-cell' + (n === cur ? ' on' : '') + '" data-ic="' + n + '" title="' + n + '">' + EmojiIcons.svg(n) + '</button>').join('') + '</div><div class="actions"><button class="btn btn-ghost" data-x>إلغاء</button></div>', { wide: true });
    m.el.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => { inp.value = IconPick.token(b.getAttribute('data-ic')); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); btn.innerHTML = EmojiIcons.svg(b.getAttribute('data-ic')); m.close(); });
    const x = m.el.querySelector('[data-x]'); if (x) x.onclick = () => m.close();
  }
};

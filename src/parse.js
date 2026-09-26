// يحوّل ملفات المحتوى النصية (src/content/*.txt) إلى كائن JSON واحد يُضمَّن في الصفحة.
'use strict';
const fs = require('fs');
const path = require('path');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// نص عادي متعدد الأسطر ← HTML (أسطر تبدأ بـ "- " أو "• " تصبح قائمة نقطية)
function toHtml(txt) {
  if (!txt) return '';
  const lines = String(txt).split('\n').map(l => l.trim()).filter(Boolean);
  let out = '', inList = false;
  for (const l of lines) {
    const m = l.match(/^[-•]\s+(.*)$/);
    if (m) { if (!inList) { out += '<ul>'; inList = true; } out += '<li>' + esc(m[1]) + '</li>'; }
    else { if (inList) { out += '</ul>'; inList = false; } out += '<p>' + esc(l) + '</p>'; }
  }
  if (inList) out += '</ul>';
  return out;
}

function parseChart(v) {
  const parts = v.split('|').map(s => s.trim());
  return { kind: parts[0], items: parts.slice(1) };
}

const RICH_SLIDE = ['text', 'rule', 'intro'];
const RICH_EX = ['scenario', 'task', 'hint', 'model'];

function parseFile(txt, data) {
  const lines = txt.split('\n');
  let cur = null, curType = null, lastKey = null, axis = null;
  const flushKey = () => {};
  for (let raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    let m;
    if ((m = line.match(/^=== AXIS (\S+)/))) {
      axis = { id: m[1], slides: [], exercises: [], highlights: [] };
      data.axes.push(axis); cur = axis; curType = 'axis'; lastKey = null; continue;
    }
    if ((m = line.match(/^=== ACTIVITY (\S+)/))) {
      cur = { id: m[1], kind: 'activity', format: 'text', steps: [] };
      data.activities.push(cur); curType = 'ex'; lastKey = null; continue;
    }
    if ((m = line.match(/^=== SURVEY (\S+)/))) {
      cur = { id: m[1], kind: 'survey', format: 'text', mode: 'individual', steps: [] };
      data.survey = cur; curType = 'ex'; lastKey = null; continue;
    }
    if (line.match(/^=== ASSESSMENT/)) {
      cur = { items: [], steps: [] }; data.assessment = cur; curType = 'ex'; lastKey = null; continue;
    }
    if (line.match(/^=== LAB/)) {
      cur = { stages: [] }; data.lab = cur; curType = 'lab'; lastKey = null; continue;
    }
    if ((m = line.match(/^--- (\w+) \| (.*)$/))) {
      cur = { type: m[1], title: m[2].trim(), points: [], items: [] };
      axis.slides.push(cur); curType = 'slide'; lastKey = null; continue;
    }
    if ((m = line.match(/^\+\+\+ EX (\S+) \| (.*?) \| (.*?) \| (\w+) \| (\w+)/))) {
      cur = { id: m[1], title: m[2].trim(), icon: m[3].trim(), mode: m[4], format: m[5], steps: [], items: [] };
      axis.exercises.push(cur); curType = 'ex'; lastKey = null; continue;
    }
    if ((m = line.match(/^-\s+(.*)$/))) {
      const val = m[1].trim();
      if (curType === 'axis') cur.highlights.push(val);
      else if (curType === 'slide') {
        if (cur.type === 'examples' || cur.type === 'mistakes' || cur.type === 'tools') cur.items.push(val.replace(/\s*::\s*/, '::'));
        else cur.points.push(val);
      } else if (curType === 'ex') {
        if (lastKey === 'steps') cur.steps.push(val);
        else if (lastKey) cur[lastKey] = (cur[lastKey] ? cur[lastKey] + '\n' : '') + '- ' + val;
      }
      continue;
    }
    if ((m = line.match(/^(\w+):\s?(.*)$/))) {
      const k = m[1], v = m[2].trim();
      if (curType === 'ex' && k === 'q') {
        const p = v.split('||').map(s => s.trim());
        let answer = 0; const options = p.slice(1).map((o, i) => { if (o.startsWith('*')) { answer = i; return o.slice(1).trim(); } return o; });
        cur.items.push({ q: p[0], options, answer }); continue;
      }
      if (curType === 'ex' && k === 'tf') { const p = v.split('||').map(s => s.trim()); cur.items.push({ q: p[0], answer: p[1] === 'صح' }); continue; }
      if (curType === 'ex' && k === 'fb') { const p = v.split('||').map(s => s.trim()); cur.items.push({ text: p[0], answer: p[1] }); continue; }
      if (curType === 'ex' && k === 'cp') { const p = v.split('||').map(s => s.trim()); cur.items.push({ a: p[0], b: p[1], answer: p[2] }); continue; }
      if (curType === 'lab' && k === 'stage') { const p = v.split('|').map(s => s.trim()); cur.stages.push({ icon: p[0], title: p[1], task: p[2] }); continue; }
      if (k === 'chart') { cur.chart = parseChart(v); lastKey = null; continue; }
      if (k === 'highlights' || k === 'steps') { lastKey = k; continue; }
      cur[k] = v; lastKey = k; continue;
    }
    // سطر متابعة
    if (lastKey && cur) cur[lastKey] = (cur[lastKey] || '') + '\n' + line.trim();
  }
}

// خلط الخيارات بترتيب ثابت (بذرة من معرّف التمرين ورقم السؤال) حتى لا تتركز الإجابة الصحيحة في موضع واحد
function shuffleOpts(e) {
  (e.items || []).forEach((it, qi) => {
    if (!it.options) return;
    let seed = 7; for (const ch of String(e.id || 'assess') + ':' + qi) seed = (seed * 31 + ch.charCodeAt(0)) % 1000003;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const idx = it.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const correct = it.options[it.answer];
    it.options = idx.map(i => it.options[i]); it.answer = it.options.indexOf(correct);
  });
}
function finalize(data) {
  const exFix = e => {
    for (const k of RICH_EX) if (e[k] != null) e[k] = toHtml(e[k]);
    if (e.principle) e.principle = e.principle.trim();
    if (e.why) e.why = e.why.trim();
    if (!e.items || !e.items.length) delete e.items; else shuffleOpts(e);
    if (!e.steps || !e.steps.length) e.steps = [];
  };
  data.axes.forEach((a, ai) => {
    a.unit = +a.unit; a.color = +a.color; a.desc = toHtml(a.desc);
    a.slides.forEach((s, i) => {
      s.id = a.id + 's' + (i + 1);
      for (const k of RICH_SLIDE) if (s[k] != null) s[k] = toHtml(s[k]);
      if (!s.points.length) delete s.points;
      if (!s.items.length) delete s.items;
    });
    a.exercises.forEach(e => { e.axis = a.id; exFix(e); });
  });
  data.activities.forEach(e => { e.mode = e.mode || 'individual'; exFix(e); });
  if (data.survey) exFix(data.survey);
  if (data.lab) { data.lab.intro = toHtml(data.lab.intro); data.lab.minutes = 10; }
  if (data.assessment) { delete data.assessment.steps; data.assessment.id = 'assess'; shuffleOpts(data.assessment); }
  return data;
}

function parseAll(dir) {
  const data = { axes: [], activities: [], survey: null, lab: null, assessment: null };
  for (const f of ['u1.txt', 'u2.txt', 'u3.txt', 'u4.txt', 'u5.txt', 'u6.txt', 'extra.txt']) parseFile(fs.readFileSync(path.join(dir, f), 'utf8'), data);
  return finalize(data);
}

module.exports = { parseAll };
if (require.main === module) {
  const d = parseAll(path.join(__dirname, 'content'));
  const exCount = d.axes.reduce((n, a) => n + a.exercises.length, 0);
  const slCount = d.axes.reduce((n, a) => n + a.slides.length, 0);
  console.log('assessment', d.assessment && d.assessment.items.length, 'axes', d.axes.length, 'slides', slCount, 'exercises', exCount, 'activities', d.activities.length, 'lab stages', d.lab.stages.length);
  const fmt = {}; d.axes.forEach(a => a.exercises.forEach(e => { fmt[e.format + '/' + e.mode] = (fmt[e.format + '/' + e.mode] || 0) + 1; }));
  console.log(fmt);
  const charts = {}; d.axes.forEach(a => a.slides.forEach(s => { if (s.chart) charts[s.chart.kind] = (charts[s.chart.kind] || 0) + 1; }));
  console.log(charts);
  // تحقق من سلامة التمارين التفاعلية
  d.axes.forEach(a => a.exercises.forEach(e => {
    if (e.format !== 'text' && !(e.items && e.items.length)) console.log('NO ITEMS', e.id);
    if (e.format === 'fillblank' && e.mode !== 'group') console.log('MODE', e.id);
    if (e.format === 'comparePairs' && e.mode !== 'group') console.log('MODE', e.id);
    if ((e.format === 'mcq' || e.format === 'truefalse') && e.mode !== 'individual') console.log('MODE', e.id);
    if (e.format !== 'text' && e.items && e.items.length < 10) console.log('LESS THAN 10', e.id, e.items.length);
    if (e.format === 'fillblank') { const ans = e.items.map(i => i.answer); if (new Set(ans).size !== ans.length) console.log('DUP BANK', e.id, ans); e.items.forEach(i => { if (!/___/.test(i.text)) console.log('NO BLANK', e.id, i.text); }); }
  }));
}

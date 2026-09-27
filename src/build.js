// يبني الملف النهائي الواحد index.html من المصادر: node src/build.js
'use strict';
const fs = require('fs');
const path = require('path');
const { parseAll } = require('./parse');

const SRC = __dirname;
const OUT = path.join(SRC, '..', 'index.html');
const course = parseAll(path.join(SRC, 'content'));
const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
const jsFiles = fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).sort();
const js = jsFiles.map(f => '/* ===== ' + f + ' ===== */\n' + fs.readFileSync(path.join(SRC, 'js', f), 'utf8')).join('\n\n');
// المحتوى الافتراضي كما كُتب أول مرة — لا يُعدَّل أبدًا من المتصفح (كل تعديل تراكب منفصل في Firebase)
const courseJs = 'const COURSE = Object.freeze(' + JSON.stringify(course).replace(/<\/script/gi, '<\\/script') + ');';

const html = `<!DOCTYPE html>
<!--
  تسريع التجارة الإلكترونية للمشاريع الصغيرة والمتوسطة — منصة تدريبية تفاعلية
  ملف HTML واحد قائم بذاته (Vanilla JS) + Firebase Realtime Database
  الاتصال الحقيقي يعتمد على databaseURL في firebaseConfig (أسفل الملف).
  لمعاينة محلية دون لمس قاعدة البيانات الحقيقية أضف ?demo=1 إلى الرابط.
  يُستضاف كملف HTML عادي (Netlify Drop مثلًا، أو Google Sites بخيار Embed URL).
-->
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#8A1538">
<title>تسريع التجارة الإلكترونية للمشاريع الصغيرة والمتوسطة</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check-compat.js"></script>
<style>
${css}
</style>
</head>
<body>
<div id="app"><div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#7D879C">جارٍ التحميل…</div></div>
<script>
${courseJs}
</script>
<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(OUT, html);
console.log('built', OUT, (html.length / 1024).toFixed(0) + ' KB', 'axes', course.axes.length);

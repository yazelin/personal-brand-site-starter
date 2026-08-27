#!/usr/bin/env node
// 上線前的機器檢查。零依賴，node 直接跑：
//   node tools/check.mjs site/index.html
// 通過回傳 0，有錯回傳 1。這支擋的是「忘了改」跟「一定會被抓包」的那幾種錯，
// 不負責判斷好不好看。好不好看要人自己看。

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const file = process.argv[2] || 'site/index.html';
if (!existsSync(file)) {
  console.error(`找不到 ${file}`);
  console.error('用法：node tools/check.mjs site/index.html');
  process.exit(1);
}
const raw = readFileSync(file, 'utf8');
// 註解裡常常放「要換成這樣」的範例，那些不是真的標籤，掃描前先拿掉
const html = raw.replace(/<!--[\s\S]*?-->/g, '');
const dir = dirname(file);

// 連進來的本機 CSS 也要一起看，共用樣式放在 base.css 而不是行內 <style>
const linkedCss = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)]
  .map(m => m[1])
  .filter(h => !/^(https?:|\/\/)/i.test(h))
  .map(h => join(dir, h.split('?')[0]))
  .filter(existsSync)
  .map(p => readFileSync(p, 'utf8'))
  .join('\n');
const allCss = html + '\n' + linkedCss;

// 標籤層級的檢查要看的是版面本身，不是 <script> 與 <style> 的內容。
// 沒有拿掉的話，JS 註解裡提到的 <img> 會被當成真的圖片標籤
const markup = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

const errors = [];
const warns = [];
const fail = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const has = (re) => re.test(html);
const attr = (re) => (html.match(re) || [])[1]?.trim();

// 一、還沒換掉的示範內容
if (has(/name=["']x-demo-content["']/i))
  fail('還留著 <meta name="x-demo-content">。內容換成使用者自己的之後要刪掉這一行');
for (const s of ['李默', 'hello@example.com', 'https://example.com', '把複雜的流程做成人看得懂的介面'])
  if (html.includes(s)) fail(`還留著模板的示範內容：${s}`);
for (const s of ['TODO', 'Lorem ipsum', '你的名字', '請填寫', 'XXX'])
  if (html.includes(s)) fail(`還留著佔位字串：${s}`);

// 二、搜尋引擎與分享卡一定要有的東西
if (!attr(/<html[^>]*\slang=["']([^"']+)["']/i)) fail('<html> 少了 lang，螢幕閱讀器會用錯語言唸');
const title = attr(/<title>([^<]*)<\/title>/i);
if (!title) fail('少了 <title>');
else if (title.length < 6) warn(`<title> 只有 ${title.length} 個字，搜尋結果會很吃虧`);
else if (title.length > 60) warn(`<title> 有 ${title.length} 個字，搜尋結果會被截斷`);

const desc = attr(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
if (!desc) fail('少了 meta description，分享出去只會顯示網址');
else if (desc.length < 20) warn('meta description 太短，寫滿一到兩句話');

if (!has(/name=["']viewport["']/i)) fail('少了 viewport，手機上會整頁縮小');
if (!has(/property=["']og:title["']/i)) fail('少了 og:title，貼到社群不會有預覽卡');
if (!has(/property=["']og:image["']/i)) warn('少了 og:image，社群預覽卡不會有圖');
if (!has(/rel=["']canonical["']/i)) warn('少了 canonical');
if (!has(/rel=["'][^"']*icon/i)) warn('少了 favicon，分頁上會是一張白紙');

// 三、簡體字混進正體中文的頁面
// 用非 Claude 的模型跑這個流程時實測會發生：模型自己吐出「根据」「必须」這種字，
// 使用者看不出來，網站就這樣上線了。字表只收「簡體才有」的字，
// 台、准、后 這種正體也在用的不能放進來，會誤判
var SIMPLIFIED = /[这么们个来对说时会没经过还种样发点当电脑网页图书专业务实验证据历确级别标资软条获艺国与东车长门问间马鸟鱼龙见贝风飞齐亚儿广义华备复够关观规汉号欢环极计记讲认让设谁数谈团万为无习应银优员圆远运张织众]/g;
var lang = (attr(/<html[^>]*\slang=["']([^"']+)["']/i) || '').toLowerCase();
if (/^zh(-hant|-tw|-hk|-mo)?$/.test(lang) && !/hans|cn/.test(lang)) {
  var hits = [...new Set(markup.match(SIMPLIFIED) || [])];
  if (hits.length) fail(`頁面標了 lang="${lang}" 卻出現簡體字：${hits.join(' ')}`);
}

// 四、結構
const h1 = markup.match(/<h1[\s>]/gi) || [];
if (h1.length === 0) fail('整頁沒有 <h1>');
else if (h1.length > 1) fail(`有 ${h1.length} 個 <h1>，一頁只能有一個`);

// 五、圖片
for (const tag of markup.match(/<img\b[^>]*>/gi) || []) {
  if (!/\salt=/i.test(tag)) fail(`有 <img> 沒寫 alt：${tag.slice(0, 70)}`);
  if (!/\swidth=/i.test(tag) || !/\sheight=/i.test(tag))
    warn(`有 <img> 沒寫 width/height，載入時版面會跳：${tag.slice(0, 70)}`);
  // 選了要圖的版面卻沒放圖，是這條線最常見的翻車方式。本機路徑就直接檢查檔案在不在
  var src = (tag.match(/\ssrc=["']([^"']+)["']/i) || [])[1];
  if (src && !/^(https?:|data:|\/\/)/i.test(src) && !existsSync(join(dir, src.split('?')[0])))
    fail(`<img> 指到 ${src}，但那個檔案不存在`);
}

// 六、外連安全
for (const tag of markup.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi) || [])
  if (!/rel=["'][^"']*noopener/i.test(tag)) fail(`target="_blank" 少了 rel="noopener"：${tag.slice(0, 70)}`);

// 七、有沒有叫人做事
const ctas = markup.match(/href=["'](mailto:|tel:|https?:)[^"']*["']/gi) || [];
if (ctas.length === 0) fail('整頁沒有任何一個可以聯絡或購買的連結，這個網站沒有出口');

// 八、首屏動效
const heroSrc = attr(/<script[^>]+src=["']([^"']*hero[^"']*\.js)["']/i);
if (!/<canvas/i.test(markup)) warn('首屏沒有 <canvas>，如果本來就不打算做動效可以忽略');
else if (!heroSrc) fail('有 <canvas> 但沒有載入 hero.js');
else {
  const p = join(dir, heroSrc);
  if (!existsSync(p)) fail(`載入了 ${heroSrc}，但那個檔案不在 ${p}`);
  else {
    const js = readFileSync(p, 'utf8');
    if (!/prefers-reduced-motion/.test(js))
      fail(`${heroSrc} 沒有處理 prefers-reduced-motion，會動的東西一定要能關掉`);
    if (!/visibilitychange/.test(js))
      warn(`${heroSrc} 沒有在分頁切走時停掉迴圈，會在背景一直燒電`);
  }
}
if (!/prefers-reduced-motion/.test(allCss)) warn('CSS 裡沒有 prefers-reduced-motion 的處理');

// 九、預覽用的東西要刪掉
if (has(/URLSearchParams\(location\.search\)\.get\(['"]vibe['"]\)/))
  fail('還留著預覽用的 ?vibe 切換程式，上線前要刪掉');

// 報告
const line = (m) => console.log('  ' + m);
if (warns.length) { console.log(`\n提醒 ${warns.length} 項（不擋上線，但值得處理）`); warns.forEach(line); }
if (errors.length) {
  console.log(`\n必須修正 ${errors.length} 項`);
  errors.forEach(line);
  console.log('');
  process.exit(1);
}
console.log(`\n${file} 通過機器檢查。接下來的事情機器看不出來，要你自己看：`);
console.log('  手機上開一次、把網路調到慢速開一次、把整頁唸出來聽通不通順。');
console.log('');

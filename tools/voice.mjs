#!/usr/bin/env node
// 檢查使用者自己講過的話還在不在。零依賴，node 直接跑：
//   node tools/voice.mjs site/index.html site/voice.txt
// voice.txt 一行一句，是訪談時他自己講出來、你決定要放上網站的話。
// 優化跑到第三圈的時候，他講得最好的那幾句常常已經被改光了，這支就是擋這件事的。

import { readFileSync, existsSync } from 'node:fs';

const [file, voiceFile] = [process.argv[2] || 'site/index.html', process.argv[3] || 'site/voice.txt'];
if (!existsSync(file) || !existsSync(voiceFile)) {
  console.error(`用法：node tools/voice.mjs <網頁> <voice.txt>`);
  console.error(`找不到 ${!existsSync(file) ? file : voiceFile}`);
  process.exit(1);
}

// 只看畫面上的文字，標籤、樣式、程式碼都不算
const text = readFileSync(file, 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, '')
  .replace(/\s+/g, '');

const lines = readFileSync(voiceFile, 'utf8')
  .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

const missing = [];
for (const line of lines) {
  const needle = line.replace(/\s+/g, '');
  if (!text.includes(needle)) missing.push(line);
}

console.log(`\n他自己講過的話：${lines.length} 句，還在網站上的 ${lines.length - missing.length} 句`);
if (missing.length) {
  console.log(`\n不見了 ${missing.length} 句：`);
  for (const m of missing) console.log('  ' + m);
  console.log('\n每一句都要有交代：加回去，或是跟他確認過才准拿掉。');
  console.log('受眾的意見是用來補的，不是用來換掉他的話的。\n');
  process.exit(1);
}
console.log('沒有一句被改掉。\n');

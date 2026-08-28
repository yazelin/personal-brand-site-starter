#!/usr/bin/env node
// 驗 spec/site.yaml 的必要欄位有沒有齊。零依賴，不做完整 YAML 解析，
// 只看 key 在不在、有沒有填東西——擋的是「代理人自己發明一套 schema」。
// 用法：node tools/spec-check.mjs spec/site.yaml

import { readFileSync, existsSync } from 'node:fs';

const file = process.argv[2] || 'spec/site.yaml';
if (!existsSync(file)) {
  console.error(`找不到 ${file}\n用法：node tools/spec-check.mjs spec/site.yaml`);
  process.exit(1);
}
const raw = readFileSync(file, 'utf8').replace(/```\w*\n?/g, '');

// [key, 說明, 是不是硬性]
const NEED = [
  ['goal',      'buy / contact / remember / hire / card 五選一', true],
  ['one_line',  '這個網站要讓來的人做哪一件事', true],
  ['name',      '他要別人怎麼稱呼他', true],
  ['tagline',   '首屏大標，他自己的話', true],
  ['lede',      '副標，他自己的話', true],
  ['audience',  '一個具體的人，階段五要拿它當角色', true],
  ['avoid',     '他明講絕對不要的東西', true],
  ['vibe',      'calm / bold / gallery / grand', false],
  ['layout',    'stack / split / editorial / bleed / console', false],
  ['hosting',   '階段二填', false],
];
const GOALS = ['buy','contact','remember','hire','card'];

const has = (k) => new RegExp(`^\\s*${k}\\s*:\\s*(.*)$`, 'm').exec(raw);

const missing = [], empty = [], warn = [];
for (const [k, why, hard] of NEED) {
  const m = has(k);
  if (!m) { (hard ? missing : warn).push(`${k} — ${why}`); continue; }
  const v = m[1].trim();
  // 值可以寫在下一行（區塊或清單），所以空值要再看下一行有沒有縮排內容
  if (!v) {
    const after = raw.slice(m.index + m[0].length);
    if (!/^\n\s+\S/.test(after)) (hard ? empty : warn).push(`${k} — ${why}`);
  }
}
const g = has('goal');
if (g && g[1].trim() && !GOALS.includes(g[1].trim().split(/\s|#/)[0]))
  warn.push(`goal 寫的是「${g[1].trim().split(/\s|#/)[0]}」，應該是 ${GOALS.join(' / ')} 其中一個`);

if (warn.length) { console.log(`\n提醒 ${warn.length} 項`); warn.forEach(w => console.log('  ' + w)); }
if (missing.length || empty.length) {
  console.log(`\n必要欄位有問題 ${missing.length + empty.length} 項`);
  missing.forEach(m => console.log('  少了 ' + m));
  empty.forEach(m => console.log('  空的 ' + m));
  console.log('\n不要自己發明結構。完整格式看 spec/site.example.yaml。\n');
  process.exit(1);
}
console.log(`\n${file} 必要欄位都在。\n`);

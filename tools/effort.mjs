#!/usr/bin/env node
// 算一個專案「做多久」，用來寫在作品卡上。零依賴，只讀 git log。
//   node tools/effort.mjs ~/my-project
//
// 為什麼需要這支：作品集常常想寫「花了多久」，而那個數字最容易寫錯。
// 兩個坑都實測過：
//   1. 拿「第一個到最後一個 commit」當答案 → 那是「一直在維護」，不是「做多久」
//   2. 沒有排除自動化 commit → 有個每小時自動更新的專案，含 bot 算出「前一半要 85 天」，
//      排除後是 12 天，差七倍
// 這支兩個坑都擋掉，輸出的是可以直接寫上網站的句子。

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const repo = process.argv[2];
if (!repo || !existsSync(`${repo}/.git`)) {
  console.error('用法：node tools/effort.mjs <git 專案的路徑>');
  process.exit(1);
}
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' });

const rows = git('log', '--reverse', '--format=%ad|%an', '--date=short')
  .split('\n').filter(Boolean)
  .map(l => { const [d, who] = l.split('|'); return { d: new Date(d), who }; });

if (!rows.length) { console.error('沒有 commit'); process.exit(1); }

// 自動化的 commit 不算人做的工
const isBot = (w) => /\[bot\]|actions|dependabot|renovate/i.test(w);
const human = rows.filter(r => !isBot(r.who));
const botCount = rows.length - human.length;

if (!human.length) { console.error('全部都是自動化 commit'); process.exit(1); }

const days = (a, b) => Math.round((b - a) / 86400000);
const first = human[0].d, last = human[human.length - 1].d;
const at = (p) => human[Math.min(human.length - 1, Math.floor(human.length * p))].d;

const burst = days(first, at(0.25));   // 前四分之一的工作花了幾天
const half  = days(first, at(0.50));
const span  = days(first, last);

console.log(`\n${repo}`);
console.log(`  人工 commit ${human.length} 個` + (botCount ? `（另有 ${botCount} 個自動化的，已排除）` : ''));
console.log(`  前 25% 的修改在 ${burst} 天內完成`);
console.log(`  前 50% 的修改在 ${half} 天內完成`);
console.log(`  第一個到最後一個 commit 相隔 ${span} 天`);

const word = (n) => n <= 1 ? '一天' : `${n} 天`;
console.log(`\n可以寫在作品卡上的句子：`);
console.log(`  「一半的修改在${word(half)}內做完，之後陸續改了 ${span} 天」`);
if (botCount > human.length)
  console.log(`\n  注意：這個專案的 commit 大部分是自動化的（${botCount} 對 ${human.length}）。`);
console.log(`\n不要寫「花了 ${span} 天做」——那是維護的時間，不是做出來的時間。\n`);

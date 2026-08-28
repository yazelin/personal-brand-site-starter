#!/usr/bin/env node
// 算一個專案「做多久」，用來寫在作品卡上。零依賴，只讀 git log 與 .github/workflows。
//   node tools/effort.mjs ~/my-project
//
// 為什麼需要這支：作品集常常想寫「花了多久」，那個數字最容易寫錯。三個坑都實測過：
//   1. 拿「第一個到最後一個 commit」當答案 → 那是「一直在維護」，不是「做多久」
//   2. 沒排除自動化 commit → 有個每小時更新的專案，含 bot 算出「前一半要 85 天」，
//      排除後 12 天，差七倍
//   3. 只靠作者名字排除 → workflow 若用個人 token 推送，作者就是本人，全漏。
//      所以另外從 .github/workflows 讀出 commit 訊息，用訊息再擋一次。

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.argv[2];
if (!repo || !existsSync(join(repo, '.git'))) {
  console.error('用法：node tools/effort.mjs <git 專案的路徑>');
  process.exit(1);
}
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' });
const SEP = '|~|';

// ── 一、從 workflow 撈出自動 commit 的訊息長什麼樣 ────────────────
const wfDir = join(repo, '.github', 'workflows');
const patterns = [];
let hasVariableMsg = false;
if (existsSync(wfDir)) {
  for (const f of readdirSync(wfDir).filter(n => /\.ya?ml$/i.test(n))) {
    const y = readFileSync(join(wfDir, f), 'utf8');
    for (const m of y.matchAll(/git\s+commit[^\n]*?-m\s+(['"])([^'"]+)\1/g)) {
      const raw = m[2];
      // 把整個模板轉成正則，變數換成萬用字元。只取變數前面那一小段當前綴會誤殺：
      // workflow 是「feat: 第 $N 話草稿(自動產出,待人工確認)」，
      // 只比對「feat: 第」會把人寫的「feat: 第三話——伺服器重啟中！」也擋掉。
      const parts = raw.split(/\$\{\{[^}]*\}\}|\$\{\w+\}|\$\w+/);
      const fixedChars = parts.join('').trim().length;
      if (fixedChars >= 8) {
        const rx = parts.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
        patterns.push(new RegExp('^' + rx));
      } else {
        hasVariableMsg = true;
      }
    }
  }
}

// ── 二、讀 commit，兩道都擋 ───────────────────────────────────────
const rows = git('log', '--reverse', `--format=%ad${SEP}%an${SEP}%s`, '--date=short')
  .split('\n').filter(Boolean)
  .map(l => { const [d, who, subj] = l.split(SEP); return { d: new Date(d), who: who || '', subj: subj || '' }; });
if (!rows.length) { console.error('沒有 commit'); process.exit(1); }

const byAuthor = (r) => /\[bot\]|actions|dependabot|renovate/i.test(r.who);
const byMessage = (r) => patterns.some(p => p.test(r.subj));

const human = rows.filter(r => !byAuthor(r) && !byMessage(r));
const botA = rows.filter(byAuthor).length;
const botM = rows.filter(r => !byAuthor(r) && byMessage(r)).length;
if (!human.length) { console.error('全部都是自動化 commit'); process.exit(1); }

const days = (a, b) => Math.round((b - a) / 86400000);
const first = human[0].d, last = human[human.length - 1].d;
const at = (p) => human[Math.min(human.length - 1, Math.floor(human.length * p))].d;
const burst = days(first, at(0.25)), half = days(first, at(0.50)), span = days(first, last);

console.log(`\n${repo}`);
console.log(`  人工 commit ${human.length} 個`);
if (botA) console.log(`  排除：作者是機器人的 ${botA} 個`);
if (botM) console.log(`  排除：訊息對上 workflow 的 ${botM} 個`);
if (patterns.length) console.log(`  workflow 的自動訊息樣式：${patterns.map(p => `「${p.source.slice(1)}」`).join('、')}`);
console.log(`  前 25% 的修改在 ${burst} 天內完成`);
console.log(`  前 50% 的修改在 ${half} 天內完成`);
console.log(`  第一個到最後一個 commit 相隔 ${span} 天`);

const word = (n) => n <= 1 ? '一天' : `${n} 天`;
console.log(`\n可以寫在作品卡上的句子：`);
console.log(`  「一半的修改在${word(half)}內做完，之後陸續改了 ${span} 天」`);
if (botA + botM > human.length)
  console.log(`\n  注意：這個專案大部分的 commit 是自動化的（${botA + botM} 對 ${human.length}）。`);
if (hasVariableMsg)
  console.log(`\n  注意：有 workflow 的 commit 訊息是變數（像 -m "$MSG"），訊息比對抓不到，`
            + `\n  那部分只能靠作者名字擋。如果那支 workflow 用的是個人 token，數字會偏高。`);
console.log(`\n不要寫「花了 ${span} 天做」——那是維護的時間，不是做出來的時間。\n`);

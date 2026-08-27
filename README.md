# personal-brand-site-starter

把一個人的話問出來，做成一頁式的個人品牌網站，首屏會流動。

**In short:** paste this repo's URL into your AI coding agent and ask it to follow
`AGENTS.md`. It interviews you, picks a host that matches your actual situation,
builds a one-page personal site with an animated hero, and checks it before you ship.
Docs are in Traditional Chinese. Zero dependencies, zero build step.

## 這是什麼

一份給 AI 代理人照著跑的作業流程。你不用會寫程式，也不用挑技術。

網路上做個人網站的模板很多，問題是換上你的名字之後，它還是一份模板。
這個 repo 的重點在**前面那段訪談**：先問出你到底要讓來的人做哪一件事，
再決定要放什麼、放在哪裡、長什麼樣。

## 怎麼用

打開你在用的 AI 工具（Claude Code、Codex、Gemini CLI、Cursor 都可以），把這段貼進去：

```
請讀 https://github.com/yazelin/personal-brand-site-starter 的 AGENTS.md，
照它的四個階段幫我做個人品牌網站。先訪談我，不要直接開始寫程式。
```

接下來它會問你問題，一次一題。老實回答就好，答不出來的說不知道，它會替你決定。

想要在本機跑得更順的話，先把 repo 抓下來：

```bash
git clone https://github.com/yazelin/personal-brand-site-starter
cd personal-brand-site-starter
```

然後叫你的 AI 讀 `AGENTS.md`。

## 四個階段

| 階段 | 做什麼 | 產出 |
|---|---|---|
| 一 訪談 | 問出你真正要促成哪一件事，賣東西、接案、作品集、求職，還是一張正式的名片 | `spec/site.yaml` |
| 二 選型 | 依照你的狀況決定放在哪裡，要不要後端，要不要收錢 | spec 的 `hosting` 區塊 |
| 三 建站 | 生出網站，配一種會流動的首屏 | `site/` |
| 四 驗收 | 機器檢查加人眼確認，然後上線 | 一個能用的網址 |

每個階段結束會停下來給你看，不會一路做到底再一次丟給你。

## 四種版面

**結構不一樣，不只是換顏色。** [線上一次比較](https://yazelin.github.io/personal-brand-site-starter/templates/preview.html)。

- **堆疊** 吸頂導覽、靠左首屏、區塊上下堆疊。最通用，判斷不出來就用這個。
- **左右分屏** 首屏左字右動效，內容區左邊黏著標題右邊捲動。雜誌感最強。
- **編號索引** 每個區塊掛一個大編號，字級對比拉到最大。內容少的人用這個最划算。
- **滿版出血** 圖片鋪滿寬度，文字疊在上面。手上有好圖的人才選。

版面決定於內容有多少、有沒有圖，不是決定於好不好看。四種版面各自可以再套四種風格。

## 四種風格

寫在 `<html data-vibe="...">` 一個字就換整站氣質。

- `calm` 克制：淺底、細字、大量留白。求職、顧問、專業服務。
- `bold` 明確：深底、大字、一個亮色。賣東西、接案。
- `gallery` 作品優先：介面退到最淡，圖片佔滿。設計、攝影、影像。
- `grand` 大氣：墨底、襯線大標、金屬色、超大留白。講者、顧問。

## 五種會流動的首屏

`hero/` 底下五支，各自獨立一個檔案。
[線上一次看到五種在動](https://yazelin.github.io/personal-brand-site-starter/hero/preview.html)，
或是在本機開 `hero/preview.html`。

- **流體漸層** 色塊疊加後模糊，緩慢流動。最省效能，也最搶眼。
- **粒子場** 點漂移並連線，滑鼠經過會推開。技術感重。
- **噪聲線條** 一疊橫線緩緩起伏，像等高線。最安靜。
- **幾何緩動** 大型線稿圖形極慢地漂移，像一張會呼吸的海報。
- **流體墨彩** 游標攪動、點一下潑灑的流體，沒人動的時候自己流。最有存在感，也最重。

前四支是零依賴的手寫效果，幾十行，參數開在檔案最上面，AI 會照你的內容調過再用。
第五支是移植過來的 Navier-Stokes 求解器，只調參數不用讀內容，
出處與授權寫在 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

五支都做好了三件事：跟著系統設定關掉動畫、分頁切走停止運算、高解析螢幕不糊。
五種都不對的時候，`docs/effects.md` 會帶你去 90 個開源特效裡挑，
並且說明怎麼包成同一套介面。

## 檢查

```bash
node tools/check.mjs site/index.html
```

擋的是幾種一定會被抓包的錯：模板的示範內容忘了換、搜尋引擎與社群分享要的標籤沒寫、
會動的東西沒辦法關掉、圖片檔案不存在、正體中文的頁面混進簡體字。
最後那兩條是實測出來的：用非 Claude 的模型跑這條流程，它會把「根據」「必須」寫成簡體。
通過回傳 0。好不好看它不管，那要你自己看，清單在 `skills/04-verify/SKILL.md`。

## repo 長什麼樣

```
AGENTS.md              總控，AI 從這裡開始讀
skills/                四個階段各一份作業指引
templates/             四種版面骨架，preview.html 可以一次比較
templates/tokens.css   顏色、字級、間距的變數，改這裡就換掉整站氣質
templates/base.css     四種版面共用的元件樣式
hero/                  四種首屏動效，外加一頁可以一次比較的預覽
tools/check.mjs        上線前的機器檢查，零依賴
spec/site.example.yaml 訪談產出長什麼樣
docs/                  部署步驟、參考站清單、更兇的特效、可以另外裝的第三方 skills
```

## 參考哪些站

`docs/inspiration.md` 收了一批真人做的站，依照四種風格分好，
每一個都寫了「看什麼」。AI 在問你風格的時候會挑幾個丟給你看，
因為看得到的東西問得出意見，形容詞問不出來。

## 沒有做的事

沒有 build step，沒有 npm install，沒有框架。
產出就是可以直接丟上任何靜態空間的 HTML、CSS 跟一支 JS。

沒有夾帶別人寫的 skills。找到的相關工具列在 `docs/external-skills.md`，
要用自己去裝，AI 不會替你安裝任何東西。

唯一移植進來的第三方程式是流體墨彩那支，出處與授權寫在
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 授權

MIT，© 2026 林亞澤。做出來的網站是你的，內容、文案、圖片都歸你。

---

亞澤的其他作品：[GitHub](https://github.com/yazelin) · [個人網站](https://yazelin.github.io/) · [Facebook](https://www.facebook.com/yazelin.j303) · [請我喝杯咖啡](https://buymeacoffee.com/yazelin)

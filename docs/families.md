# 美學族譜

**這個 repo 一開始只做得出一種美學：單色、克制、文件感。**
那是一種品味，不是唯一一種，而且四個範例排在一起會讓人以為只能做出那種。
這一份是族譜，用來擴充選擇。

挑族的順序：**先問他是誰、他的受眾是誰，再挑族，最後才挑概念。**
族決定「這個站的性格」，概念決定「這個站的骨架」。兩件事不一樣。

## 一個少有人用的判準：動畫的性格

分析既有作品的 `@keyframes` 名稱，發現每一族的動畫在做的事完全不同：

| 族 | keyframes 在動什麼 |
|---|---|
| 圖鑑 | `bob / buoy / drift / ripple / sea-sway / float` — **漂浮與波動** |
| 霓虹 | `flicker / glow / pulse / stamp / reveal` — **閃爍與脈動** |
| 終端 | `boot / spinGlow / pulseDot / idle` — **開機與待機** |
| 訊號 | 流體本身在流，不需要 keyframes |
| 克制 | 幾乎沒有動畫 |

**挑族的時候先問「這個人的動應該是哪一種動」**，比問「你喜歡什麼顏色」準得多。

---

## 一、克制（文件感）

單色、文件隱喻、方格、留白。**內容要被仔細讀的人用這一族。**

- **誰適合**：顧問、講師、工程師、求職、諮商、任何內容量大的人
- **誰不適合**：作品本身就是視覺的人
- **色彩**：一到兩色加一個強調色，飽和度低
- **動畫的性格**：幾乎不動。動的只有首屏的背景，而且要壓得很低
- **repo 裡的骨架**：`templates/stack.html`、`split.html`、`editorial.html`、`console.html`
- **參考**：[sive.rs](https://sive.rs/)、[tomcritchlow.com](https://tomcritchlow.com/)、
  [mxb.dev](https://mxb.dev/)

## 二、訊號（動效當主角）

動效鋪滿畫面，名字用漸層剪成看動效的窗，配顆粒與暗角。

- **誰適合**：作品本身就是視覺的人、想被記住勝過想被讀完的人
- **誰不適合**：內容量大的人。字會被吃掉
- **色彩**：深底加二到三個高飽和的螢光色
- **動畫的性格**：**流**。連續、沒有起點也沒有終點
- **關鍵手法**：`background-clip: text` 剪字並讓漸層流動、`mix-blend-mode`、
  SVG 顆粒、暗角、捲離首屏用 IntersectionObserver 淡出
- **repo 裡的骨架**：`templates/signal.html`、範例 `examples/vj.html`
- **參考**：[yazelin.github.io/j303](https://yazelin.github.io/j303/)（原始版本，
  三層 canvas、名字挖空讓流體透出來）

## 三、圖鑑（漂浮／收藏／系列）

深色底上一整片會漂的東西，內容排成可以收集的卡片或格。

- **誰適合**：有**系列作品**的人。插畫家、做角色的人、收藏者、寫連載的人
- **誰不適合**：只有三件作品的人。圖鑑要有量才成立
- **色彩**：深藍或墨色打底，配奶白與米黃這種暖色，**色數可以多**
- **動畫的性格**：**漂**。上下浮動、緩慢側移、水波。每個元素各自漂，週期不同
- **關鍵手法**：`@keyframes` 做 2 到 6 秒的上下浮動並給每張卡不同的 `animation-delay`、
  inline SVG 當插畫、卡片有厚度（多層 `box-shadow`）
- **參考**：[台灣人代表](https://yazelin.github.io/taiwan-people/)
  （深藍夜海配奶白，`bob / buoy / drift / ripple / sea-sway` 五種漂法同時在跑）

## 四、霓虹街機（閃爍／脈動／夜色）

洋紅配青配黃，HUD 式的極小字大字距，東西會閃。

- **誰適合**：遊戲、電音、夜生活、街頭、實況主
- **誰不適合**：需要顯得可靠的人。這一族天生像在辦活動
- **色彩**：純黑或深藍夜底，配 `#ff2a78` 洋紅、`#00e0ff` 青、`#ffd84a` 黃這種對撞色
- **動畫的性格**：**閃**。不規則、有節拍、會停頓。霓虹燈管的壞掉感是重點
- **關鍵手法**：`text-shadow` 疊三層做輝光、`@keyframes` 用不平均的
  `steps()` 做故障閃爍、按鈕 `pulse`、成績或狀態用蓋章式的 `stamp` 動畫
- **參考**：[Roll Formosa](https://yazelin.github.io/roll-formosa/)
  （`ny-flicker / ny-skyglow / ny-titleflick / rank-stamp`）

## 五、終端（開機／面板／角色）

深青配螢光青，面板堆疊，有開機動畫，可以有一個角色陪著。

- **誰適合**：工程、AI、系統、自動化。比「機櫃」那種概念更活潑，因為有角色與開機儀式
- **誰不適合**：非技術受眾。術語感重
- **色彩**：`#0d2b3a` 這種深青底，配 `#2dd4bf` 螢光青當唯一亮色
- **動畫的性格**：**開機與待機**。進場有一次性的 boot 動畫，之後是小幅度的 idle 循環
- **關鍵手法**：進場的逐行顯示、`pulseDot` 狀態燈、面板卡片重複堆疊、
  一個 idle 動的小角色（`petbob` / `yzIdle` 這種）
- **參考**：[格莉奇 OS](https://yazelin.github.io/ai-brain-site/)（26 張面板卡片＋開機動畫＋角色）

## 六、粗獷（Neobrutalism）

粗黑框、不模糊的位移陰影、對撞色、超大字、故意的歪斜。

- **誰適合**：設計、行銷、想顯得有主張的人
- **誰不適合**：要顯得溫和可靠的人
- **色彩**：高飽和對撞色配純黑框，白底或亮色底
- **動畫的性格**：**彈**。hover 時位移、按下去陷下去，沒有緩動曲線那種軟綿綿
- **關鍵手法**：`border: 3px solid #000`、`box-shadow: 8px 8px 0 #000`（不要模糊）、
  `transform: rotate(-1.4deg)`、`border-radius: 0`
- **repo 裡的骨架**：`templates/console.html` 用了一半（粗框加位移陰影加實體按鈕）
- **參考**：[NN/g 的 Neobrutalism 說明](https://www.nngroup.com/articles/neobrutalism/)、
  [Neobrutalism 範例集](https://www.downgraf.com/inspiration/20-neobrutalism-web-design-examples-that-break-all-the-rules/)

## 七、復古介面（Y2K／OS 懷舊）

鉻面漸層、光暈、視窗邊框、故意的低解析感。

- **誰適合**：做懷舊主題的人、獨立遊戲、音樂、次文化
- **誰不適合**：企業客戶會看的頁面
- **色彩**：銀灰鉻面加冷色漸層，或是螢光配黑
- **動畫的性格**：**掃描與閃爍**。掃描線、CRT 抖動、載入條
- **關鍵手法**：`repeating-linear-gradient` 做掃描線、
  多層 `linear-gradient` 做鉻面、視窗標題列與假的關閉鈕
- **參考**：[2026 的 retro 與 brutalist UI 指南](https://www.setproduct.com/blog/retro-brutalist-ui-design-2026)、
  [Y2K 與 Neo-Brutalism 的比較](https://blog.cgfrog.com/y2k-vs-neo-brutalism-design-trends/)

---

## 怎麼用這一份

**一、訪談問完內容之後，用「動的性格」問族**，不要問顏色：

> 如果你的網站上有東西在動，你希望它是**漂**的、**閃**的、**流**的，
> 還是幾乎**不動**？

四個選項對應到圖鑑／霓虹／訊號／克制。答不出來就給他看範例。

**二、族挑完才問概念。** 族是性格，概念是骨架，兩件事分開問。
同一個概念可以做成不同族：「工單」可以是克制的工程圖，也可以是粗獷的黑黃警示牌。

**三、族不對就整個重來，不要在錯的族裡調參數。**
一個做電音的人配上克制族，字距與留白調到死都不會對。

**四、族與受眾要對得起來。** 霓虹族很好看，但如果他的受眾是要付六位數的企業窗口，
那一族會讓他看起來像在辦活動。這一題比好不好看重要。

# 給 AI 代理人的作業指令

你正在幫一個真人做他的個人品牌網站。這份檔案是總控，照著跑。
（Claude Code、Codex、Gemini CLI、Cursor、Windsurf 都讀得懂這份檔案。）

## 三條不能破的規則

**一、先訪談，訪談完成前不准寫任何一行 HTML。**
使用者說「你直接幫我做就好」也一樣。沒有訪談的網站會長成一張通用模板，
放上去等於沒放。訪談的產出是 `spec/site.yaml`，那份檔案是後面所有步驟的唯一依據。

**二、使用者不知道的事，你替他決定，然後用一句話告訴他你選了什麼、為什麼。**
不要把「你要用 Cloudflare Pages 還是 Render」這種問題丟回去。他不知道才來找你。
判斷依據寫在 `skills/02-hosting-choice/SKILL.md`，照那份決策樹走。

**三、每個階段結束停下來，把成果給他看過再繼續。**
一路做到底再一次交出來，等於逼他從頭改起。

**四、`docs/` 底下的清單是流程的一部分。**
到了下表指定的時機**一定要打開來讀**，不要憑印象跳過：

| 什麼時候 | 打開哪一份 | 要做什麼 |
|---|---|---|
| 階段一問到風格 | `templates/preview.html` | **先給他看做得出來的東西**，讓他從十六種組合裡挑 |
| 挑完版面之後 | `docs/inspiration.md` | 去 personalsit.es 篩他那一行，找同行的站補充討論 |
| 階段一問概念 | `docs/concept.md` | 問出一個屬於他這一行的東西。**這一題最決定成品像不像他** |
| 想知道成品長怎樣 | `examples/` | 四個行業的完整範例，每一個都附對打的票數 |
| 階段三挑版面 | `templates/preview.html` | 五種版面各自適合誰，都寫在那一頁 |
| 階段三排版前 | `docs/images.md` | 使用者手上沒有能用的圖的時候怎麼辦，還有一條不能踩的紅線 |
| 階段三排版時 | `docs/concept.md` | 把概念變成三個具體決定，只在首屏做足 |
| 階段三排版時 | `docs/craft.md` | 中文排版的具體數值與破除套版感的手法，附怎麼量自己有沒有進步 |
| 階段二決定放哪裡 | `docs/deploy.md` | 照選定平台的步驟寫給他 |
| 階段三開始排版前 | `docs/inspiration.md` | 看完就關掉。對著別人的站排版，做出來的是別人的站 |
| 使用者說要更酷的效果 | `docs/effects.md` | 先確認他真的需要，再去挑 |
| 階段三、四開始時 | `docs/external-skills.md` | 看有沒有已經裝好的 skill 可以搭，**有就用，沒有就講一句帶過** |

**不要自己去安裝任何第三方 skill 或套件。** 那些是選配，
使用者自己裝好了你才用得到。他沒裝，你就照這個 repo 內建的做完，
最多在交付的時候提一句「想要更嚴的檢查可以另外裝這個」。

## 四個階段

| 階段 | 做什麼 | 讀哪份 | 產出 |
|---|---|---|---|
| 1 訪談 | 問出他真正要促成哪一件事 | `skills/01-interview/SKILL.md` | `spec/site.yaml` |
| 2 選型 | 決定放在哪裡、要不要後端 | `skills/02-hosting-choice/SKILL.md` | spec 裡的 `hosting` 區塊 |
| 3 建站 | 生出網站，包含會流動的首屏 | `skills/03-build/SKILL.md` | `site/index.html` 等 |
| 4 驗收 | 機器檢查加人眼確認，然後上線 | `skills/04-verify/SKILL.md` | 檢查通過的線上網址 |

一個階段跑完，跟他確認過，再進下一個。

## 這個 repo 有什麼

```
AGENTS.md              你正在讀的這份，總控
skills/                四個階段各一份作業指引
templates/             五種版面骨架，開 templates/preview.html 一次比較
examples/              四個行業的完整範例，用這條流程做出來就會長那樣
templates/tokens.css   顏色、字級、間距的變數，改這裡就換掉整站氣質
templates/base.css     四種版面共用的元件樣式
hero/                  四種首屏動效，零依賴，各自獨立一支
tools/check.mjs        上線前的機器檢查，零依賴，node 直接跑
spec/site.example.yaml 訪談產出長什麼樣的範例
docs/                  部署步驟、參考站清單、更兇的特效、可以外掛的第三方 skills
```

## 開工

挑好版面之後這樣開工，不要直接改 `templates/`。使用者之後想重來一次，模板要是乾淨的。

```bash
mkdir -p site
cp templates/<挑的版面>.html site/index.html
cp templates/tokens.css templates/base.css site/
cp hero/<挑的動效>.js site/hero.js
```

從 `skills/01-interview/SKILL.md` 開始。

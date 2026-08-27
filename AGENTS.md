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
templates/index.html   一頁式網站骨架，單檔可跑，已經填了示範內容
templates/tokens.css   顏色、字級、間距的變數，改這裡就換掉整站氣質
hero/                  四種首屏動效，零依賴，各自獨立一支
tools/check.mjs        上線前的機器檢查，零依賴，node 直接跑
spec/site.example.yaml 訪談產出長什麼樣的範例
docs/                  部署方式、可以外掛的第三方 skills
```

## 開工

複製一份 `templates/` 到 `site/` 之後才動手改，不要直接改 `templates/`。
使用者之後想重來一次，模板要是乾淨的。

從 `skills/01-interview/SKILL.md` 開始。

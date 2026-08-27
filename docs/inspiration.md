# 參考哪些站

## 先看做得出來的那些

**第一個給使用者看的，是 `templates/preview.html`。** 那裡有四種版面乘以四種風格，
十六種組合都是他真的會拿到的東西。

拿外面的站當範例有一個很大的風險：**看到做不到的東西，會對做得到的東西失望。**
先讓他從實際會拿到的東西裡選，選完之後再拿外部的站來補充討論。順序反過來就不對。

## 先看這一個

[musicalwebdev.com](https://musicalwebdev.com/) —— 一位開發者兼教學者的個人站，
整個站的概念是百老匯的節目單。首屏是一張傾斜的 Playbill 封面，名字直排在右側，
頂端跑著歌詞。

**查過它的原始碼：沒有 WebGL、沒有 canvas，唯一的外部 script 是流量統計。**
它用的是 `rotate()` 八次、`writing-mode` 直排四次、`box-shadow` 位移陰影十八次、
三組 keyframes、等寬字、grid。全部都是普通 CSS。

它比多數精緻的模板更像人做的，而它用的技術更少。
**差別在於它有一個概念，而那個概念來自她是誰。**

做法在 `docs/concept.md`。乾淨的版面做到頂還是會被說像模板的時候，
缺的通常是這個。

## 能照著做的參考站

下面每一個都是普通專業人士做的，**版面複雜度都在這個 repo 的範圍內**。
它們共同的特徵是：靠內容跟排版，不靠特效。

| 站 | 這是什麼 | 看什麼 |
|---|---|---|
| [brittanychiang.com](https://brittanychiang.com/) | 工程師的求職一頁式 | 一頁講完經歷、作品、聯絡，沒有一句廢話。接近 `stack` 版面 |
| [kaleighmoore.com](https://kaleighmoore.com/) | 接案文字工作者 | 首屏就寫清楚「我幫誰做什麼」，**檔期狀態放在最上面** |
| [paco.me](https://paco.me/) | 一頁式個人介紹 | 是誰、做過什麼、怎麼找他，結構最乾淨的範本之一 |
| [tomcritchlow.com](https://tomcritchlow.com/) | 獨立顧問 | 首頁是簡介加寫作加專案，純文字排版。接近 `editorial` 版面 |
| [mxb.dev](https://mxb.dev/) | 網站開發者 | 首屏只有一句「I make websites」。語意化 HTML、沒有動畫、極快 |
| [sive.rs](https://sive.rs/) | 作者與創業者 | 幾乎純文字，視覺元素只有書封。**內容夠好的時候不需要設計** |
| [musicalwebdev.com](https://musicalwebdev.com/) | 開發者兼教學者 | 純 CSS 做出一個完整的概念。上面那一節有拆解 |

`sive.rs` 值得單獨講。它證明的是：如果一個人有足夠具體的東西可以講，
排版乾淨就夠了。使用者覺得自己的內容不夠看的時候，先回去補內容，不要加特效。

`kaleighmoore.com` 的**檔期狀態放首屏**值得抄。接案的人寫「目前接十一月之後的案子」，
可以擋掉一半不合的詢問。

## 一千多個普通人的站

[personalsit.es](https://personalsit.es/) 收了約一千一百個個人網站，
可以照職業篩：developer 七百多個、designer 三百多個，還有 writer、photographer 等等。

**這是這份清單裡最有用的一個連結。** 使用者是攝影師就篩攝影師的，
是工程師就篩工程師的，找兩三個同行的站給他看，比給他看得獎作品有用得多。
同行的站他看得懂，也知道自己做不做得到。

## 使用者說「我要做成那樣」的時候

偶爾會有人拿這幾個來要求：

- [bruno-simon.com](https://bruno-simon.com/) 作品集做成可以開車逛的 3D 世界
- [cassie.codes](https://www.cassie.codes/) 整個站都是手寫的 SVG 動畫
- [samsy.ninja](https://samsy.ninja/) 3D 與動態的整合
- [lynnandtonic.com](https://lynnandtonic.com/) 每年改版一次，每一版是一個點子

**這些用這個 repo 做不出來，而且不該假裝做得出來。**
它們是全職創意工程師花幾個月做的，站本身就是他們的作品，
那是他們的產品，不是他們的名片。

正確的回應是這樣：先講清楚那需要什麼（一個懂 WebGL 的人、數週到數月、之後還要維護），
再問他**那個站裡他真正想要的是哪一件事**。多數時候答案是「有個記得住的東西」，
那用一種對的首屏動效加一句寫得夠準的標題就達得到，成本差兩個數量級。

**做不到的別答應。** 答應了做不出來，比一開始就說做不到傷更多。

## 一直有新東西可以看的地方

- [personalsit.es](https://personalsit.es/) 普通人的站，可以篩職業。**最實用**
- [Minimal Gallery](https://minimal.gallery/) 專收極簡風，多數在能照著做的範圍內
- [Godly](https://godly.website/) 收得比較精，雜訊少，難度偏高
- [Awwwards 作品集分類](https://www.awwwards.com/websites/portfolio/) 量最大，但**多數做不出來**
- [Codrops](https://tympanus.net/codrops/) 每一篇都附可以直接跑的原始碼

## 怎麼用這份清單

1. **先開 `templates/preview.html`**，讓他從真的會拿到的東西裡挑一種版面。
2. 挑完之後，**去 personalsit.es 篩他那一行**，找兩三個同行的站給他看。
3. 問他：**哪一個看起來像你會做的東西。** 不要問他喜歡哪一個。
   喜歡跟像他是兩件事，做出不像他的站，他不敢拿出去發。
4. 他指出來之後，追問一句「像在哪裡」。他的答案會直接變成設計決策。

**看完就關掉，不要一邊排版一邊開著。** 對著別人的站排版，做出來的一定是別人的站。

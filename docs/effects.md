# 想要更兇的特效

這個 repo 內建五種首屏動效，在 `hero/` 底下，
[線上可以一次看到](https://yazelin.github.io/personal-brand-site-starter/hero/preview.html)。
五種都不夠的時候，**先確認真的需要**，再往下看。

## 先確認真的需要

個人品牌站的首屏動效有一個很低的天花板：它的工作是讓人多看三秒，
不是讓人看它。**動效救不了寫壞的標題。** 使用者說「我想要更酷的效果」的時候，
八成的情況是首屏那句話沒寫清楚他是做什麼的。先回去改字。

真的需要更兇的效果，通常是這三種人：做視覺的、做 3D 的、做遊戲的。
他們的站本身就是作品，效果就是內容。其他人加上去只會讓文字更難讀。

## 去哪裡挑

[web-effects-collector](https://github.com/yazelin/web-effects-collector)
彙整了 90 個開源網頁特效，分十二類，每一個都附 Demo、原始碼與整合說明，
[線上版可以直接看](https://yazelin.github.io/web-effects-collector/)。

挑的時候照這個順序刪：

1. **要 React 或 Next 的先刪掉。** 這個 repo 的產出是單頁靜態 HTML，
   為了一個背景效果引進整套框架不划算。
2. **要 build step 的先刪掉。** 同上。
3. **只剩一個 script 標籤就能跑的留下。** Vanta.js、tsParticles、
   Whatamesh 這一類是能直接用的。
4. 留下來的挑一個，**照 `hero/` 那五支的介面包起來**：
   接 `(canvas, opts)`、回傳 `{ destroy }`、
   `prefers-reduced-motion` 要能靜止、分頁切走要停迴圈。

第四步不能省。少做這四件事，會有人的筆電在背景一直燒電，
而且開了系統的「減少動態」的人會看到一片空白。

## 授權

那 90 個特效的版權歸各自的作者。**用之前去看那個專案的 LICENSE。**
多數是 MIT，但不是全部，而且有幾個是教學文章附的範例碼，授權沒有寫清楚。
沒寫清楚的就不要用在客戶的站上。

`hero/fluid-ink.js` 是這個 repo 唯一一支移植進來的第三方程式，
出處與授權寫在 `THIRD_PARTY_NOTICES.md`，可以照那個格式標。

# 部署

選型的判斷在 `skills/02-hosting-choice/SKILL.md`，這份只放步驟。
每一種都假設網站檔案在 `site/`。

## GitHub Pages

免費、不會突然收費、綁自訂網域是內建功能。純展示的個人站首選。

```bash
cd site
git init && git add -A && git commit -m "個人網站"
gh repo create <你的帳號>.github.io --public --source=. --push
```

到該 repo 的 Settings 的 Pages，Source 選 `main` 分支的根目錄，
等一兩分鐘就會出現在 `https://<你的帳號>.github.io`。

用 `<帳號>.github.io` 當 repo 名稱的話網址最短。
用別的名稱就會變成 `https://<帳號>.github.io/<repo>/`，
**這時候頁面裡所有的相對路徑要重新確認一次**，這是最常見的上線後壞掉原因。

自訂網域：Settings 的 Pages 填網域，然後到網域商把 A 記錄指到
`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153` 這四個位址，
或是用 CNAME 指到 `<帳號>.github.io`。憑證由 GitHub 自動處理，等十分鐘。

## Cloudflare Pages

要收表單、收名單、或是之後想加一點後端邏輯的時候用這個。

```bash
npm i -g wrangler
wrangler pages deploy site --project-name=<專案名>
```

表單要處理的話，在同一個專案底下加 `functions/api/contact.js`：

```js
export async function onRequestPost({ request, env }) {
  const form = await request.formData();
  await env.DB.prepare('INSERT INTO leads (email, message) VALUES (?, ?)')
    .bind(form.get('email'), form.get('message')).run();
  return Response.redirect(new URL('/thanks.html', request.url), 303);
}
```

D1 資料庫先建起來：`wrangler d1 create leads-db`，
把回傳的 id 寫進 `wrangler.toml`。免費額度對個人站綽綽有餘。

**表單一定要擋機器人。** 最省事的做法是加一個隱藏欄位，
真人不會填，有填就當作垃圾丟掉，不要擋，讓對方以為送出成功了。

## 不想寫後端，但是要收表單

靜態站照 GitHub Pages 部署，表單的 `action` 指向 Formspree 或 Tally 這類服務。
二十分鐘上線。**缺點是名單在別人家，選之前先確認能匯出。**

## Render

要常駐後端、資料庫、定時工作的時候用。

在 Render 建一個 Static Site 或 Web Service，接上 repo，
Build Command 留空，Publish Directory 填 `site`。

**免費方案會冷啟動**，閒置一段時間之後第一個訪客要等十幾秒才看得到畫面。
個人品牌站要用 Render 就付最低方案，不然那十幾秒會讓人以為網站掛了。

## 收錢

**不要自己收卡號，不要自己存卡號，不要自己驗卡號。**
一律走金流商的 hosted checkout 或 payment link，你的站上只放一個按鈕連過去。

- 國際：Stripe 後台建 Payment Link，把網址貼進按鈕的 `href`。
- 台灣：綠界、藍新、SHOPLINE Payments 都有類似的收款連結功能。

使用者已經有在用的金流就用他現在那個，不要叫他換。

## 上線之後

再跑一次檢查，這次餵線上網址：

```bash
curl -s https://你的網址/ > /tmp/live.html && node tools/check.mjs /tmp/live.html
```

相對路徑在正式環境壞掉的話，這一步會抓到。

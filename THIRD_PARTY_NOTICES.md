# 第三方程式出處

這個 repo 的程式碼是 MIT，© 2026 林亞澤。以下是移植進來的第三方程式，
版權歸原作者，授權條款以原專案為準。

## hero/fluid-ink.js

WebGL 流體模擬（Navier-Stokes 求解器與 GLSL shader）。

- 原始實作：[PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation)，MIT License，© Pavel Dobryakov
- 中間版本：[yazelin/webgl-flow-simulation](https://github.com/yazelin/webgl-flow-simulation)，MIT License

這裡的改動是把它包成 `(canvas, opts)` 介面、加上色票、閒置時自動流動、
`prefers-reduced-motion` 的靜止畫面、分頁切走停止運算，以及 `destroy()`。
求解器本身沒有改。

`hero/` 底下另外四支（flow-gradient、particle-field、noise-lines、geo-drift）
是為這個 repo 寫的，沒有第三方程式。

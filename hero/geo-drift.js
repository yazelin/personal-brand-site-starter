// 幾何緩動：少數幾個大型的圓環與線段極慢地漂移旋轉，像一張會呼吸的海報。
// 用法：Hero.geoDrift(canvas, { color: '#c9a227', shapes: 7 })
// 動得慢到幾乎察覺不到是刻意的。看得出來在動的背景會一直搶注意力。
window.Hero = window.Hero || {};
Hero.geoDrift = function (canvas, opts) {
  var o = Object.assign({
    color: '#c9a227',   // 圖形顏色
    background: null,   // null 代表透明
    shapes: 8,          // 圖形數量
    speed: 0.35,        // 速度倍率
    alpha: 0.5,         // 整體不透明度上限
    width: 1.2          // 線寬（px）
  }, opts || {});

  var ctx = canvas.getContext('2d');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0, t = 0, w = 0, h = 0, dpr = 1, items = [];

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function seed() {
    items = [];
    var kinds = ['ring', 'arc', 'line', 'poly'];
    for (var i = 0; i < o.shapes; i++) {
      items.push({
        kind: kinds[i % kinds.length],
        x: 0.18 + Math.random() * 0.64, y: 0.18 + Math.random() * 0.64,
        r: 0.13 + Math.random() * 0.21,
        rot: Math.random() * 6.2832,
        spin: (Math.random() - 0.5) * 0.02,
        drift: 0.02 + Math.random() * 0.05,
        phase: Math.random() * 6.2832,
        a: 0.25 + Math.random() * 0.75,
        sides: 3 + Math.floor(Math.random() * 4)
      });
    }
  }

  function resize() {
    var b = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = o.width;
    var m = Math.min(w, h);

    for (var i = 0; i < items.length; i++) {
      var s = items[i];
      var x = (s.x + Math.sin(t * s.drift + s.phase) * 0.06) * w;
      var y = (s.y + Math.cos(t * s.drift * 0.8 + s.phase) * 0.06) * h;
      var r = s.r * m;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(s.rot + t * s.spin);
      ctx.strokeStyle = rgba(o.color, s.a * o.alpha);
      ctx.beginPath();
      if (s.kind === 'ring') {
        ctx.arc(0, 0, r, 0, 6.2832);
      } else if (s.kind === 'arc') {
        ctx.arc(0, 0, r, 0, 2.3);
      } else if (s.kind === 'line') {
        ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
      } else {
        for (var k = 0; k <= s.sides; k++) {
          var a = k / s.sides * 6.2832;
          var px = Math.cos(a) * r, py = Math.sin(a) * r;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  function loop() { t += 0.03 * o.speed; draw(); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && !still) raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function onVis() { document.hidden ? stop() : start(); }

  var ro = new ResizeObserver(resize);
  ro.observe(canvas);
  document.addEventListener('visibilitychange', onVis);
  seed(); resize(); start();

  return {
    destroy: function () {
      stop(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    }
  };
};

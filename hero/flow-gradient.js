// 流體漸層：幾團緩慢漂移的色塊互相疊加，配 CSS 模糊化成一片流動的光。
// 用法：Hero.flowGradient(canvas, { colors: ['#4f46e5','#0ea5e9'] })
// 這支最省效能，內部只畫到十分之一解析度，模糊交給瀏覽器合成層做。
window.Hero = window.Hero || {};
Hero.flowGradient = function (canvas, opts) {
  var o = Object.assign({
    colors: ['#4f46e5', '#0ea5e9', '#ec4899'],
    background: '#0b0d12',
    speed: 1,        // 漂移速度倍率
    blobs: 5,        // 色團數量
    blur: 64,        // 模糊半徑（px）
    scale: 10        // 內部解析度縮小倍率，越大越省
  }, opts || {});

  var ctx = canvas.getContext('2d');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0, t = 0, w = 0, h = 0;

  canvas.style.filter = 'blur(' + o.blur + 'px)';
  canvas.style.transform = 'scale(1.2)';  // 撐開，蓋掉模糊在邊緣造成的淡出

  var seeds = [];
  for (var i = 0; i < o.blobs; i++) {
    seeds.push({
      color: o.colors[i % o.colors.length],
      x: Math.random(), y: Math.random(),
      ax: 0.18 + Math.random() * 0.22, ay: 0.14 + Math.random() * 0.2,
      fx: 0.11 + Math.random() * 0.17, fy: 0.09 + Math.random() * 0.15,
      px: Math.random() * 6.28, py: Math.random() * 6.28,
      r: 0.34 + Math.random() * 0.26
    });
  }

  function resize() {
    var b = canvas.getBoundingClientRect();
    w = canvas.width = Math.max(1, Math.round(b.width / o.scale));
    h = canvas.height = Math.max(1, Math.round(b.height / o.scale));
    draw();
  }

  function draw() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    var m = Math.max(w, h);
    for (var i = 0; i < seeds.length; i++) {
      var s = seeds[i];
      var x = (s.x + Math.sin(t * s.fx + s.px) * s.ax) * w;
      var y = (s.y + Math.cos(t * s.fy + s.py) * s.ay) * h;
      var r = s.r * m;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, s.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
    }
  }

  function loop() {
    t += 0.006 * o.speed;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() { if (!raf && !still) raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function onVis() { document.hidden ? stop() : start(); }

  var ro = new ResizeObserver(resize);
  ro.observe(canvas);
  document.addEventListener('visibilitychange', onVis);
  resize();
  start();

  return {
    destroy: function () {
      stop(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    }
  };
};

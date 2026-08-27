// 粒子場：稀疏的點緩慢漂移，靠得夠近就連一條淡線，滑鼠經過會被輕輕推開。
// 用法：Hero.particleField(canvas, { color: '#8b93a7', count: 70 })
// 密度預設壓得很低。點多線多會變成螢幕保護程式，不像個人網站。
window.Hero = window.Hero || {};
Hero.particleField = function (canvas, opts) {
  var o = Object.assign({
    color: '#8b93a7',   // 點與線的顏色
    background: null,   // null 代表透明，讓 CSS 決定底色
    count: 70,          // 點的數量（會依畫布面積再調整）
    link: 130,          // 連線距離（px）
    speed: 0.22,        // 漂移速度
    dot: 1.6,           // 點半徑（px）
    repel: 90           // 滑鼠斥力半徑（px），設 0 關掉
  }, opts || {});

  var ctx = canvas.getContext('2d');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0, w = 0, h = 0, dpr = 1, pts = [];
  var mouse = { x: -1e4, y: -1e4 };

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function resize() {
    var b = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = b.width; h = b.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 依面積等比縮放數量，手機上自動變稀疏
    var n = Math.max(30, Math.round(o.count * Math.min(1, (w * h) / (1440 * 800))));
    pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * o.speed,
        vy: (Math.random() - 0.5) * o.speed
      });
    }
    draw();
  }

  function draw() {
    if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      for (var j = i + 1; j < pts.length; j++) {
        var q = pts[j], dx = p.x - q.x, dy = p.y - q.y;
        var d = Math.hypot(dx, dy);
        if (d < o.link) {
          ctx.strokeStyle = rgba(o.color, (1 - d / o.link) * 0.28);
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      ctx.fillStyle = rgba(o.color, 0.75);
      ctx.beginPath(); ctx.arc(p.x, p.y, o.dot, 0, 6.2832); ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      if (o.repel) {
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < o.repel && d > 0.01) {
          var f = (o.repel - d) / o.repel * 0.6;
          p.x += dx / d * f; p.y += dy / d * f;
        }
      }
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function onMove(e) { var b = canvas.getBoundingClientRect(); mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top; }
  function onLeave() { mouse.x = mouse.y = -1e4; }
  function start() { if (!raf && !still) raf = requestAnimationFrame(step); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function onVis() { document.hidden ? stop() : start(); }

  var ro = new ResizeObserver(resize);
  ro.observe(canvas);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);
  resize(); start();

  return {
    destroy: function () {
      stop(); ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    }
  };
};

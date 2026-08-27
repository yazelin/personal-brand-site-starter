// 噪聲線條：一疊橫線被同一組噪聲推動，像等高線或聲波緩緩起伏。
// 用法：Hero.noiseLines(canvas, { color: '#e6e8ee', lines: 26 })
// 這支最安靜，適合克制的版面。線條本身就是版面的一部分，不搶內容。
window.Hero = window.Hero || {};
Hero.noiseLines = function (canvas, opts) {
  var o = Object.assign({
    color: '#e6e8ee',   // 線的顏色
    background: null,   // null 代表透明
    lines: 26,          // 線的數量
    amp: 78,            // 起伏幅度（px）
    freq: 0.0022,       // 空間頻率，越小越平緩
    speed: 0.12,        // 流動速度
    spread: 0.78,       // 線群佔畫布高度的比例
    width: 1.1          // 線寬（px）
  }, opts || {});

  var ctx = canvas.getContext('2d');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raf = 0, t = 0, w = 0, h = 0, dpr = 1;

  // 一維 value noise，夠平滑也夠便宜，不需要引外部套件
  function hash(n) { var s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
  function noise(x) {
    var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }
  function fbm(x) {
    return noise(x) * 0.5 + noise(x * 2.03) * 0.25 + noise(x * 4.01) * 0.15 + noise(x * 8.05) * 0.1;
  }

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
    draw();
  }

  function draw() {
    if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, w, h); }
    else ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = o.width;

    var top = h * (1 - o.spread) / 2;
    var gap = (h * o.spread) / Math.max(1, o.lines - 1);
    var stepX = Math.max(6, w / 160);   // 取樣間距，寬螢幕不會變慢

    for (var k = 0; k < o.lines; k++) {
      var mid = k / (o.lines - 1);
      // 中間的線起伏最大、最亮，往上下兩端淡出，整疊看起來有厚度
      var env = Math.sin(mid * Math.PI);
      ctx.strokeStyle = rgba(o.color, 0.05 + env * 0.66);
      ctx.beginPath();
      for (var x = 0; x <= w + stepX; x += stepX) {
        var n = fbm(x * o.freq + k * 0.35 + t) - 0.5;
        var y = top + k * gap + n * o.amp * (0.35 + env);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function loop() { t += 0.004 * o.speed * 60 / 60; draw(); raf = requestAnimationFrame(loop); }
  function start() { if (!raf && !still) raf = requestAnimationFrame(loop); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function onVis() { document.hidden ? stop() : start(); }

  var ro = new ResizeObserver(resize);
  ro.observe(canvas);
  document.addEventListener('visibilitychange', onVis);
  resize(); start();

  return {
    destroy: function () {
      stop(); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    }
  };
};

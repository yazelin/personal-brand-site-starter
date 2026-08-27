// 流體墨彩：在 GPU 上解 Navier-Stokes，游標經過會攪動，點一下會潑灑。
// 用法：Hero.fluidInk(canvas, { colors: ['#c9a227'], intensity: 1 })
//
// 這一支是例外。另外四支是幾十行、拿來讀也拿來改的；這一支是流體求解器，
// 只要調上面那幾個參數就好，裡面的 shader 不用讀。
//
// 移植自 https://github.com/yazelin/webgl-flow-simulation
// 原始實作：Pavel Dobryakov, WebGL-Fluid-Simulation, MIT License
// https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
window.Hero = window.Hero || {};
Hero.fluidInk = function (canvas, opts) {
  var o = Object.assign({
    colors: null,       // 給一組十六進位色票就只用那些顏色；null 代表整片彩色
    intensity: 1,       // 攪動與潑灑的力道
    dissipation: 1.3,   // 墨色消散速度，越大退得越快
    idle: true,         // 沒有人動滑鼠的時候自己緩慢流動
    quality: 'auto'     // auto | low，low 會降低模擬解析度，給低階手機用
  }, opts || {});

  // 色票轉成 0 到 1 的 rgb
  var palette = (o.colors || []).map(function (hex) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    return { r: (n >> 16 & 255) / 255, g: (n >> 8 & 255) / 255, b: (n & 255) / 255 };
  });

  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(devicePixelRatio || 1, o.quality === 'low' ? 1 : 1.5);
  var raf = 0, idleFor = 0, autoT = 0;

  function sizeCanvas() {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  }

  const CONFIG = {
    SIM_RESOLUTION:      o.quality === 'low' ? 96 : 128,
    DYE_RESOLUTION:      o.quality === 'low' ? 512 : 1024,
    DENSITY_DISSIPATION: o.dissipation,
    VELOCITY_DISSIPATION: 2,
    PRESSURE:            0.1,
    PRESSURE_ITERATIONS: o.quality === 'low' ? 12 : 20,
    CURL:                3,
    SPLAT_RADIUS:        0.25,
    SPLAT_FORCE:         6000 * o.intensity,
    SHADING:             true,
    COLOR_UPDATE_SPEED:  10,
    TRANSPARENT:         true
  };
  
  sizeCanvas();
  
  // ── WebGL setup ────────────────────────────────────────────
  let gl, ext;
  (function initGL() {
    const params = { alpha: true, depth: false, stencil: false, antialias: false };
    gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
  
    let halfFloat, supportLinearFiltering;
    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloat = gl.getExtension('OES_texture_half_float');
      supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }
    gl.clearColor(0, 0, 0, 1);
  
    const hfType = isWebGL2 ? gl.HALF_FLOAT : (halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE);
  
    function getSupportedFormat(internalFormat, format) {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, hfType, null);
      const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return null;
      return { internalFormat, format };
    }
  
    let rgba, rg, r;
    if (isWebGL2) {
      rgba = getSupportedFormat(gl.RGBA16F, gl.RGBA) || getSupportedFormat(gl.RGBA, gl.RGBA);
      rg   = getSupportedFormat(gl.RG16F,   gl.RG)   || rgba;
      r    = getSupportedFormat(gl.R16F,    gl.RED)   || rgba;
    } else {
      rgba = rg = r = getSupportedFormat(gl.RGBA, gl.RGBA);
    }
  
    ext = { hfType, rgba, rg, r, filtering: supportLinearFiltering ? gl.LINEAR : gl.NEAREST };
  })();
  
  // ── Shaders ────────────────────────────────────────────────
  const VS = `precision highp float;
  attribute vec2 aPosition;varying vec2 vUv,vL,vR,vT,vB;uniform vec2 texelSize;
  void main(){vUv=aPosition*.5+.5;vL=vUv-vec2(texelSize.x,0.);vR=vUv+vec2(texelSize.x,0.);
  vT=vUv+vec2(0.,texelSize.y);vB=vUv-vec2(0.,texelSize.y);gl_Position=vec4(aPosition,0.,1.);}`;
  
  function prog(fsSrc, defs) {
    const kw = defs ? defs.map(d=>`#define ${d}\n`).join('') : '';
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, kw + fsSrc);
    const p  = gl.createProgram();
    gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i=0;i<n;i++){const name=gl.getActiveUniform(p,i).name; u[name]=gl.getUniformLocation(p,name);}
    return { p, u, bind(){ gl.useProgram(this.p); } };
  }
  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s;
  }
  
  const SPLAT_P = prog(`precision highp float;precision highp sampler2D;
  varying vec2 vUv;uniform sampler2D uTarget;uniform float aspectRatio;uniform vec3 color;uniform vec2 point;uniform float radius;
  void main(){vec2 p=vUv-point;p.x*=aspectRatio;vec3 splat=exp(-dot(p,p)/radius)*color;gl_FragColor=vec4(texture2D(uTarget,vUv).xyz+splat,1.);}
  `);
  const ADV_P = prog(`precision highp float;precision highp sampler2D;
  varying vec2 vUv;uniform sampler2D uVelocity,uSource;uniform vec2 texelSize,dyeTexelSize;uniform float dt,dissipation;
  vec4 bilerp(sampler2D sam,vec2 uv,vec2 ts){vec2 st=uv/ts-.5;vec2 iuv=floor(st);vec2 fuv=fract(st);
  vec4 a=texture2D(sam,(iuv+vec2(.5,.5))*ts),b=texture2D(sam,(iuv+vec2(1.5,.5))*ts),c=texture2D(sam,(iuv+vec2(.5,1.5))*ts),d=texture2D(sam,(iuv+vec2(1.5,1.5))*ts);
  return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);}
  void main(){
  #ifdef MANUAL_FILTERING
  vec2 coord=vUv-dt*bilerp(uVelocity,vUv,texelSize).xy*texelSize;vec4 result=bilerp(uSource,coord,dyeTexelSize);
  #else
  vec2 coord=vUv-dt*texture2D(uVelocity,vUv).xy*texelSize;vec4 result=texture2D(uSource,coord);
  #endif
  gl_FragColor=result/(1.+dissipation*dt);}`, ext.filtering===gl.NEAREST?['MANUAL_FILTERING']:null);
  const DIV_P = prog(`precision mediump float;precision mediump sampler2D;
  varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity;
  void main(){float L=texture2D(uVelocity,vL).x,R=texture2D(uVelocity,vR).x,T=texture2D(uVelocity,vT).y,B=texture2D(uVelocity,vB).y;
  vec2 C=texture2D(uVelocity,vUv).xy;
  if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;
  gl_FragColor=vec4(.5*(R-L+T-B),0.,0.,1.);}`);
  const CURL_P = prog(`precision mediump float;precision mediump sampler2D;
  varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity;
  void main(){float L=texture2D(uVelocity,vL).y,R=texture2D(uVelocity,vR).y,T=texture2D(uVelocity,vT).x,B=texture2D(uVelocity,vB).x;
  gl_FragColor=vec4(.5*(R-L-T+B),0.,0.,1.);}`);
  const VOR_P = prog(`precision highp float;precision highp sampler2D;
  varying vec2 vUv,vL,vR,vT,vB;uniform sampler2D uVelocity,uCurl;uniform float curl,dt;
  void main(){float L=texture2D(uCurl,vL).x,R=texture2D(uCurl,vR).x,T=texture2D(uCurl,vT).x,B=texture2D(uCurl,vB).x,C=texture2D(uCurl,vUv).x;
  vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+.0001;f*=curl*C;f.y*=-1.;
  vec2 v=texture2D(uVelocity,vUv).xy+f*dt;gl_FragColor=vec4(clamp(v,-1000.,1000.),0.,1.);}`);
  const PRES_P = prog(`precision mediump float;precision mediump sampler2D;
  varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uPressure,uDivergence;
  void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;
  float div=texture2D(uDivergence,vUv).x;gl_FragColor=vec4((L+R+B+T-div)*.25,0.,0.,1.);}`);
  const GRAD_P = prog(`precision mediump float;precision mediump sampler2D;
  varying highp vec2 vUv,vL,vR,vT,vB;uniform sampler2D uPressure,uVelocity;
  void main(){float L=texture2D(uPressure,vL).x,R=texture2D(uPressure,vR).x,T=texture2D(uPressure,vT).x,B=texture2D(uPressure,vB).x;
  vec2 v=texture2D(uVelocity,vUv).xy-vec2(R-L,T-B);gl_FragColor=vec4(v,0.,1.);}`);
  const CLEAR_P = prog(`precision mediump float;precision mediump sampler2D;
  varying highp vec2 vUv;uniform sampler2D uTexture;uniform float value;
  void main(){gl_FragColor=value*texture2D(uTexture,vUv);}`);
  const COLOR_P = prog(`precision mediump float;uniform vec4 color;void main(){gl_FragColor=color;}`);
  
  // Display: supports SHADING keyword
  class DisplayMaterial {
    constructor() {
      this._kw = null;
      this._p  = null;
      this._src = `precision highp float;precision highp sampler2D;
  varying vec2 vUv,vL,vR,vT,vB;uniform sampler2D uTexture;uniform vec2 texelSize;
  vec3 ltg(vec3 c){c=max(c,vec3(0));return max(1.055*pow(c,vec3(.4166667))-.055,vec3(0));}
  void main(){vec3 c=texture2D(uTexture,vUv).rgb;
  #ifdef SHADING
  vec3 lc=texture2D(uTexture,vL).rgb,rc=texture2D(uTexture,vR).rgb,tc=texture2D(uTexture,vT).rgb,bc=texture2D(uTexture,vB).rgb;
  float dx=length(rc)-length(lc),dy=length(tc)-length(bc);
  vec3 n=normalize(vec3(dx,dy,length(texelSize)));
  float diffuse=clamp(dot(n,vec3(0.,0.,1.))+.7,.7,1.);c*=diffuse;
  #endif
  float a=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c,a);}`;
    }
    setKw(kw) {
      const key = kw.join(',');
      if (key !== this._kw) { this._kw = key; this._p = prog(this._src, kw.length?kw:null); }
    }
    bind() { this._p.bind(); return this._p.u; }
  }
  const DISP = new DisplayMaterial();
  
  // ── Blit ───────────────────────────────────────────────────
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  
  function blit(target, clear=false) {
    if (target==null) {
      gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    } else {
      gl.viewport(0,0,target.width,target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
    }
    if (clear) { gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT); }
    gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
  }
  
  // ── FBO ────────────────────────────────────────────────────
  function fbo(w,h,internalFormat,format,type,param) {
    gl.activeTexture(gl.TEXTURE0);
    const tex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,param);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,param);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,internalFormat,w,h,0,format,type,null);
    const fb=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
    gl.viewport(0,0,w,h); gl.clear(gl.COLOR_BUFFER_BIT);
    return {tex,fbo:fb,width:w,height:h,
      texelSizeX:1/w,texelSizeY:1/h,
      attach(id){gl.activeTexture(gl.TEXTURE0+id);gl.bindTexture(gl.TEXTURE_2D,this.tex);return id;}};
  }
  function dfbo(w,h,iF,f,t,p) {
    let a=fbo(w,h,iF,f,t,p), b=fbo(w,h,iF,f,t,p);
    return {width:w,height:h,texelSizeX:a.texelSizeX,texelSizeY:a.texelSizeY,
      get read(){return a;},get write(){return b;},swap(){let tmp=a;a=b;b=tmp;}};
  }
  
  function getRes(r) {
    const ar=gl.drawingBufferWidth/gl.drawingBufferHeight;
    const min=Math.round(r), max=Math.round(r*(ar<1?1/ar:ar));
    return gl.drawingBufferWidth>gl.drawingBufferHeight?{w:max,h:min}:{w:min,h:max};
  }
  
  let dye, vel, div, curl_, pres;
  function initFBOs() {
    const sr=getRes(CONFIG.SIM_RESOLUTION), dr=getRes(CONFIG.DYE_RESOLUTION);
    const t=ext.hfType, LIN=ext.filtering;
    dye  = dfbo(dr.w,dr.h,ext.rgba.internalFormat,ext.rgba.format,t,LIN);
    vel  = dfbo(sr.w,sr.h,ext.rg.internalFormat,  ext.rg.format,  t,LIN);
    div  = fbo(sr.w,sr.h,ext.r.internalFormat,   ext.r.format,   t,gl.NEAREST);
    curl_= fbo(sr.w,sr.h,ext.r.internalFormat,   ext.r.format,   t,gl.NEAREST);
    pres = dfbo(sr.w,sr.h,ext.r.internalFormat,  ext.r.format,   t,gl.NEAREST);
  }
  initFBOs();
  
  // ── Color ──────────────────────────────────────────────────
  function hsv(h,s,v){
    const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);
    const [r,g,b]=[[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6];
    return{r,g,b};
  }
  function genColor(){
    var c;
    if (palette.length) {
      // 從色票裡挑一個，色相隨機微偏，才不會四團顏色一模一樣
      var base = palette[Math.floor(Math.random()*palette.length)];
      c = { r: base.r, g: base.g, b: base.b };
    } else {
      c = hsv(Math.random(),1,1);
    }
    c.r*=.15; c.g*=.15; c.b*=.15;
    return c;
  }
  
  // ── Pointers ───────────────────────────────────────────────
  const pointers=[{x:0,y:0,px:0,py:0,dx:0,dy:0,moved:false,color:genColor()}];
  
  function cdx(d){const ar=canvas.width/canvas.height;return ar<1?d*ar:d;}
  function cdy(d){const ar=canvas.width/canvas.height;return ar>1?d/ar:d;}
  function cr(r){const ar=canvas.width/canvas.height;return ar>1?r*ar:r;}
  
  function pointAt(clientX, clientY) {
    var b = canvas.getBoundingClientRect();
    var p = pointers[0];
    p.px = p.x; p.py = p.y;
    p.x = (clientX - b.left) / b.width;
    p.y = 1 - (clientY - b.top) / b.height;
    p.dx = cdx(p.x - p.px); p.dy = cdy(p.y - p.py);
    p.moved = Math.abs(p.dx) > 0 || Math.abs(p.dy) > 0;
    idleFor = 0;
  }
  function onMove(e) { pointAt(e.clientX, e.clientY); }
  function onDown(e) {
    // 點一下潑一團，力道比滑過去大
    var b = canvas.getBoundingClientRect();
    var c = genColor(); c.r*=10; c.g*=10; c.b*=10;
    splat((e.clientX-b.left)/b.width, 1-(e.clientY-b.top)/b.height,
          1000*(Math.random()-.5), 1000*(Math.random()-.5), c);
    idleFor = 0;
  }
  
  // ── Splat ──────────────────────────────────────────────────
  function splat(x,y,dx,dy,color) {
    SPLAT_P.bind();
    gl.uniform1i(SPLAT_P.u.uTarget, vel.read.attach(0));
    gl.uniform1f(SPLAT_P.u.aspectRatio, canvas.width/canvas.height);
    gl.uniform2f(SPLAT_P.u.point, x, y);
    gl.uniform3f(SPLAT_P.u.color, dx, dy, 0);
    gl.uniform1f(SPLAT_P.u.radius, cr(CONFIG.SPLAT_RADIUS/100));
    blit(vel.write); vel.swap();
    gl.uniform1i(SPLAT_P.u.uTarget, dye.read.attach(0));
    gl.uniform3f(SPLAT_P.u.color, color.r, color.g, color.b);
    blit(dye.write); dye.swap();
  }
  
  // ── Simulation step ────────────────────────────────────────
  function step(dt) {
    gl.disable(gl.BLEND);
  
    CURL_P.bind();
    gl.uniform2f(CURL_P.u.texelSize,vel.texelSizeX,vel.texelSizeY);
    gl.uniform1i(CURL_P.u.uVelocity,vel.read.attach(0)); blit(curl_);
  
    VOR_P.bind();
    gl.uniform2f(VOR_P.u.texelSize,vel.texelSizeX,vel.texelSizeY);
    gl.uniform1i(VOR_P.u.uVelocity,vel.read.attach(0));
    gl.uniform1i(VOR_P.u.uCurl,curl_.attach(1));
    gl.uniform1f(VOR_P.u.curl,CONFIG.CURL);
    gl.uniform1f(VOR_P.u.dt,dt); blit(vel.write); vel.swap();
  
    DIV_P.bind();
    gl.uniform2f(DIV_P.u.texelSize,vel.texelSizeX,vel.texelSizeY);
    gl.uniform1i(DIV_P.u.uVelocity,vel.read.attach(0)); blit(div);
  
    CLEAR_P.bind();
    gl.uniform1i(CLEAR_P.u.uTexture,pres.read.attach(0));
    gl.uniform1f(CLEAR_P.u.value,CONFIG.PRESSURE); blit(pres.write); pres.swap();
  
    PRES_P.bind();
    gl.uniform2f(PRES_P.u.texelSize,vel.texelSizeX,vel.texelSizeY);
    gl.uniform1i(PRES_P.u.uDivergence,div.attach(0));
    for(let i=0;i<CONFIG.PRESSURE_ITERATIONS;i++){
      gl.uniform1i(PRES_P.u.uPressure,pres.read.attach(1)); blit(pres.write); pres.swap();
    }
  
    GRAD_P.bind();
    gl.uniform2f(GRAD_P.u.texelSize,vel.texelSizeX,vel.texelSizeY);
    gl.uniform1i(GRAD_P.u.uPressure,pres.read.attach(0));
    gl.uniform1i(GRAD_P.u.uVelocity,vel.read.attach(1)); blit(vel.write); vel.swap();
  
    ADV_P.bind();
    gl.uniform2f(ADV_P.u.texelSize,vel.texelSizeX,vel.texelSizeY);
    if(ext.filtering===gl.NEAREST)
      gl.uniform2f(ADV_P.u.dyeTexelSize,vel.texelSizeX,vel.texelSizeY);
    let vt=vel.read.attach(0);
    gl.uniform1i(ADV_P.u.uVelocity,vt); gl.uniform1i(ADV_P.u.uSource,vt);
    gl.uniform1f(ADV_P.u.dt,dt); gl.uniform1f(ADV_P.u.dissipation,CONFIG.VELOCITY_DISSIPATION);
    blit(vel.write); vel.swap();
  
    if(ext.filtering===gl.NEAREST)
      gl.uniform2f(ADV_P.u.dyeTexelSize,dye.texelSizeX,dye.texelSizeY);
    gl.uniform1i(ADV_P.u.uVelocity,vel.read.attach(0));
    gl.uniform1i(ADV_P.u.uSource,dye.read.attach(1));
    gl.uniform1f(ADV_P.u.dissipation,CONFIG.DENSITY_DISSIPATION);
    blit(dye.write); dye.swap();
  }
  
  // ── Render ─────────────────────────────────────────────────
  function render() {
    const w=gl.drawingBufferWidth, h=gl.drawingBufferHeight;
    gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
  
    // 透明背景（讓底下的字符層透出來）
    COLOR_P.bind();
    gl.uniform4f(COLOR_P.u.color, 0, 0, 0, 0);
    blit(null);
  
    const kw=[]; if(CONFIG.SHADING)kw.push('SHADING');
    const u = DISP.setKw(kw) || DISP.bind();
    const du = DISP.bind();
    gl.uniform2f(du.texelSize,1/w,1/h);
    gl.uniform1i(du.uTexture,dye.read.attach(0));
    blit(null);
  }
  
  // ── Main loop ──────────────────────────────────────────────
  let last=Date.now(), colorTimer=0;
  
  function loop() {
    var now = Date.now();
    var dt = Math.min((now - last) / 1000, 0.016666);
    last = now;
  
    if (canvas.width !== Math.round(canvas.clientWidth * dpr) ||
        canvas.height !== Math.round(canvas.clientHeight * dpr)) {
      sizeCanvas(); initFBOs();
    }
  
    colorTimer += dt * CONFIG.COLOR_UPDATE_SPEED;
    if (colorTimer >= 1) { colorTimer = 0; pointers.forEach(function(p){ p.color = genColor(); }); }
  
    pointers.forEach(function(p){
      if (p.moved) { p.moved = false; splat(p.x, p.y, p.dx*CONFIG.SPLAT_FORCE, p.dy*CONFIG.SPLAT_FORCE, p.color); }
    });
  
    // 沒有人動滑鼠的時候，自己緩慢潑灑，首屏才不會停成一片死水
    idleFor += dt;
    if (o.idle && idleFor > 0.7) {
      idleFor = 0;
      autoT += 1;
      var c = genColor(); c.r*=9; c.g*=9; c.b*=9;
      var ax = 0.5 + Math.cos(autoT * 0.9) * 0.32;
      var ay = 0.5 + Math.sin(autoT * 0.6) * 0.28;
      splat(ax, ay, Math.cos(autoT*1.7)*700, Math.sin(autoT*1.3)*700, c);
    }
  
    step(dt);
    render();
    raf = requestAnimationFrame(loop);
  }
  

  // 一開始先潑幾團，第一眼就有東西看，不用等使用者動滑鼠
  function seed(n, boost) {
    for (var i = 0; i < n; i++) {
      var c = genColor(); c.r *= boost; c.g *= boost; c.b *= boost;
      splat(Math.random(), Math.random(), 1000 * (Math.random() - .5), 1000 * (Math.random() - .5), c);
    }
    step(0.016); render();
  }

  function start() { if (!raf && !still) { last = Date.now(); raf = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function onVis() { document.hidden ? stop() : start(); }

  if (still) {
    // 使用者要求減少動態：潑幾團之後空跑一段，讓墨擴散淡開，
    // 留下一張靜止但完整的畫面，不跑迴圈。空跑太少會亮到壓住標題
    seed(5, 2.5);
    for (var k = 0; k < 90; k++) { step(0.016); }
    render();
  } else {
    seed(7, 10);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    document.addEventListener('visibilitychange', onVis);
    start();
  }

  return {
    destroy: function () {
      stop();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVis);
      var lose = gl && gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  };
};

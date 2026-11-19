/* Obsidian & Copper hero: liquid-metal WebGL field + grain + cursor halo + progress */
(function () {
  function start() {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress ---------- */
  var bar = document.createElement('div');
  bar.className = 'bt-progress';
  document.documentElement.appendChild(bar);
  function prog() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
  }
  addEventListener('scroll', prog, { passive: true });
  prog();

  /* ---------- cursor halo (desktop only) ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
    var halo = document.createElement('div');
    halo.className = 'bt-halo';
    document.documentElement.appendChild(halo);
    var hx = innerWidth / 2, hy = innerHeight / 2, tx = hx, ty = hy;
    addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; halo.style.opacity = 1; }, { passive: true });
    (function loop() {
      hx += (tx - hx) * 0.14; hy += (ty - hy) * 0.14;
      halo.style.transform = 'translate3d(' + (hx - 160) + 'px,' + (hy - 160) + 'px,0)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      halo.classList.toggle('bt-halo-link', !!(e.target.closest && e.target.closest('a,button')));
    });
  }

  /* ---------- hero shader ---------- */
  function mount() {
    var stage = document.querySelector('.forge-stage');
    if (!stage || stage.querySelector('.bt-canvas')) return !!stage;
    var cv = document.createElement('canvas');
    cv.className = 'bt-canvas';
    cv.setAttribute('aria-hidden', 'true');
    stage.insertBefore(cv, stage.firstChild);
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) { cv.remove(); return true; }

    var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision highp float;',
      'uniform vec2 R;uniform float T;uniform vec2 M;uniform float S;',
      'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
      'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
      ' return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}',
      'float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<3;i++){s+=a*vn(p);p=m*p;a*=.5;}return s;}',
      'float field(vec2 p){',
      ' vec2 q=vec2(fbm(p+vec2(0.,T*.06)),fbm(p+vec2(5.2,1.3)-T*.05));',
      ' vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+T*.09),fbm(p+3.*q+vec2(8.3,2.8)-T*.07));',
      ' return fbm(p+3.2*r);}',
      'void main(){',
      ' vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;',
      ' vec2 m=(M-.5*R)/R.y;',
      ' vec2 d=uv-m;float dist=length(d);',
      ' vec2 p=uv*1.05+vec2(S*.35,0.);',
      ' p+=d*exp(-dist*3.2)*.55;',          /* liquid pulled toward the cursor */
      ' float e=.012;float h=field(p);',
      ' float hx=field(p+vec2(e,0.))-h,hy=field(p+vec2(0.,e))-h;',
      ' vec3 n=normalize(vec3(-hx/e*.75,-hy/e*.75,1.));',
      ' vec3 rf=reflect(vec3(0.,0.,-1.),n);',
      ' float key=smoothstep(.15,.95,rf.y*.9+rf.x*.35);',
      ' float band=pow(.5+.5*sin(rf.x*5.+rf.y*4.+h*5.),3.);',
      ' float rim=pow(1.-n.z,2.2);',
      ' vec3 deep=vec3(.020,.016,.014);',
      ' vec3 copper=vec3(.96,.52,.26);',
      ' vec3 bone=vec3(.97,.93,.86);',
      ' vec3 col=deep+copper*key*.62+bone*band*.55*key+copper*rim*.35;',
      ' col+=bone*pow(max(dot(rf,normalize(vec3(-.4,.7,.6))),0.),38.)*.9;',   /* soft highlight */
      ' col*=.55+.75*smoothstep(0.,1.,h);',
      ' float vig=smoothstep(1.25,.25,length(uv*vec2(.8,1.)));',
      ' col*=vig;',
      ' col=mix(col,deep,smoothstep(-.05,-.5,uv.y)*.85);',                   /* melt into the page below */
      ' col+=(h21(gl_FragCoord.xy+T)-.5)*.022;',
      ' col=pow(col,vec3(.92));',
      ' gl_FragColor=vec4(col,1.);}'
    ].join('\n');

    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(pr)); cv.remove(); return true; }
    gl.useProgram(pr);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T'),
        uM = gl.getUniformLocation(pr, 'M'), uS = gl.getUniformLocation(pr, 'S');

    var scale = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 800 ? 0.6 : 0.62);
    function size() {
      var w = stage.clientWidth, h = stage.clientHeight;
      cv.width = Math.max(2, Math.round(w * scale)); cv.height = Math.max(2, Math.round(h * scale));
      gl.viewport(0, 0, cv.width, cv.height);
    }
    size();
    addEventListener('resize', size);

    var mx = cv.width * .62, my = cv.height * .5, tx = mx, ty = my;
    addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * cv.width;
      ty = (1 - (e.clientY - r.top) / r.height) * cv.height;
    }, { passive: true });

    var vis = true;
    new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(stage);
    var t0 = performance.now(), idle = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (!vis || document.hidden) return;
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      var t = reduce ? 4 : (now - t0) / 1000;
      gl.uniform2f(uR, cv.width, cv.height);
      gl.uniform1f(uT, t);
      gl.uniform2f(uM, mx, my);
      gl.uniform1f(uS, Math.min(scrollY / 900, 1));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
    return true;
  }

  var tries = 0;
  (function wait() {
    if (mount() || ++tries > 60) return;
    setTimeout(wait, 100);
  })();
  }
  function run() {
    if (window.__thWhenHydrated) {
      window.__thWhenHydrated(function () { setTimeout(start, 200); });
    } else {
      setTimeout(start, 1500);
    }
  }
  if (document.readyState === 'complete') run(); else addEventListener('load', run);
})();

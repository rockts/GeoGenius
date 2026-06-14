// ================================================================
// GeoGenius Topic: f4 — 圆柱的体积 (Cylinder Volume)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f4
// ================================================================

// @@SECTION:helpers@@

   const f4State = {
    r: 3, h: 5, curStep: -1, animRaf: null, animDone: false,
   };

   /* ── Canvas helpers ── */
   function f4Label(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function f4RoundRect(ctx, x, y, w, h, radius, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   /* Draw 3D cylinder with perspective */
   function f4Cylinder(ctx, cx, cy, rx, hPx, colTop, colSide, colStroke, lw) {
    colTop   = colTop    || '#E4F6EE';
    colSide  = colSide   || '#C8E6D4';
    colStroke = colStroke || '#0A7050';
    lw = lw || 2;
    const ry = Math.max(6, Math.round(rx * 0.28));
    ctx.save();
    ctx.strokeStyle = colStroke; ctx.lineWidth = lw;
    /* bottom front arc (only visible half) */
    ctx.beginPath();
    ctx.ellipse(cx, cy+hPx, rx, ry, 0, 0, Math.PI, false);
    ctx.stroke();
    /* side fill */
    ctx.fillStyle = colSide;
    ctx.beginPath();
    ctx.moveTo(cx-rx, cy);
    ctx.lineTo(cx-rx, cy+hPx);
    ctx.ellipse(cx, cy+hPx, rx, ry, 0, Math.PI, 0, true);  // front bottom arc L→R
    ctx.lineTo(cx+rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, true);       // back top arc R→L
    ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx-rx, cy); ctx.lineTo(cx-rx, cy+hPx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+rx, cy); ctx.lineTo(cx+rx, cy+hPx); ctx.stroke();
    /* top face */
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, 2*Math.PI);
    ctx.fillStyle = colTop; ctx.fill(); ctx.strokeStyle = colStroke; ctx.stroke();
    ctx.restore();
   }

   /* Draw n-sector pie (top view) at (cx,cy,r) */
   function f4PieCircle(ctx, cx, cy, r, n) {
    const pi = Math.PI;
    const alpha = pi / n;
    const col = [{fill:'#FCEAF2',stroke:'#A03060'},{fill:'#EEF2FF',stroke:'#4A5AC0'}];
    for (let i = 0; i < n; i++) {
     const mid = (i / n + 0.5 / n) * 2 * pi - pi / 2;
     const c = col[i % 2];
     ctx.save();
     ctx.translate(cx, cy); ctx.rotate(mid);
     ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,-alpha,alpha); ctx.closePath();
     ctx.fillStyle=c.fill; ctx.fill(); ctx.strokeStyle=c.stroke; ctx.lineWidth=0.8; ctx.stroke();
     ctx.restore();
    }
   }

   /* Draw a single sector */
   function f4Sector(ctx, cx, cy, r, alpha, midAngle, fill, stroke) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(midAngle);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,-alpha,alpha); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=0.8; ctx.stroke();
    ctx.restore();
   }

   /* Draw n interleaved sectors in horizontal band */
   function f4Band(ctx, n, bandY, rArr) {
    const pi = Math.PI;
    const alpha = pi / n;
    const arcW = 2 * pi * rArr / n;
    const totalW = n * arcW;
    const startX = (420 - totalW) / 2;
    const col = [{fill:'#FCEAF2',stroke:'#A03060'},{fill:'#EEF2FF',stroke:'#4A5AC0'}];
    for (let i = 0; i < n; i++) {
     const openDown = (i % 2 === 0);
     const cx_ = startX + (i + 0.5) * arcW;
     const cy_ = openDown ? (bandY - rArr) : (bandY + rArr);
     const mid = openDown ? pi/2 : -pi/2;
     const c = col[i % 2];
     ctx.save();
     ctx.translate(cx_, cy_); ctx.rotate(mid);
     ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,rArr,-alpha,alpha); ctx.closePath();
     ctx.fillStyle=c.fill; ctx.fill(); ctx.strokeStyle=c.stroke; ctx.lineWidth=0.8; ctx.stroke();
     ctx.restore();
    }
    return { startX, totalW };
   }

   /* ── Canvas setup / teardown ── */
   function getF4Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f4-canvas');
    let overlay = document.getElementById('f4-overlay');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f4-canvas';
     canvas.width = 420; canvas.height = 260;
     Object.assign(canvas.style, {
      display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px',
     });
     wrap.appendChild(canvas);
     overlay = document.createElement('div');
     overlay.id = 'f4-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center',
      justifyContent:'center', flexWrap:'wrap',
      padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#0A7050;font-weight:600">
       底面半径 <i>r</i>&thinsp;=&thinsp;<span id="f4-r-val">${f4State.r}</span>
       <input id="f4-r" type="range" min="2" max="5" step="1" value="${f4State.r}"
        style="width:80px;accent-color:#0A7050">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="f4-h-val">${f4State.h}</span>
       <input id="f4-h" type="range" min="3" max="8" step="1" value="${f4State.h}"
        style="width:80px;accent-color:#C03030">
      </label>`;
     wrap.after(overlay);
     function onSlider() {
      if (f4State.animRaf) {
       cancelAnimationFrame(f4State.animRaf);
       f4State.animRaf = null; f4State.animDone = true;
      }
      f4DrawStep(canvas);
      const sf = document.getElementById('sform');
      if (sf) sf.textContent = ANIMS[ct.id][cs].formula;
     }
     document.getElementById('f4-r').addEventListener('input', function() {
      f4State.r = +this.value;
      document.getElementById('f4-r-val').textContent = this.value;
      onSlider();
     });
     document.getElementById('f4-h').addEventListener('input', function() {
      f4State.h = +this.value;
      document.getElementById('f4-h-val').textContent = this.value;
      onSlider();
     });
    }
    return { canvas, overlay };
   }

   function removeF4Canvas() {
    if (f4State.animRaf) {
     cancelAnimationFrame(f4State.animRaf);
     f4State.animRaf = null;
    }
    const c = document.getElementById('f4-canvas');
    const o = document.getElementById('f4-overlay');
    if (c) {
     const svg = c.parentElement && c.parentElement.querySelector('svg');
     if (svg) svg.style.display = '';
     c.remove();
    }
    if (o) o.remove();
    f4State.curStep = -1;
   }

   /* ── Static drawing (all steps) ── */
   function f4DrawStep(canvas) {
    const W=420, H=260;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const r=f4State.r, h=f4State.h, step=f4State.curStep, pi=Math.PI;
    const RARR = 55;
    const CX=52, CY=46, RS=40;  // reference circle position

    if (step === 0) {
     /* Cylinder scales with r and h sliders */
     const cx=85, cy=28;
     const rx = Math.max(25, r * 10);
     const hPx = Math.max(36, h * 10);
     f4Cylinder(ctx, cx, cy, rx, hPx);
     /* r label above top face */
     ctx.save(); ctx.strokeStyle='#0A7050'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+rx, cy); ctx.stroke(); ctx.restore();
     f4Label(ctx, `r = ${r}`, cx+rx/2, cy-10, '#0A7050', 14, 'center', '600');
     /* h label on right side */
     const hx = cx+rx+14;
     ctx.save(); ctx.strokeStyle='#C03030'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
     ctx.beginPath(); ctx.moveTo(hx, cy); ctx.lineTo(hx, cy+hPx); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, cy); ctx.lineTo(hx+5, cy); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, cy+hPx); ctx.lineTo(hx+5, cy+hPx); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx+6, cy+hPx/2, '#C03030', 14, 'left', '600');
     /* formula box */
     f4RoundRect(ctx, 228, 30, 174, 120, 8, '#FFF8E7', '#9A5800', 1.5);
     f4Label(ctx, '圆柱体积', 315, 54, '#9A5800', 13, 'center', '600');
     f4Label(ctx, 'V = ?', 315, 82, '#A03060', 22, 'center', '700');
     f4Label(ctx, '底面积 × 高', 315, 116, '#9A5800', 12);
     f4Label(ctx, '= πr² × h', 315, 135, '#9A5800', 12);
    }
    else if (step === 1) {
     /* Top-view circle + 8 sector-columns spread out */
     const bandY = 162;
     const {startX, totalW} = f4Band(ctx, 8, bandY, RARR);
     ctx.save(); ctx.setLineDash([4,3]); ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
     ctx.beginPath(); ctx.moveTo(startX,bandY-RARR); ctx.lineTo(startX+totalW,bandY-RARR); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bandY+RARR); ctx.lineTo(startX+totalW,bandY+RARR); ctx.stroke();
     ctx.restore();
     f4PieCircle(ctx, CX, CY, RS, 8);
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS+6,CY); ctx.lineTo(CX+RS+28,CY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath(); ctx.moveTo(CX+RS+28,CY); ctx.lineTo(CX+RS+20,CY-5); ctx.lineTo(CX+RS+20,CY+5); ctx.fill();
     ctx.restore();
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.fillRect(CX-34,CY+RS+1,68,13); ctx.restore();
     f4Label(ctx, '俯视图', CX, CY+RS+8, '#555', 11);
     f4Label(ctx, '↑ 锯齿明显，近似平行六面体', W/2, 246, '#666', 11);
    }
    else if (step === 2) {
     const bandY = 162;
     const {startX, totalW} = f4Band(ctx, 16, bandY, RARR);
     ctx.save(); ctx.setLineDash([4,3]); ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
     ctx.beginPath(); ctx.moveTo(startX,bandY-RARR); ctx.lineTo(startX+totalW,bandY-RARR); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bandY+RARR); ctx.lineTo(startX+totalW,bandY+RARR); ctx.stroke();
     ctx.restore();
     f4PieCircle(ctx, CX, CY, RS, 16);
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS+6,CY); ctx.lineTo(CX+RS+28,CY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath(); ctx.moveTo(CX+RS+28,CY); ctx.lineTo(CX+RS+20,CY-5); ctx.lineTo(CX+RS+20,CY+5); ctx.fill();
     ctx.restore();
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.fillRect(CX-40,CY+RS+1,80,13); ctx.restore();
     f4Label(ctx, '16个扇形柱', CX, CY+RS+8, '#555', 11);
     f4Label(ctx, '锯齿减少，越来越像长方体！', W/2, 246, '#666', 12);
    }
    else if (step === 3) {
     const bandY = 145;
     const {startX, totalW} = f4Band(ctx, 32, bandY, RARR);
     const top = bandY-RARR, bot = bandY+RARR;
     /* Dashed rectangle outline */
     ctx.save(); ctx.setLineDash([6,4]); ctx.strokeStyle='#0A7050'; ctx.lineWidth=2;
     ctx.strokeRect(startX, top, totalW, 2*RARR); ctx.restore();
     /* Bottom brace + 长≈πr */
     ctx.save(); ctx.strokeStyle='#0A7050'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(startX,bot+20); ctx.lineTo(startX+totalW,bot+20); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bot+15); ctx.lineTo(startX,bot+25); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX+totalW,bot+15); ctx.lineTo(startX+totalW,bot+25); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `长≈πr=π×${r}≈${(pi*r).toFixed(1)}`, W/2, bot+36, '#0A7050', 13, 'center', '600');
     f4Label(ctx, `× 高h=${h}  →  V=πr²h`, W/2, bot+52, '#555', 12);
     /* Width label inside right */
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(startX+totalW-72, bandY-11, 68, 22); ctx.restore();
     f4Label(ctx, `宽=r=${r}`, startX+totalW-6, bandY, '#C03030', 12, 'right', '600');
     /* Height label inside left */
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(startX+4, bandY-11, 66, 22); ctx.restore();
     f4Label(ctx, `高h=${h}`, startX+8, bandY, '#A03060', 12, 'left', '600');
     f4Label(ctx, '32个扇形柱 ≈ 长方体', W/2, top-14, '#333', 12);
     /* Reference circle (top view) drawn last */
     f4PieCircle(ctx, CX, CY, RS, 32);
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS+6,CY); ctx.lineTo(CX+RS+26,CY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath(); ctx.moveTo(CX+RS+26,CY); ctx.lineTo(CX+RS+18,CY-5); ctx.lineTo(CX+RS+18,CY+5); ctx.fill();
     ctx.restore();
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.fillRect(CX-40,CY+RS+1,80,13); ctx.restore();
     f4Label(ctx, '32个扇形柱', CX, CY+RS+8, '#555', 11);
    }
    else if (step === 4) {
     /* Left: cylinder (fixed display size) with current r and h labels */
     const cx=66, cy=20, rx=40;
     const hPx = Math.max(50, Math.min(h*14, 140));
     f4Cylinder(ctx, cx, cy, rx, hPx);
     ctx.save(); ctx.strokeStyle='#0A7050'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+rx, cy); ctx.stroke(); ctx.restore();
     f4Label(ctx, `r=${r}`, cx+rx/2, cy-10, '#0A7050', 13, 'center', '600');
     const hx = cx+rx+14;
     ctx.save(); ctx.strokeStyle='#C03030'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
     ctx.beginPath(); ctx.moveTo(hx, cy); ctx.lineTo(hx, cy+hPx); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, cy); ctx.lineTo(hx+5, cy); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, cy+hPx); ctx.lineTo(hx+5, cy+hPx); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h=${h}`, hx+6, cy+hPx/2, '#C03030', 13, 'left', '600');
     /* Formula derivation box */
     const vol = (3.14*r*r*h).toFixed(2);
     const fx=163, fy=18, fw=244, fh=152;
     f4RoundRect(ctx, fx, fy, fw, fh, 8, '#FFF8E7', '#9A5800', 1.5);
     f4Label(ctx, '推导过程', fx+fw/2, fy+18, '#9A5800', 12, 'center', '600');
     f4Label(ctx, 'V = 底面积 × 高', fx+fw/2, fy+40, '#555', 13);
     f4Label(ctx, '= πr² × h', fx+fw/2, fy+62, '#555', 13);
     f4Label(ctx, '= πr²h', fx+fw/2, fy+88, '#A03060', 20, 'center', '700');
     f4Label(ctx, `r=${r}, h=${h} → V=3.14×${r}²×${h}`, fx+fw/2, fy+116, '#555', 12);
     f4Label(ctx, `=3.14×${r*r}×${h} ≈ ${vol}`, fx+fw/2, fy+138, '#A03060', 14, 'center', '700');
     /* Green formula box */
     f4RoundRect(ctx, 48, 186, 322, 55, 8, '#E8F5E9', '#2E7D32', 1.5);
     f4Label(ctx, '圆柱体积公式：V = πr²h', W/2, 207, '#2E7D32', 15, 'center', '700');
     f4Label(ctx, '切得越细越准确！', W/2, 229, '#2E7D32', 12, 'center', '600');
    }
   }

   /* ── Animation: sectors fly from circle to band ── */
   function f4AnimFrame(canvas, n, bandY, RARR, p) {
    const W=420, H=260, pi=Math.PI;
    const CX=52, CY=46, RS=40;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const alpha = pi/n;
    const arcW = 2*pi*RARR/n;
    const totalW = n*arcW;
    const startX = (W-totalW)/2;
    const STAGGER = 0.65;
    const FLIGHT_DUR = 1 - STAGGER*(n-1)/n;
    const col = [{fill:'#FCEAF2',stroke:'#A03060'},{fill:'#EEF2FF',stroke:'#4A5AC0'}];
    function tOf(i) {
     return Math.max(0, Math.min(1, (p - STAGGER*i/n) / FLIGHT_DUR));
    }
    /* Band dashed lines fade in */
    if (p > 0.2) {
     const la = Math.min(1, (p-0.2)/0.4);
     ctx.save(); ctx.globalAlpha=la; ctx.setLineDash([5,4]); ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
     ctx.beginPath(); ctx.moveTo(startX,bandY-RARR); ctx.lineTo(startX+totalW,bandY-RARR); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bandY+RARR); ctx.lineTo(startX+totalW,bandY+RARR); ctx.stroke();
     ctx.restore();
    }
    /* Flying sectors */
    for (let i=0; i<n; i++) {
     const t = tOf(i);
     if (t <= 0) continue;
     const ease = t*t*(3-2*t);
     const c = col[i%2];
     const openDown = (i%2===0);
     const srcMid = (i/n + 0.5/n)*2*pi - pi/2;
     const tX = startX + (i+0.5)*arcW;
     const tY = openDown ? (bandY-RARR) : (bandY+RARR);
     const tMid = openDown ? pi/2 : -pi/2;
     const curX = CX + (tX-CX)*ease;
     const curY = CY + (tY-CY)*ease;
     let dA = tMid - srcMid;
     while (dA > pi)  dA -= 2*pi;
     while (dA < -pi) dA += 2*pi;
     const curAngle = srcMid + dA*ease;
     const curR = RS + (RARR-RS)*ease;
     f4Sector(ctx, curX, curY, curR, alpha, curAngle, c.fill, c.stroke);
    }
    /* Circle outline fading */
    const cAlpha = Math.max(0, 1-p*2);
    if (cAlpha > 0) {
     ctx.save(); ctx.globalAlpha=cAlpha;
     ctx.beginPath(); ctx.arc(CX, CY, RS, 0, 2*pi);
     ctx.strokeStyle='#ccc'; ctx.lineWidth=1; ctx.stroke();
     ctx.restore();
    }
    ctx.save(); ctx.fillStyle='rgba(255,255,255,0.82)'; ctx.fillRect(CX-40,CY+RS+1,80,13); ctx.restore();
    f4Label(ctx, `${n}个扇形柱`, CX, CY+RS+8, '#555', 11);
   }

   function f4StartAnim(canvas, n) {
    const RARR = 55;
    const bandY = (n===32) ? 145 : 162;
    const dur   = (n===32) ? 2500 : 2200;
    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }
    f4State.animDone = false;
    const t0 = performance.now();
    (function tick(now) {
     const p = Math.min(1, (now-t0)/dur);
     f4AnimFrame(canvas, n, bandY, RARR, p);
     if (p < 1) {
      f4State.animRaf = requestAnimationFrame(tick);
     } else {
      f4State.animRaf = null; f4State.animDone = true;
      f4DrawStep(canvas);
     }
    })(performance.now());
   }

// @@SECTION:anims@@

     {
      hint: '这是一个底面半径r、高h的圆柱。体积怎么算？拖动滑块改变r和h，观察圆柱大小变化。',
      formula: 'V = ?（目标：推导圆柱体积公式 V = πr²h）',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF4Canvas(s);
       f4State.curStep = 0;
       f4DrawStep(canvas);
      },
     },
     {
      hint: '把圆柱沿高方向竖切，切成许多扇形柱。每块体积不变，拼回去就是原来的体积。',
      formula: '圆柱 → 竖切成8个扇形柱（俯视为圆形切片）',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF4Canvas(s);
       f4State.curStep = 1;
       f4DrawStep(canvas);
      },
     },
     {
      hint: '把扇形柱一正一反交错排开。观察动画——切得越细，形状越接近长方体！',
      formula: '16个扇形柱交错排开 → 越来越像长方体',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF4Canvas(s);
       f4State.curStep = 2;
       f4StartAnim(canvas, 16);
      },
     },
     {
      hint: '切成32个扇形柱，几乎就是长方体！长≈πr，宽=r，高=h → V≈πr×r×h=πr²h。',
      formula: '32个扇形柱 ≈ 长方体：长≈πr，宽=r，高=h → V≈πr²h',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF4Canvas(s);
       f4State.curStep = 3;
       f4StartAnim(canvas, 32);
      },
     },
     {
      hint: '切得越细越准确！长方体体积 = 底面积×高 = πr²×h = πr²h，这就是圆柱体积公式！',
      get formula() { const r=f4State.r, h=f4State.h; return `V = πr²h，r=${r}，h=${h} → V = 3.14×${r}²×${h} ≈ ${(3.14*r*r*h).toFixed(2)}`; },
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF4Canvas(s);
       f4State.curStep = 4;
       f4DrawStep(canvas);
      },
     },

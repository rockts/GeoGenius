// ================================================================
// GeoGenius Topic: f2 — 圆的面积 (Circle Area)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f2
// ================================================================

// @@SECTION:helpers@@

   const f2State = {
    r: 3,
    curStep: -1,
    animRaf: null,
    animDone: false,
   };

   /* ── shared canvas helpers ── */
   function f2Label(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }
   function f2Line(ctx, x1, y1, x2, y2, color, lw, dashed) {
    ctx.save();
    ctx.strokeStyle = color || '#333';
    ctx.lineWidth = lw || 1.5;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
   }
   function f2Circle(ctx, cx, cy, r, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
    ctx.restore();
   }
   function f2RoundRect(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
    ctx.restore();
   }
   /** Pie-slice sector: cx/cy = apex = arc center, rotated to midAngle direction */
   function f2Sector(ctx, cx, cy, r, alpha, midAngle, fill, stroke) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -alpha, alpha);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
   }
   /** Draw circle divided into n coloured sectors */
   function f2PieCircle(ctx, cx, cy, r, n) {
    const pi = Math.PI;
    const col = [{fill:'#FCEAF2',stroke:'#A03060'},{fill:'#EEF2FF',stroke:'#4A5AC0'}];
    for (let i = 0; i < n; i++) {
     const a1 = (i / n) * 2 * pi - pi / 2;
     const a2 = ((i + 1) / n) * 2 * pi - pi / 2;
     ctx.beginPath(); ctx.moveTo(cx, cy);
     ctx.arc(cx, cy, r, a1, a2); ctx.closePath();
     ctx.fillStyle = col[i%2].fill; ctx.fill();
     ctx.strokeStyle = col[i%2].stroke; ctx.lineWidth = 0.9; ctx.stroke();
    }
   }
   /** Draw n interleaved sectors in a horizontal band. Returns {startX, totalW}. */
   function f2Band(ctx, n, bandY, rArr) {
    const pi = Math.PI;
    const alpha = pi / n;
    const arcW  = 2 * pi * rArr / n;
    const totalW = n * arcW;
    const startX = (420 - totalW) / 2;
    const col = [{fill:'#FCEAF2',stroke:'#A03060'},{fill:'#EEF2FF',stroke:'#4A5AC0'}];
    for (let i = 0; i < n; i++) {
     const openDown = (i % 2 === 0);
     const cx_ = startX + (i + 0.5) * arcW;
     const cy_ = openDown ? (bandY - rArr) : (bandY + rArr);
     f2Sector(ctx, cx_, cy_, rArr, alpha, openDown ? pi / 2 : -pi / 2, col[i%2].fill, col[i%2].stroke);
    }
    return { startX, totalW };
   }

   /* ── Canvas setup / teardown ── */
   function getF2Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f2-canvas');
    let overlay = document.getElementById('f2-overlay');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f2-canvas';
     canvas.width = 420; canvas.height = 260;
     Object.assign(canvas.style, {
      display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px',
     });
     wrap.appendChild(canvas);
     overlay = document.createElement('div');
     overlay.id = 'f2-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'12px', alignItems:'center',
      justifyContent:'center', flexWrap:'wrap',
      padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#1A5FA8;font-weight:600">
       半径 <i>r</i>&thinsp;=&thinsp;<span id="f2-r-val">${f2State.r}</span>
       <input id="f2-r" type="range" min="2" max="8" step="1" value="${f2State.r}"
        style="width:90px;accent-color:#1A5FA8">
      </label>`;
     wrap.after(overlay);
     document.getElementById('f2-r').addEventListener('input', function() {
      f2State.r = +this.value;
      document.getElementById('f2-r-val').textContent = this.value;
      /* cancel any animation so static draw isn't overwritten */
      if (f2State.animRaf) {
       cancelAnimationFrame(f2State.animRaf);
       f2State.animRaf = null; f2State.animDone = true;
      }
      f2DrawStep(canvas);
     });
    }
    return { canvas, overlay };
   }
   function removeF2Canvas() {
    if (f2State.animRaf) {
     cancelAnimationFrame(f2State.animRaf);
     f2State.animRaf = null;
    }
    const c = document.getElementById('f2-canvas');
    const o = document.getElementById('f2-overlay');
    if (c) {
     const svg = c.parentElement && c.parentElement.querySelector('svg');
     if (svg) svg.style.display = '';
     c.remove();
    }
    if (o) o.remove();
    f2State.curStep = -1;
   }

   /* ── Static drawing (all steps) ── */
   function f2DrawStep(canvas) {
    const W = 420, H = 260;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const r = f2State.r, step = f2State.curStep, pi = Math.PI;
    const RARR = 60;   // fixed arrangement radius (independent of r)
    const CX = 52, CY = 62, RS = 46;  // small circle position

    if (step === 0) {
     /* Circle + radius line; size scales with r */
     const cx = 145, cy = 128;
     const rPx = Math.max(25, r * 10);
     f2Circle(ctx, cx, cy, rPx, '#FCEAF2', '#A03060', 2.5);
     f2Line(ctx, cx, cy, cx + rPx, cy, '#1A5FA8', 2.5);
     f2Circle(ctx, cx, cy, 4, '#A03060');
     f2Label(ctx, `r = ${r}`, cx + rPx / 2, cy - 14, '#1A5FA8', 16, 'center', '700');
     f2RoundRect(ctx, 268, 78, 136, 94, 8, '#FFF8E7', '#9A5800', 1.5);
     f2Label(ctx, '圆的面积', 336, 100, '#9A5800', 13, 'center', '600');
     f2Label(ctx, 'S = ?', 336, 128, '#A03060', 24, 'center', '700');
     f2Label(ctx, '推导：扇形切拼', 336, 157, '#9A5800', 12);
    }
    else if (step === 1) {
     const bandY = 148;
     f2PieCircle(ctx, CX, CY, RS, 8);
     f2Label(ctx, '8个扇形', CX, CY + RS + 14, '#555', 11);
     // arrow →
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS+6,CY); ctx.lineTo(CX+RS+28,CY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath(); ctx.moveTo(CX+RS+28,CY); ctx.lineTo(CX+RS+20,CY-5); ctx.lineTo(CX+RS+20,CY+5); ctx.fill();
     ctx.restore();
     const {startX,totalW} = f2Band(ctx, 8, bandY, RARR);
     f2Line(ctx, startX, bandY-RARR, startX+totalW, bandY-RARR, '#aaa', 1, true);
     f2Line(ctx, startX, bandY+RARR, startX+totalW, bandY+RARR, '#aaa', 1, true);
     f2Label(ctx, '↑ 锯齿明显，近似平行四边形', W/2, 232, '#666', 11);
    }
    else if (step === 2) {
     /* Final state after animation */
     const bandY = 148;
     f2PieCircle(ctx, CX, CY, RS, 16);
     f2Label(ctx, '16个扇形', CX, CY + RS + 14, '#555', 11);
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS+6,CY); ctx.lineTo(CX+RS+28,CY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath(); ctx.moveTo(CX+RS+28,CY); ctx.lineTo(CX+RS+20,CY-5); ctx.lineTo(CX+RS+20,CY+5); ctx.fill();
     ctx.restore();
     const {startX,totalW} = f2Band(ctx, 16, bandY, RARR);
     f2Line(ctx, startX, bandY-RARR, startX+totalW, bandY-RARR, '#aaa', 1, true);
     f2Line(ctx, startX, bandY+RARR, startX+totalW, bandY+RARR, '#aaa', 1, true);
     f2Label(ctx, '锯齿变少，越来越像长方形！', W/2, 232, '#666', 12);
    }
    else if (step === 3) {
     const bandY = 130;
     const {startX,totalW} = f2Band(ctx, 32, bandY, RARR);
     const top = bandY-RARR, bot = bandY+RARR;
     ctx.save(); ctx.setLineDash([6,4]); ctx.strokeStyle='#1A5FA8'; ctx.lineWidth=2;
     ctx.strokeRect(startX, top, totalW, 2*RARR); ctx.restore();
     // bottom brace
     ctx.save(); ctx.strokeStyle='#1A5FA8'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(startX,bot+22); ctx.lineTo(startX+totalW,bot+22); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bot+17); ctx.lineTo(startX,bot+27); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX+totalW,bot+17); ctx.lineTo(startX+totalW,bot+27); ctx.stroke();
     ctx.restore();
     f2Label(ctx, `长 ≈ πr = π×${r} ≈ ${(pi*r).toFixed(1)}`, W/2, bot+38, '#1A5FA8', 13, 'center', '600');
     // right brace
     const rx = startX+totalW+14;
     ctx.save(); ctx.strokeStyle='#C03030'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(rx,top); ctx.lineTo(rx,bot); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(rx-5,top); ctx.lineTo(rx+5,top); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(rx-5,bot); ctx.lineTo(rx+5,bot); ctx.stroke();
     ctx.restore();
     f2Label(ctx, `宽=r=${r}`, rx+4, bandY, '#C03030', 13, 'left', '600');
     f2Label(ctx, '32个扇形 ≈ 长方形', W/2, top-14, '#333', 12);
    }
    else if (step === 4) {
     const cx=68, cy=78, rS=56;
     f2Circle(ctx, cx, cy, rS, '#FCEAF2', '#A03060', 2);
     f2Line(ctx, cx, cy, cx+rS, cy, '#1A5FA8', 2);
     f2Circle(ctx, cx, cy, 4, '#A03060');
     f2Label(ctx, `r = ${r}`, cx+rS/2, cy-14, '#1A5FA8', 14, 'center', '600');
     const area = (pi*r*r).toFixed(2);
     const fw=224,fh=145,fx=168,fy=22;
     f2RoundRect(ctx, fx, fy, fw, fh, 8, '#FFF8E7', '#9A5800', 1.5);
     f2Label(ctx, '推导过程', fx+fw/2, fy+18, '#9A5800', 12, 'center', '600');
     f2Label(ctx, 'S = 长 × 宽', fx+fw/2, fy+40, '#555', 13);
     f2Label(ctx, '= πr × r', fx+fw/2, fy+63, '#555', 13);
     f2Label(ctx, '= πr²', fx+fw/2, fy+90, '#A03060', 20, 'center', '700');
     f2Label(ctx, `r=${r} → S = 3.14×${r}²`, fx+fw/2, fy+116, '#555', 12);
     f2Label(ctx, `= 3.14×${r*r} ≈ ${area}`, fx+fw/2, fy+136, '#A03060', 14, 'center', '700');
     f2RoundRect(ctx, 50, 185, 316, 55, 8, '#E8F5E9', '#2E7D32', 1.5);
     f2Label(ctx, '圆的面积公式：S = πr²', 208, 206, '#2E7D32', 15, 'center', '700');
     f2Label(ctx, '（无限细分扇形后精确成立）', 208, 228, '#555', 11);
    }
   }

   /* ── Animation: sectors fly from circle to band ── */
   function f2AnimFrame(canvas, n, bandY, RARR, p) {
    const W = 420, H = 260, pi = Math.PI;
    const CX = 52, CY = 62, RS = 46;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const alpha = pi / n;
    const arcW = 2 * pi * RARR / n;
    const totalW = n * arcW;
    const startX = (W - totalW) / 2;
    const col = [{fill:'#FCEAF2',stroke:'#A03060'},{fill:'#EEF2FF',stroke:'#4A5AC0'}];

    /* stagger: sector i starts flying at p = STAGGER*i/n; each flight lasts FLIGHT_DUR */
    const STAGGER = 0.65;
    const FLIGHT_DUR = 1 - STAGGER * (n - 1) / n;
    function tOf(i) {
     return Math.min(1, Math.max(0, (p - STAGGER * i / n) / FLIGHT_DUR));
    }

    /* Draw remaining sectors in source circle (fade as they fly away) */
    for (let i = 0; i < n; i++) {
     const t = tOf(i);
     if (t >= 1) continue;
     const a1 = (i / n) * 2 * pi - pi / 2;
     const a2 = ((i + 1) / n) * 2 * pi - pi / 2;
     ctx.save();
     ctx.globalAlpha = Math.max(0, 1 - t * 2.5);
     ctx.beginPath(); ctx.moveTo(CX, CY);
     ctx.arc(CX, CY, RS, a1, a2); ctx.closePath();
     ctx.fillStyle = col[i%2].fill; ctx.fill();
     ctx.strokeStyle = col[i%2].stroke; ctx.lineWidth = 0.9; ctx.stroke();
     ctx.restore();
    }

    /* Circle outline fades */
    const cAlpha = Math.max(0, 1 - p * 2);
    if (cAlpha > 0) {
     ctx.save(); ctx.globalAlpha = cAlpha;
     ctx.beginPath(); ctx.arc(CX, CY, RS, 0, 2*pi);
     ctx.strokeStyle='#ccc'; ctx.lineWidth=1; ctx.stroke();
     ctx.restore();
    }
    f2Label(ctx, `${n}个扇形`, CX, CY + RS + 14, '#555', 11);

    /* Band dashed lines fade in */
    if (p > 0.2) {
     const la = Math.min(1, (p - 0.2) / 0.4);
     ctx.save(); ctx.globalAlpha = la; ctx.setLineDash([5,4]);
     ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
     ctx.beginPath(); ctx.moveTo(startX, bandY-RARR); ctx.lineTo(startX+totalW, bandY-RARR); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX, bandY+RARR); ctx.lineTo(startX+totalW, bandY+RARR); ctx.stroke();
     ctx.restore();
    }

    /* Draw flying / placed sectors */
    for (let i = 0; i < n; i++) {
     const t = tOf(i);
     if (t <= 0) continue;
     const ease = t * t * (3 - 2 * t);   // smoothstep
     const c = col[i % 2];
     const openDown = (i % 2 === 0);

     /* Source: apex at circle center, opening radially outward */
     const srcMid = (i / n + 0.5 / n) * 2 * pi - pi / 2;

     /* Target: apex at band edge, opening up or down */
     const tX = startX + (i + 0.5) * arcW;
     const tY = openDown ? (bandY - RARR) : (bandY + RARR);
     const tMid = openDown ? pi / 2 : -pi / 2;

     /* Interpolate position */
     const curX = CX + (tX - CX) * ease;
     const curY = CY + (tY - CY) * ease;

     /* Interpolate angle — take shorter arc */
     let dA = tMid - srcMid;
     while (dA > pi)  dA -= 2 * pi;
     while (dA < -pi) dA += 2 * pi;
     const curAngle = srcMid + dA * ease;

     /* Interpolate radius */
     const curR = RS + (RARR - RS) * ease;

     f2Sector(ctx, curX, curY, curR, alpha, curAngle, c.fill, c.stroke);
    }
   }

   /** Start rAF animation for step 2 (n=16) or step 3 (n=32) */
   function f2StartAnim(canvas, n) {
    const RARR = 60;
    const bandY = (n === 32) ? 130 : 148;
    const dur   = (n === 32) ? 2500 : 2200;
    if (f2State.animRaf) { cancelAnimationFrame(f2State.animRaf); f2State.animRaf = null; }
    f2State.animDone = false;
    const t0 = performance.now();
    (function tick(now) {
     const p = Math.min(1, (now - t0) / dur);
     f2AnimFrame(canvas, n, bandY, RARR, p);
     if (p < 1) {
      f2State.animRaf = requestAnimationFrame(tick);
     } else {
      f2State.animRaf = null; f2State.animDone = true;
      f2DrawStep(canvas);   // draw final static state
     }
    })(performance.now());
   }

// @@SECTION:anims@@

     {
      hint: '圆可以被切成若干扇形。拖动半径 r 滑块，看圆的大小如何变化。',
      formula: 'S = ?（目标：推导圆面积公式）',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF2Canvas(s);
       f2State.curStep = 0;
       f2DrawStep(canvas);
      },
     },
     {
      hint: '把圆切成8个扇形，交错排列。注意：锯齿还比较明显，不够像长方形。',
      formula: '8个扇形 → 近似平行四边形（锯齿明显）',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF2Canvas(s);
       f2State.curStep = 1;
       f2DrawStep(canvas);
      },
     },
     {
      hint: '切成16个扇形，锯齿减少，越来越像长方形！观察动画。',
      formula: '16个扇形 → 更接近长方形（极限思想）',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF2Canvas(s);
       f2State.curStep = 2;
       f2StartAnim(canvas, 16);
      },
     },
     {
      hint: '切成32个扇形，几乎就是长方形了！长≈πr（半周长），宽=r（半径）。',
      formula: '32个扇形 ≈ 长方形：长≈πr，宽=r → S≈πr²',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF2Canvas(s);
       f2State.curStep = 3;
       f2StartAnim(canvas, 32);
      },
     },
     {
      hint: '切得无限细时，长方形面积 = πr×r = πr²，这就是圆面积公式！',
      formula: 'S = πr²（精确公式，用 r=3 验证：S≈28.26）',
      dur: 100,
      noAutoFit: true,
      draw(s) {
       const { canvas } = getF2Canvas(s);
       f2State.curStep = 4;
       f2DrawStep(canvas);
      },
     },

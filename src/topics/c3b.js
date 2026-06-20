// ================================================================
// GeoGenius Topic: c3b — 正方形周长 (Square Perimeter)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.c3b
// 复用 c3 展开逻辑，限定四边相等 a：描一周 → 展开 a+a+a+a → C = 4a
// ================================================================

// @@SECTION:helpers@@

   const c3bState = {
    a: 6, curStep: -1, animRaf: null, animT0: 0, animDur: 3000,
   };

   const Q4   = '#5C7CE0';   // 正方形边 主色
   const Q4_D = '#3A56B0';
   const Q4_L = '#9FB2F0';   // 浅色（展开时交替，便于数4段）

   function c3bLabel(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }
   function c3bRoundRect(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   function c3bD() {
    const a = c3bState.a, s = 9;
    const aPx = a * s;
    return { a, s, aPx, perim: 4 * aPx };
   }

   /* Canvas + 滑块 overlay（只有边长 a） */
   function getC3bCanvas(sv) {
    const svg = sv.ownerSVGElement || sv;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('c3b-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'c3b-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'c3b-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     const D = c3bD();
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#3A56B0;font-weight:600">
       边长 <i>a</i>&thinsp;=&thinsp;<span id="c3b-a-val">${D.a}</span>
       <input id="c3b-a" type="range" min="3" max="10" step="1" value="${D.a}" style="width:110px;accent-color:#5C7CE0">
      </label>`;
     wrap.after(overlay);
     const canvasRef = canvas;
     document.getElementById('c3b-a').addEventListener('input', function() {
      c3bState.a = +this.value; document.getElementById('c3b-a-val').textContent = this.value;
      if (c3bState.animRaf) { cancelAnimationFrame(c3bState.animRaf); c3bState.animRaf = null; }
      c3bDrawStep(canvasRef);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     });
    }
    return { canvas };
   }

   function removeC3bCanvas() {
    if (c3bState.animRaf) { cancelAnimationFrame(c3bState.animRaf); c3bState.animRaf = null; }
    const c = document.getElementById('c3b-canvas'), o = document.getElementById('c3b-overlay');
    if (c) { const sv = c.parentElement && c.parentElement.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    if (o) o.remove();
    c3bState.curStep = -1;
   }

   function c3bSquare(ctx, rx, ry, aPx, faint) {
    ctx.save();
    ctx.fillStyle = '#FBFBFD'; ctx.strokeStyle = faint ? '#d6d8dc' : '#9aa0a6';
    ctx.lineWidth = faint ? 1 : 1.4;
    ctx.beginPath(); ctx.rect(rx, ry, aPx, aPx); ctx.fill(); ctx.stroke();
    ctx.restore();
   }

   /* 四条边（顺时针），全部等长 aPx */
   function c3bEdges(rx, ry, aPx) {
    return [
     { x1: rx,       y1: ry,       x2: rx + aPx, y2: ry       }, // 上
     { x1: rx + aPx, y1: ry,       x2: rx + aPx, y2: ry + aPx }, // 右
     { x1: rx + aPx, y1: ry + aPx, x2: rx,       y2: ry + aPx }, // 下
     { x1: rx,       y1: ry + aPx, x2: rx,       y2: ry       }, // 左
    ];
   }

   /* ─── 静态绘图 ─── */
   function c3bDrawStep(canvas) {
    const W = 420, H = 280, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const step = c3bState.curStep;
    const D = c3bD();
    const { a, aPx } = D;

    if (step === 0) {
     const rx = 210 - aPx/2, ry = 128 - aPx/2;
     c3bSquare(ctx, rx, ry, aPx);
     const E = c3bEdges(rx, ry, aPx);
     ctx.save(); ctx.strokeStyle = Q4; ctx.lineWidth = 5; ctx.lineCap = 'round';
     E.forEach(e => { ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); });
     ctx.restore();
     // 四条边都标 a（强调相等）
     c3bLabel(ctx, `a=${a}`, rx + aPx/2, ry - 11, Q4_D, 12, 'center', '700');
     c3bLabel(ctx, `a=${a}`, rx + aPx/2, ry + aPx + 12, Q4_D, 12, 'center', '700');
     c3bLabel(ctx, `a=${a}`, rx - 12, ry + aPx/2, Q4_D, 12, 'right', '700');
     c3bLabel(ctx, `a=${a}`, rx + aPx + 12, ry + aPx/2, Q4_D, 12, 'left', '700');
     c3bLabel(ctx, '四条边都相等', 210, 246, Q4_D, 12, 'center', '700');
     c3bRoundRect(ctx, 150, 256, 120, 0, 0, '#fff', '#fff', 0); // (占位防越界)
     c3bRoundRect(ctx, 314, 96, 86, 36, 8, '#FFF8E7', '#9A5800', 1.5);
     c3bLabel(ctx, 'C = ?', 357, 114, '#A03060', 16, 'center', '700');
    }

    else if (step === 1) { c3bAnimFrame(canvas, 1); }
    else if (step === 2) { c3bAnimFrame(canvas, 1); }

    else if (step === 3) {
     const rx = 132 - aPx/2, ry = 120 - aPx/2;
     c3bSquare(ctx, rx, ry, aPx);
     const E = c3bEdges(rx, ry, aPx);
     ctx.save(); ctx.strokeStyle = Q4; ctx.lineWidth = 5; ctx.lineCap = 'round';
     E.forEach(e => { ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); });
     ctx.restore();
     c3bLabel(ctx, `a=${a}`, rx + aPx/2, ry - 11, Q4_D, 11, 'center', '700');
     const C = 4 * a;
     c3bRoundRect(ctx, 232, 60, 168, 150, 9, '#E8F5E9', '#2E7D32', 1.5);
     c3bLabel(ctx, '正方形周长公式', 316, 84, '#2E7D32', 13, 'center', '700');
     c3bLabel(ctx, 'C = a+a+a+a', 316, 112, '#555', 13, 'center', '600');
     c3bLabel(ctx, 'C = 4 × a', 316, 138, '#2E7D32', 18, 'center', '700');
     c3bLabel(ctx, `= 4 × ${a}`, 316, 166, '#2E7D32', 13, 'center', '600');
     c3bLabel(ctx, `= ${C}`, 316, 190, '#2E7D32', 16, 'center', '700');
    }
   }

   /* ─── 动画：curStep=1 描边一周；curStep=2 四边展开成直线 ─── */
   function c3bAnimFrame(canvas, p) {
    const W = 420, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, 280);
    const D = c3bD();
    const { a, aPx, perim } = D;

    if (c3bState.curStep === 2) {
     /* 展开：四条边飞到下方基线，依次拼成 a+a+a+a */
     const rx = 210 - aPx/2, ry = 72;
     const E = c3bEdges(rx, ry, aPx);
     c3bSquare(ctx, rx, ry, aPx, true);
     const baseY = 196, xStart = (W - perim) / 2;
     const STAG = 0.16, DUR = 1 - STAG * 3;
     for (let i = 0; i < 4; i++) {
      const lp = Math.max(0, Math.min(1, (p - i * STAG) / DUR));
      const e = E[i], ease = lp * lp * (3 - 2 * lp);
      const tx1 = xStart + i * aPx, tx2 = xStart + (i + 1) * aPx;
      const cx1 = e.x1 + (tx1 - e.x1) * ease, cy1 = e.y1 + (baseY - e.y1) * ease;
      const cx2 = e.x2 + (tx2 - e.x2) * ease, cy2 = e.y2 + (baseY - e.y2) * ease;
      ctx.save(); ctx.strokeStyle = (i % 2 === 0) ? Q4 : Q4_L; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke(); ctx.restore();
      if (lp >= 1) c3bLabel(ctx, `${a}`, (tx1 + tx2)/2, baseY + 14, Q4_D, 12, 'center', '700');
     }
     if (p >= 1) {
      ctx.save(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xStart, baseY+22); ctx.lineTo(xStart, baseY+27);
      ctx.lineTo(xStart+perim, baseY+27); ctx.lineTo(xStart+perim, baseY+22); ctx.stroke(); ctx.restore();
      c3bLabel(ctx, `C = a+a+a+a = ${a}+${a}+${a}+${a} = ${4*a}`, W/2, baseY + 40, '#333', 13, 'center', '700');
     }
     c3bLabel(ctx, '四条相等的边展开拉直成一条线段', W/2, 38, Q4_D, 13, 'center', '700');
     return;
    }

    /* 描边：沿正方形走一圈，四条边依次描粗 */
    const rx = 210 - aPx/2, ry = 130 - aPx/2;
    c3bSquare(ctx, rx, ry, aPx, true);
    const E = c3bEdges(rx, ry, aPx);
    const travel = p * perim;
    let used = 0, edgesDone = 0;
    for (let i = 0; i < 4; i++) {
     const e = E[i], remain = travel - used;
     if (remain <= 0) break;
     const frac = Math.min(1, remain / aPx);
     const hx = e.x1 + (e.x2 - e.x1) * frac, hy = e.y1 + (e.y2 - e.y1) * frac;
     ctx.save(); ctx.strokeStyle = Q4; ctx.lineWidth = 5; ctx.lineCap = 'round';
     ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(hx, hy); ctx.stroke(); ctx.restore();
     if (frac >= 1) {
      edgesDone++;
      const mx = (e.x1+e.x2)/2 + (i===1?12:i===3?-12:0), my = (e.y1+e.y2)/2 + (i===0?-11:i===2?12:0);
      c3bLabel(ctx, `a`, mx, my, Q4_D, 12, 'center', '700');
     }
     used += aPx;
     if (frac < 1) { ctx.save(); ctx.fillStyle = '#C03030'; ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, 2*pi); ctx.fill(); ctx.restore(); }
    }
    c3bLabel(ctx, p >= 1 ? '周长 = 四条边总和 = a+a+a+a' : `正在数第 ${Math.min(4, edgesDone+1)} 条边…`,
             W/2, 36, Q4_D, 13, 'center', '700');
   }

   /* ─── 动画入口（修正版守卫） ─── */
   function c3bStartAnim(canvas, forceRestart, dur) {
    if (!forceRestart && (c3bState.animRaf || c3bState.animT0 === 0)) return;
    if (c3bState.animRaf) { cancelAnimationFrame(c3bState.animRaf); c3bState.animRaf = null; }
    const SM = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const D = (dur || c3bState.animDur) * SM;
    c3bState.animT0 = performance.now();
    const t0 = c3bState.animT0;
    let pausedMs = 0, pausedAt = 0;
    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) { if (!pausedAt) pausedAt = now; c3bState.animRaf = requestAnimationFrame(tick); return; }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }
     const p = Math.min(1, (now - t0 - pausedMs) / D);
     c3bAnimFrame(canvas, p);
     if (p < 1) { c3bState.animRaf = requestAnimationFrame(tick); }
     else { c3bState.animRaf = null; c3bState.animT0 = 0; c3bDrawStep(canvas); }
    })(t0);
   }

// @@SECTION:anims@@

     {
      hint: '这是一个正方形：四条边都相等，边长都是 a。它的周长 C 是四条边的总长度。拖动滑块改变边长。',
      formula: 'C = ?（目标：推导正方形周长 C = 4a）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getC3bCanvas(s); c3bState.curStep=0; c3bDrawStep(canvas); },
     },
     {
      hint: '沿着正方形走一圈，把四条边依次描粗。四条边一样长，都是 a。',
      formula: '周长 = 四条相等的边 = a + a + a + a',
      dur: 2800, noAutoFit: true,
      draw(s, p) { const {canvas}=getC3bCanvas(s); c3bState.curStep=1; c3bState.animDur=2800; c3bStartAnim(canvas, p===0, 2800); },
     },
     {
      hint: '把四条边一条条展开、拉直，接成一条线段：a + a + a + a，正好是 4 个 a。',
      formula: '展开四条边 → a + a + a + a',
      dur: 3400, noAutoFit: true,
      draw(s, p) { const {canvas}=getC3bCanvas(s); c3bState.curStep=2; c3bState.animDur=3400; c3bStartAnim(canvas, p===0, 3400); },
     },
     {
      hint: '四条边都是 a，4 个 a 加起来就是 4×a。所以正方形周长 C = 4a。拖滑块验证。',
      get formula() { const a=c3bState.a; return `C = 4a = 4×${a} = ${4*a}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getC3bCanvas(s); c3bState.curStep=3; c3bDrawStep(canvas); },
     },

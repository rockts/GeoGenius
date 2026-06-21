// @@SECTION:helpers@@
   const c5bState = { unit: 0, curStep: -1, animRaf: null, animT0: 0, animDur: 200 };

   // unit pair labels
   function c5bUnits() {
    return c5bState.unit === 0
     ? { big:'m',  small:'dm', bigSq:'m²',  smallSq:'dm²', bigName:'平方米',  smallName:'平方分米', next:{bigSq:'dm²',smallSq:'cm²'} }
     : { big:'dm', small:'cm', bigSq:'dm²', smallSq:'cm²', bigName:'平方分米',smallName:'平方厘米', next:{bigSq:'cm²',smallSq:'mm²'} };
   }

   function c5bLbl(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.font = `${weight||'normal'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.fillStyle = color || '#333';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function c5bBox(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad||6);
    else { ctx.rect(x, y, w, h); }
    if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   function c5bLayout() {
    // big square: top-left (rx,ry), side SZ, 10×10 grid
    const SZ = 196, rx = 52, ry = 30, N = 10, cs = SZ / N;
    return { SZ, rx, ry, N, cs };
   }

   function c5bDrawBigSquare(ctx, L, u) {
    const { SZ, rx, ry } = L;
    ctx.save();
    ctx.fillStyle = 'rgba(240,195,120,0.15)';
    ctx.fillRect(rx, ry, SZ, SZ);
    ctx.strokeStyle = '#A04800';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(rx, ry, SZ, SZ);
    ctx.restore();
    c5bLbl(ctx, '1 '+u.big, rx + SZ/2, ry - 14, '#A04800', 13, 'center', 'bold');
    c5bLbl(ctx, '1 '+u.big, rx - 26, ry + SZ/2, '#A04800', 13, 'center', 'bold');
   }

   function c5bDrawGrid(ctx, L, filled, alpha) {
    const { SZ, rx, ry, N, cs } = L;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < N*N; i++) {
     const row = Math.floor(i/N), col = i%N;
     ctx.fillStyle = i < filled ? '#A3C9EE' : 'rgba(163,201,238,0.13)';
     ctx.fillRect(rx + col*cs + 0.5, ry + row*cs + 0.5, cs-1, cs-1);
    }
    ctx.strokeStyle = '#5E9FC8';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= N; r++) {
     ctx.beginPath(); ctx.moveTo(rx, ry+r*cs); ctx.lineTo(rx+SZ, ry+r*cs); ctx.stroke();
    }
    for (let c = 0; c <= N; c++) {
     ctx.beginPath(); ctx.moveTo(rx+c*cs, ry); ctx.lineTo(rx+c*cs, ry+SZ); ctx.stroke();
    }
    ctx.restore();
   }

   /* Render a single step at progress p ∈ [0,1] */
   function c5bFrame(canvas, step, p) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const e = p*p*(3-2*p);   // smoothstep
    const L = c5bLayout();
    const u = c5bUnits();
    const { SZ, rx, ry, N, cs } = L;
    const RX2 = 270, RW = 142; // right column x & width

    if (step === 0) {
     c5bDrawBigSquare(ctx, L, u);
     // Center label
     c5bLbl(ctx, '1 '+u.bigSq, rx+SZ/2, ry+SZ/2-10, '#A04800', 19, 'center', 'bold');
     c5bLbl(ctx, '面积 = ?', rx+SZ/2, ry+SZ/2+20, '#888', 13, 'center');
     // Right info card
     c5bBox(ctx, RX2, 78, RW, 56, 8, '#FFF8F0', '#C07030', 1.5);
     c5bLbl(ctx, '1 '+u.big+' × 1 '+u.big, RX2+RW/2, 98, '#A04800', 13, 'center', 'bold');
     c5bLbl(ctx, '= 1 '+u.bigSq, RX2+RW/2, 118, '#A04800', 13, 'center');
     c5bLbl(ctx, '这是 1 '+u.bigName, W/2, 262, '#555', 13, 'center');
    }

    if (step === 1) {
     c5bDrawBigSquare(ctx, L, u);
     c5bDrawGrid(ctx, L, 0, e);
     ctx.save(); ctx.globalAlpha = e;
     // Tick labels on first row/col
     c5bLbl(ctx, '← 10格，每格 1 '+u.small+' →', rx+SZ/2, ry+SZ+14, '#1A5FA8', 11, 'center');
     // Right card
     c5bBox(ctx, RX2, 64, RW, 76, 8, '#EBF4FF', '#1A5FA8', 1.5);
     c5bLbl(ctx, '每边平均分10份', RX2+RW/2, 85, '#0D3F6E', 12, 'center');
     c5bLbl(ctx, '每份 = 1 '+u.small, RX2+RW/2, 103, '#0D3F6E', 13, 'center', 'bold');
     c5bLbl(ctx, '每小格 = 1 '+u.smallSq, RX2+RW/2, 121, '#0D3F6E', 12, 'center');
     c5bLbl(ctx, '共 10×10 = ?', RX2+RW/2, 139, '#0D3F6E', 12, 'center');
     ctx.restore();
     c5bLbl(ctx, '把正方形分成小方格，每格是 1 '+u.smallName, W/2, 262, '#555', 12, 'center');
    }

    if (step === 2) {
     const count = Math.round(e * 100);
     c5bDrawBigSquare(ctx, L, u);
     c5bDrawGrid(ctx, L, count, 1);
     // Highlight first cell (top-left)
     ctx.save();
     ctx.fillStyle = 'rgba(240,90,20,0.35)';
     ctx.fillRect(rx, ry, cs, cs);
     ctx.strokeStyle = '#C03000';
     ctx.lineWidth = 2;
     ctx.strokeRect(rx, ry, cs, cs);
     ctx.restore();
     // "1 smallSq" callout above first cell
     c5bLbl(ctx, '1 '+u.smallSq, rx+cs/2, ry-12, '#C03000', 11, 'center', 'bold');
     // Big counter on right
     ctx.save();
     ctx.font = 'bold 54px sans-serif';
     ctx.fillStyle = '#1A4FA8';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(String(count), RX2+RW/2, 110);
     ctx.restore();
     c5bLbl(ctx, '小格', RX2+RW/2, 150, '#1A4FA8', 14, 'center');
     if (count === 100) {
      c5bLbl(ctx, '= 100 '+u.smallSq, RX2+RW/2, 176, '#C03000', 14, 'center', 'bold');
     }
     c5bLbl(ctx, '每小格 = 1 '+u.smallName, W/2, 262, '#555', 12, 'center');
    }

    if (step === 3) {
     c5bDrawBigSquare(ctx, L, u);
     c5bDrawGrid(ctx, L, 100, 1);
     // Main formula
     c5bBox(ctx, RX2, 44, RW, 62, 8, '#EBF4FF', '#1A5FA8', 2);
     c5bLbl(ctx, '1 '+u.bigSq, RX2+RW/2, 65, '#0D3F6E', 16, 'center', 'bold');
     c5bLbl(ctx, '= 100 '+u.smallSq, RX2+RW/2, 90, '#0D3F6E', 16, 'center', 'bold');
     // Analogy
     c5bBox(ctx, RX2, 120, RW, 72, 8, '#FFF0E8', '#A04800', 1.5);
     c5bLbl(ctx, '同理', RX2+RW/2, 138, '#A04800', 11, 'center');
     c5bLbl(ctx, '1 '+u.next.bigSq, RX2+RW/2, 158, '#A04800', 15, 'center', 'bold');
     c5bLbl(ctx, '= 100 '+u.next.smallSq, RX2+RW/2, 178, '#A04800', 15, 'center', 'bold');
     // Proof line
     c5bLbl(ctx, '每边 10 等份 → 10×10 = 100 格', W/2, 262, '#555', 12, 'center');
    }
   }

   function c5bDrawStep(canvas) { c5bFrame(canvas, c5bState.curStep, 1); }
   function c5bAnimFrame(canvas, p) { c5bFrame(canvas, c5bState.curStep, p); }

   function c5bStartAnim(canvas, forceRestart, dur) {
    if (!forceRestart && (c5bState.animRaf || c5bState.animT0 === 0)) return;
    if (c5bState.animRaf) { cancelAnimationFrame(c5bState.animRaf); c5bState.animRaf = null; }
    const SM = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const D = (dur || c5bState.animDur) * SM;
    c5bState.animT0 = performance.now();
    const t0 = c5bState.animT0;
    let pausedMs = 0, pausedAt = 0;
    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) { if (!pausedAt) pausedAt = now; c5bState.animRaf = requestAnimationFrame(tick); return; }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }
     const p = Math.min(1, (now - t0 - pausedMs) / D);
     c5bAnimFrame(canvas, p);
     if (p < 1) { c5bState.animRaf = requestAnimationFrame(tick); }
     else { c5bState.animRaf = null; c5bState.animT0 = 0; c5bDrawStep(canvas); }
    })(t0);
   }

   function removeC5bCanvas() {
    if (c5bState.animRaf) { cancelAnimationFrame(c5bState.animRaf); c5bState.animRaf = null; }
    c5bState.curStep = -1; c5bState.animT0 = 0;
    const c = document.getElementById('c5b-canvas');
    if (c) { const sv = c.parentElement?.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    const o = document.getElementById('c5b-overlay');
    if (o) o.remove();
   }

   function getC5bCanvas(sv) {
    const svg = sv.ownerSVGElement || sv;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('c5b-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'c5b-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'c5b-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'16px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#1A5FA8;font-weight:600">
       换算类型
       <select id="c5b-unit" style="font-size:13px;border:1px solid #bbb;border-radius:4px;padding:2px 6px;">
        <option value="0">米 → 分米（m² = 100 dm²）</option>
        <option value="1">分米 → 厘米（dm² = 100 cm²）</option>
       </select>
      </label>`;
     wrap.after(overlay);
     const ref = canvas;
     document.getElementById('c5b-unit').addEventListener('change', function() {
      c5bState.unit = +this.value;
      if (c5bState.animRaf) { cancelAnimationFrame(c5bState.animRaf); c5bState.animRaf = null; }
      c5bDrawStep(ref);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     });
    }
    return { canvas };
   }

// @@SECTION:anims@@

     {
      hint: '这是一个边长为1米的正方形，它的面积是 1平方米（1m²）。换算类型可在下方切换。',
      formula: '1 m²（面积单位：边长1m的正方形所占面积）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getC5bCanvas(s); c5bState.curStep=0; c5bDrawStep(canvas); },
     },
     {
      hint: '把每条边平均分成10份（每份1分米），在正方形内画 10×10 的网格。每个小方格边长1dm，面积是1dm²。',
      formula: '每边10等份 → 格子出现（10×10个小方格）',
      dur: 1500, noAutoFit: true,
      draw(s, p) { const {canvas}=getC5bCanvas(s); c5bState.curStep=1; c5bStartAnim(canvas, p===0, 1500); },
     },
     {
      hint: '小方格一格格亮起来并计数——共有100格！每格面积1dm²，所以 1m² = 100dm²。',
      formula: '100小格 → 1 m² = 100 dm²',
      dur: 3200, noAutoFit: true,
      draw(s, p) { const {canvas}=getC5bCanvas(s); c5bState.curStep=2; c5bStartAnim(canvas, p===0, 3200); },
     },
     {
      hint: '相邻面积单位之间，边长是10倍，面积就是100倍。切换下方选择框可验证 dm²→cm² 也是同样的关系。',
      get formula() { return c5bState.unit===0 ? '1 m² = 100 dm²，同理 1 dm² = 100 cm²' : '1 dm² = 100 cm²，同理 1 cm² = 100 mm²'; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getC5bCanvas(s); c5bState.curStep=3; c5bDrawStep(canvas); },
     },

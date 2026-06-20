// @@SECTION:helpers@@
   const f3State = { r: 3, h: 5, curStep: -1, animRaf: null, animT0: 0, animDur: 200 };

   const F3BODY  = '#C8E6F8';   // cylinder body fill
   const F3EDGE  = '#1A6FA8';   // cylinder outline
   const F3SIDE  = '#F9D86A';   // lateral face (yellow)
   const F3SIDE_D = '#9A7000';  // lateral face dark
   const F3CIRC  = '#A8E6B0';   // circular base fill
   const F3CIRC_D = '#1A7040';  // circular base dark

   function f3Lbl(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.font = `${weight||'normal'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.fillStyle = color || '#333';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function f3Box(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad||6);
    else ctx.rect(x, y, w, h);
    if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   function f3D() {
    const r = f3State.r, h = f3State.h;
    const Rpx = Math.min(r * 7 + 8, 43);  // r=1→15, r=5→43
    const Hpx = Math.min(h * 16, 170);     // h=2→32, h=8→128
    const ry  = Math.round(Rpx * 0.35);
    const cylCX = 86;
    const topY  = Math.max(22, 150 - Hpx / 2 - ry);
    const botY  = topY + Hpx;
    const rectX = cylCX + Rpx + 16;
    const rectW = 2 * Math.PI * Rpx;
    return { r, h, Rpx, Hpx, ry, cylCX, topY, botY, rectX, rectW };
   }

   /* Draw 3D cylinder.
    * opts.sideColor  – override body fill
    * opts.topColor   – override top ellipse fill
    * opts.botColor   – override bottom ellipse fill
    * opts.sideAlpha  – global alpha for body rect only
    */
   function f3DrawCyl(ctx, D, opts) {
    const { Rpx, Hpx, ry, cylCX, topY, botY } = D;
    const sc  = opts.sideColor  || F3BODY;
    const tc  = opts.topColor   || F3BODY;
    const btc = opts.botColor   || F3BODY;
    const sa  = opts.sideAlpha !== undefined ? opts.sideAlpha : 1;

    // Body (rect between top and bot ellipses)
    ctx.save();
    ctx.globalAlpha = sa;
    ctx.fillStyle = sc;
    ctx.fillRect(cylCX - Rpx, topY, Rpx * 2, Hpx);
    ctx.restore();

    // Side outlines
    ctx.save();
    ctx.strokeStyle = F3EDGE; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cylCX - Rpx, topY); ctx.lineTo(cylCX - Rpx, botY);
    ctx.moveTo(cylCX + Rpx, topY); ctx.lineTo(cylCX + Rpx, botY);
    ctx.stroke();
    ctx.restore();

    // Bottom ellipse (visible front)
    ctx.save();
    ctx.fillStyle = btc;
    ctx.beginPath(); ctx.ellipse(cylCX, botY, Rpx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = F3EDGE; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Dashed back arc of bottom ellipse
    ctx.save();
    ctx.strokeStyle = F3EDGE; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.ellipse(cylCX, botY, Rpx, ry, 0, Math.PI, 0, true);
    ctx.stroke();
    ctx.restore();

    // Top ellipse
    ctx.save();
    ctx.fillStyle = tc;
    ctx.beginPath(); ctx.ellipse(cylCX, topY, Rpx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = F3EDGE; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
   }

   function f3Frame(canvas, step, p) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const e = p * p * (3 - 2 * p);
    const D = f3D();
    const { r, h, Rpx, Hpx, ry, cylCX, topY, botY, rectX, rectW } = D;
    const pi = Math.PI;

    // ── Step 0: full cylinder with r / h labels ──────────────────────────────
    if (step === 0) {
     f3DrawCyl(ctx, D, {});
     // r arrow on top ellipse
     ctx.save();
     ctx.strokeStyle = '#D03000'; ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(cylCX, topY); ctx.lineTo(cylCX + Rpx, topY); ctx.stroke();
     ctx.fillStyle = '#D03000';
     ctx.beginPath();
     ctx.moveTo(cylCX + Rpx, topY);
     ctx.lineTo(cylCX + Rpx - 6, topY - 3);
     ctx.lineTo(cylCX + Rpx - 6, topY + 3);
     ctx.closePath(); ctx.fill();
     ctx.restore();
     f3Lbl(ctx, 'r = ' + r, cylCX + Rpx / 2, topY - 14, '#D03000', 12, 'center', 'bold');
     // h arrow on right side
     ctx.save();
     ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 1.5;
     ctx.beginPath();
     ctx.moveTo(cylCX + Rpx + 12, topY); ctx.lineTo(cylCX + Rpx + 12, botY);
     ctx.stroke();
     // arrowheads
     ctx.fillStyle = '#1A5FA8';
     ctx.beginPath(); ctx.moveTo(cylCX+Rpx+12, topY); ctx.lineTo(cylCX+Rpx+6, topY+7); ctx.lineTo(cylCX+Rpx+18, topY+7); ctx.fill();
     ctx.beginPath(); ctx.moveTo(cylCX+Rpx+12, botY); ctx.lineTo(cylCX+Rpx+6, botY-7); ctx.lineTo(cylCX+Rpx+18, botY-7); ctx.fill();
     ctx.restore();
     f3Lbl(ctx, 'h = ' + h, cylCX + Rpx + 28, (topY + botY) / 2, '#1A5FA8', 12, 'center', 'bold');
     // Right info card
     const cx2 = 230, cy2 = 60, cw = 182, ch = 90;
     f3Box(ctx, cx2, cy2, cw, ch, 8, '#F0F6FF', '#1A5FA8', 1.5);
     f3Lbl(ctx, '表面积 = 侧面 + 两底面', cx2+cw/2, cy2+22, '#0D3F6E', 12, 'center', 'bold');
     f3Lbl(ctx, '= 2πrh + 2πr²', cx2+cw/2, cy2+48, '#0D3F6E', 14, 'center', 'bold');
     f3Lbl(ctx, '= 2πr(r + h)', cx2+cw/2, cy2+72, '#888', 12, 'center');
     f3Lbl(ctx, '圆柱：底面半径 r，高 h', W / 2, 262, '#555', 13, 'center');
    }

    // ── Step 1: unroll side face into rectangle ────────────────────────────────
    if (step === 1) {
     // Cylinder body highlighted yellow, fading as it unrolls
     const sideAlpha = 1 - e * 0.4;
     f3DrawCyl(ctx, D, { sideColor: F3SIDE, sideAlpha });

     // Unrolled rectangle grows from left to right
     const curW = Math.max(0, e * rectW);
     if (curW > 0) {
      ctx.save();
      ctx.fillStyle = F3SIDE;
      ctx.fillRect(rectX, topY, curW, Hpx);
      ctx.strokeStyle = F3SIDE_D; ctx.lineWidth = 1.5;
      ctx.strokeRect(rectX, topY, curW, Hpx);
      ctx.restore();
      // Connection line: link right edge of cylinder to left edge of rect
      ctx.save();
      ctx.strokeStyle = F3SIDE_D; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(cylCX + Rpx, topY); ctx.lineTo(rectX, topY);
      ctx.moveTo(cylCX + Rpx, botY); ctx.lineTo(rectX, botY);
      ctx.stroke();
      ctx.restore();
     }

     // Labels fade in after 70%
     if (e > 0.7) {
      const la = (e - 0.7) / 0.3;
      ctx.save(); ctx.globalAlpha = la;
      f3Lbl(ctx, '2πr', rectX + curW / 2, topY - 14, F3SIDE_D, 13, 'center', 'bold');
      f3Lbl(ctx, '= 2π×' + r + ' ≈ ' + (2*pi*r).toFixed(1), rectX + curW / 2, topY - 26, '#888', 10, 'center');
      // h label right of rect
      ctx.save();
      ctx.strokeStyle = '#9A5800'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(rectX + curW + 10, topY); ctx.lineTo(rectX + curW + 10, botY);
      ctx.stroke();
      ctx.restore();
      f3Lbl(ctx, 'h', rectX + curW + 22, (topY + botY) / 2, '#9A5800', 14, 'center', 'bold');
      // Side area label inside rect
      if (curW > 60) {
       f3Lbl(ctx, '侧面积', rectX + curW / 2, (topY + botY) / 2 - 8, F3SIDE_D, 12, 'center', 'bold');
       f3Lbl(ctx, '= 2πrh', rectX + curW / 2, (topY + botY) / 2 + 10, F3SIDE_D, 12, 'center');
      }
      ctx.restore();
     }
     f3Lbl(ctx, '侧面沿高剪开展平 → 长方形（长=2πr，宽=h）', W / 2, 262, '#555', 12, 'center');
    }

    // ── Step 2: highlight top + bottom circles ─────────────────────────────────
    if (step === 2) {
     // Cylinder with green tops, faded yellow side
     f3DrawCyl(ctx, D, { topColor: F3CIRC, botColor: F3CIRC, sideAlpha: 0.5 });
     // Faded rect reminder
     ctx.save(); ctx.globalAlpha = 0.3;
     ctx.fillStyle = F3SIDE;
     ctx.fillRect(rectX, topY, rectW, Hpx);
     ctx.strokeStyle = F3SIDE_D; ctx.lineWidth = 1;
     ctx.strokeRect(rectX, topY, rectW, Hpx);
     ctx.restore();
     // Labels on tops
     f3Lbl(ctx, 'πr²', cylCX, topY - 12, F3CIRC_D, 12, 'center', 'bold');
     f3Lbl(ctx, 'πr²', cylCX, botY + 12 + ry, F3CIRC_D, 12, 'center', 'bold');
     // Right summary box
     const bx = 230, by = 65, bw = 180, bh = 100;
     f3Box(ctx, bx, by, bw, bh, 8, '#F0FFF4', F3CIRC_D, 1.5);
     f3Lbl(ctx, '两个底面', bx+bw/2, by+20, F3CIRC_D, 13, 'center', 'bold');
     f3Lbl(ctx, '= 2 × πr²', bx+bw/2, by+44, F3CIRC_D, 15, 'center', 'bold');
     f3Lbl(ctx, `= 2π×${r}² = 2π×${r*r}`, bx+bw/2, by+68, F3CIRC_D, 12, 'center');
     f3Lbl(ctx, `≈ ${(2*pi*r*r).toFixed(1)} cm²`, bx+bw/2, by+88, F3CIRC_D, 13, 'center', 'bold');
     f3Lbl(ctx, '上下两个圆形底面，面积各为 πr²', W / 2, 262, '#555', 12, 'center');
    }

    // ── Step 3: full formula ──────────────────────────────────────────────────
    if (step === 3) {
     f3DrawCyl(ctx, D, { sideColor: F3SIDE, topColor: F3CIRC, botColor: F3CIRC });
     // Full rect
     ctx.save();
     ctx.fillStyle = F3SIDE; ctx.globalAlpha = 0.6;
     ctx.fillRect(rectX, topY, rectW, Hpx);
     ctx.restore();
     ctx.save();
     ctx.strokeStyle = F3SIDE_D; ctx.lineWidth = 1.5;
     ctx.strokeRect(rectX, topY, rectW, Hpx);
     ctx.restore();
     // Formula box
     const S_side = 2 * pi * r * h;
     const S_top  = 2 * pi * r * r;
     const S_tot  = S_side + S_top;
     const bx = 218, by = 42, bw = 196, bh = 140;
     f3Box(ctx, bx, by, bw, bh, 8, '#EBF4FF', '#1A5FA8', 2);
     f3Lbl(ctx, 'S = 2πrh + 2πr²', bx+bw/2, by+22, '#0D3F6E', 14, 'center', 'bold');
     f3Lbl(ctx, '  = 2πr(r + h)', bx+bw/2, by+46, '#0D3F6E', 13, 'center');
     f3Lbl(ctx, `代入 r=${r}, h=${h}`, bx+bw/2, by+72, '#555', 11, 'center');
     f3Lbl(ctx, `= 2π×${r}×${h} + 2π×${r*r}`, bx+bw/2, by+92, '#0D3F6E', 12, 'center');
     f3Lbl(ctx, `≈ ${S_side.toFixed(1)} + ${S_top.toFixed(1)}`, bx+bw/2, by+112, '#0D3F6E', 12, 'center');
     f3Lbl(ctx, `≈ ${S_tot.toFixed(1)} cm²`, bx+bw/2, by+133, '#1A5FA8', 14, 'center', 'bold');
     f3Lbl(ctx, '侧面 + 两底面 = S = 2πrh + 2πr²', W / 2, 262, '#555', 12, 'center');
    }
   }

   function f3DrawStep(canvas) { f3Frame(canvas, f3State.curStep, 1); }
   function f3AnimFrame(canvas, p) { f3Frame(canvas, f3State.curStep, p); }

   function f3StartAnim(canvas, forceRestart, dur) {
    if (!forceRestart && (f3State.animRaf || f3State.animT0 === 0)) return;
    if (f3State.animRaf) { cancelAnimationFrame(f3State.animRaf); f3State.animRaf = null; }
    const SM = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const D = (dur || f3State.animDur) * SM;
    f3State.animT0 = performance.now();
    const t0 = f3State.animT0;
    let pausedMs = 0, pausedAt = 0;
    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) { if (!pausedAt) pausedAt = now; f3State.animRaf = requestAnimationFrame(tick); return; }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }
     const p = Math.min(1, (now - t0 - pausedMs) / D);
     f3AnimFrame(canvas, p);
     if (p < 1) { f3State.animRaf = requestAnimationFrame(tick); }
     else { f3State.animRaf = null; f3State.animT0 = 0; f3DrawStep(canvas); }
    })(t0);
   }

   function removeF3Canvas() {
    if (f3State.animRaf) { cancelAnimationFrame(f3State.animRaf); f3State.animRaf = null; }
    f3State.curStep = -1; f3State.animT0 = 0;
    const c = document.getElementById('f3-canvas');
    if (c) { const sv = c.parentElement?.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    const o = document.getElementById('f3-overlay');
    if (o) o.remove();
   }

   function getF3Canvas(sv) {
    const svg = sv.ownerSVGElement || sv;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f3-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f3-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'f3-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     const D = f3D();
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#D03000;font-weight:600">
       底面半径 <i>r</i> = <span id="f3-r-val">${D.r}</span>
       <input id="f3-r" type="range" min="1" max="5" step="1" value="${D.r}" style="width:90px;accent-color:#D03000">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#1A5FA8;font-weight:600">
       高 <i>h</i> = <span id="f3-h-val">${D.h}</span>
       <input id="f3-h" type="range" min="2" max="8" step="1" value="${D.h}" style="width:90px;accent-color:#1A5FA8">
      </label>`;
     wrap.after(overlay);
     const ref = canvas;
     document.getElementById('f3-r').addEventListener('input', function() {
      f3State.r = +this.value; document.getElementById('f3-r-val').textContent = this.value;
      if (f3State.animRaf) { cancelAnimationFrame(f3State.animRaf); f3State.animRaf = null; }
      f3DrawStep(ref);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     });
     document.getElementById('f3-h').addEventListener('input', function() {
      f3State.h = +this.value; document.getElementById('f3-h-val').textContent = this.value;
      if (f3State.animRaf) { cancelAnimationFrame(f3State.animRaf); f3State.animRaf = null; }
      f3DrawStep(ref);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     });
    }
    return { canvas };
   }

// @@SECTION:anims@@

     {
      hint: '这是一个底面半径 r、高 h 的圆柱。它的表面积由侧面和两个底面组成。拖动滑块改变大小。',
      formula: '表面积 = 侧面积 + 2×底面积（目标：推导 S = 2πrh + 2πr²）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF3Canvas(s); f3State.curStep=0; f3DrawStep(canvas); },
     },
     {
      hint: '把圆柱的侧面沿一条母线（竖向）剪开，展平，得到一个长方形。长方形的长等于底面周长 2πr，宽等于圆柱高 h。',
      formula: '侧面积 = 2πrh（长方形面积）',
      dur: 2600, noAutoFit: true,
      draw(s, p) { const {canvas}=getF3Canvas(s); f3State.curStep=1; f3StartAnim(canvas, p===0, 2600); },
     },
     {
      hint: '上下两个底面都是圆形，半径都是 r，面积各为 πr²，两个合在一起是 2πr²。',
      formula: '两底面积 = 2πr²',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF3Canvas(s); f3State.curStep=2; f3DrawStep(canvas); },
     },
     {
      hint: '表面积 = 侧面积 + 两底面积 = 2πrh + 2πr²，也可以写成 2πr(r+h)。拖滑块代入验证。',
      get formula() { const r=f3State.r,h=f3State.h,pi=Math.PI; return `S = 2π×${r}×${h} + 2π×${r}² ≈ ${(2*pi*r*h+2*pi*r*r).toFixed(1)} cm²`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF3Canvas(s); f3State.curStep=3; f3DrawStep(canvas); },
     },

// ================================================================
// GeoGenius Topic: c3 — 长方形周长 (Rectangle Perimeter)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.c3
// 推导：四条边依次描出 → 展开成一条直线 a+b+a+b → C = 2(a+b)
// ================================================================

// @@SECTION:helpers@@

   const c3State = {
    a: 6, b: 4, curStep: -1, animRaf: null, animT0: 0, animDur: 3000,
   };

   const C3A   = '#E07B39';   // 长a边 橙
   const C3A_D = '#B85C1E';
   const C3B   = '#2E9E6B';   // 宽b边 绿
   const C3B_D = '#1C6E48';
   const C3LINE= '#9aa0a6';

   function c3Label(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }
   function c3RoundRect(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   function c3D() {
    const a = c3State.a, b = c3State.b, s = 10;
    const aPx = a * s, bPx = b * s;
    return { a, b, s, aPx, bPx, perim: 2 * (aPx + bPx) };
   }

   /* Canvas + 滑块 overlay（长a、宽b） */
   function getC3Canvas(sv) {
    const svg = sv.ownerSVGElement || sv;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('c3-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'c3-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'c3-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     const D = c3D();
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#B85C1E;font-weight:600">
       长 <i>a</i>&thinsp;=&thinsp;<span id="c3-a-val">${D.a}</span>
       <input id="c3-a" type="range" min="3" max="10" step="1" value="${D.a}" style="width:84px;accent-color:#E07B39">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#1C6E48;font-weight:600">
       宽 <i>b</i>&thinsp;=&thinsp;<span id="c3-b-val">${D.b}</span>
       <input id="c3-b" type="range" min="2" max="8" step="1" value="${D.b}" style="width:84px;accent-color:#2E9E6B">
      </label>`;
     wrap.after(overlay);
     const canvasRef = canvas;
     function onSlider() {
      if (c3State.animRaf) { cancelAnimationFrame(c3State.animRaf); c3State.animRaf = null; }
      c3DrawStep(canvasRef);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     }
     document.getElementById('c3-a').addEventListener('input', function() {
      c3State.a = +this.value; document.getElementById('c3-a-val').textContent = this.value; onSlider();
     });
     document.getElementById('c3-b').addEventListener('input', function() {
      c3State.b = +this.value; document.getElementById('c3-b-val').textContent = this.value; onSlider();
     });
    }
    return { canvas };
   }

   function removeC3Canvas() {
    if (c3State.animRaf) { cancelAnimationFrame(c3State.animRaf); c3State.animRaf = null; }
    const c = document.getElementById('c3-canvas'), o = document.getElementById('c3-overlay');
    if (c) { const sv = c.parentElement && c.parentElement.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    if (o) o.remove();
    c3State.curStep = -1;
   }

   /* 长方形矩形（rx,ry 左上角；可选边色/尺寸标注） */
   function c3Rect(ctx, rx, ry, aPx, bPx, opts) {
    opts = opts || {};
    ctx.save();
    ctx.fillStyle = '#FBFBFD'; ctx.strokeStyle = opts.faint ? '#d6d8dc' : C3LINE;
    ctx.lineWidth = opts.faint ? 1 : 1.4;
    ctx.beginPath(); ctx.rect(rx, ry, aPx, bPx); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (opts.dims) {
     c3Label(ctx, `长 a=${c3State.a}`, rx + aPx/2, ry - 11, C3A_D, 12, 'center', '700');
     c3Label(ctx, `宽 b=${c3State.b}`, rx - 10, ry + bPx/2, C3B_D, 12, 'right', '700');
    }
   }

   /* 沿矩形周长走 frac（0~1）的点坐标 + 已走的分段，用于描边动画 */
   function c3RectEdges(rx, ry, aPx, bPx) {
    return [
     { x1: rx,        y1: ry,        x2: rx + aPx, y2: ry,        len: aPx, col: C3A, name: 'a' }, // 上
     { x1: rx + aPx,  y1: ry,        x2: rx + aPx, y2: ry + bPx,  len: bPx, col: C3B, name: 'b' }, // 右
     { x1: rx + aPx,  y1: ry + bPx,  x2: rx,       y2: ry + bPx,  len: aPx, col: C3A, name: 'a' }, // 下
     { x1: rx,        y1: ry + bPx,  x2: rx,       y2: ry,        len: bPx, col: C3B, name: 'b' }, // 左
    ];
   }

   /* ─── 静态绘图 ─── */
   function c3DrawStep(canvas) {
    const W = 420, H = 280;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const step = c3State.curStep;
    const D = c3D();
    const { a, b, aPx, bPx, perim } = D;

    if (step === 0) {
     const rx = 210 - aPx/2, ry = 128 - bPx/2;
     c3Rect(ctx, rx, ry, aPx, bPx, { dims: true });
     // 上下边橙、左右边绿，呼应后面
     const E = c3RectEdges(rx, ry, aPx, bPx);
     ctx.save(); ctx.lineWidth = 4; ctx.lineCap = 'round';
     E.forEach(e => { ctx.strokeStyle = e.col; ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); });
     ctx.restore();
     c3RoundRect(ctx, 150, 232, 120, 36, 8, '#FFF8E7', '#9A5800', 1.5);
     c3Label(ctx, 'C = ?', 210, 250, '#A03060', 16, 'center', '700');
    }

    else if (step === 1) {
     c3AnimFrame(canvas, 1);   // 描边终态
    }

    else if (step === 2) {
     c3AnimFrame(canvas, 1);   // 展开终态（curStep=2 时 c3AnimFrame 走展开分支）
    }

    else if (step === 3) {
     const rx = 150 - aPx/2, ry = 120 - bPx/2;
     c3Rect(ctx, rx, ry, aPx, bPx, { dims: true });
     const E = c3RectEdges(rx, ry, aPx, bPx);
     ctx.save(); ctx.lineWidth = 4; ctx.lineCap = 'round';
     E.forEach(e => { ctx.strokeStyle = e.col; ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); });
     ctx.restore();
     const C = 2 * (a + b);
     c3RoundRect(ctx, 232, 60, 168, 150, 9, '#E8F5E9', '#2E7D32', 1.5);
     c3Label(ctx, '长方形周长公式', 316, 84, '#2E7D32', 13, 'center', '700');
     c3Label(ctx, 'C = a+b+a+b', 316, 112, '#555', 13, 'center', '600');
     c3Label(ctx, 'C = 2×(a+b)', 316, 138, '#2E7D32', 18, 'center', '700');
     c3Label(ctx, `= 2×(${a}+${b})`, 316, 166, '#2E7D32', 13, 'center', '600');
     c3Label(ctx, `= ${C}`, 316, 190, '#2E7D32', 16, 'center', '700');
    }
   }

   /* ─── 动画帧：curStep=1 描边一周；curStep=2 四边展开成直线 ─── */
   function c3AnimFrame(canvas, p) {
    const W = 420, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, 280);
    const D = c3D();
    const { a, b, aPx, bPx, perim } = D;

    if (c3State.curStep === 2) {
     /* ── 展开：四条边从矩形飞到下方基线，依次拼成 a+b+a+b ── */
     const rx = 210 - aPx/2, ry = 70;
     const E = c3RectEdges(rx, ry, aPx, bPx);
     // 顶部淡矩形参照
     c3Rect(ctx, rx, ry, aPx, bPx, { faint: true });
     // 基线目标位置
     const baseY = 196, xStart = (W - perim) / 2;
     const slotLen = [aPx, bPx, aPx, bPx];
     let acc = 0;
     const targets = slotLen.map(L => { const t = { x1: xStart + acc, x2: xStart + acc + L }; acc += L; return t; });
     // 每条边错峰展开
     const STAG = 0.16, DUR = 1 - STAG * 3;
     for (let i = 0; i < 4; i++) {
      const lp = Math.max(0, Math.min(1, (p - i * STAG) / DUR));
      const e = E[i], ease = lp * lp * (3 - 2 * lp);
      // 源端点 → 目标端点（目标在基线上水平铺开）
      const sx1 = e.x1, sy1 = e.y1, sx2 = e.x2, sy2 = e.y2;
      const tx1 = targets[i].x1, ty1 = baseY, tx2 = targets[i].x2, ty2 = baseY;
      const cx1 = sx1 + (tx1 - sx1) * ease, cy1 = sy1 + (ty1 - sy1) * ease;
      const cx2 = sx2 + (tx2 - sx2) * ease, cy2 = sy2 + (ty2 - sy2) * ease;
      ctx.save(); ctx.strokeStyle = e.col; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx1, cy1); ctx.lineTo(cx2, cy2); ctx.stroke(); ctx.restore();
      // 已落位的边在基线下标注长度
      if (lp >= 1) c3Label(ctx, e.name === 'a' ? `${a}` : `${b}`, (tx1+tx2)/2, baseY + 14, e.name==='a'?C3A_D:C3B_D, 12, 'center', '700');
     }
     // 全部落位后画总括号
     const allDone = p >= 1;
     if (allDone) {
      ctx.save(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xStart, baseY+22); ctx.lineTo(xStart, baseY+27);
      ctx.lineTo(xStart+perim, baseY+27); ctx.lineTo(xStart+perim, baseY+22); ctx.stroke(); ctx.restore();
      c3Label(ctx, `C = a+b+a+b = ${a}+${b}+${a}+${b} = ${2*(a+b)}`, W/2, baseY + 40, '#333', 13, 'center', '700');
     }
     c3Label(ctx, '把四条边展开拉直成一条线段', W/2, 36, '#B85C1E', 13, 'center', '700');
     return;
    }

    /* ── 描边：curStep=1，沿周长走一圈把四条边依次描粗 ── */
    const rx = 210 - aPx/2, ry = 130 - bPx/2;
    c3Rect(ctx, rx, ry, aPx, bPx, { dims: true, faint: true });
    const E = c3RectEdges(rx, ry, aPx, bPx);
    const travel = p * perim;
    let used = 0, edgesDone = 0;
    for (let i = 0; i < 4; i++) {
     const e = E[i];
     const remain = travel - used;
     if (remain <= 0) break;
     const frac = Math.min(1, remain / e.len);
     const hx = e.x1 + (e.x2 - e.x1) * frac, hy = e.y1 + (e.y2 - e.y1) * frac;
     ctx.save(); ctx.strokeStyle = e.col; ctx.lineWidth = 5; ctx.lineCap = 'round';
     ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(hx, hy); ctx.stroke(); ctx.restore();
     if (frac >= 1) { edgesDone++; c3Label(ctx, e.name === 'a' ? `${a}` : `${b}`, (e.x1+e.x2)/2 + (e.name==='b'? (i===1?12:-12):0), (e.y1+e.y2)/2 + (e.name==='a'? (i===0?-10:12):0), e.name==='a'?C3A_D:C3B_D, 12, 'center', '700'); }
     used += e.len;
     // 笔尖
     if (frac < 1) { ctx.save(); ctx.fillStyle = '#C03030'; ctx.beginPath(); ctx.arc(hx, hy, 3.5, 0, 2*pi); ctx.fill(); ctx.restore(); }
    }
    c3Label(ctx, p >= 1 ? '周长 = 四条边的总长度 = a+b+a+b' : `正在数第 ${Math.min(4, edgesDone+1)} 条边…`,
            W/2, 36, '#B85C1E', 13, 'center', '700');
   }

   /* ─── 动画入口（修正版守卫，避免RAF竞态重启死循环） ─── */
   function c3StartAnim(canvas, forceRestart, dur) {
    if (!forceRestart && (c3State.animRaf || c3State.animT0 === 0)) return;
    if (c3State.animRaf) { cancelAnimationFrame(c3State.animRaf); c3State.animRaf = null; }

    const SM = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const D = (dur || c3State.animDur) * SM;

    c3State.animT0 = performance.now();
    const t0 = c3State.animT0;
    let pausedMs = 0, pausedAt = 0;

    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) { if (!pausedAt) pausedAt = now; c3State.animRaf = requestAnimationFrame(tick); return; }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }
     const p = Math.min(1, (now - t0 - pausedMs) / D);
     c3AnimFrame(canvas, p);
     if (p < 1) { c3State.animRaf = requestAnimationFrame(tick); }
     else { c3State.animRaf = null; c3State.animT0 = 0; c3DrawStep(canvas); }
    })(t0);
   }

// @@SECTION:anims@@

     {
      hint: '这是一个长方形：长 a、宽 b。它的周长 C 是绕一圈四条边的总长度。拖动滑块改变长宽。',
      formula: 'C = ?（目标：推导长方形周长 C = 2(a+b)）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getC3Canvas(s); c3State.curStep=0; c3DrawStep(canvas); },
     },
     {
      hint: '沿着长方形走一圈，把四条边依次描粗：上(a)→右(b)→下(a)→左(b)。周长就是这四条边的总和。',
      formula: '周长 = 上 + 右 + 下 + 左 = a + b + a + b',
      dur: 2800, noAutoFit: true,
      draw(s, p) { const {canvas}=getC3Canvas(s); c3State.curStep=1; c3State.animDur=2800; c3StartAnim(canvas, p===0, 2800); },
     },
     {
      hint: '把四条边一条条展开、拉直，接成一条线段：a + b + a + b。这就是周长的总长度。',
      formula: '展开四条边 → a + b + a + b',
      dur: 3400, noAutoFit: true,
      draw(s, p) { const {canvas}=getC3Canvas(s); c3State.curStep=2; c3State.animDur=3400; c3StartAnim(canvas, p===0, 3400); },
     },
     {
      hint: '两条长 a + 两条宽 b，合起来就是 2 个 (a+b)。所以长方形周长 C = 2×(a+b)。拖滑块验证。',
      get formula() { const a=c3State.a,b=c3State.b; return `C = 2(a+b) = 2×(${a}+${b}) = ${2*(a+b)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getC3Canvas(s); c3State.curStep=3; c3DrawStep(canvas); },
     },

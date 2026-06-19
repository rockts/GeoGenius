// ================================================================
// GeoGenius Topic: f1 — 圆的周长 (Circle Circumference)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f1
// 推导：圆滚一圈=周长 → 用直径量周长，约3.14倍 → π → C=πd=2πr
// ================================================================

// @@SECTION:helpers@@

   const f1State = {
    r: 3, curStep: -1, animRaf: null, animT0: 0,
   };

   const F1CIR   = '#E8F1FB';   // 圆填充
   const F1CIR_D = '#1A5FA8';   // 圆描边
   const F1DIA   = '#0A7050';   // 直径绿
   const F1CIRC  = '#E07B39';   // 周长橙
   const F1MARK  = '#C03030';   // 滚动标记点

   function f1Label(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }
   function f1RoundRect(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   function f1D() {
    const r = f1State.r;
    const Rpx = Math.min(r * 13, 42);
    const d   = 2 * Rpx;
    const Cpx = 2 * Math.PI * Rpx;
    const startX = 44, botY = 178;
    return { r, Rpx, d, Cpx, startX, botY };
   }

   /* Canvas + 滑块 overlay 初始化（只有半径 r） */
   function getF1Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f1-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f1-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'f1-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     const D = f1D();
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#1A5FA8;font-weight:600">
       半径 <i>r</i>&thinsp;=&thinsp;<span id="f1-r-val">${D.r}</span>
       <input id="f1-r" type="range" min="2" max="5" step="1" value="${D.r}" style="width:96px;accent-color:#1A5FA8">
      </label>`;
     wrap.after(overlay);
     const canvasRef = canvas;
     document.getElementById('f1-r').addEventListener('input', function() {
      f1State.r = +this.value; document.getElementById('f1-r-val').textContent = this.value;
      if (f1State.animRaf) { cancelAnimationFrame(f1State.animRaf); f1State.animRaf = null; }
      f1DrawStep(canvasRef);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     });
    }
    return { canvas };
   }

   function removeF1Canvas() {
    if (f1State.animRaf) { cancelAnimationFrame(f1State.animRaf); f1State.animRaf = null; }
    const c = document.getElementById('f1-canvas'), o = document.getElementById('f1-overlay');
    if (c) { const sv = c.parentElement && c.parentElement.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    if (o) o.remove();
    f1State.curStep = -1;
   }

   /* 画圆 + 圆心 + 半径/直径线 */
   function f1Circle(ctx, cx, cy, R, opts) {
    opts = opts || {};
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2*Math.PI);
    ctx.fillStyle = F1CIR; ctx.fill();
    ctx.strokeStyle = F1CIR_D; ctx.lineWidth = 2; ctx.stroke();
    if (opts.r) {
     ctx.strokeStyle = F1CIR_D; ctx.lineWidth = 1.6;
     ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
     f1Label(ctx, `r=${f1State.r}`, cx + R/2, cy - 9, F1CIR_D, 12, 'center', '700');
    }
    if (opts.d) {
     ctx.strokeStyle = F1DIA; ctx.lineWidth = 1.8;
     ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
     f1Label(ctx, `d=${2*f1State.r}`, cx, cy + 12, F1DIA, 12, 'center', '700');
    }
    ctx.fillStyle = F1CIR_D; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 2*Math.PI); ctx.fill();
    ctx.restore();
   }

   /* 滚动帧：p=0→1，圆沿地面滚一整圈，标记点画摆线，地面高亮已滚轨迹 */
   function f1RollFrame(ctx, p) {
    const W = 420, pi = Math.PI;
    const D = f1D();
    const { r, Rpx, Cpx, startX, botY } = D;
    ctx.clearRect(0, 0, W, 280);

    // 地面
    ctx.save(); ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(24, botY); ctx.lineTo(400, botY); ctx.stroke(); ctx.restore();

    const phi = p * 2 * pi;
    const dist = Rpx * phi;          // = p * Cpx
    const cx = startX + dist, cy = botY - Rpx;

    // 终点目标刻度（虚线竖线）
    ctx.save(); ctx.strokeStyle = '#bbb'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(startX, botY - 8); ctx.lineTo(startX, botY + 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(startX + Cpx, botY - 8); ctx.lineTo(startX + Cpx, botY + 14); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    // 已滚轨迹（橙色加粗）
    ctx.save(); ctx.strokeStyle = F1CIRC; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(startX, botY); ctx.lineTo(startX + dist, botY); ctx.stroke(); ctx.restore();

    // 摆线轨迹（标记点走过的路径，淡橙虚线）
    if (phi > 0.01) {
     ctx.save(); ctx.strokeStyle = 'rgba(224,123,57,0.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
     ctx.beginPath();
     for (let a = 0; a <= phi + 0.001; a += 0.12) {
      const mx = startX + Rpx * (a - Math.sin(a));
      const my = botY - Rpx * (1 - Math.cos(a));
      if (a === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
     }
     ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    // 圆
    f1Circle(ctx, cx, cy, Rpx, {});
    // 辐条 + 标记点（显示旋转）
    const mx = cx - Rpx * Math.sin(phi), my = cy + Rpx * Math.cos(phi);
    ctx.save(); ctx.strokeStyle = F1MARK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();
    ctx.fillStyle = F1MARK; ctx.beginPath(); ctx.arc(mx, my, 3.5, 0, 2*pi); ctx.fill();
    ctx.restore();

    // 起点小旗
    f1Label(ctx, '起点', startX, botY + 22, '#888', 10, 'center');

    // 文字
    const turn = (p * 1).toFixed(2);
    f1Label(ctx, p >= 1 ? '滚了整整一圈！' : `已滚 ${turn} 圈`, W/2, 32, F1CIR_D, 13, 'center', '700');
    if (p >= 1) {
     f1Label(ctx, '橙色轨迹的长度 = 圆的周长 C', W/2, 52, F1CIRC, 12, 'center', '700');
    } else {
     f1Label(ctx, '红点滚过的水平距离 = 周长', W/2, 52, '#888', 11, 'center');
    }
   }

   /* ─── 静态绘图 ─── */
   function f1DrawStep(canvas) {
    const W = 420, H = 280, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const step = f1State.curStep;
    const D = f1D();
    const { r, Rpx, d, Cpx, startX, botY } = D;

    if (step === 0) {
     /* 圆 + r/d + C=? 卡片 */
     const cx = 130, cy = 140, R = Math.max(40, r * 16);
     f1Circle(ctx, cx, cy, R, { r: true, d: true });
     f1RoundRect(ctx, 250, 80, 148, 120, 9, '#FFF8E7', '#9A5800', 1.5);
     f1Label(ctx, '圆的周长', 324, 104, '#9A5800', 13, 'center', '600');
     f1Label(ctx, 'C = ?', 324, 138, '#A03060', 22, 'center', '700');
     f1Label(ctx, '绕圆一圈的长度', 324, 172, '#9A5800', 11);
    }

    else if (step === 1) {
     /* 滚动演示终态 */
     f1RollFrame(ctx, 1);
    }

    else if (step === 2) {
     /* 测量：拉直的周长 vs 直径 */
     const xS = (W - Cpx) / 2, yC = 96;
     // 周长线段
     ctx.save(); ctx.strokeStyle = F1CIRC; ctx.lineWidth = 4; ctx.lineCap = 'round';
     ctx.beginPath(); ctx.moveTo(xS, yC); ctx.lineTo(xS + Cpx, yC); ctx.stroke();
     ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(xS, yC-7); ctx.lineTo(xS, yC+7); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(xS+Cpx, yC-7); ctx.lineTo(xS+Cpx, yC+7); ctx.stroke();
     ctx.restore();
     f1Label(ctx, '周长 C（滚一圈拉直）', W/2, yC - 16, F1CIRC, 12, 'center', '700');
     // 直径线段（同左端对齐，便于比较）
     const yD = 150;
     ctx.save(); ctx.strokeStyle = F1DIA; ctx.lineWidth = 4; ctx.lineCap = 'round';
     ctx.beginPath(); ctx.moveTo(xS, yD); ctx.lineTo(xS + d, yD); ctx.stroke();
     ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(xS, yD-7); ctx.lineTo(xS, yD+7); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(xS+d, yD-7); ctx.lineTo(xS+d, yD+7); ctx.stroke();
     ctx.restore();
     f1Label(ctx, `直径 d=${2*r}`, xS + d + 30, yD, F1DIA, 12, 'left', '700');
     f1RoundRect(ctx, 60, 198, W - 120, 44, 8, '#EAF3FF', '#1A5FA8', 1.5);
     f1Label(ctx, '周长比直径长多少倍？用直径去量一量 →', W/2, 220, '#1A5FA8', 12, 'center', '700');
    }

    else if (step === 3) {
     /* 用直径量周长：3次多一点 ≈ 3.14倍 */
     const xS = (W - Cpx) / 2, yC = 104;
     // 周长基准线
     ctx.save(); ctx.strokeStyle = F1CIRC; ctx.lineWidth = 4; ctx.lineCap = 'round';
     ctx.beginPath(); ctx.moveTo(xS, yC); ctx.lineTo(xS + Cpx, yC); ctx.stroke(); ctx.restore();
     f1Label(ctx, '周长 C', xS - 8, yC, F1CIRC, 12, 'right', '700');
     // 在下方一段段铺直径
     const yD = 140, full = 3, rem = (pi - 3);
     for (let k = 0; k < full; k++) {
      const x0 = xS + k * d;
      ctx.save(); ctx.strokeStyle = F1DIA; ctx.lineWidth = 7; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(x0 + 1, yD); ctx.lineTo(x0 + d - 1, yD); ctx.stroke(); ctx.restore();
      f1Label(ctx, `${k+1}`, x0 + d/2, yD, '#fff', 11, 'center', '700');
      // 对齐竖虚线
      ctx.save(); ctx.strokeStyle = 'rgba(10,112,80,0.5)'; ctx.lineWidth = 0.8; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(x0 + d, yC - 6); ctx.lineTo(x0 + d, yD + 6); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
     }
     // 余下 0.14d
     const xr = xS + full * d;
     ctx.save(); ctx.strokeStyle = '#A03060'; ctx.lineWidth = 7; ctx.lineCap = 'butt';
     ctx.beginPath(); ctx.moveTo(xr + 1, yD); ctx.lineTo(xr + rem * d - 1, yD); ctx.stroke(); ctx.restore();
     f1Label(ctx, '0.14', xr + rem*d/2, yD + 14, '#A03060', 10, 'center', '700');
     f1Label(ctx, '用直径量周长：3整段 + 0.14段', W/2, 70, '#333', 12, 'center', '700');
     f1RoundRect(ctx, 52, 176, W - 104, 70, 8, '#F6ECF4', '#A03060', 1.5);
     f1Label(ctx, 'C ≈ 3.14 × d', W/2, 200, '#A03060', 18, 'center', '700');
     f1Label(ctx, '这个固定倍数 3.1415… 就是圆周率 π', W/2, 228, '#A03060', 12, 'center', '600');
    }

    else if (step === 4) {
     /* 公式 + 数值验证 */
     const cx = 116, cy = 128, R = Math.max(38, r * 15);
     f1Circle(ctx, cx, cy, R, { d: true });
     const Cval = (3.14 * 2 * r).toFixed(2);
     f1RoundRect(ctx, 224, 56, 174, 150, 9, '#E8F5E9', '#2E7D32', 1.5);
     f1Label(ctx, '圆周长公式', 311, 80, '#2E7D32', 13, 'center', '700');
     f1Label(ctx, 'C = πd = 2πr', 311, 110, '#2E7D32', 18, 'center', '700');
     f1Label(ctx, `r=${r}，d=${2*r}`, 311, 140, '#555', 12, 'center', '600');
     f1Label(ctx, `C = 2×3.14×${r}`, 311, 166, '#2E7D32', 13, 'center', '600');
     f1Label(ctx, `≈ ${Cval}`, 311, 190, '#2E7D32', 16, 'center', '700');
    }
   }

   /* ─── 滚动动画入口（修正版守卫，避免RAF竞态重启死循环） ─── */
   function f1AnimFrame(canvas, p) {
    f1RollFrame(canvas.getContext('2d'), p);
   }
   function f1StartAnim(canvas, forceRestart) {
    if (!forceRestart && (f1State.animRaf || f1State.animT0 === 0)) return;
    if (f1State.animRaf) { cancelAnimationFrame(f1State.animRaf); f1State.animRaf = null; }

    const SM  = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const dur = 3800 * SM;

    f1State.animT0 = performance.now();
    const t0 = f1State.animT0;
    let pausedMs = 0, pausedAt = 0;

    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) {
      if (!pausedAt) pausedAt = now;
      f1State.animRaf = requestAnimationFrame(tick);
      return;
     }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }

     const p = Math.min(1, (now - t0 - pausedMs) / dur);
     f1AnimFrame(canvas, p);

     if (p < 1) {
      f1State.animRaf = requestAnimationFrame(tick);
     } else {
      f1State.animRaf = null; f1State.animT0 = 0;
      f1DrawStep(canvas);
     }
    })(t0);
   }

// @@SECTION:anims@@

     {
      hint: '圆的周长就是绕圆一圈的长度。它和直径 d、半径 r 有什么关系？拖动滑块改变大小。',
      formula: 'C = ?（目标：推导圆周长公式 C = πd = 2πr）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF1Canvas(s); f1State.curStep=0; f1DrawStep(canvas); },
     },
     {
      hint: '把圆放到直线上滚一整圈，红点滚过的水平距离就是周长。观察滚动！',
      formula: '圆滚一整圈走过的距离 = 周长 C',
      dur: 3800, noAutoFit: true,
      draw(s, p) { const {canvas}=getF1Canvas(s); f1State.curStep=1; f1StartAnim(canvas, p===0); },
     },
     {
      hint: '把滚出的周长拉直成一条线段，再和直径比一比，周长明显比直径长好几倍。',
      formula: '周长 C 拉直 → 和直径 d 比较',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF1Canvas(s); f1State.curStep=2; f1DrawStep(canvas); },
     },
     {
      hint: '用直径一段段去量周长：正好量了3整段，还多出约0.14段。所以周长≈3.14倍直径！',
      formula: 'C ≈ 3.14 × d，这个倍数就是圆周率 π',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF1Canvas(s); f1State.curStep=3; f1DrawStep(canvas); },
     },
     {
      hint: '周长是直径的π倍：C = πd。又因为 d=2r，所以 C = 2πr。拖动滑块验证数值。',
      get formula() { const r=f1State.r; return `C = 2πr = 2×3.14×${r} ≈ ${(3.14*2*r).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF1Canvas(s); f1State.curStep=4; f1DrawStep(canvas); },
     },

// ================================================================
// GeoGenius Topic: f4 — 圆柱的体积 (Cylinder Volume)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f4
// 推导：竖切n等份 → 同色扇形柱直立并排 → 切越细越像长方体 → V=πr²h
// ================================================================

// @@SECTION:helpers@@

   const f4State = {
    r: 3, h: 5, curStep: -1, animRaf: null, animT0: 0,
   };

   const F4BW = 252;  // 展开块总宽（固定像素）

   function f4Label(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function f4RoundRect(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   /* 从 r/h/n 计算绘制参数 */
   function f4D(n) {
    const r = f4State.r, h = f4State.h;
    n = n || 8;
    const ch    = Math.min(h * 16, 130);
    const arcW  = F4BW / n;
    // 扇形矢高：r*(1-cos(π/n))，随n增大趋近0
    const depth = Math.max(1, r * (1 - Math.cos(Math.PI / n)) * 80);
    const cylCX = 58;
    const cylRx = Math.min(r * 10, 34);
    const cylRy = Math.max(5, Math.round(cylRx * 0.28));
    const botY  = 212;
    const startXcyl    = cylCX + cylRx + 26;
    const startXcenter = Math.round((420 - F4BW) / 2);
    return { r, h, n, ch, arcW, depth, cylCX, cylRx, cylRy, botY, startXcyl, startXcenter };
   }

   /* 画直立圆柱，可选顶面切割线 */
   function f4Cyl(ctx, cx, topY, D, showCuts, nCuts) {
    const { cylRx: rx, cylRy: ry, ch } = D;
    const botY = topY + ch;
    ctx.save();
    ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, botY);
    ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, topY);
    ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath(); ctx.fillStyle = '#C8E6D4'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, topY); ctx.lineTo(cx + rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, topY, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#E4F6EE'; ctx.fill(); ctx.strokeStyle = '#0A7050'; ctx.stroke();
    if (showCuts && nCuts > 0) {
     ctx.strokeStyle = '#8B0020'; ctx.lineWidth = 1.2;
     for (let i = 0; i < nCuts; i++) {
      const a = i * 2 * Math.PI / nCuts;
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx + rx * Math.cos(a), topY + ry * Math.sin(a));
      ctx.stroke();
     }
    }
    ctx.restore();
   }

   /* 单色扇形柱：矩形主体 + 顶面等腰三角（朝上） */
   function f4Col(ctx, x, botY, arcW, ch, depth) {
    ctx.save();
    ctx.fillStyle = '#F88060';
    ctx.fillRect(x, botY - ch, arcW, ch);
    ctx.strokeStyle = '#C04820';
    ctx.lineWidth = arcW > 10 ? 0.7 : 0.3;
    ctx.strokeRect(x, botY - ch, arcW, ch);
    ctx.fillStyle = '#FAB090';
    ctx.beginPath();
    ctx.moveTo(x, botY - ch);
    ctx.lineTo(x + arcW, botY - ch);
    ctx.lineTo(x + arcW / 2, botY - ch - depth);
    ctx.closePath(); ctx.fill();
    if (arcW > 8) { ctx.strokeStyle = '#C04820'; ctx.lineWidth = 0.5; ctx.stroke(); }
    ctx.restore();
   }

   /* 画完整展开块（2D，仅动画过程中使用） */
   function f4DrawBlock(ctx, n, startX, botY, arcW, ch, depth) {
    for (let i = 0; i < n; i++) {
     f4Col(ctx, startX + i * arcW, botY, arcW, ch, depth);
    }
   }

   /* 画3D展开块：顶面（平行四边形）+ 绿色右截面 + 前面列 */
   function f4DrawBlock3D(ctx, n, startX, botY, arcW, ch, depth) {
    const oblX = 18, oblY = 10;
    const topY = botY - ch;
    const endX = startX + n * arcW;

    // 顶面（平行四边形，深橙）
    ctx.save();
    ctx.fillStyle = '#D86848';
    ctx.beginPath();
    ctx.moveTo(startX, topY);
    ctx.lineTo(endX, topY);
    ctx.lineTo(endX + oblX, topY - oblY);
    ctx.lineTo(startX + oblX, topY - oblY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#C04820'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();

    // 右侧截面（绿色，代表 r×h 的圆截面）
    ctx.save();
    ctx.fillStyle = '#6AAB78';
    ctx.beginPath();
    ctx.moveTo(endX, topY);
    ctx.lineTo(endX + oblX, topY - oblY);
    ctx.lineTo(endX + oblX, botY - oblY);
    ctx.lineTo(endX, botY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2A7040'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();

    // 前面各列（矩形 + 三角顶，覆盖在顶面之上）
    for (let i = 0; i < n; i++) {
     f4Col(ctx, startX + i * arcW, botY, arcW, ch, depth);
    }
   }

   /* Canvas + 滑块 overlay 初始化 */
   function getF4Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f4-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f4-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'f4-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     const D = f4D();
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#0A7050;font-weight:600">
       底面半径 <i>r</i>&thinsp;=&thinsp;<span id="f4-r-val">${D.r}</span>
       <input id="f4-r" type="range" min="2" max="5" step="1" value="${D.r}" style="width:80px;accent-color:#0A7050">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="f4-h-val">${D.h}</span>
       <input id="f4-h" type="range" min="2" max="8" step="1" value="${D.h}" style="width:80px;accent-color:#C03030">
      </label>`;
     wrap.after(overlay);
     const canvasRef = canvas;
     function onSlider() {
      if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }
      f4DrawStep(canvasRef);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     }
     document.getElementById('f4-r').addEventListener('input', function() {
      f4State.r = +this.value; document.getElementById('f4-r-val').textContent = this.value; onSlider();
     });
     document.getElementById('f4-h').addEventListener('input', function() {
      f4State.h = +this.value; document.getElementById('f4-h-val').textContent = this.value; onSlider();
     });
    }
    return { canvas };
   }

   function removeF4Canvas() {
    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }
    const c = document.getElementById('f4-canvas'), o = document.getElementById('f4-overlay');
    if (c) { const sv = c.parentElement && c.parentElement.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    if (o) o.remove();
    f4State.curStep = -1;
   }

   /* ─── 静态绘图 ─── */
   function f4DrawStep(canvas) {
    const W = 420, H = 280, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const step = f4State.curStep;

    if (step === 0) {
     /* ── 圆柱 + r/h 标注 + V=? 卡片 ── */
     const D = f4D(8);
     const { r, h, ch, cylCX, cylRx, botY } = D;
     f4Cyl(ctx, cylCX, botY - ch, D, false, 0);
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(cylCX, botY - ch); ctx.lineTo(cylCX + cylRx, botY - ch); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `r = ${r}`, cylCX + cylRx / 2, botY - ch - 10, '#0A7050', 13, 'center', '600');
     const hx = cylCX + cylRx + 14;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.moveTo(hx, botY - ch); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, botY-ch); ctx.lineTo(hx+5, botY-ch); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, botY); ctx.lineTo(hx+5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx + 8, botY - ch / 2, '#C03030', 13, 'left', '600');
     f4RoundRect(ctx, 152, 38, 230, 112, 8, '#FFF8E7', '#9A5800', 1.5);
     f4Label(ctx, '圆柱体积', 267, 62, '#9A5800', 13, 'center', '600');
     f4Label(ctx, 'V = ?', 267, 94, '#A03060', 22, 'center', '700');
     f4Label(ctx, '底面积 × 高 = πr² × h', 267, 128, '#9A5800', 11);
    }

    else if (step === 1) {
     /* ── 圆柱顶面8条切割线 + 说明 ── */
     const D = f4D(8);
     const { r, h, ch, cylCX, cylRx, botY } = D;
     f4Cyl(ctx, cylCX, botY - ch, D, true, 8);
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(cylCX, botY - ch); ctx.lineTo(cylCX + cylRx, botY - ch); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `r = ${r}`, cylCX + cylRx / 2, botY - ch - 10, '#0A7050', 12, 'center', '600');
     const hx = cylCX + cylRx + 14;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.moveTo(hx, botY-ch); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx + 8, botY - ch / 2, '#C03030', 12, 'left', '600');
     f4RoundRect(ctx, 152, 36, 240, 64, 8, '#FFF0E8', '#C04820', 1.5);
     f4Label(ctx, '沿圆心竖切8等份', 272, 57, '#C04820', 12, 'center', '600');
     f4Label(ctx, '每份叫一个"扇形柱"', 272, 79, '#C04820', 12, 'center', '600');
    }

    else if (step === 2) {
     /* ── 8份并排展开（3D） ── */
     const D = f4D(8);
     const { ch, arcW, depth, cylCX, cylRx, botY, startXcyl } = D;
     f4Cyl(ctx, cylCX, botY - ch, D, true, 8);
     const ax = startXcyl - 6;
     ctx.save(); ctx.strokeStyle = '#666'; ctx.lineWidth = 1.8;
     ctx.beginPath(); ctx.moveTo(cylCX + cylRx + 4, botY - ch / 2); ctx.lineTo(ax, botY - ch / 2); ctx.stroke();
     ctx.fillStyle = '#666';
     ctx.beginPath(); ctx.moveTo(ax, botY-ch/2); ctx.lineTo(ax-7, botY-ch/2-5); ctx.lineTo(ax-7, botY-ch/2+5); ctx.closePath(); ctx.fill();
     ctx.restore();
     f4DrawBlock3D(ctx, 8, startXcyl, botY, arcW, ch, depth);
     f4Label(ctx, '8个扇形柱并排展开', startXcyl + F4BW / 2, botY + depth + 14, '#555', 11, 'center', '600');
    }

    else if (step === 3) {
     /* ── 16份展开（3D），顶面更平 ── */
     const oblX = 18, oblY = 10;
     const D = f4D(16);
     const { r, h, ch, arcW, depth, botY, startXcenter } = D;
     f4DrawBlock3D(ctx, 16, startXcenter, botY, arcW, ch, depth);
     // 底部宽度标注（前面底边）
     const annY = botY + 14;
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(startXcenter, annY); ctx.lineTo(startXcenter + F4BW, annY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter, annY-5); ctx.lineTo(startXcenter, annY+5); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter+F4BW, annY-5); ctx.lineTo(startXcenter+F4BW, annY+5); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `总宽 ≈ 2πr ≈ ${(2*pi*r).toFixed(1)}`, startXcenter + F4BW/2, botY + 28, '#0A7050', 11, 'center', '600');
     // 右侧高度标注（在绿色截面右侧）
     const hx2 = startXcenter + F4BW + oblX + 10;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(hx2, botY-ch); ctx.lineTo(hx2, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx2-4, botY-ch); ctx.lineTo(hx2+4, botY-ch); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx2-4, botY); ctx.lineTo(hx2+4, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h=${h}`, hx2 + 6, botY - ch/2, '#C03030', 11, 'left', '600');
     // 顶部提示（在斜面之上）
     f4Label(ctx, '切16份：顶面锯齿更小，整体更接近长方体', W/2, botY - ch - oblY - depth - 12, '#333', 11, 'center', '600');
    }

    else if (step === 4) {
     /* ── 32份展开（3D） + 公式 ── */
     const oblX = 18, oblY = 10;
     const D = f4D(32);
     const { r, h, ch, arcW, depth, botY, startXcenter } = D;
     f4DrawBlock3D(ctx, 32, startXcenter, botY, arcW, ch, depth);
     f4Label(ctx, '切32份：顶面几乎平整，非常接近长方体！', W/2, botY - ch - oblY - depth - 12, '#333', 11, 'center', '600');
     const vol = (3.14 * r * r * h).toFixed(2);
     f4RoundRect(ctx, 22, botY + 10, W - 44, 52, 8, '#E8F5E9', '#2E7D32', 1.5);
     f4Label(ctx, 'V = πr²h', W/2, botY + 26, '#2E7D32', 16, 'center', '700');
     f4Label(ctx, `r=${r}, h=${h}  →  V = 3.14×${r}²×${h} = 3.14×${r*r}×${h} ≈ ${vol}`, W/2, botY + 48, '#2E7D32', 12, 'center', '600');
    }
   }

   /* ─── 动画：8个扇形柱从圆柱右侧依次展开并排 ───
      forceRestart=true  → 主 app 新一轮（run() 发来 p=0），必须重启
      forceRestart=false → animTick 中途调用：正在播放(animRaf)或已结束(animT0===0)
                           都忽略，避免 f4 自身 RAF 先结束后被重启成死循环。 */
   function f4StartAnim(canvas, forceRestart) {
    if (!forceRestart && (f4State.animRaf || f4State.animT0 === 0)) return;
    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }

    const n = 8;
    const D = f4D(n);
    const { ch, arcW, depth, cylCX, cylRx, botY, startXcyl } = D;
    const finalX = Array.from({ length: n }, (_, i) => startXcyl + i * arcW);
    const srcX   = cylCX + cylRx + 2;

    // 慢速支持：animTick 已经把 dur 乘以 1.9，f4 也同步拉长
    const SM      = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const STAGGER = 60 * SM;
    const COLDUR  = 320 * SM;
    const totalDur = STAGGER * (n - 1) + COLDUR + 60;

    f4State.animT0 = performance.now();
    const t0 = f4State.animT0;
    let pausedMs = 0, pausedAt = 0;

    (function tick(now) {
     // 暂停支持：animState.paused 由主 app togglePause 控制
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) {
      if (!pausedAt) pausedAt = now;
      f4State.animRaf = requestAnimationFrame(tick);
      return;
     }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }

     const elapsed = now - t0 - pausedMs;
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, 420, 280);

     f4Cyl(ctx, cylCX, botY - ch, D, true, n);

     const ax = startXcyl - 6;
     ctx.save(); ctx.strokeStyle = '#666'; ctx.lineWidth = 1.8;
     ctx.beginPath(); ctx.moveTo(cylCX + cylRx + 4, botY - ch / 2); ctx.lineTo(ax, botY - ch / 2); ctx.stroke();
     ctx.fillStyle = '#666';
     ctx.beginPath(); ctx.moveTo(ax, botY-ch/2); ctx.lineTo(ax-7, botY-ch/2-5); ctx.lineTo(ax-7, botY-ch/2+5); ctx.closePath(); ctx.fill();
     ctx.restore();

     for (let i = 0; i < n; i++) {
      const p  = Math.max(0, Math.min(1, (elapsed - i * STAGGER) / COLDUR));
      const pe = p * p * (3 - 2 * p);
      const x  = srcX + (finalX[i] - srcX) * pe;
      f4Col(ctx, x, botY, arcW, ch, depth);
     }

     const done = Array.from({ length: n }, (_, i) => (elapsed - i * STAGGER) / COLDUR >= 1).filter(Boolean).length;
     if (done < n) {
      f4Label(ctx, `展开 ${done}/${n}`, startXcyl + F4BW / 2, botY + depth + 14, '#555', 11, 'center');
     }

     if (elapsed < totalDur) {
      f4State.animRaf = requestAnimationFrame(tick);
     } else {
      f4State.animRaf = null;
      f4State.animT0 = 0;
      f4DrawStep(canvas);
     }
    })(t0);
   }

// @@SECTION:anims@@

     {
      hint: '这是一个底面半径r、高h的圆柱。体积怎么算？拖动滑块改变大小，观察变化。',
      formula: 'V = ?（目标：推导圆柱体积公式 V = πr²h）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=0; f4DrawStep(canvas); },
     },
     {
      hint: '沿圆柱中心轴竖切8等份，每份叫一个"扇形柱"。注意顶面的8条切割线。',
      formula: '圆柱竖切8等份 → 8个扇形柱',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=1; f4DrawStep(canvas); },
     },
     {
      hint: '把8个扇形柱并排展开——合在一起的轮廓已经有点像长方体了！',
      formula: '8个扇形柱并排 → 近似长方体（总宽≈2πr，高=h）',
      dur: 820, noAutoFit: true,
      draw(s, p) { const {canvas}=getF4Canvas(s); f4State.curStep=2; f4StartAnim(canvas, p===0); },
     },
     {
      hint: '切成16等份后，每个扇形柱更细，顶面锯齿更小，整体更接近长方体。',
      formula: '16份并排 → 更接近长方体：总宽≈2πr，高=h',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=3; f4DrawStep(canvas); },
     },
     {
      hint: '切32等份后几乎是完美的长方体！由此推出：圆柱体积 V = πr²h。',
      get formula() { const r=f4State.r,h=f4State.h; return `V = πr²h，r=${r}，h=${h} → V=3.14×${r}²×${h}≈${(3.14*r*r*h).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=4; f4DrawStep(canvas); },
     },

// ================================================================
// GeoGenius Topic: f4 — 圆柱的体积 (Cylinder Volume)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f4
// 推导：竖切n等份 → 奇偶两组 → 翻转咬合 → 近似长方体 → V=πr²h
// 扇形柱正视图：矩形前面 + 等腰三角（齿），橙齿朝上，蓝齿朝下，交替咬合
// ================================================================

// @@SECTION:helpers@@

   const f4State = {
    r: 3, h: 5, curStep: -1, animRaf: null,
   };

   const F4BW = 252;  // 块总宽（固定像素）

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
    const ch    = Math.min(h * 16, 130);              // 柱矩形高（像素）
    const arcW  = F4BW / n;                           // 单柱宽（像素）
    // 扇形矢高（齿高）= r*(1-cos(π/n))，缩放后至少 4px
    const depth = Math.max(4, r * (1 - Math.cos(Math.PI / n)) * 65);
    const cylCX = 58;
    const cylRx = Math.min(r * 10, 34);
    const cylRy = Math.max(5, Math.round(cylRx * 0.28));
    const botY  = 212;                                // 矩形底边 y（蓝色齿在 botY+depth 处）
    const startXcyl    = cylCX + cylRx + 26;          // 带圆柱时块起始 x
    const startXcenter = Math.round((420 - F4BW) / 2);// 居中时块起始 x
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

   /* 单根橙色扇形柱：矩形 + 顶面等腰三角（齿朝上） */
   function f4ColOrange(ctx, x, botY, arcW, ch, depth) {
    ctx.save();
    ctx.fillStyle = '#F97028';
    ctx.fillRect(x, botY - ch, arcW, ch);
    ctx.strokeStyle = '#A03810'; ctx.lineWidth = 0.7;
    ctx.strokeRect(x, botY - ch, arcW, ch);
    ctx.fillStyle = '#FBBA70';
    ctx.beginPath();
    ctx.moveTo(x, botY - ch);
    ctx.lineTo(x + arcW, botY - ch);
    ctx.lineTo(x + arcW / 2, botY - ch - depth);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#A03810'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
   }

   /* 单根蓝色扇形柱：矩形 + 底面等腰三角（齿朝下，翻转） */
   function f4ColBlue(ctx, x, botY, arcW, ch, depth) {
    ctx.save();
    ctx.fillStyle = '#4A90E8';
    ctx.fillRect(x, botY - ch, arcW, ch);
    ctx.strokeStyle = '#1840A0'; ctx.lineWidth = 0.7;
    ctx.strokeRect(x, botY - ch, arcW, ch);
    ctx.fillStyle = '#88BBF4';
    ctx.beginPath();
    ctx.moveTo(x, botY);
    ctx.lineTo(x + arcW, botY);
    ctx.lineTo(x + arcW / 2, botY + depth);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1840A0'; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
   }

   /* 画完整咬合块（n 列交替橙蓝） */
   function f4DrawBlock4(ctx, n, startX, botY, arcW, ch, depth) {
    for (let i = 0; i < n; i++) {
     const x = startX + i * arcW;
     if (i % 2 === 0) f4ColOrange(ctx, x, botY, arcW, ch, depth);
     else              f4ColBlue(ctx, x, botY, arcW, ch, depth);
    }
   }

   /* 创建 Canvas + 滑块 overlay */
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
     /* ── Step 0：圆柱 + r/h 标注 + V=? 卡片 ── */
     const D = f4D(8);
     const { r, h, ch, cylCX, cylRx, cylRy, botY } = D;
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
     /* ── Step 1：圆柱顶面8条切割线 + 奇偶说明 ── */
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
     f4RoundRect(ctx, 148, 36, 244, 66, 8, '#FFF0F0', '#AA0020', 1.5);
     f4Label(ctx, '竖切8等份：奇数扇形柱→橙色', 270, 57, '#AA0020', 12, 'center', '600');
     f4Label(ctx, '偶数扇形柱→蓝色（翻转180°）', 270, 80, '#AA0020', 12, 'center', '600');
    }

    else if (step === 2) {
     /* ── Step 2：咬合完成帧（动画结束后） ── */
     const D = f4D(8);
     const { ch, arcW, depth, cylCX, cylRx, botY, startXcyl } = D;
     f4Cyl(ctx, cylCX, botY - ch, D, true, 8);
     /* 箭头 */
     const ax = startXcyl - 8;
     ctx.save(); ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
     ctx.beginPath(); ctx.moveTo(cylCX + cylRx + 4, botY - ch / 2); ctx.lineTo(ax, botY - ch / 2); ctx.stroke();
     ctx.fillStyle = '#555';
     ctx.beginPath(); ctx.moveTo(ax, botY - ch/2); ctx.lineTo(ax-7, botY-ch/2-5); ctx.lineTo(ax-7, botY-ch/2+5); ctx.closePath(); ctx.fill();
     ctx.restore();
     f4DrawBlock4(ctx, 8, startXcyl, botY, arcW, ch, depth);
     f4Label(ctx, '橙蓝咬合 ≈ 近似长方体', startXcyl + F4BW / 2, botY + depth + 14, '#333', 11, 'center', '600');
    }

    else if (step === 3) {
     /* ── Step 3：16份静态展示 + 标注 ── */
     const D = f4D(16);
     const { r, ch, arcW, depth, botY, startXcenter } = D;
     f4DrawBlock4(ctx, 16, startXcenter, botY, arcW, ch, depth);
     /* 虚线框 */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
     ctx.strokeRect(startXcenter, botY - ch - depth, F4BW, ch + depth * 2);
     ctx.restore();
     /* 长标注 */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(startXcenter, botY + depth + 14); ctx.lineTo(startXcenter + F4BW, botY + depth + 14); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter, botY + depth + 9); ctx.lineTo(startXcenter, botY + depth + 19); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter + F4BW, botY + depth + 9); ctx.lineTo(startXcenter + F4BW, botY + depth + 19); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `长 ≈ πr = π×${r} ≈ ${(pi * r).toFixed(1)}`, startXcenter + F4BW / 2, botY + depth + 28, '#0A7050', 12, 'center', '600');
     /* 高标注 */
     const hx = startXcenter + F4BW + 14;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(hx, botY - ch); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, botY-ch); ctx.lineTo(hx+5, botY-ch); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, botY); ctx.lineTo(hx+5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `高=h=${f4State.h}`, hx + 7, botY - ch / 2, '#C03030', 11, 'left', '600');
     f4Label(ctx, '切得越细，整体越像长方体', W / 2, botY - ch - depth - 14, '#333', 11, 'center', '600');
    }

    else if (step === 4) {
     /* ── Step 4：公式验证 + 滑块 ── */
     const D = f4D(16);
     const { r, h, ch, arcW, depth, botY, startXcenter } = D;
     f4DrawBlock4(ctx, 16, startXcenter, botY, arcW, ch, depth);
     const vol = (3.14 * r * r * h).toFixed(2);
     f4RoundRect(ctx, 22, botY + depth + 8, W - 44, 52, 8, '#E8F5E9', '#2E7D32', 1.5);
     f4Label(ctx, 'V = πr²h', W / 2, botY + depth + 24, '#2E7D32', 16, 'center', '700');
     f4Label(ctx, `r=${r}, h=${h}  →  V = 3.14×${r}²×${h} = 3.14×${r*r}×${h} ≈ ${vol}`, W / 2, botY + depth + 46, '#2E7D32', 12, 'center', '600');
    }
   }

   /* ─── Step 2 动画：橙色柱从圆柱飞出，蓝色柱从上方落下插入 ─── */
   function f4StartAnim(canvas) {
    const n = 8;
    const D = f4D(n);
    const { ch, arcW, depth, cylCX, cylRx, botY, startXcyl } = D;

    /* 橙色柱最终 x（偶数槽 0,2,4,6） */
    const orangeFinalX = [0, 2, 4, 6].map(i => startXcyl + i * arcW);
    /* 蓝色柱最终 x（奇数槽 1,3,5,7） */
    const blueFinalX   = [1, 3, 5, 7].map(i => startXcyl + i * arcW);

    /* 橙色起点：紧贴圆柱右边缘 */
    const srcX = cylCX + cylRx + 2;
    /* 蓝色起点：在橙色三角顶点上方（从上落入） */
    const blueSrcBotY = botY - ch - 2 * depth - 32;

    const STAGGER    = 70;   // ms/柱
    const COLDUR     = 340;  // 飞行时长
    const BLUE_START = 310;  // 蓝色开始落下的延迟
    const totalDur   = BLUE_START + STAGGER * 4 + COLDUR + 50;

    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }
    const t0 = performance.now();

    (function tick(now) {
     const elapsed = now - t0;
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, 420, 280);

     /* 圆柱固定 */
     f4Cyl(ctx, cylCX, botY - ch, D, true, n);

     /* 橙色柱从左飞出（先画，在下层） */
     for (let i = 0; i < 4; i++) {
      const p  = Math.max(0, Math.min(1, (elapsed - i * STAGGER) / COLDUR));
      const pe = p * p * (3 - 2 * p);
      const x  = srcX + (orangeFinalX[i] - srcX) * pe;
      f4ColOrange(ctx, x, botY, arcW, ch, depth);
     }

     /* 蓝色柱从上落下（后画，在上层） */
     for (let i = 0; i < 4; i++) {
      const t = elapsed - BLUE_START - i * STAGGER;
      if (t <= 0) continue;
      const p  = Math.min(1, t / COLDUR);
      const pe = p * p * (3 - 2 * p);
      const x  = blueFinalX[i];
      const y  = blueSrcBotY + (botY - blueSrcBotY) * pe;
      f4ColBlue(ctx, x, y, arcW, ch, depth);
     }

     /* 进度文字 */
     const od = [0,1,2,3].filter(i => (elapsed - i*STAGGER)/COLDUR >= 1).length;
     const bd = [0,1,2,3].filter(i => (elapsed - BLUE_START - i*STAGGER)/COLDUR >= 1).length;
     if (od < 4 || bd < 4) {
      f4Label(ctx, `橙 ${od}/4 就位  蓝 ${bd}/4 落入`, startXcyl + F4BW / 2, botY + depth + 14, '#555', 11, 'center');
     }

     if (elapsed < totalDur) {
      f4State.animRaf = requestAnimationFrame(tick);
     } else {
      f4State.animRaf = null;
      f4DrawStep(canvas);
     }
    })(performance.now());
   }

// @@SECTION:anims@@

     {
      hint: '这是一个底面半径r、高h的圆柱。体积怎么算？拖动滑块改变大小，观察变化。',
      formula: 'V = ?（目标：推导圆柱体积公式 V = πr²h）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=0; f4DrawStep(canvas); },
     },
     {
      hint: '沿高度方向竖切成8等份：奇数号扇形柱（橙色）组成一组，偶数号（蓝色）组成另一组，蓝色组翻转180°准备咬合。',
      formula: '竖切8等份 → 橙色奇数组（齿朝上）+ 蓝色偶数组（齿朝下，翻转）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=1; f4DrawStep(canvas); },
     },
     {
      hint: '橙色扇形柱展开平铺（齿朝上），蓝色扇形柱从上方落入间隙（齿朝下），两者交替咬合成近似长方体！',
      formula: '两组咬合 → 近似长方体（长≈πr，高=h，宽=r）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=2; f4StartAnim(canvas); },
     },
     {
      hint: '切成16等份后更接近长方体：长≈πr（半圆周长），高=h，切得越细整体轮廓越平整。',
      formula: '16份咬合 → 更接近长方体：长≈πr，高=h → V≈πr×r×h',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=3; f4DrawStep(canvas); },
     },
     {
      hint: '圆柱体积公式：V = πr²h。拖动滑块改变r和h，实时验算。',
      get formula() { const r=f4State.r,h=f4State.h; return `V = πr²h，r=${r}，h=${h} → V=3.14×${r}²×${h}≈${(3.14*r*r*h).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=4; f4DrawStep(canvas); },
     },

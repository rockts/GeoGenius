// ================================================================
// GeoGenius Topic: f4 — 圆柱的体积 (Cylinder Volume)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f4
// 推导：竖切n等份 → 扇形柱直立展开 → 近似长方体 → V=πr²h
// Cabinet投影：前面=矩形(arcW×h)，顶面=三角(深度r)，右侧面=平行四边形
// ================================================================

// @@SECTION:helpers@@

   const f4State = {
    r: 3, h: 5, curStep: -1, animRaf: null, animDone: false,
   };

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

   /* 从滑块值计算像素尺寸 */
   function f4D() {
    const r = f4State.r, h = f4State.h;
    const pixR  = Math.min(r * 12, 40);          // Cabinet投影深度（半径像素）
    const colH  = Math.min(h * 16, 155);          // 柱高像素
    const botY  = 228;                            // 柱底 y
    const topY  = botY - colH;                   // 柱顶 y
    const oblX  = r * 6;                          // 顶面后顶点水平偏移
    const oblY  = r * 4;                          // 顶面后顶点垂直偏移（向上）
    const blockW = 252;                           // 整个柱块的固定宽度
    const cylCX = 60;                             // 圆柱中心 x（Steps 0-2）
    const cylRx = Math.min(r * 10, 34);          // 圆柱水平半径
    const cylRy = Math.max(5, Math.round(cylRx * 0.28));
    return { r, h, pixR, colH, botY, topY, oblX, oblY, blockW, cylCX, cylRx, cylRy };
   }

   /* 画直立圆柱，可选顶面切割线 */
   function f4Cyl(ctx, cx, cy, D, showCuts, nCuts) {
    const { cylRx: rx, cylRy: ry, colH } = D;
    const botY = cy + colH;
    ctx.save();
    /* 底面半椭圆 */
    ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
    /* 侧面 */
    ctx.beginPath();
    ctx.moveTo(cx - rx, cy); ctx.lineTo(cx - rx, botY);
    ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath(); ctx.fillStyle = '#C8E6D4'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.lineTo(cx - rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, cy); ctx.lineTo(cx + rx, botY); ctx.stroke();
    /* 顶面椭圆 */
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#E4F6EE'; ctx.fill(); ctx.strokeStyle = '#0A7050'; ctx.stroke();
    /* 切割线 */
    if (showCuts && nCuts > 0) {
     ctx.strokeStyle = '#8B0020'; ctx.lineWidth = 1.2;
     for (let i = 0; i < nCuts; i++) {
      const a = i * 2 * Math.PI / nCuts;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + rx * Math.cos(a), cy + ry * Math.sin(a));
      ctx.stroke();
     }
    }
    ctx.restore();
   }

   /* 颜色表（奇偶交替） */
   const F4COL = [
    { front: '#F97028', top: '#FBBA70', stroke: '#A03810' },   // 橙
    { front: '#4A90E8', top: '#88BBF4', stroke: '#1840A0' },   // 蓝
   ];

   /*
    * 画 n 个直立扇形柱组成的块（Cabinet 投影）
    * 画家算法：右侧面 → 顶面(右到左) → 前面(左到右)
    * 支持每柱的 x 位置数组（用于动画），默认为等间距
    */
   function f4DrawBlock(ctx, n, startX, D, xArr) {
    const { topY, colH, oblX, oblY, blockW } = D;
    const botY  = topY + colH;
    const arcW  = blockW / n;

    /* 当前每柱的 x 位置 */
    const xs = xArr || Array.from({ length: n }, (_, i) => startX + i * arcW);
    const lastX = (xArr ? xArr[n - 1] + arcW : startX + n * arcW);

    /* 右侧面（最右柱的切面，绿色平行四边形） */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lastX, topY);
    ctx.lineTo(lastX + oblX, topY - oblY);
    ctx.lineTo(lastX + oblX, botY - oblY);
    ctx.lineTo(lastX, botY);
    ctx.closePath();
    ctx.fillStyle = '#A8D4B4'; ctx.fill();
    ctx.strokeStyle = '#2A6040'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();

    /* 顶面扇形（右到左，保证近处覆盖远处）
       前弧用二次贝塞尔模拟扇形弧面；n≥20 时统一顶色减少锯齿
       奇数柱（橙,i偶）apex向右后，偶数柱（蓝,i奇）apex向左后，交替咬合 */
    const cylRx = D.cylRx || 30;
    const sagY   = Math.max(1.5, arcW * arcW / (8 * cylRx));
    const effOblY = n >= 20 ? Math.min(oblY, arcW * 0.85) : oblY;
    const effOblX = oblX * (effOblY / oblY);
    const blendTop = n >= 20;
    for (let i = n - 1; i >= 0; i--) {
     const x = xs[i], c = F4COL[i % 2];
     const flipped = (i % 2 === 1);
     // 橙色 apex = 右后角 (x+arcW+oblX)，蓝色 apex = 左后角 (x+oblX)
     // 相邻橙蓝柱共享同一顶点 → 整体顶面锯齿减半
     const apexX = flipped ? (x + effOblX) : (x + arcW + effOblX);
     // 蓝色前弧略上凸（朝向圆心），橙色下凸（朝向圆弧）
     const sagCY = topY + (flipped ? -sagY * 0.6 : sagY);
     ctx.save();
     ctx.beginPath();
     ctx.moveTo(x, topY);
     ctx.quadraticCurveTo(x + arcW / 2, sagCY, x + arcW, topY);
     ctx.lineTo(apexX, topY - effOblY);
     ctx.closePath();
     ctx.fillStyle = blendTop ? '#F0C880' : c.top; ctx.fill();
     ctx.strokeStyle = blendTop ? '#C8A040' : c.stroke;
     ctx.lineWidth = blendTop ? 0.25 : 0.5; ctx.stroke();
     ctx.restore();
    }

    /* 前面矩形（左到右） */
    for (let i = 0; i < n; i++) {
     const x = xs[i], c = F4COL[i % 2];
     ctx.save();
     ctx.fillStyle = c.front; ctx.fillRect(x, topY, arcW, colH);
     ctx.strokeStyle = c.stroke; ctx.lineWidth = 0.7; ctx.strokeRect(x, topY, arcW, colH);
     ctx.restore();
    }
   }

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
      if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; f4State.animDone = true; }
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

   /* ─── 静态绘图入口 ─── */
   function f4DrawStep(canvas) {
    const W = 420, H = 280, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const D = f4D();
    const { r, h, topY, botY, colH, oblX, oblY, blockW, cylCX, cylRx } = D;

    /* 两种布局的 startX */
    const startXwithCyl = cylCX + cylRx + 30; // Steps 0-2：圆柱右侧
    const startXcenter  = Math.round((W - blockW) / 2);  // Steps 3-5：居中

    if (f4State.curStep === 0) {
     /* ── Step 0：3D 圆柱 ── */
     f4Cyl(ctx, cylCX, topY, D, false, 0);
     /* r 标注 */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(cylCX, topY); ctx.lineTo(cylCX + cylRx, topY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `r = ${r}`, cylCX + cylRx / 2, topY - 10, '#0A7050', 13, 'center', '600');
     /* h 标注 */
     const hx = cylCX + cylRx + 12;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.moveTo(hx, topY); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx - 5, topY); ctx.lineTo(hx + 5, topY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx - 5, botY); ctx.lineTo(hx + 5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx + 7, (topY + botY) / 2, '#C03030', 13, 'left', '600');
     /* V=? 卡片 */
     f4RoundRect(ctx, 160, 36, 218, 120, 8, '#FFF8E7', '#9A5800', 1.5);
     f4Label(ctx, '圆柱体积', 269, 60, '#9A5800', 13, 'center', '600');
     f4Label(ctx, 'V = ?', 269, 90, '#A03060', 22, 'center', '700');
     f4Label(ctx, '底面积 × 高', 269, 122, '#9A5800', 12);
     f4Label(ctx, '= πr² × h', 269, 142, '#9A5800', 12);
    }

    else if (f4State.curStep === 1) {
     /* ── Step 1：圆柱顶面加切割线 ── */
     f4Cyl(ctx, cylCX, topY, D, true, 8);
     /* r 和 h 标注（同 Step0） */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(cylCX, topY); ctx.lineTo(cylCX + cylRx, topY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `r = ${r}`, cylCX + cylRx / 2, topY - 10, '#0A7050', 13, 'center', '600');
     const hx = cylCX + cylRx + 12;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.moveTo(hx, topY); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx - 5, topY); ctx.lineTo(hx + 5, topY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx - 5, botY); ctx.lineTo(hx + 5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx + 7, (topY + botY) / 2, '#C03030', 13, 'left', '600');
     /* 标注 */
     f4RoundRect(ctx, 158, 36, 230, 60, 8, '#FFF0F0', '#AA0020', 1.5);
     f4Label(ctx, '沿高度方向竖切成8等份', 273, 58, '#AA0020', 12, 'center', '600');
     f4Label(ctx, '得到 8 个扇形柱', 273, 80, '#AA0020', 12, 'center', '600');
     /* 箭头提示 */
     f4Label(ctx, '每个扇形柱：宽=πr×1/4，高=h', 273, 120, '#555', 11);
    }

    else if (f4State.curStep === 2) {
     /* ── Step 2：8柱静态最终排列 + 圆柱 ── */
     f4Cyl(ctx, cylCX, topY, D, true, 8);
     /* 箭头 */
     const ax = startXwithCyl - 14;
     ctx.save(); ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
     ctx.beginPath(); ctx.moveTo(cylCX + cylRx + 6, (topY + botY) / 2); ctx.lineTo(ax, (topY + botY) / 2); ctx.stroke();
     ctx.fillStyle = '#555';
     ctx.beginPath(); ctx.moveTo(ax, (topY + botY) / 2); ctx.lineTo(ax - 7, (topY + botY) / 2 - 5); ctx.lineTo(ax - 7, (topY + botY) / 2 + 5); ctx.closePath(); ctx.fill();
     ctx.restore();
     f4DrawBlock(ctx, 8, startXwithCyl, D, null);
     f4Label(ctx, '8个扇形柱直立排开', startXwithCyl + blockW / 2, botY + 18, '#333', 11, 'center', '600');
    }

    else if (f4State.curStep === 3) {
     /* ── Step 3：16柱静态 + 虚线框标注 ── */
     f4DrawBlock(ctx, 16, startXcenter, D, null);
     /* 虚线标注框 */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]);
     ctx.strokeRect(startXcenter, topY, blockW, colH);
     ctx.restore();
     /* 长 ≈ πr */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(startXcenter, botY + 14); ctx.lineTo(startXcenter + blockW, botY + 14); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter, botY + 9); ctx.lineTo(startXcenter, botY + 19); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter + blockW, botY + 9); ctx.lineTo(startXcenter + blockW, botY + 19); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `长 ≈ πr = π×${r} ≈ ${(pi * r).toFixed(1)}`, startXcenter + blockW / 2, botY + 30, '#0A7050', 12, 'center', '600');
     /* 高 = h */
     const rhx = startXcenter + blockW + oblX + 10;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(rhx, topY); ctx.lineTo(rhx, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(rhx - 5, topY); ctx.lineTo(rhx + 5, topY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(rhx - 5, botY); ctx.lineTo(rhx + 5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `高 = h = ${h}`, rhx + 7, (topY + botY) / 2, '#C03030', 11, 'left', '600');
     f4Label(ctx, '16个扇形柱交错排列，整体接近长方体', W / 2, topY - 16, '#333', 11, 'center', '600');
    }

    else if (f4State.curStep === 4) {
     /* ── Step 4：32柱 → 近似长方体 + 推导公式 ── */
     f4DrawBlock(ctx, 32, startXcenter, D, null);
     /* 宽=r：标在右侧面中线上 */
     const sfMx = startXcenter + blockW + oblX / 2;   // 右侧面水平中点
     const sfMy = (topY - oblY / 2 + botY - oblY / 2) / 2;  // 右侧面垂直中点
     ctx.save(); ctx.strokeStyle = '#9030A0'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
     ctx.beginPath(); ctx.moveTo(startXcenter + blockW, topY); ctx.lineTo(startXcenter + blockW + oblX, topY - oblY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `宽≈r=${r}`, sfMx + 4, sfMy - 4, '#9030A0', 11, 'left', '600');
     /* 长 */
     ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(startXcenter, botY + 12); ctx.lineTo(startXcenter + blockW, botY + 12); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter, botY + 7); ctx.lineTo(startXcenter, botY + 17); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startXcenter + blockW, botY + 7); ctx.lineTo(startXcenter + blockW, botY + 17); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `长≈πr = ${(pi * r).toFixed(2)}`, startXcenter + blockW / 2, botY + 28, '#0A7050', 11, 'center', '600');
     /* 高 */
     const hx2 = startXcenter + blockW + oblX + 10;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.2;
     ctx.beginPath(); ctx.moveTo(hx2, topY); ctx.lineTo(hx2, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx2 - 5, topY); ctx.lineTo(hx2 + 5, topY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx2 - 5, botY); ctx.lineTo(hx2 + 5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `高=${h}`, hx2 + 6, (topY + botY) / 2, '#C03030', 11, 'left', '600');
     /* 推导 */
     f4Label(ctx, `V ≈ πr × r × h = πr²h`, W / 2, botY + 46, '#A03060', 13, 'center', '700');
    }

    else if (f4State.curStep === 5) {
     /* ── Step 5：公式验证 ── */
     f4DrawBlock(ctx, 32, startXcenter, D, null);
     const vol = (3.14 * r * r * h).toFixed(2);
     f4RoundRect(ctx, 22, botY + 4, W - 44, 54, 8, '#E8F5E9', '#2E7D32', 1.5);
     f4Label(ctx, 'V = πr²h', W / 2, botY + 22, '#2E7D32', 16, 'center', '700');
     f4Label(ctx, `r=${r}, h=${h}  →  V = 3.14×${r}²×${h} = 3.14×${r*r}×${h} ≈ ${vol}`, W / 2, botY + 44, '#2E7D32', 12, 'center', '600');
    }
   }

   /*
    * Step 2 动画：n 个扇形柱从圆柱右侧飞出，stagger 60ms/柱，各自滑到最终位置
    */
   function f4StartAnim(canvas, n) {
    const D = f4D();
    const { topY, blockW, cylCX, cylRx } = D;
    const arcW = blockW / n;
    const startXwithCyl = cylCX + cylRx + 30;
    const srcXorange = cylCX + cylRx + 4;             // 橙色柱从圆柱右侧飞出
    const srcXblue   = startXwithCyl + blockW + arcW; // 蓝色柱从右端反向插入

    const STAGGER = 60;   // ms
    const COLDUR  = 380;  // 每柱飞行时间
    const totalDur = STAGGER * n + COLDUR;

    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }
    f4State.animDone = false;
    const t0 = performance.now();

    (function tick(now) {
     const elapsed = now - t0;
     const ctx = canvas.getContext('2d');
     ctx.clearRect(0, 0, 420, 280);

     /* 圆柱（固定） */
     f4Cyl(ctx, cylCX, topY, D, true, n);

     /* 计算每柱当前 x：橙色从左飞，蓝色从右插入 */
     const xs = [];
     let anyMoving = false;
     for (let i = 0; i < n; i++) {
      const isBlue = (i % 2 === 1);
      const srcX   = isBlue ? srcXblue : srcXorange;
      const colElapsed = elapsed - i * STAGGER;
      const p = Math.max(0, Math.min(1, colElapsed / COLDUR));
      const pe = p * p * (3 - 2 * p);   // ease in-out
      const finalX = startXwithCyl + i * arcW;
      xs.push(srcX + (finalX - srcX) * pe);
      if (pe < 1) anyMoving = true;
     }

     /* 画柱块（使用当前位置数组） */
     f4DrawBlock(ctx, n, startXwithCyl, D, xs);

     /* 进度文字 */
     const done = xs.filter((x, i) => Math.abs(x - (startXwithCyl + i * arcW)) < 1).length;
     if (done < n) {
      f4Label(ctx, `${done}/${n} 就位`, startXwithCyl + blockW / 2, D.botY + 18, '#555', 11, 'center', '400');
     }

     if (elapsed < totalDur || anyMoving) {
      f4State.animRaf = requestAnimationFrame(tick);
     } else {
      f4State.animRaf = null; f4State.animDone = true;
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
      hint: '沿高度方向竖切成8等份——圆柱顶面可以看到8条切割线，得到8个扇形柱，每个柱的宽≈πr÷4，高=h。',
      formula: '竖切8等份 → 8个扇形柱（宽≈πr/4，高=h的3D柱体）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=1; f4DrawStep(canvas); },
     },
     {
      hint: '8个扇形柱直立展开——从圆柱中飞出，一个个排开。每个柱有弧形顶面和矩形前面，整体像一本摊开的书。',
      formula: '8个扇形柱直立排列 → 宽=8×arcW=2πr，高=h',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=2; f4StartAnim(canvas, 8); },
     },
     {
      hint: '切成16等份静态排列：长≈πr（半个圆周），高=h。虚线框勾勒出近似长方体的轮廓，切得越细越像长方体。',
      formula: '16个扇形柱 → 长≈πr，高=h → 越来越像长方体',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=3; f4DrawStep(canvas); },
     },
     {
      hint: '切成32等份，三个维度都能看清：长≈πr、宽=r（顶面深度方向）、高=h。体积 ≈ πr×r×h = πr²h！',
      formula: '32个扇形柱 ≈ 长方体：长≈πr，宽=r，高=h → V≈πr²h',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=4; f4DrawStep(canvas); },
     },
     {
      hint: '圆柱体积公式：V = πr²h。拖动滑块改变r和h，实时验算。',
      get formula() { const r=f4State.r,h=f4State.h; return `V = πr²h，r=${r}，h=${h} → V=3.14×${r}²×${h}≈${(3.14*r*r*h).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=5; f4DrawStep(canvas); },
     },

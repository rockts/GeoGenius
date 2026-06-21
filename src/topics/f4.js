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

   // ── 配色（对齐人教版参考图：粉色柱身 + 青色切面 + 绿色右截面）──
   const F4PINK   = '#E24A93';   // 正面粉
   const F4PINK_D = '#A82A6E';   // 深粉描边
   const F4PINK_L = '#EE7AB6';   // 浅粉高光
   const F4CYAN   = '#A9E3E3';   // 顶面/切面青
   const F4CYAN_D = '#4F9BA6';   // 青描边
   const F4CYAN_L = '#CFF2F2';   // 浅青齿高光
   const F4GREEN  = '#AEDCC0';   // 右截面 r×h
   const F4GREEN_D= '#4F9E6E';

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

   /* 从 r/h/n 计算绘制参数。
      正面 = 底面圆剪拼成的"长方形"（交叉咬合的扇形），面积≈πr²；
      斜向进深 = 圆柱的高 h → 体积 V = πr² × h。 */
   function f4D(n) {
    const r = f4State.r, h = f4State.h;
    n = n || 8;
    const ch    = Math.min(h * 16, 128);   // 圆柱柱身像素高
    const cylCX = 56;
    const cylRx = Math.min(r * 9, 28);
    const cylRy = Math.max(5, Math.round(cylRx * 0.30));
    const botY  = 196;                      // 圆柱底基线
    // 交叉咬合正面（仿圆面积 f2）
    const meshR = 30;                       // 扇形半径 / 半带高
    const boxW  = Math.round(2 * Math.PI * meshR);  // ≈188，正面宽
    const bandH = 2 * meshR;                // 正面高（带高 = 直径方向）
    const startXbox = 150;                  // 正面左端
    const boxBotY   = 176;                  // 正面底边
    // 斜向进深（= 高 h），随 h 变化
    const depthX = Math.round(Math.min(46, h * 5.4));
    const depthY = Math.round(Math.min(28, h * 3.3));
    const arcW = boxW / n;
    return { r, h, n, ch, cylCX, cylRx, cylRy, botY,
             meshR, boxW, bandH, startXbox, boxBotY, depthX, depthY, arcW };
   }

   /* 画粉色3D圆柱，顶面青色，可按 nCuts 分扇 */
   function f4Cyl(ctx, cx, topY, D, nCuts) {
    const { cylRx: rx, cylRy: ry, ch } = D;
    const botY = topY + ch;
    ctx.save();
    // 柱身（粉色横向渐变，营造圆柱光感）
    const g = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    g.addColorStop(0, F4PINK_D); g.addColorStop(0.42, F4PINK_L);
    g.addColorStop(0.7, F4PINK); g.addColorStop(1, F4PINK_D);
    ctx.beginPath();
    ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, botY);
    ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, topY);
    ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = F4PINK_D; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, topY); ctx.lineTo(cx + rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
    // 顶面椭圆（青色）
    ctx.beginPath(); ctx.ellipse(cx, topY, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = F4CYAN; ctx.fill();
    ctx.strokeStyle = F4CYAN_D; ctx.lineWidth = 1.2; ctx.stroke();
    // 顶面扇形分割线（俯视的"披萨"切分）
    if (nCuts > 0) {
     ctx.strokeStyle = '#7BC2CC'; ctx.lineWidth = 0.7;
     for (let i = 0; i < nCuts; i++) {
      const a = i * 2 * Math.PI / nCuts;
      ctx.beginPath(); ctx.moveTo(cx, topY);
      ctx.lineTo(cx + rx * Math.cos(a), topY + ry * Math.sin(a)); ctx.stroke();
     }
    }
    ctx.restore();
   }

   /* 单个扇形：顶点(cx,cy)，弧在 midAngle 方向、半径 r */
   function f4Sector(ctx, cx, cy, r, alpha, midAngle, fill, stroke) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(midAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -alpha, alpha); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.5; ctx.stroke(); }
    ctx.restore();
   }

   /* 交叉咬合正面：n个扇形，A组(偶)尖朝上·深粉，B组(奇)尖朝下·浅粉，像拉链穿插。
      画在以 midY 为中线、半带高 meshR 的带内。返回每个扇形的目标位姿（动画用）。 */
   function f4MeshTargets(n, startX, midY, meshR) {
    const alpha = Math.PI / n;
    const arcW  = 2 * Math.PI * meshR / n;
    const t = [];
    for (let i = 0; i < n; i++) {
     const up = (i % 2 === 0);                 // A组尖朝上
     const cx = startX + (i + 0.5) * arcW;
     const cy = up ? (midY - meshR) : (midY + meshR);
     t.push({ cx, cy, r: meshR, alpha, mid: up ? Math.PI / 2 : -Math.PI / 2,
              fill: up ? F4PINK : F4PINK_L, up });
    }
    return t;
   }

   function f4MeshFront(ctx, n, startX, midY, meshR) {
    const arcW = 2 * Math.PI * meshR / n;
    const totalW = n * arcW;
    // 底色（填满带，避免缝隙露白）
    ctx.save();
    ctx.fillStyle = '#F6D2E4';
    ctx.fillRect(startX, midY - meshR, totalW, 2 * meshR);
    ctx.restore();
    f4MeshTargets(n, startX, midY, meshR).forEach(s =>
     f4Sector(ctx, s.cx, s.cy, s.r, s.alpha, s.mid, s.fill, F4CYAN_D));
   }

   /* 交叉咬合的近似长方体（3D）：正面=交叉扇形(πr²) + 斜向进深(=h) + 绿右截面(r×h) */
   function f4BoxMesh(ctx, n, D) {
    const { meshR, boxW, startXbox: startX, boxBotY, depthX, depthY } = D;
    const midY = boxBotY - meshR;
    const topB = midY - meshR, botB = midY + meshR, endX = startX + boxW;
    ctx.save();
    // 顶面（πr × h，斜向，浅青）
    ctx.fillStyle = F4CYAN;
    ctx.beginPath();
    ctx.moveTo(startX, topB); ctx.lineTo(endX, topB);
    ctx.lineTo(endX + depthX, topB - depthY); ctx.lineTo(startX + depthX, topB - depthY);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = F4CYAN_D; ctx.lineWidth = 0.7; ctx.stroke();
    // 右截面（r × h，绿）
    ctx.fillStyle = F4GREEN;
    ctx.beginPath();
    ctx.moveTo(endX, topB); ctx.lineTo(endX + depthX, topB - depthY);
    ctx.lineTo(endX + depthX, botB - depthY); ctx.lineTo(endX, botB);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = F4GREEN_D; ctx.lineWidth = 1; ctx.stroke();
    // 正面交叉扇形
    f4MeshFront(ctx, n, startX, midY, meshR);
    // 正面外框
    ctx.strokeStyle = F4PINK_D; ctx.lineWidth = 1.1;
    ctx.strokeRect(startX, topB, boxW, 2 * meshR);
    ctx.restore();
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

   /* 圆柱 → 箭头（steps 2/3/4 复用，圆柱在左、长方体在右） */
   function f4DrawCylArrow(ctx, D, nCuts) {
    const { ch, cylCX, cylRx, botY, startXbox, boxBotY, meshR } = D;
    f4Cyl(ctx, cylCX, botY - ch, D, nCuts);
    const ax0 = cylCX + cylRx + 8, ax1 = startXbox - 12, ay = boxBotY - meshR;
    ctx.save(); ctx.strokeStyle = '#6C7AE0'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(ax1 - 2, ay); ctx.stroke();
    ctx.fillStyle = '#6C7AE0';
    ctx.beginPath(); ctx.moveTo(ax1 + 5, ay); ctx.lineTo(ax1 - 5, ay - 5); ctx.lineTo(ax1 - 5, ay + 5); ctx.closePath(); ctx.fill();
    ctx.restore();
   }

   /* 进深 = 高 h 标注（沿右截面斜边） */
   function f4HLabel(ctx, D) {
    const { h, meshR, boxW, startXbox, boxBotY, depthX, depthY } = D;
    const ex = startXbox + boxW, by = boxBotY;
    ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ex + 4, by + 3); ctx.lineTo(ex + depthX + 4, by - depthY + 3); ctx.stroke();
    ctx.fillStyle = '#C03030';
    ctx.beginPath(); ctx.arc(ex + 4, by + 3, 1.6, 0, 2*Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + depthX + 4, by - depthY + 3, 1.6, 0, 2*Math.PI); ctx.fill();
    ctx.restore();
    f4Label(ctx, `高 h=${h}`, ex + depthX + 9, by - depthY + 2, '#C03030', 11, 'left', '700');
   }

   /* 正面长≈πr、宽=r 标注 */
   function f4FrontLabel(ctx, D, showWidth) {
    const pi = Math.PI;
    const { r, meshR, boxW, startXbox, boxBotY } = D;
    const annY = boxBotY + 12;
    ctx.save(); ctx.strokeStyle = '#A82A6E'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(startXbox, annY); ctx.lineTo(startXbox + boxW, annY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(startXbox, annY-4); ctx.lineTo(startXbox, annY+4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(startXbox+boxW, annY-4); ctx.lineTo(startXbox+boxW, annY+4); ctx.stroke();
    ctx.restore();
    f4Label(ctx, `长 ≈ πr ≈ ${(pi*r).toFixed(1)}`, startXbox + boxW/2, annY + 12, '#A82A6E', 11, 'center', '600');
    if (showWidth) {
     f4Label(ctx, `宽=r`, startXbox - 8, boxBotY - meshR, '#A82A6E', 11, 'right', '600');
    }
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
     const { r, h, ch, cylCX, cylRx, cylRy, botY } = D;
     f4Cyl(ctx, cylCX, botY - ch, D, 0);
     // r：顶面半径线
     ctx.save(); ctx.strokeStyle = '#1A6F8A'; ctx.lineWidth = 1.6;
     ctx.beginPath(); ctx.moveTo(cylCX, botY - ch); ctx.lineTo(cylCX + cylRx, botY - ch); ctx.stroke();
     ctx.fillStyle = '#1A6F8A'; ctx.beginPath(); ctx.arc(cylCX, botY - ch, 2.5, 0, 2*pi); ctx.fill();
     ctx.restore();
     f4Label(ctx, `r = ${r}`, cylCX + cylRx / 2, botY - ch - 11, '#1A6F8A', 13, 'center', '700');
     const hx = cylCX + cylRx + 16;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.moveTo(hx, botY - ch); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.setLineDash([]);
     ctx.beginPath(); ctx.moveTo(hx-5, botY-ch); ctx.lineTo(hx+5, botY-ch); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5, botY); ctx.lineTo(hx+5, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx + 8, botY - ch / 2, '#C03030', 13, 'left', '700');
     f4RoundRect(ctx, 158, 46, 232, 110, 9, '#FFF8E7', '#9A5800', 1.5);
     f4Label(ctx, '圆柱体积', 274, 70, '#9A5800', 13, 'center', '600');
     f4Label(ctx, 'V = ?', 274, 102, '#A03060', 22, 'center', '700');
     f4Label(ctx, '底面积 × 高 = πr² × h', 274, 136, '#9A5800', 11);
    }

    else if (step === 1) {
     /* ── 圆柱顶面8条切割线 + 说明 ── */
     const D = f4D(8);
     const { r, h, ch, cylCX, cylRx, botY } = D;
     f4Cyl(ctx, cylCX, botY - ch, D, 8);
     ctx.save(); ctx.strokeStyle = '#1A6F8A'; ctx.lineWidth = 1.5;
     ctx.beginPath(); ctx.moveTo(cylCX, botY - ch); ctx.lineTo(cylCX + cylRx, botY - ch); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `r = ${r}`, cylCX + cylRx / 2, botY - ch - 11, '#1A6F8A', 12, 'center', '700');
     const hx = cylCX + cylRx + 16;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.moveTo(hx, botY-ch); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.restore();
     f4Label(ctx, `h = ${h}`, hx + 8, botY - ch / 2, '#C03030', 12, 'left', '700');
     f4RoundRect(ctx, 158, 50, 236, 70, 9, '#FCE9F1', '#A82A6E', 1.5);
     f4Label(ctx, '沿圆心竖切8等份', 276, 73, '#A82A6E', 12, 'center', '600');
     f4Label(ctx, '每份叫一个"扇形柱"', 276, 97, '#A82A6E', 12, 'center', '600');
    }

    else if (step === 2) {
     /* ── 圆柱 + 箭头 + 8份交叉咬合（A4块尖上·B4块尖下） ── */
     const D = f4D(8);
     f4DrawCylArrow(ctx, D, 8);
     f4BoxMesh(ctx, 8, D);
     f4HLabel(ctx, D);
     f4FrontLabel(ctx, D, false);
     f4Label(ctx, '8份 = 两组各4块，尖朝上/朝下交叉咬合', W/2, 52, '#A82A6E', 12, 'center', '700');
     f4Label(ctx, '正面还坑洼，只是"近似"长方形', W/2, 70, '#A82A6E', 11, 'center', '600');
    }

    else if (step === 3) {
     /* ── 16份交叉咬合（更密更平）+ 长/宽标注 ── */
     const D = f4D(16);
     f4DrawCylArrow(ctx, D, 16);
     f4BoxMesh(ctx, 16, D);
     f4HLabel(ctx, D);
     f4FrontLabel(ctx, D, true);
     f4Label(ctx, '16份：交叉更密，正面更接近长方形', W/2, 58, '#333', 12, 'center', '700');
    }

    else if (step === 4) {
     /* ── 32份交叉咬合（≈长方形）+ V=πr²h 公式 ── */
     const D = f4D(32);
     const { r, h } = D;
     f4DrawCylArrow(ctx, D, 32);
     f4BoxMesh(ctx, 32, D);
     f4HLabel(ctx, D);
     f4Label(ctx, '32份：正面几乎是完美长方形！', W/2, 52, '#333', 12, 'center', '700');
     const vol = (3.14 * r * r * h).toFixed(2);
     f4RoundRect(ctx, 26, 210, W - 52, 56, 8, '#E8F5E9', '#2E7D32', 1.5);
     f4Label(ctx, '正面=底面圆→长方形(πr²)，进深=高h', W/2, 228, '#2E7D32', 12, 'center', '600');
     f4Label(ctx, `V = πr²·h = 3.14×${r}²×${h} ≈ ${vol}`, W/2, 250, '#2E7D32', 14, 'center', '700');
    }
   }

   /* ─── 动画帧：扇形柱从圆柱依次飞出，A组尖朝上/B组尖朝下交叉咬合拼成长方形 ───
      p=0→1。仿圆面积 f2：每个扇形从圆柱中心飞向带内目标位姿（错峰）。 */
   function f4AnimFrame(canvas, p) {
    const n = 8;
    const D = f4D(n);
    const { ch, cylCX, cylRx, botY, meshR, boxW, startXbox, boxBotY, depthX, depthY } = D;
    const W = 420, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, 280);

    const midY   = boxBotY - meshR;
    const cylMid = botY - ch / 2;
    const RS     = Math.max(8, cylRx * 0.7);   // 源半径
    const alpha  = pi / n;
    const targets = f4MeshTargets(n, startXbox, midY, meshR);
    const endX = startXbox + boxW, topB = midY - meshR, botB = midY + meshR;

    const STAGGER = 0.62;
    const FLIGHT  = 1 - STAGGER * (n - 1) / n;
    const tOf = i => Math.min(1, Math.max(0, (p - STAGGER * i / n) / FLIGHT));

    // 原圆柱（顶面8扇分割），随飞出略微淡出
    ctx.save();
    ctx.globalAlpha = Math.max(0.35, 1 - p * 0.7);
    f4Cyl(ctx, cylCX, botY - ch, D, n);
    ctx.restore();

    // 箭头
    const arrA = Math.min(1, Math.max(0, (p - 0.04) / 0.12));
    if (arrA > 0) {
     const ax0 = cylCX + cylRx + 8, ax1 = startXbox - 12;
     ctx.save(); ctx.globalAlpha = arrA; ctx.strokeStyle = '#6C7AE0'; ctx.lineWidth = 2.2;
     ctx.beginPath(); ctx.moveTo(ax0, midY); ctx.lineTo(ax1 - 2, midY); ctx.stroke();
     ctx.fillStyle = '#6C7AE0';
     ctx.beginPath(); ctx.moveTo(ax1 + 5, midY); ctx.lineTo(ax1 - 5, midY - 5); ctx.lineTo(ax1 - 5, midY + 5); ctx.closePath(); ctx.fill();
     ctx.restore();
    }

    // 长方体外壳（青顶面 + 绿右截面）随拼合淡入
    const shellA = Math.min(1, Math.max(0, (p - 0.62) / 0.3));
    if (shellA > 0.01) {
     ctx.save(); ctx.globalAlpha = shellA;
     ctx.fillStyle = F4CYAN;
     ctx.beginPath();
     ctx.moveTo(startXbox, topB); ctx.lineTo(endX, topB);
     ctx.lineTo(endX + depthX, topB - depthY); ctx.lineTo(startXbox + depthX, topB - depthY);
     ctx.closePath(); ctx.fill(); ctx.strokeStyle = F4CYAN_D; ctx.lineWidth = 0.7; ctx.stroke();
     ctx.fillStyle = F4GREEN;
     ctx.beginPath();
     ctx.moveTo(endX, topB); ctx.lineTo(endX + depthX, topB - depthY);
     ctx.lineTo(endX + depthX, botB - depthY); ctx.lineTo(endX, botB);
     ctx.closePath(); ctx.fill(); ctx.strokeStyle = F4GREEN_D; ctx.lineWidth = 1; ctx.stroke();
     ctx.restore();
    }

    // 正面带底色（已落位区域），淡入
    const baseA = Math.min(1, Math.max(0, (p - 0.45) / 0.3));
    if (baseA > 0.01) {
     ctx.save(); ctx.globalAlpha = baseA;
     ctx.fillStyle = '#F6D2E4'; ctx.fillRect(startXbox, topB, boxW, 2 * meshR);
     ctx.restore();
    }

    // 飞行 / 落位的扇形（A深 B浅，体现交叉咬合）
    let arrived = 0;
    for (let i = 0; i < n; i++) {
     const t = tOf(i);
     if (t <= 0) continue;
     const ease = t * t * (3 - 2 * t);
     const tg = targets[i];
     const srcMid = ((i + 0.5) / n) * 2 * pi - pi / 2;
     const curX = cylCX + (tg.cx - cylCX) * ease;
     const curY = cylMid + (tg.cy - cylMid) * ease;
     let dA = tg.mid - srcMid;
     while (dA > pi)  dA -= 2 * pi;
     while (dA < -pi) dA += 2 * pi;
     const curMid = srcMid + dA * ease;
     const curR = RS + (tg.r - RS) * ease;
     f4Sector(ctx, curX, curY, curR, alpha, curMid, tg.fill, F4CYAN_D);
     if (t >= 1) arrived++;
    }

    // 正面外框（拼合接近完成时淡入）
    if (shellA > 0.01) {
     ctx.save(); ctx.globalAlpha = shellA;
     ctx.strokeStyle = F4PINK_D; ctx.lineWidth = 1.1;
     ctx.strokeRect(startXbox, topB, boxW, 2 * meshR);
     ctx.restore();
    }

    if (arrived > 0 && arrived < n) {
     f4Label(ctx, `交叉咬合 ${arrived}/${n}`, startXbox + boxW / 2, boxBotY + 16, '#555', 11, 'center');
    }
   }

   /* ─── 动画入口：p===0 时强制重启，animTick 后续帧复用已跑的 RAF ───
      forceRestart=true  → 主 app 新一轮（run() 发来 p=0），必须重启
      forceRestart=false → animTick 中途调用：正在播放(animRaf)或已结束(animT0===0)
                           都忽略，避免 f4 自身 RAF 先结束后被重启成死循环。 */
   function f4StartAnim(canvas, forceRestart) {
    if (!forceRestart && (f4State.animRaf || f4State.animT0 === 0)) return;
    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf = null; }

    const SM  = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const dur = 4000 * SM;

    f4State.animT0 = performance.now();
    const t0 = f4State.animT0;
    let pausedMs = 0, pausedAt = 0;

    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) {
      if (!pausedAt) pausedAt = now;
      f4State.animRaf = requestAnimationFrame(tick);
      return;
     }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }

     const p = Math.min(1, (now - t0 - pausedMs) / dur);
     f4AnimFrame(canvas, p);

     if (p < 1) {
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
      hint: '8份分成两组：A组4块尖朝上、B组4块尖朝下，像拉链一样交叉咬合，正面拼成近似长方形。只切8份还坑洼。',
      formula: '两组各4块交叉咬合 → 近似长方形（正面=底面圆剪拼）',
      dur: 4000, noAutoFit: true,
      draw(s, p) { const {canvas}=getF4Canvas(s); f4State.curStep=2; f4StartAnim(canvas, p===0); },
     },
     {
      hint: '切成16等份后，扇形柱更细，咬合后顶面齿更小，更接近长方体。',
      formula: '16份交替咬合 → 更接近长方体：长≈πr，高=h',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=3; f4DrawStep(canvas); },
     },
     {
      hint: '切32等份后几乎是完美的长方体！由此推出：圆柱体积 V = πr²h。',
      get formula() { const r=f4State.r,h=f4State.h; return `V = πr²h，r=${r}，h=${h} → V=3.14×${r}²×${h}≈${(3.14*r*r*h).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=4; f4DrawStep(canvas); },
     },

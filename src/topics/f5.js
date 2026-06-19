// ================================================================
// GeoGenius Topic: f5 — 圆锥的体积 (Cone Volume)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f5
// 推导：等底等高时，圆锥倒水3次正好装满圆柱 → V圆锥 = ⅓πr²h
// ================================================================

// @@SECTION:helpers@@

   const f5State = {
    r: 3, h: 6, curStep: -1, animRaf: null, animT0: 0,
   };

   // ── 配色 ──
   const F5CONE   = '#D9E9FB';   // 圆锥体浅蓝
   const F5CONE_D = '#2A6BB0';   // 蓝描边
   const F5CYL    = '#E4F6EE';   // 圆柱浅绿
   const F5CYL_D  = '#0A7050';   // 绿描边
   const F5WAT    = '#5AA0E8';   // 水体
   const F5WAT_T  = '#86BEF2';   // 水面

   function f5Label(ctx, text, x, y, color, size, align, weight) {
    ctx.save();
    ctx.fillStyle = color || '#333';
    ctx.font = `${weight||'400'} ${size||13}px 'Noto Sans SC',sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }
   function f5RoundRect(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   /* 从 r/h 计算绘制参数（圆锥、圆柱等底等高） */
   function f5D() {
    const r = f5State.r, h = f5State.h;
    const bodyH = Math.min(h * 15, 120);
    const rx = Math.min(r * 9, 30);
    const ry = Math.max(5, Math.round(rx * 0.30));
    const botY = 198;
    const coneCX = 112, cylCX = 314;
    return { r, h, bodyH, rx, ry, botY, coneCX, cylCX };
   }

   /* 画3D圆锥（顶点朝上 + 底面椭圆 + 可选水位 waterFrac 0~1） */
   function f5Cone(ctx, cx, botY, bodyH, rx, ry, waterFrac) {
    const apexY = botY - bodyH;
    ctx.save();
    // 锥体
    ctx.beginPath();
    ctx.moveTo(cx - rx, botY); ctx.lineTo(cx, apexY); ctx.lineTo(cx + rx, botY);
    ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false);
    ctx.closePath(); ctx.fillStyle = F5CONE; ctx.fill();
    // 水（底部锥台）
    if (waterFrac > 0.001) {
     const f = Math.min(1, waterFrac);
     const yW = botY - f * bodyH, rxW = rx * (1 - f), ryW = ry * (1 - f);
     ctx.beginPath();
     ctx.moveTo(cx - rx, botY); ctx.lineTo(cx - rxW, yW);
     ctx.ellipse(cx, yW, rxW, ryW, 0, Math.PI, 0, true);
     ctx.lineTo(cx + rx, botY);
     ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false);
     ctx.closePath(); ctx.fillStyle = F5WAT; ctx.fill();
     if (rxW > 1) { ctx.beginPath(); ctx.ellipse(cx, yW, rxW, ryW, 0, 0, 2*Math.PI); ctx.fillStyle = F5WAT_T; ctx.fill(); }
    }
    // 轮廓
    ctx.strokeStyle = F5CONE_D; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - rx, botY); ctx.lineTo(cx, apexY); ctx.lineTo(cx + rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 2*Math.PI, false); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
   }

   /* 画3D圆柱（可选水位 waterFrac，可选1/3刻度线 ticks） */
   function f5Cyl(ctx, cx, botY, bodyH, rx, ry, waterFrac, ticks) {
    const topY = botY - bodyH;
    ctx.save();
    // 柱身底色
    ctx.beginPath();
    ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, botY);
    ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, topY);
    ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath(); ctx.fillStyle = F5CYL; ctx.fill();
    // 水
    if (waterFrac > 0.001) {
     const yW = botY - Math.min(1, waterFrac) * bodyH;
     ctx.beginPath();
     ctx.moveTo(cx - rx, yW); ctx.lineTo(cx - rx, botY);
     ctx.ellipse(cx, botY, rx, ry, 0, Math.PI, 0, true);
     ctx.lineTo(cx + rx, yW);
     ctx.ellipse(cx, yW, rx, ry, 0, 0, Math.PI, true);
     ctx.closePath(); ctx.fillStyle = F5WAT; ctx.fill();
     ctx.beginPath(); ctx.ellipse(cx, yW, rx, ry, 0, 0, 2*Math.PI); ctx.fillStyle = F5WAT_T; ctx.fill();
     ctx.strokeStyle = F5CONE_D; ctx.lineWidth = 1; ctx.stroke();
    }
    // 1/3、2/3 刻度虚线
    if (ticks) {
     ctx.strokeStyle = 'rgba(10,112,80,0.55)'; ctx.lineWidth = 0.8; ctx.setLineDash([4, 3]);
     for (let k = 1; k <= 2; k++) {
      const yk = botY - (k/3) * bodyH;
      ctx.beginPath(); ctx.ellipse(cx, yk, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
     }
     ctx.setLineDash([]);
    }
    // 轮廓
    ctx.strokeStyle = F5CYL_D; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - rx, topY); ctx.lineTo(cx - rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, topY); ctx.lineTo(cx + rx, botY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, topY, rx, ry, 0, 0, 2*Math.PI); ctx.stroke();
    ctx.restore();
   }

   /* Canvas + 滑块 overlay 初始化 */
   function getF5Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f5-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f5-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'f5-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     const D = f5D();
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#0A7050;font-weight:600">
       底面半径 <i>r</i>&thinsp;=&thinsp;<span id="f5-r-val">${D.r}</span>
       <input id="f5-r" type="range" min="2" max="5" step="1" value="${D.r}" style="width:80px;accent-color:#0A7050">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="f5-h-val">${D.h}</span>
       <input id="f5-h" type="range" min="2" max="8" step="1" value="${D.h}" style="width:80px;accent-color:#C03030">
      </label>`;
     wrap.after(overlay);
     const canvasRef = canvas;
     function onSlider() {
      if (f5State.animRaf) { cancelAnimationFrame(f5State.animRaf); f5State.animRaf = null; }
      f5DrawStep(canvasRef);
      const sf = document.getElementById('sform');
      try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
     }
     document.getElementById('f5-r').addEventListener('input', function() {
      f5State.r = +this.value; document.getElementById('f5-r-val').textContent = this.value; onSlider();
     });
     document.getElementById('f5-h').addEventListener('input', function() {
      f5State.h = +this.value; document.getElementById('f5-h-val').textContent = this.value; onSlider();
     });
    }
    return { canvas };
   }

   function removeF5Canvas() {
    if (f5State.animRaf) { cancelAnimationFrame(f5State.animRaf); f5State.animRaf = null; }
    const c = document.getElementById('f5-canvas'), o = document.getElementById('f5-overlay');
    if (c) { const sv = c.parentElement && c.parentElement.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    if (o) o.remove();
    f5State.curStep = -1;
   }

   /* r/h 标注（圆锥用） */
   function f5ConeLabels(ctx, cx, botY, bodyH, rx) {
    const apexY = botY - bodyH;
    // 高 h（中轴虚线）
    ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, apexY); ctx.lineTo(cx, botY); ctx.stroke();
    ctx.restore();
    f5Label(ctx, `h = ${f5State.h}`, cx + 8, (apexY + botY) / 2, '#C03030', 12, 'left', '700');
    // 半径 r
    ctx.save(); ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx, botY); ctx.lineTo(cx + rx, botY); ctx.stroke();
    ctx.restore();
    f5Label(ctx, `r = ${f5State.r}`, cx + rx / 2, botY + 13, '#0A7050', 12, 'center', '700');
   }

   /* ─── 静态绘图 ─── */
   function f5DrawStep(canvas) {
    const W = 420, H = 280, pi = Math.PI;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const step = f5State.curStep;
    const D = f5D();
    const { r, h, bodyH, rx, ry, botY, coneCX, cylCX } = D;

    if (step === 0) {
     /* 圆锥介绍 + r/h 标注 + V=? 卡片 */
     const cx = 132;
     f5Cone(ctx, cx, botY, bodyH, rx, ry, 0);
     // 顶点
     ctx.save(); ctx.fillStyle = F5CONE_D; ctx.beginPath(); ctx.arc(cx, botY - bodyH, 3, 0, 2*pi); ctx.fill(); ctx.restore();
     f5Label(ctx, '顶点', cx, botY - bodyH - 12, '#0D3F6E', 12, 'center', '600');
     f5ConeLabels(ctx, cx, botY, bodyH, rx);
     f5RoundRect(ctx, 236, 60, 162, 116, 9, '#FFF8E7', '#9A5800', 1.5);
     f5Label(ctx, '圆锥体积', 317, 84, '#9A5800', 13, 'center', '600');
     f5Label(ctx, 'V = ?', 317, 116, '#A03060', 22, 'center', '700');
     f5Label(ctx, '底面半径 r、高 h', 317, 150, '#9A5800', 11);
    }

    else if (step === 1) {
     /* 等底等高的圆锥 vs 圆柱：猜几分之几 */
     f5Cone(ctx, coneCX, botY, bodyH, rx, ry, 0);
     f5Cyl(ctx, cylCX, botY, bodyH, rx, ry, 0, false);
     f5Label(ctx, '圆锥', coneCX, botY + 16, '#2A6BB0', 12, 'center', '700');
     f5Label(ctx, '圆柱', cylCX, botY + 16, '#0A7050', 12, 'center', '700');
     // 等高标注（左侧）
     const hx = 40;
     ctx.save(); ctx.strokeStyle = '#C03030'; ctx.lineWidth = 1.3;
     ctx.beginPath(); ctx.moveTo(hx, botY - bodyH); ctx.lineTo(hx, botY); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-4, botY-bodyH); ctx.lineTo(hx+4, botY-bodyH); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-4, botY); ctx.lineTo(hx+4, botY); ctx.stroke();
     ctx.restore();
     f5Label(ctx, `等高 h=${h}`, hx + 6, botY - bodyH/2, '#C03030', 11, 'left', '600');
     f5RoundRect(ctx, 120, 30, 240, 40, 8, '#EAF3FF', '#2A6BB0', 1.5);
     f5Label(ctx, '等底等高！圆锥体积是圆柱的几分之几？', 240, 50, '#1A5FA8', 12, 'center', '700');
    }

    else if (step === 2) {
     /* 倒水实验终态（静态，动画在 f5AnimFrame） */
     f5Cone(ctx, coneCX, botY, bodyH, rx, ry, 0);
     f5Cyl(ctx, cylCX, botY, bodyH, rx, ry, 1, true);
     f5Label(ctx, '圆锥', coneCX, botY + 16, '#2A6BB0', 12, 'center', '700');
     f5Label(ctx, '圆柱', cylCX, botY + 16, '#0A7050', 12, 'center', '700');
     f5Label(ctx, '圆锥装3次正好倒满圆柱！', W/2, 34, '#1A5FA8', 13, 'center', '700');
    }

    else if (step === 3) {
     /* 结论 + 公式 */
     f5Cone(ctx, coneCX, botY, bodyH, rx, ry, 0);
     f5Cyl(ctx, cylCX, botY, bodyH, rx, ry, 1, true);
     f5Label(ctx, '圆锥', coneCX, botY + 16, '#2A6BB0', 11, 'center', '700');
     f5Label(ctx, '圆柱', cylCX, botY + 16, '#0A7050', 11, 'center', '700');
     f5Label(ctx, '倒3次装满 → 圆锥 = 圆柱 ÷ 3', W/2, 30, '#1A5FA8', 12, 'center', '700');
     const vcyl = (3.14 * r * r * h);
     const vcone = (vcyl / 3).toFixed(2);
     f5RoundRect(ctx, 26, 222, W - 52, 52, 8, '#E8F5E9', '#2E7D32', 1.5);
     f5Label(ctx, 'V圆锥 = ⅓ × 底面积 × 高 = ⅓πr²h', W/2, 239, '#2E7D32', 13, 'center', '700');
     f5Label(ctx, `= ⅓×3.14×${r}²×${h} ≈ ${vcone}`, W/2, 261, '#2E7D32', 13, 'center', '700');
    }
   }

   /* ─── 倒水动画：圆锥3次装满圆柱 ───
      3个倒水周期：每次圆锥水排空、圆柱上升1/3，并显示倒水次数。 */
   function f5PourState(p) {
    for (let k = 0; k < 3; k++) {
     const s = k * 0.30, e = s + 0.27;
     if (p < s)  return { cyl: k/3, cone: 1, pouring: false, no: k+1 };
     if (p <= e) { const lp = (p - s) / 0.27; return { cyl: k/3 + lp/3, cone: 1 - lp, pouring: true, no: k+1 }; }
     if (k < 2 && p < s + 0.30) return { cyl: (k+1)/3, cone: 1, pouring: false, no: k+1 };
    }
    return { cyl: 1, cone: 0, pouring: false, no: 3, done: true };
   }

   function f5AnimFrame(canvas, p) {
    const W = 420, pi = Math.PI;
    const D = f5D();
    const { r, h, bodyH, rx, ry, botY, coneCX, cylCX } = D;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, 280);

    const st = f5PourState(p);
    f5Cone(ctx, coneCX, botY, bodyH, rx, ry, st.cone);
    f5Cyl(ctx, cylCX, botY, bodyH, rx, ry, st.cyl, true);
    f5Label(ctx, '圆锥', coneCX, botY + 16, '#2A6BB0', 12, 'center', '700');
    f5Label(ctx, '圆柱', cylCX, botY + 16, '#0A7050', 12, 'center', '700');

    // 倒水水流（弧线，从圆锥口流向圆柱水面）
    if (st.pouring) {
     const x0 = coneCX + rx - 2, y0 = botY - bodyH * 0.78;
     const yCyl = botY - st.cyl * bodyH;
     const x1 = cylCX - rx + 4, y1 = yCyl;
     ctx.save(); ctx.strokeStyle = F5WAT; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
     ctx.beginPath(); ctx.moveTo(x0, y0);
     ctx.quadraticCurveTo((x0 + x1) / 2, y0 - 22, x1, y1);
     ctx.stroke(); ctx.restore();
    }

    // 次数提示
    f5Label(ctx, `第 ${st.no} 次倒水`, W/2, 30, '#1A5FA8', 13, 'center', '700');
    f5Label(ctx, st.done ? '3次正好装满！' : `已倒 ${(st.cyl*3).toFixed(2)} 杯（满=3杯）`,
            W/2, 50, '#888', 11, 'center', '600');
   }

   /* ─── 动画入口：p===0 时强制重启，animTick 后续帧复用已跑的 RAF ───
      非强制调用时：正在播放(animRaf)或已结束(animT0===0)都忽略，
      避免主 animTick 在 f5 自身 RAF 先结束后把动画重启成死循环。 */
   function f5StartAnim(canvas, forceRestart) {
    if (!forceRestart && (f5State.animRaf || f5State.animT0 === 0)) return;
    if (f5State.animRaf) { cancelAnimationFrame(f5State.animRaf); f5State.animRaf = null; }

    const SM  = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const dur = 5400 * SM;

    f5State.animT0 = performance.now();
    const t0 = f5State.animT0;
    let pausedMs = 0, pausedAt = 0;

    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) {
      if (!pausedAt) pausedAt = now;
      f5State.animRaf = requestAnimationFrame(tick);
      return;
     }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }

     const p = Math.min(1, (now - t0 - pausedMs) / dur);
     f5AnimFrame(canvas, p);

     if (p < 1) {
      f5State.animRaf = requestAnimationFrame(tick);
     } else {
      f5State.animRaf = null; f5State.animT0 = 0;
      f5DrawStep(canvas);
     }
    })(t0);
   }

// @@SECTION:anims@@

     {
      hint: '圆锥有1个圆形底面、1个顶点、1条高h（顶点到底面圆心）、底面半径r。拖动滑块看大小变化。',
      formula: 'V = ?（目标：推导圆锥体积公式 V = ⅓πr²h）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF5Canvas(s); f5State.curStep=0; f5DrawStep(canvas); },
     },
     {
      hint: '把圆锥和一个等底等高的圆柱放在一起。猜一猜：圆锥的体积是圆柱的几分之几？',
      formula: '等底等高：圆锥体积 = 圆柱体积 × ?',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF5Canvas(s); f5State.curStep=1; f5DrawStep(canvas); },
     },
     {
      hint: '关键实验：用圆锥装满水倒进等底等高的圆柱，倒3次正好装满！所以圆锥是圆柱的⅓。',
      formula: '圆锥倒满圆柱需3次 → V圆锥 = ⅓ V圆柱',
      dur: 5400, noAutoFit: true,
      draw(s, p) { const {canvas}=getF5Canvas(s); f5State.curStep=2; f5StartAnim(canvas, p===0); },
     },
     {
      hint: '圆柱体积=πr²h，圆锥是它的⅓，所以圆锥体积 V = ⅓πr²h。拖动滑块验证数值。',
      get formula() { const r=f5State.r,h=f5State.h; return `V圆锥 = ⅓πr²h = ⅓×3.14×${r}²×${h} ≈ ${(3.14*r*r*h/3).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF5Canvas(s); f5State.curStep=3; f5DrawStep(canvas); },
     },

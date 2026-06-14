// ================================================================
// GeoGenius Topic: e3 — 梯形面积 (Trapezoid Area)
// Canvas interactive derivation with sliders + rotation animation
//
// Build system splits this file into two injection sections:
//   @@SECTION:helpers@@  → injected before `const ANIMS = {`
//   @@SECTION:anims@@    → injected as the body of ANIMS.e3 array
//
// Edit this file, then run `./build.sh` to update dist/index.html
// ================================================================

// @@SECTION:helpers@@

   /* ── e3 Canvas 交互推导器状态 ── */
   const e3State = {
    a: 4, b: 6, h: 5,  // 上底、下底、高
    curStep: -1,
    rotAngle: 0,        // 旋转角（0 → π）
    rotDone: false,
    rotRaf: null,
   };

   /** 获取或创建 e3 专属 canvas+overlay */
   function getE3Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('e3-canvas');
    let overlay = document.getElementById('e3-overlay');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'e3-canvas';
     canvas.width = 420;
     canvas.height = 250;
     Object.assign(canvas.style, {
      display: 'block', maxWidth: '100%', height: 'auto', borderRadius: '6px',
     });
     wrap.appendChild(canvas);
     overlay = document.createElement('div');
     overlay.id = 'e3-overlay';
     Object.assign(overlay.style, {
      display: 'flex', gap: '12px', alignItems: 'center',
      justifyContent: 'center', flexWrap: 'wrap',
      padding: '6px 0 2px',
      fontSize: '13px', fontFamily: "'Noto Sans SC',sans-serif", whiteSpace: 'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#6A3A00;font-weight:600">
       上底 <i>a</i>&thinsp;=&thinsp;<span id="e3-a-val">${e3State.a}</span>
       <input id="e3-a" type="range" min="2" max="8" step="1" value="${e3State.a}"
        style="width:70px;accent-color:#9A5800">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#0D3F6E;font-weight:600">
       下底 <i>b</i>&thinsp;=&thinsp;<span id="e3-b-val">${e3State.b}</span>
       <input id="e3-b" type="range" min="4" max="12" step="1" value="${e3State.b}"
        style="width:70px;accent-color:#0D3F6E">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="e3-h-val">${e3State.h}</span>
       <input id="e3-h" type="range" min="2" max="8" step="1" value="${e3State.h}"
        style="width:70px;accent-color:#C03030">
      </label>`;
     wrap.parentNode.insertBefore(overlay, wrap.nextSibling);
     overlay.querySelector('#e3-a').addEventListener('input', function() {
      e3State.a = +this.value;
      if (e3State.a >= e3State.b) {
       e3State.b = Math.min(12, e3State.a + 1);
       overlay.querySelector('#e3-b').value = e3State.b;
       overlay.querySelector('#e3-b-val').textContent = e3State.b;
      }
      overlay.querySelector('#e3-a-val').textContent = e3State.a;
      e3DrawStep(canvas);
     });
     overlay.querySelector('#e3-b').addEventListener('input', function() {
      e3State.b = +this.value;
      if (e3State.b <= e3State.a) {
       e3State.a = Math.max(2, e3State.b - 1);
       overlay.querySelector('#e3-a').value = e3State.a;
       overlay.querySelector('#e3-a-val').textContent = e3State.a;
      }
      overlay.querySelector('#e3-b-val').textContent = e3State.b;
      e3DrawStep(canvas);
     });
     overlay.querySelector('#e3-h').addEventListener('input', function() {
      e3State.h = +this.value;
      overlay.querySelector('#e3-h-val').textContent = e3State.h;
      e3DrawStep(canvas);
     });
    }
    return { canvas, overlay };
   }

   /** 删除 e3 canvas+overlay */
   function removeE3Canvas() {
    if (e3State.rotRaf) { cancelAnimationFrame(e3State.rotRaf); e3State.rotRaf = null; }
    document.getElementById('e3-canvas')?.remove();
    document.getElementById('e3-overlay')?.remove();
    const svg = document.getElementById('asvg');
    if (svg) svg.style.display = '';
    e3State.curStep = -1;
    e3State.rotAngle = 0;
    e3State.rotDone = false;
   }

   /** 根据 e3State.curStep 在 canvas 上绘制当前步骤 */
   function e3DrawStep(canvas) {
    const ctx = canvas.getContext('2d');
    const W = 420, H = 250;
    ctx.clearRect(0, 0, W, H);

    const a = e3State.a, b = e3State.b, h = e3State.h;
    const sc = 13;
    const offset = 20;  // 右腰水平分量（梯形腰的倾斜）
    const baseY = 200;
    const cx = 210;

    // 梯形顶点：A（左下）、B（右下）、C（右上）、D（左上）
    const Ax = Math.round(cx - ((a + b) * sc + offset) / 2), Ay = baseY;
    const Bx = Ax + b * sc, By = baseY;
    const Dx = Ax + offset, Dy = baseY - h * sc;
    const Cx = Dx + a * sc, Cy = Dy;

    // M = 右腰 BC 的中点
    const Mx = (Bx + Cx) / 2, My = (By + Cy) / 2;

    // 旋转 180° 后：B↔C 互换，A→Ar（顶层），D→Dr（底层）
    const Ar_x = 2 * Mx - Ax, Ar_y = Cy;
    const Dr_x = 2 * Mx - Dx, Dr_y = Ay;

    function rot(px, py, angle) {
     const cos = Math.cos(angle), sin = Math.sin(angle);
     const dx = px - Mx, dy = py - My;
     return [Mx + dx * cos - dy * sin, My + dx * sin + dy * cos];
    }

    function fillPoly(pts, fill, strokeColor, lw) {
     ctx.beginPath();
     ctx.moveTo(pts[0][0], pts[0][1]);
     for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
     ctx.closePath();
     ctx.fillStyle = fill; ctx.fill();
     if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lw || 2; ctx.stroke(); }
    }

    function label(text, x, y, color, size, align) {
     ctx.save();
     ctx.fillStyle = color || '#333';
     ctx.font = `600 ${size || 13}px 'Noto Sans SC',sans-serif`;
     ctx.textAlign = align || 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(text, x, y);
     ctx.restore();
    }

    function dashedLine(x1, y1, x2, y2, color, lw, dash) {
     ctx.save();
     ctx.strokeStyle = color; ctx.lineWidth = lw || 1.8;
     ctx.setLineDash(dash || [5, 3]);
     ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
     ctx.setLineDash([]);
     ctx.restore();
    }

    function solidLine(x1, y1, x2, y2, color, lw) {
     ctx.save();
     ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
     ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
     ctx.restore();
    }

    function rightAngle(x, y, sz, col) {
     ctx.save();
     ctx.strokeStyle = col || '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
     ctx.beginPath();
     ctx.moveTo(x, y - sz); ctx.lineTo(x + sz, y - sz); ctx.lineTo(x + sz, y);
     ctx.stroke();
     ctx.restore();
    }

    function dot(x, y, r, color) {
     ctx.save();
     ctx.fillStyle = color;
     ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
     ctx.restore();
    }

    function roundRect(x, y, w, h, r, fill, strokeColor, lw) {
     ctx.save();
     ctx.beginPath();
     ctx.moveTo(x + r, y);
     ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
     ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
     ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
     ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
     ctx.closePath();
     if (fill) { ctx.fillStyle = fill; ctx.fill(); }
     if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
     ctx.restore();
    }

    const step = e3State.curStep;

    if (step === 0) {
     // 橙色梯形 ABCD，标顶点，上底 a，下底 b，高 h
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#FEF0DC', '#9A5800', 2.5);
     label('A', Ax - 12, Ay, '#9A5800', 13, 'right');
     label('B', Bx + 12, By, '#9A5800', 13, 'left');
     label('C', Cx + 12, Cy, '#9A5800', 13, 'left');
     label('D', Dx - 12, Dy, '#9A5800', 13, 'right');
     label(`上底 a = ${a}`, (Dx + Cx) / 2, Dy - 16, '#6A3A00', 12);
     label(`下底 b = ${b}`, (Ax + Bx) / 2, Ay + 20, '#0D3F6E', 12);
     dashedLine(Dx, Dy, Dx, Ay, '#C03030', 1.8, [5, 3]);
     rightAngle(Dx, Ay, 10, '#C03030');
     label(`h = ${h}`, Dx - 14, (Dy + Ay) / 2, '#C03030', 12, 'right');

    } else if (step === 1) {
     // 橙+绿叠放，标 M（BC中点），旋转箭头
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#FEF0DC', '#9A5800', 2.5);
     ctx.save(); ctx.globalAlpha = 0.55;
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#A8EFD0', '#0A7050', 2);
     ctx.restore();
     solidLine(Bx, By, Cx, Cy, '#1A5FA8', 2.5);
     dot(Mx, My, 5, '#E02020');
     label('M', Mx + 14, My, '#E02020', 12, 'left');
     label('（BC中点）', Mx + 14, My + 16, '#E02020', 11, 'left');
     label('绿色将绕 M 旋转 180°', (Ax + Bx) / 2, Dy - 18, '#0A7050', 12);
     ctx.save();
     ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
     ctx.beginPath(); ctx.arc(Mx, My, 28, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke();
     const arx = Mx + 28 * Math.cos(Math.PI * 0.6), ary = My + 28 * Math.sin(Math.PI * 0.6);
     ctx.setLineDash([]);
     ctx.fillStyle = '#0A7050';
     ctx.beginPath();
     ctx.moveTo(arx, ary); ctx.lineTo(arx - 8, ary - 3); ctx.lineTo(arx - 5, ary + 6);
     ctx.closePath(); ctx.fill();
     ctx.restore();

    } else if (step === 2) {
     // 旋转动画：绿色绕 M 转，橙色固定
     const angle = e3State.rotAngle;
     const [rAt_x, rAt_y] = rot(Ax, Ay, angle);
     const [rBt_x, rBt_y] = rot(Bx, By, angle);
     const [rCt_x, rCt_y] = rot(Cx, Cy, angle);
     const [rDt_x, rDt_y] = rot(Dx, Dy, angle);
     fillPoly([[rAt_x,rAt_y],[rBt_x,rBt_y],[rCt_x,rCt_y],[rDt_x,rDt_y]], '#E4F6EE', '#0A7050', 1.8);
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#FEF0DC', '#9A5800', 2.5);
     dot(Mx, My, 5, '#E02020');
     label('M', Mx + 10, My - 10, '#E02020', 12, 'left');
     if (e3State.rotDone) {
      ctx.save();
      ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(Ax, Ay); ctx.lineTo(Dr_x, Dr_y); ctx.lineTo(Ar_x, Ar_y); ctx.lineTo(Dx, Dy);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      label('拼成平行四边形！', (Ax + Dr_x) / 2, Dy - 18, '#0A7050', 13);
     }

    } else if (step === 3) {
     // 平行四边形：橙色左梯形 + 绿色右梯形
     const area = (a + b) * h;
     fillPoly([[Bx,By],[Dr_x,Dr_y],[Ar_x,Ar_y],[Cx,Cy]], '#E4F6EE', '#0A7050', 2);
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#FEF0DC', '#9A5800', 2);
     ctx.save();
     ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
     ctx.beginPath();
     ctx.moveTo(Ax, Ay); ctx.lineTo(Dr_x, Dr_y); ctx.lineTo(Ar_x, Ar_y); ctx.lineTo(Dx, Dy);
     ctx.closePath(); ctx.stroke();
     ctx.restore();
     dashedLine(Dx, Dy, Dx, Ay, '#C03030', 1.8, [5, 3]);
     rightAngle(Dx, Ay, 10, '#C03030');
     // 公式框：h 够高时置于平行四边形内，否则置于顶边上方
     const pCx3 = Math.round(Ax + (a + b) * sc / 2 + offset / 2);
     const fw3 = 130, fh3 = 46;
     const fy3 = h * sc >= fh3 + 16 ? Dy + Math.round((h * sc - fh3) / 2) : Math.max(8, Dy - fh3 - 8);
     roundRect(pCx3 - fw3 / 2, fy3, fw3, fh3, 7, '#FFF8E7', '#9A5800', 1.5);
     label('面积 = (a+b)×h', pCx3, fy3 + 15, '#9A5800', 12);
     label(`= (${a}+${b})×${h} = ${area}`, pCx3, fy3 + 33, '#9A5800', 12);
     // 标注压在公式框上方
     label(`底 = a+b = ${a + b}`, (Ax + Dr_x) / 2, Ay + 20, '#1A5FA8', 12);
     label(`上底 a = ${a}`, (Dx + Cx) / 2, Dy - 16, '#6A3A00', 11);
     label(`h = ${h}`, Dx - 14, (Dy + Ay) / 2, '#C03030', 13, 'right');

    } else if (step === 4) {
     // 公式 S = (a+b)×h÷2
     const area = (a + b) * h;
     const S = area / 2;
     fillPoly([[Bx,By],[Dr_x,Dr_y],[Ar_x,Ar_y],[Cx,Cy]], '#E4F6EE', '#0A7050', 1.5);
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#FEF0DC', '#9A5800', 2.5);
     ctx.save();
     ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 2; ctx.setLineDash([]);
     ctx.beginPath();
     ctx.moveTo(Ax, Ay); ctx.lineTo(Dr_x, Dr_y); ctx.lineTo(Ar_x, Ar_y); ctx.lineTo(Dx, Dy);
     ctx.closePath(); ctx.stroke();
     ctx.restore();
     dashedLine(Dx, Dy, Dx, Ay, '#C03030', 1.8, [5, 3]);
     rightAngle(Dx, Ay, 10, '#C03030');
     // 公式框先画（背景），再画标注文字压在上面
     const pCx4 = Math.round(Ax + (a + b) * sc / 2 + offset / 2);
     const fw4 = 142, fh4 = 62;
     const fy4 = h * sc >= fh4 + 16 ? Dy + Math.round((h * sc - fh4) / 2) : Math.max(8, Dy - fh4 - 8);
     roundRect(pCx4 - fw4 / 2, fy4, fw4, fh4, 7, '#FEF0DC', '#9A5800', 1.5);
     label('S = (a+b)×h÷2', pCx4, fy4 + 17, '#9A5800', 13);
     label(`= (${a}+${b})×${h}÷2`, pCx4, fy4 + 36, '#9A5800', 12);
     label(`= ${area}÷2 = ${S}`, pCx4, fy4 + 54, '#9A5800', 13);
     // 标注压在公式框上（后画 = 最上层）
     label(`下底 b = ${b}`, (Ax + Bx) / 2, Ay + 20, '#0D3F6E', 12);
     label(`上底 a = ${a}`, (Dx + Cx) / 2, Dy - 16, '#6A3A00', 12);
     label(`h = ${h}`, Dx - 14, (Dy + Ay) / 2, '#C03030', 12, 'right');
    }
   }

// @@SECTION:anims@@

     {
      hint: '梯形：上底 a（短），下底 b（长），高 h 是两底间的垂直距离。拖动滑块改变数值，图形实时联动。',
      formula: '梯形：上底 a，下底 b，高 h',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas } = getE3Canvas(s);
       e3State.curStep = 0;
       e3DrawStep(canvas);
      },
     },
     {
      hint: '复制一个相同的梯形（绿色），叠在橙色上。旋转中心 M 是右腰 BC 的中点。',
      formula: '绕 M（BC中点）旋转 180° → 拼成平行四边形',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas } = getE3Canvas(s);
       e3State.curStep = 1;
       e3DrawStep(canvas);
      },
     },
     {
      hint: '绿色梯形绕右腰 BC 中点 M 自动旋转 180°，BC 边重合，两个梯形拼成平行四边形！',
      formula: '旋转 180° → BC 边重合 → 平行四边形',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas } = getE3Canvas(s);
       if (e3State.rotRaf) { cancelAnimationFrame(e3State.rotRaf); e3State.rotRaf = null; }
       e3State.rotAngle = 0;
       e3State.rotDone = false;
       e3State.curStep = 2;
       const start = performance.now();
       const dur = 1400;
       (function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const te = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        e3State.rotAngle = Math.PI * te;
        e3DrawStep(canvas);
        if (p < 1) {
         e3State.rotRaf = requestAnimationFrame(tick);
        } else {
         e3State.rotRaf = null;
         e3State.rotDone = true;
         e3DrawStep(canvas);
        }
       })(performance.now());
      },
     },
     {
      hint: '两个梯形拼成平行四边形，底 = a+b，高 = h，平行四边形面积 = (a+b)×h。拖动滑块验证。',
      formula: '平行四边形面积 = (a+b)×h',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas } = getE3Canvas(s);
       e3State.curStep = 3;
       e3DrawStep(canvas);
      },
     },
     {
      hint: '每个梯形只占平行四边形的一半，所以 S = (a+b)×h÷2。拖动滑块代入验证！',
      formula: '✅  S = (a+b)×h÷2',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas } = getE3Canvas(s);
       e3State.curStep = 4;
       e3DrawStep(canvas);
      },
     },

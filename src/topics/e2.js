// ================================================================
// GeoGenius Topic: e2 — 三角形面积 (Triangle Area)
// Canvas interactive derivation with sliders + rotation animation
//
// Build system splits this file into two injection sections:
//   @@SECTION:helpers@@  → injected before `const ANIMS = {`
//   @@SECTION:anims@@    → injected as the body of ANIMS.e2 array
//
// Edit this file, then run `./build.sh` to update dist/index.html
// ================================================================

// @@SECTION:helpers@@

   /* ── e2 Canvas 交互推导器状态 ── */
   const e2State = {
    a: 8, h: 5,        // 滑块当前值
    curStep: -1,       // 当前步骤索引（用于检测步骤切换）
    rotAngle: 0,       // Step 3 旋转角（0 → π）
    rotDone: false,    // Step 3 旋转是否完成
    rotRaf: null,      // Step 3 rAF 句柄
   };

   /** 获取或创建挂在 .canvas-wrap 旁边的 e2 专属 canvas+overlay */
   function getE2Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('e2-canvas');
    let overlay = document.getElementById('e2-overlay');
    if (!canvas) {
     // 隐藏原 SVG，canvas 作为 flex 子元素显示
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'e2-canvas';
     canvas.width = 420;
     canvas.height = 220;
     Object.assign(canvas.style, {
      display: 'block',
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '6px',
     });
     wrap.appendChild(canvas);
     // Overlay div（放滑块和按钮），插入到 canvas-wrap 后面
     overlay = document.createElement('div');
     overlay.id = 'e2-overlay';
     Object.assign(overlay.style, {
      display: 'flex', gap: '14px', alignItems: 'center',
      justifyContent: 'center', flexWrap: 'wrap',
      padding: '6px 0 2px',
      fontSize: '13px', fontFamily: "'Noto Sans SC',sans-serif",
      whiteSpace: 'nowrap',
     });
     // 底边滑块
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#6A3A00;font-weight:600">
       底边 <i>a</i>&thinsp;=&thinsp;<span id="e2-a-val">${e2State.a}</span>
       <input id="e2-a" type="range" min="4" max="14" step="1" value="${e2State.a}"
        style="width:80px;accent-color:#9A5800">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="e2-h-val">${e2State.h}</span>
       <input id="e2-h" type="range" min="3" max="10" step="1" value="${e2State.h}"
        style="width:80px;accent-color:#C03030">
      </label>`;
     // 插入在 canvas-wrap 后面（同一个父节点）
     wrap.parentNode.insertBefore(overlay, wrap.nextSibling);
     // 绑定滑块事件
     overlay.querySelector('#e2-a').addEventListener('input', function() {
      e2State.a = +this.value;
      overlay.querySelector('#e2-a-val').textContent = e2State.a;
      e2DrawStep(canvas);
     });
     overlay.querySelector('#e2-h').addEventListener('input', function() {
      e2State.h = +this.value;
      overlay.querySelector('#e2-h-val').textContent = e2State.h;
      e2DrawStep(canvas);
     });
    }
    return { canvas, overlay };
   }

   /** 删除 e2 canvas+overlay（切换到其他题目时调用） */
   function removeE2Canvas() {
    if (e2State.rotRaf) { cancelAnimationFrame(e2State.rotRaf); e2State.rotRaf = null; }
    document.getElementById('e2-canvas')?.remove();
    document.getElementById('e2-overlay')?.remove();
    // 恢复 SVG 显示
    const svg = document.getElementById('asvg');
    if (svg) svg.style.display = '';
    e2State.curStep = -1;
    e2State.rotAngle = 0;
    e2State.rotDone = false;
   }

   /** 根据 e2State.curStep 在 canvas 上绘制当前步骤 */
   function e2DrawStep(canvas) {
    const ctx = canvas.getContext('2d');
    const W = 420, H = 220;
    ctx.clearRect(0, 0, W, H);

    const a = e2State.a, h = e2State.h;
    const sc = 14;
    const baseY = 178;
    const offset = 24; // 顶点 C 相对 A 的水平偏移（形成非直角三角形）
    const cx = 205;

    // A（左下）、B（右下）、C（顶部偏右）
    const Ax = Math.round(cx - (a*sc + offset) / 2), Ay = baseY;
    const Bx = Ax + a*sc, By = baseY;
    const Cx = Ax + offset, Cy = baseY - h*sc;

    // 旋转中心 M = BC 右腰中点
    const Mx = (Bx + Cx) / 2, My = (By + Cy) / 2;

    // A 绕 M 旋转 180° → gA（平行四边形右上角）
    const gAx = 2*Mx - Ax, gAy = 2*My - Ay; // y = baseY - h*sc = Cy

    function rot(px, py, angle) {
     const cos = Math.cos(angle), sin = Math.sin(angle);
     const dx = px - Mx, dy = py - My;
     return [Mx + dx*cos - dy*sin, My + dx*sin + dy*cos];
    }

    function fillPoly(pts, fill, strokeColor, lw) {
     ctx.beginPath();
     ctx.moveTo(pts[0][0], pts[0][1]);
     for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
     ctx.closePath();
     ctx.fillStyle = fill; ctx.fill();
     if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = lw||2; ctx.stroke(); }
    }

    function label(text, x, y, color, size, align) {
     ctx.save();
     ctx.fillStyle = color||'#333';
     ctx.font = `600 ${size||13}px 'Noto Sans SC',sans-serif`;
     ctx.textAlign = align||'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(text, x, y);
     ctx.restore();
    }

    function dashedLine(x1,y1,x2,y2,color,lw,dash) {
     ctx.save();
     ctx.strokeStyle = color; ctx.lineWidth = lw||1.8;
     ctx.setLineDash(dash||[5,3]);
     ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
     ctx.setLineDash([]);
     ctx.restore();
    }

    function solidLine(x1,y1,x2,y2,color,lw) {
     ctx.save();
     ctx.strokeStyle = color; ctx.lineWidth = lw||2;
     ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
     ctx.restore();
    }

    function rightAngle(x, y, sz, col) {
     ctx.save();
     ctx.strokeStyle = col||'#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
     ctx.beginPath();
     ctx.moveTo(x, y-sz); ctx.lineTo(x+sz, y-sz); ctx.lineTo(x+sz, y);
     ctx.stroke();
     ctx.restore();
    }

    function dot(x, y, r, color) {
     ctx.save();
     ctx.fillStyle = color;
     ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
     ctx.restore();
    }

    function roundRect(x,y,w,h,r,fill,strokeColor,lw) {
     ctx.save();
     ctx.beginPath();
     ctx.moveTo(x+r,y);
     ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
     ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
     ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
     ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
     ctx.closePath();
     if (fill) { ctx.fillStyle=fill; ctx.fill(); }
     if (strokeColor) { ctx.strokeStyle=strokeColor; ctx.lineWidth=lw||1.5; ctx.stroke(); }
     ctx.restore();
    }

    const step = e2State.curStep;

    if (step === 0) {
     // 橙色三角形，A/B/C 顶点，底 a，高 h
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy]], '#FEF0DC', '#9A5800', 2.5);
     label('A', Ax-12, Ay, '#9A5800', 13, 'right');
     label('B', Bx+12, By, '#9A5800', 13, 'left');
     label('C', Cx, Cy-16, '#9A5800', 13);
     label(`底边 a = ${a}`, (Ax+Bx)/2, Ay+20, '#0D3F6E', 12);
     dashedLine(Cx, Cy, Cx, Ay, '#C03030', 1.8, [5,3]);
     rightAngle(Cx, Ay, 10, '#C03030');
     label(`h = ${h}`, Cx+16, (Cy+Ay)/2, '#C03030', 12, 'left');

    } else if (step === 1) {
     // 橙+绿叠放，标 M（BC中点），旋转箭头
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy]], '#FEF0DC', '#9A5800', 2.5);
     ctx.save(); ctx.globalAlpha = 0.55;
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy]], '#A8EFD0', '#0A7050', 2);
     ctx.restore();
     solidLine(Bx, By, Cx, Cy, '#1A5FA8', 2.5); // 右腰 BC
     dot(Mx, My, 5, '#E02020');
     label('M', Mx+14, My, '#E02020', 12, 'left');
     label('（BC中点）', Mx+14, My+16, '#E02020', 11, 'left');
     label('绿色将绕 M 旋转 180°', (Ax+Bx)/2, Cy-18, '#0A7050', 12);
     ctx.save();
     ctx.strokeStyle = '#0A7050'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
     ctx.beginPath(); ctx.arc(Mx, My, 28, -Math.PI*0.6, Math.PI*0.6); ctx.stroke();
     const arx = Mx + 28*Math.cos(Math.PI*0.6), ary = My + 28*Math.sin(Math.PI*0.6);
     ctx.setLineDash([]);
     ctx.fillStyle = '#0A7050';
     ctx.beginPath();
     ctx.moveTo(arx, ary); ctx.lineTo(arx-8, ary-3); ctx.lineTo(arx-5, ary+6);
     ctx.closePath(); ctx.fill();
     ctx.restore();

    } else if (step === 2) {
     // 旋转动画：绿色绕 M 转，橙色固定
     const angle = e2State.rotAngle;
     const [gAt_x, gAt_y] = rot(Ax, Ay, angle);
     const [gBt_x, gBt_y] = rot(Bx, By, angle);
     const [gCt_x, gCt_y] = rot(Cx, Cy, angle);
     fillPoly([[gAt_x,gAt_y],[gBt_x,gBt_y],[gCt_x,gCt_y]], '#E4F6EE', '#0A7050', 1.8);
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy]], '#FEF0DC', '#9A5800', 2.5);
     dot(Mx, My, 5, '#E02020');
     label('M', Mx+10, My-10, '#E02020', 12, 'left');
     if (e2State.rotDone) {
      ctx.save();
      ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 2; ctx.setLineDash([4,3]);
      ctx.beginPath();
      ctx.moveTo(Ax,Ay); ctx.lineTo(Bx,By); ctx.lineTo(gAx,gAy); ctx.lineTo(Cx,Cy);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      label('拼成平行四边形！', (Bx+gAx)/2, gAy-18, '#0A7050', 13);
     }

    } else if (step === 3) {
     // 平行四边形：橙（原三角形）+ 绿（旋转后的副本）
     const area = a * h;
     fillPoly([[gAx,gAy],[Cx,Cy],[Bx,By]], '#E4F6EE', '#0A7050', 2);  // 绿色右半
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy]], '#FEF0DC', '#9A5800', 2);    // 橙色左半
     ctx.save();
     ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
     ctx.beginPath();
     ctx.moveTo(Ax,Ay); ctx.lineTo(Bx,By); ctx.lineTo(gAx,gAy); ctx.lineTo(Cx,Cy);
     ctx.closePath(); ctx.stroke();
     ctx.restore();
     label(`a = ${a}`, (Ax+Bx)/2, Ay+20, '#1A5FA8', 13);
     dashedLine(Cx, Cy, Cx, Ay, '#C03030', 1.8, [5,3]);
     rightAngle(Cx, Ay, 10, '#C03030');
     label(`h = ${h}`, Cx+16, (Cy+Ay)/2, '#C03030', 13, 'left');
     const fx = Math.min(gAx+6, 305), fy = Cy-6, fw = 108, fh = 46;
     roundRect(fx, fy, fw, fh, 7, '#FFF8E7', '#9A5800', 1.5);
     label('面积 = a × h', fx+fw/2, fy+15, '#9A5800', 12);
     label(`= ${a} × ${h} = ${area}`, fx+fw/2, fy+33, '#9A5800', 13);

    } else if (step === 4) {
     // 公式 S = ah÷2
     const area = a * h;
     const S = area / 2;
     fillPoly([[gAx,gAy],[Cx,Cy],[Bx,By]], '#E4F6EE', '#0A7050', 1.5);
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy]], '#FEF0DC', '#9A5800', 2.5);
     ctx.save();
     ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 2; ctx.setLineDash([]);
     ctx.beginPath();
     ctx.moveTo(Ax,Ay); ctx.lineTo(Bx,By); ctx.lineTo(gAx,gAy); ctx.lineTo(Cx,Cy);
     ctx.closePath(); ctx.stroke();
     ctx.restore();
     dashedLine(Cx, Cy, Cx, Ay, '#C03030', 1.8, [5,3]);
     rightAngle(Cx, Ay, 10, '#C03030');
     label(`a = ${a}`, (Ax+Bx)/2, Ay+20, '#1A5FA8', 13);
     label(`h = ${h}`, Cx+16, (Cy+Ay)/2, '#C03030', 13, 'left');
     const fx = Math.min(gAx+6, 295), fy = Cy-6, fw = 120, fh = 60;
     roundRect(fx, fy, fw, fh, 7, '#FEF0DC', '#9A5800', 1.5);
     label('S = ah ÷ 2', fx+fw/2, fy+17, '#9A5800', 14);
     label(`= ${a}×${h}÷2`, fx+fw/2, fy+36, '#9A5800', 12);
     label(`= ${S} cm²`, fx+fw/2, fy+52, '#9A5800', 14);
    }
   }

// @@SECTION:anims@@

     {
      hint: '一个三角形，底边 a = BC，高 h 是顶点 A 到底边的垂直距离。拖动滑块改变 a 和 h，图形实时联动。',
      formula: '三角形：底边 a，高 h',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE2Canvas(s);
       const playBtn = overlay.querySelector('#e2-play-btn');
       if (playBtn) playBtn.style.display = 'none';
       e2State.curStep = 0;
       e2DrawStep(canvas);
      },
     },
     {
      hint: '复制一个完全相同的三角形（绿色），叠在橙色上。旋转中心 M 是 BC 边的中点。',
      formula: '绕 M（BC中点）旋转 180° → 拼成平行四边形',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE2Canvas(s);
       const playBtn = overlay.querySelector('#e2-play-btn');
       if (playBtn) playBtn.style.display = 'none';
       e2State.curStep = 1;
       e2DrawStep(canvas);
      },
     },
     {
      hint: '绿色三角形绕 BC 中点 M 自动旋转 180°，BC 边重合，两个三角形拼成平行四边形！',
      formula: '旋转 180° → BC 边重合 → 平行四边形',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas } = getE2Canvas(s);
       if (e2State.rotRaf) { cancelAnimationFrame(e2State.rotRaf); e2State.rotRaf = null; }
       e2State.rotAngle = 0;
       e2State.rotDone = false;
       e2State.curStep = 2;
       const start = performance.now();
       const dur = 1200;
       (function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const te = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2,2)/2;
        e2State.rotAngle = Math.PI * te;
        e2DrawStep(canvas);
        if (p < 1) {
         e2State.rotRaf = requestAnimationFrame(tick);
        } else {
         e2State.rotRaf = null;
         e2State.rotDone = true;
        }
       })(performance.now());
      },
     },
     {
      hint: '两个三角形拼成的平行四边形，底 a、高 h 不变，面积 = a × h。拖动滑块验证。',
      formula: '平行四边形面积 = a × h',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE2Canvas(s);
       const playBtn = overlay.querySelector('#e2-play-btn');
       if (playBtn) playBtn.style.display = 'none';
       e2State.curStep = 3;
       e2DrawStep(canvas);
      },
     },
     {
      hint: `公式 S = ah÷2。拖动滑块代入验证：S = a×h÷2。高必须垂直于底边！`,
      formula: '✅  S = ah ÷ 2，高⊥底边',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE2Canvas(s);
       const playBtn = overlay.querySelector('#e2-play-btn');
       if (playBtn) playBtn.style.display = 'none';
       e2State.curStep = 4;
       e2DrawStep(canvas);
      },
     },

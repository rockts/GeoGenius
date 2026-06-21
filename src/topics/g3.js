// @@SECTION:helpers@@

   const g3State = { angle: 40, dist: 5, quad: 'NE', curStep: -1 };
   const G3_O = [200, 155];   // origin O on canvas
   const G3_SC = 28;          // px per km
   const G3_TARGET = { angle: 55, dist: 4, quad: 'SE' }; // Step3 challenge target

   function g3Theta(quad, angle) {
    switch (quad) {
     case 'NE': return angle;
     case 'SE': return 180 - angle;
     case 'SW': return 180 + angle;
     case 'NW': return 360 - angle;
    }
   }

   function g3PtFromState() {
    const th = g3Theta(g3State.quad, g3State.angle) * Math.PI / 180;
    const r  = g3State.dist * G3_SC;
    return [G3_O[0] + r * Math.sin(th), G3_O[1] - r * Math.cos(th)];
   }

   function g3PtFixed(quad, angle, dist) {
    const th = g3Theta(quad, angle) * Math.PI / 180;
    const r  = dist * G3_SC;
    return [G3_O[0] + r * Math.sin(th), G3_O[1] - r * Math.cos(th)];
   }

   function g3DirLabel(quad, angle) {
    const from = quad[0] === 'N' ? '北' : '南';
    const to   = quad[1] === 'E' ? '东' : '西';
    if (angle ===  0) return quad[0] === 'N' ? '正北' : '正南';
    if (angle === 90) return quad[1] === 'E' ? '正东' : '正西';
    return `${from}偏${to}${angle}°`;
   }

   function g3DrawGrid(ctx) {
    const W = 420, H = 280;
    ctx.save();
    ctx.strokeStyle = '#D8E4F0';
    ctx.lineWidth = 0.8;
    for (let x = G3_O[0] % G3_SC; x < W; x += G3_SC) {
     ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = G3_O[1] % G3_SC; y < H; y += G3_SC) {
     ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // axes
    ctx.strokeStyle = '#B0C4DE'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(G3_O[0], 0); ctx.lineTo(G3_O[0], H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, G3_O[1]); ctx.lineTo(W, G3_O[1]); ctx.stroke();
    ctx.restore();
   }

   function g3DrawCompass(ctx, ox, oy, sz) {
    const arms = [['N','#C0392B',0,-1],['S','#555',0,1],['E','#555',1,0],['W','#555',-1,0]];
    const labels = {'N':'北','S':'南','E':'东','W':'西'};
    arms.forEach(([d, col, dx, dy]) => {
     ctx.save();
     ctx.strokeStyle = col; ctx.lineWidth = d==='N' ? 2 : 1;
     ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox+dx*sz, oy+dy*sz); ctx.stroke();
     // arrowhead for N
     if (d === 'N') {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(ox+dx*sz, oy+dy*sz);
      ctx.lineTo(ox+dx*sz-4, oy+dy*sz+8);
      ctx.lineTo(ox+dx*sz+4, oy+dy*sz+8);
      ctx.closePath(); ctx.fill();
     }
     ctx.fillStyle = col;
     ctx.font = "bold 11px 'Noto Sans SC',sans-serif";
     ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
     ctx.fillText(labels[d], ox+dx*(sz+10), oy+dy*(sz+10));
     ctx.restore();
    });
   }

   function g3DrawPoint(ctx, x, y, label, col, above) {
    ctx.save();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = "bold 13px 'Noto Sans SC',sans-serif";
    ctx.textAlign = 'center'; ctx.textBaseline = above ? 'bottom' : 'top';
    ctx.fillText(label, x, y + (above ? -8 : 8));
    ctx.restore();
   }

   function g3DrawRay(ctx, ox, oy, px, py, col) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();
    // arrowhead
    const ang = Math.atan2(py-oy, px-ox);
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - 10*Math.cos(ang-0.35), py - 10*Math.sin(ang-0.35));
    ctx.lineTo(px - 10*Math.cos(ang+0.35), py - 10*Math.sin(ang+0.35));
    ctx.closePath(); ctx.fill();
    ctx.restore();
   }

   function g3DrawAngleArc(ctx, ox, oy, quad, angle, radius, col, alpha) {
    // arc from North (up) clockwise to the ray, for NE/NW/SE/SW
    const northAng = -Math.PI / 2; // North = -90° in canvas coords
    const th = g3Theta(quad, angle) * Math.PI / 180 - Math.PI / 2;
    ctx.save();
    ctx.globalAlpha = alpha || 0.35;
    ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, radius, northAng, th, false);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.restore();
   }

   function g3Lbl(ctx, text, x, y, col, size, align, weight, bg) {
    ctx.save();
    ctx.font = `${weight||'normal'} ${size||13}px 'Noto Sans SC',sans-serif`;
    const tw = ctx.measureText(text).width;
    if (bg) {
     ctx.fillStyle = bg;
     ctx.fillRect(x - (align==='center'?tw/2:align==='right'?tw:0) - 3,
                  y - (size||13)/2 - 2, tw + 6, (size||13) + 4);
    }
    ctx.fillStyle = col;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function g3Box(ctx, x, y, w, h, r, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r||6);
    else ctx.rect(x, y, w, h);
    if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   function g3InfoText() {
    const dir = g3DirLabel(g3State.quad, g3State.angle);
    return `${dir}方向，距离 ${g3State.dist} km`;
   }

   function g3UpdateInfo() {
    const el = document.getElementById('g3-info');
    if (!el) return;
    el.textContent = g3InfoText();
    el.style.color = '#1A6030';
   }

   function g3DrawStep(canvas) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const step = g3State.curStep;
    const [ox, oy] = G3_O;
    const P = g3PtFromState();
    const col = '#1A6030';
    const arcCol = '#E07820';

    g3DrawGrid(ctx);

    if (step === 0) {
     // Full overview: grid, compass, O, P, ray, labels
     g3DrawCompass(ctx, ox, oy, 38);

     // North reference line (dashed)
     ctx.save();
     ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1.2; ctx.setLineDash([4,3]);
     ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy-90); ctx.stroke();
     ctx.restore();

     // angle arc
     g3DrawAngleArc(ctx, ox, oy, g3State.quad, g3State.angle, 48, arcCol, 0.2);

     // ray O→P
     g3DrawRay(ctx, ox, oy, P[0], P[1], col);

     // distance label along ray
     const mid = [(ox+P[0])/2, (oy+P[1])/2];
     const th = g3Theta(g3State.quad, g3State.angle) * Math.PI/180;
     const perp = [-Math.cos(th)*14, -Math.sin(th)*14];
     // offset label slightly perpendicular
     g3Lbl(ctx, g3State.dist+'km', mid[0]+perp[0], mid[1]+perp[1],
            col, 11, 'center', 'bold', 'rgba(255,255,255,0.85)');

     // angle arc label
     const arcMid = g3Theta(g3State.quad, g3State.angle/2) * Math.PI/180;
     const arcLx = ox + 60 * Math.sin(arcMid);
     const arcLy = oy - 60 * Math.cos(arcMid);
     g3Lbl(ctx, g3State.angle+'°', arcLx, arcLy, arcCol, 11, 'center', 'bold', 'rgba(255,255,255,0.85)');

     // Points
     g3DrawPoint(ctx, ox, oy, 'O', '#333', true);
     g3DrawPoint(ctx, P[0], P[1], 'P', col, P[1] > oy);

     // info bar
     const dir = g3DirLabel(g3State.quad, g3State.angle);
     g3Box(ctx, 8, 222, 404, 28, 6, col+'12', col, 1.5);
     g3Lbl(ctx, '目标P的位置：', 68, 236, col, 11, 'center', 'bold');
     g3Lbl(ctx, `${dir}方向`, 165, 236, '#1A6030', 14, 'center', 'bold');
     g3Lbl(ctx, `距离 O 点 ${g3State.dist} km`, 310, 236, '#333', 12, 'center');
     g3Lbl(ctx, '拖动滑块改变方向和距离', W/2, 264, '#888', 10, 'center');
    }

    if (step === 1) {
     // Angle measurement: emphasize the arc construction from North
     // Draw North ray prominently
     ctx.save();
     ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 2; ctx.setLineDash([]);
     ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy-90); ctx.stroke();
     // arrowhead
     ctx.fillStyle = '#C0392B';
     ctx.beginPath(); ctx.moveTo(ox, oy-90); ctx.lineTo(ox-4,oy-80); ctx.lineTo(ox+4,oy-80); ctx.closePath(); ctx.fill();
     ctx.restore();
     g3Lbl(ctx, '正北(N)', ox, oy-98, '#C0392B', 11, 'center', 'bold');

     // protractor arc (full 0-angle sweep, animated glow)
     g3DrawAngleArc(ctx, ox, oy, g3State.quad, g3State.angle, 60, arcCol, 0.25);

     // angle label in arc
     const arcMid = g3Theta(g3State.quad, g3State.angle/2) * Math.PI/180;
     const arcLx = ox + 74 * Math.sin(arcMid);
     const arcLy = oy - 74 * Math.cos(arcMid);
     g3Lbl(ctx, g3State.angle+'°', arcLx, arcLy, arcCol, 12, 'center', 'bold', 'rgba(255,255,255,0.9)');

     // direction ray
     g3DrawRay(ctx, ox, oy, P[0], P[1], col);

     g3DrawPoint(ctx, ox, oy, 'O', '#333', true);
     g3DrawPoint(ctx, P[0], P[1], 'P', col, P[1] > oy);

     // compass mini
     g3DrawCompass(ctx, 370, 40, 24);

     // Direction description box
     const dir = g3DirLabel(g3State.quad, g3State.angle);
     g3Box(ctx, 8, 222, 404, 28, 6, arcCol+'12', arcCol, 1.5);
     g3Lbl(ctx, '从正北方向顺时针旋转', 108, 236, '#555', 11, 'center');
     g3Lbl(ctx, g3State.angle+'°', 200, 236, arcCol, 15, 'center', 'bold');
     g3Lbl(ctx, `→ ${dir}方向`, 300, 236, col, 13, 'center', 'bold');
     g3Lbl(ctx, '拖动"角度"滑块，观察方向弧变化', W/2, 264, '#888', 10, 'center');
    }

    if (step === 2) {
     // Scale: show the ray with km tick marks
     g3DrawCompass(ctx, ox, oy, 32);

     g3DrawRay(ctx, ox, oy, P[0], P[1], col);

     // draw km tick marks along the ray
     const th = g3Theta(g3State.quad, g3State.angle) * Math.PI/180;
     const ux = Math.sin(th), uy = -Math.cos(th);  // unit vector toward P
     for (let k = 1; k <= g3State.dist; k++) {
      const tx2 = ox + k*G3_SC*ux;
      const ty2 = oy + k*G3_SC*uy;
      // tick perpendicular
      ctx.save();
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx2 - uy*6, ty2 - ux*6);
      ctx.lineTo(tx2 + uy*6, ty2 + ux*6);
      ctx.stroke();
      ctx.restore();
      g3Lbl(ctx, k+'km', tx2 + uy*18, ty2 + ux*18, col, 10, 'center', 'bold',
             'rgba(255,255,255,0.85)');
     }

     g3DrawPoint(ctx, ox, oy, 'O', '#333', true);
     g3DrawPoint(ctx, P[0], P[1], 'P', col, P[1] > oy);

     // scale bar bottom-right
     const sbx = 310, sby = 200, sbw = G3_SC*3;
     ctx.save();
     ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
     ctx.beginPath(); ctx.moveTo(sbx, sby); ctx.lineTo(sbx+sbw, sby); ctx.stroke();
     [0,1,2,3].forEach(i => {
      ctx.beginPath(); ctx.moveTo(sbx+i*G3_SC, sby-4); ctx.lineTo(sbx+i*G3_SC, sby+4); ctx.stroke();
     });
     ctx.restore();
     g3Lbl(ctx, '0', sbx, sby+12, '#555', 10, 'center');
     g3Lbl(ctx, '3km', sbx+sbw, sby+12, '#555', 10, 'center');
     g3Lbl(ctx, '比例尺', sbx+sbw/2, sby-14, '#555', 10, 'center');

     const dir = g3DirLabel(g3State.quad, g3State.angle);
     g3Box(ctx, 8, 222, 404, 28, 6, col+'12', col, 1.5);
     g3Lbl(ctx, `方向：${dir}`, 100, 236, col, 13, 'center', 'bold');
     g3Lbl(ctx, `距离：${g3State.dist} km（图上${(g3State.dist*G3_SC/37.8).toFixed(1)}cm）`, 290, 236, '#333', 11, 'center');
     g3Lbl(ctx, '拖动"距离"滑块，观察刻度变化', W/2, 264, '#888', 10, 'center');
    }

    if (step === 3) {
     // Challenge: fixed target T, user adjusts to match
     const T = g3PtFixed(G3_TARGET.quad, G3_TARGET.angle, G3_TARGET.dist);
     const Tdir = g3DirLabel(G3_TARGET.quad, G3_TARGET.angle);

     g3DrawCompass(ctx, ox, oy, 30);

     // Draw target T (star / hollow)
     ctx.save();
     ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 2.5;
     ctx.beginPath(); ctx.arc(T[0], T[1], 8, 0, Math.PI*2); ctx.stroke();
     ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1.5;
     [-1,1].forEach(d => {
      ctx.beginPath(); ctx.moveTo(T[0]-8*d,T[1]); ctx.lineTo(T[0]+8*d,T[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(T[0],T[1]-8); ctx.lineTo(T[0],T[1]+8); ctx.stroke();
     });
     g3Lbl(ctx, '目标T', T[0], T[1]-16, '#C0392B', 11, 'center', 'bold');
     ctx.restore();

     // user's current ray
     g3DrawAngleArc(ctx, ox, oy, g3State.quad, g3State.angle, 44, arcCol, 0.18);
     g3DrawRay(ctx, ox, oy, P[0], P[1], col);
     g3DrawPoint(ctx, ox, oy, 'O', '#333', true);
     g3DrawPoint(ctx, P[0], P[1], 'P', col, P[1] > oy);

     // check match
     const dx = P[0]-T[0], dy = P[1]-T[1];
     const dist2 = Math.sqrt(dx*dx+dy*dy);
     const matched = dist2 < 12;

     const dir = g3DirLabel(g3State.quad, g3State.angle);
     if (matched) {
      g3Box(ctx, 8, 222, 404, 28, 6, '#1A8030'+'22', '#1A8030', 2);
      g3Lbl(ctx, '✓ 正确！', 55, 236, '#1A8030', 14, 'center', 'bold');
      g3Lbl(ctx, `${Tdir}方向，距离 ${G3_TARGET.dist} km`, 240, 236, '#1A8030', 13, 'center', 'bold');
     } else {
      g3Box(ctx, 8, 222, 404, 28, 6, col+'10', col, 1.5);
      g3Lbl(ctx, '你的位置：', 58, 236, '#555', 11, 'center');
      g3Lbl(ctx, `${dir}，${g3State.dist}km`, 180, 236, col, 13, 'center', 'bold');
      g3Lbl(ctx, '→ 调整滑块让P与目标T重合', 330, 236, '#888', 10, 'center');
     }
     g3Lbl(ctx, '调整角度和距离，使P点与红色目标T重合', W/2, 264, '#888', 10, 'center');
    }
   }

   function getG3Canvas(sv) {
    const svg = sv.ownerSVGElement || sv;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('g3-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'g3-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);

     const overlay = document.createElement('div');
     overlay.id = 'g3-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'8px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });

     // Quad buttons
     const quadHtml = ['NE','NW','SE','SW'].map(q => {
      const lbl = {NE:'北偏东',NW:'北偏西',SE:'南偏东',SW:'南偏西'}[q];
      const active = q === g3State.quad;
      return `<button data-q="${q}" style="font-size:11px;padding:2px 8px;border-radius:10px;border:1px solid #3A7A50;background:${active?'#3A7A50':'#fff'};color:${active?'#fff':'#3A7A50'};cursor:pointer;transition:all .15s">${lbl}</button>`;
     }).join('');

     overlay.innerHTML = `
      <div id="g3-quads" style="display:flex;gap:4px">${quadHtml}</div>
      <label style="display:flex;align-items:center;gap:5px;color:#3A7A50;font-weight:600">
       角度<input id="g3-ang" type="range" min="5" max="85" step="5" value="${g3State.angle}" style="width:90px;accent-color:#E07820">
      </label>
      <label style="display:flex;align-items:center;gap:5px;color:#3A7A50;font-weight:600">
       距离<input id="g3-dist" type="range" min="1" max="7" step="1" value="${g3State.dist}" style="width:80px;accent-color:#3A7A50">
      </label>
      <button id="g3-reset" style="font-size:11px;padding:2px 10px;border:1px solid #aaa;border-radius:12px;background:#fff;color:#666;cursor:pointer">恢复默认</button>
      <span id="g3-info" style="font-size:11px;color:#1A6030;font-weight:600"></span>`;
     wrap.after(overlay);

     const onUpdate = () => {
      // refresh quad buttons
      overlay.querySelectorAll('[data-q]').forEach(btn => {
       const active = btn.dataset.q === g3State.quad;
       btn.style.background = active ? '#3A7A50' : '#fff';
       btn.style.color = active ? '#fff' : '#3A7A50';
      });
      g3UpdateInfo();
      if (g3State.animRaf) { cancelAnimationFrame(g3State.animRaf); g3State.animRaf = null; }
      g3DrawStep(canvas);
      const sf = document.getElementById('sform');
      try { if (sf && g3State.curStep >= 0) sf.textContent = ANIMS['g3'][g3State.curStep].formula; } catch(e) {}
     };

     overlay.querySelectorAll('[data-q]').forEach(btn => {
      btn.addEventListener('click', () => { g3State.quad = btn.dataset.q; onUpdate(); });
     });
     document.getElementById('g3-ang').addEventListener('input', function () { g3State.angle = +this.value; onUpdate(); });
     document.getElementById('g3-dist').addEventListener('input', function () { g3State.dist = +this.value; onUpdate(); });
     document.getElementById('g3-reset').addEventListener('click', () => {
      g3State.angle = 40; g3State.dist = 5; g3State.quad = 'NE';
      document.getElementById('g3-ang').value = 40;
      document.getElementById('g3-dist').value = 5;
      onUpdate();
     });

     g3UpdateInfo();
    }
    return { canvas };
   }

// @@SECTION:anims@@

     {
      hint: '用方向和距离来确定目标点P的位置：先说方向（如"北偏东40°"），再说距离（如"5千米"）。拖动滑块观察P点变化。',
      get formula() { return g3InfoText(); },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG3Canvas(s); g3State.curStep=0; g3DrawStep(canvas); g3UpdateInfo(); },
     },
     {
      hint: '角度：从正北方向顺时针旋转到目标方向所经过的角度。"北偏东40°"就是从正北顺时针转40°。拖动角度滑块观察弧线变化。',
      get formula() { const dir=g3DirLabel(g3State.quad,g3State.angle); return `从正北顺时针旋转 ${g3State.angle}° → ${dir}方向`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG3Canvas(s); g3State.curStep=1; g3DrawStep(canvas); g3UpdateInfo(); },
     },
     {
      hint: '比例尺：图上距离与实际距离的比。沿方向射线上的刻度表示实际千米数。拖动距离滑块改变距离。',
      get formula() { return `方向：${g3DirLabel(g3State.quad,g3State.angle)}　距离：${g3State.dist} km`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG3Canvas(s); g3State.curStep=2; g3DrawStep(canvas); g3UpdateInfo(); },
     },
     {
      hint: '综合练习：调整方向和距离，使P点与红色目标T重合。目标在"南偏东55°方向，距离4km"处。',
      get formula() {
       const P=g3PtFromState(), T=g3PtFixed(G3_TARGET.quad,G3_TARGET.angle,G3_TARGET.dist);
       const d=Math.sqrt((P[0]-T[0])**2+(P[1]-T[1])**2);
       return d<12 ? '✓ 正确！南偏东55°，距离4km' : `当前：${g3DirLabel(g3State.quad,g3State.angle)}，${g3State.dist}km（继续调整）`;
      },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG3Canvas(s); g3State.curStep=3; g3DrawStep(canvas); g3UpdateInfo(); },
     },

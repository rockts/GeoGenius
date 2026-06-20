// @@SECTION:helpers@@
   const g1State = { a: 4, b: 3, h: 3, cubeMode: false, curStep: -1, animRaf: null, animT0: 0, animDur: 200 };

   // ── colors ──────────────────────────────────────────────────────────────
   const G1_FRONT  = '#EDE8E0';  // front face
   const G1_TOP    = '#F5F2EC';  // top face (lighter)
   const G1_RIGHT  = '#D8D2C4';  // right face (darker = shadow)
   const G1_EDGE   = '#5A5248';  // default edge color
   const G1_CA     = '#E07B39';  // length-a color (orange)
   const G1_CB     = '#2E9E6B';  // width-b color (green)
   const G1_CH     = '#5C7CE0';  // height-h color (blue)
   const G1_FACE_PAIRS = [
    ['#F5D87A', '#F5E0A0'], // front/back: yellow
    ['#8FD4E8', '#B4E2F0'], // top/bottom: cyan
    ['#F0A0C8', '#F5C0D8'], // right/left: pink
   ];

   function g1Lbl(ctx, text, x, y, color, size, align, weight, bg) {
    ctx.save();
    ctx.font = `${weight||'normal'} ${size||13}px 'Noto Sans SC',sans-serif`;
    const tw = ctx.measureText(text).width;
    if (bg) {
     ctx.fillStyle = bg;
     ctx.fillRect(x - (align==='center'?tw/2:0) - 3, y - size/2 - 2, tw + 6, size + 4);
    }
    ctx.fillStyle = color || '#333';
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function g1Box(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad||6);
    else ctx.rect(x, y, w, h);
    if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   function g1D() {
    const { a, b, h, cubeMode } = g1State;
    const ea = cubeMode ? a : a;
    const eb = cubeMode ? a : b;
    const eh = cubeMode ? a : h;
    const aPx = Math.min(ea * 15, 140);
    const bPx = Math.min(eb * 11, 68);
    const hPx = Math.min(eh * 14, 108);
    const dx  = Math.round(bPx * 0.52);
    const dy  = -Math.round(bPx * 0.28);
    const x0  = 32;
    const y0  = Math.max(24, Math.round((260 - hPx - Math.abs(dy)) / 2));
    return { a: ea, b: eb, h: eh, aPx, bPx, hPx, dx, dy, x0, y0 };
   }

   /* 8 vertices of the cuboid */
   function g1Verts(D) {
    const { aPx, bPx, hPx, dx, dy, x0, y0 } = D;
    const FBL = [x0,       y0 + hPx       ];
    const FBR = [x0 + aPx, y0 + hPx       ];
    const FTL = [x0,       y0             ];
    const FTR = [x0 + aPx, y0             ];
    const BBL = [x0 + dx,  y0 + hPx + dy  ];
    const BBR = [x0+aPx+dx,y0 + hPx + dy  ];
    const BTL = [x0 + dx,  y0 + dy        ];
    const BTR = [x0+aPx+dx,y0 + dy        ];
    return { FBL, FBR, FTL, FTR, BBL, BBR, BTL, BTR };
   }

   /* Draw a polygon path */
   function g1Poly(ctx, pts, fill, stroke, lw, dash) {
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   /* Draw a line segment */
   function g1Line(ctx, p1, p2, color, lw, dash) {
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = color || G1_EDGE;
    ctx.lineWidth = lw || 1.5;
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    ctx.restore();
   }

   /* Draw cuboid base (visible faces + hidden dashed edges) */
   function g1DrawBase(ctx, D, V) {
    const { FBL, FBR, FTL, FTR, BBL, BBR, BTL, BTR } = V;
    // Back hidden edges (dashed)
    g1Line(ctx, BBL, BBR, G1_EDGE, 1, [4,3]);
    g1Line(ctx, BBL, BTL, G1_EDGE, 1, [4,3]);
    g1Line(ctx, FBL, BBL, G1_EDGE, 1, [4,3]);
    // Visible solid faces
    g1Poly(ctx, [FBL, FBR, FTR, FTL], G1_FRONT, G1_EDGE, 1.5);  // front
    g1Poly(ctx, [FTL, FTR, BTR, BTL], G1_TOP,   G1_EDGE, 1.5);  // top
    g1Poly(ctx, [FBR, FTR, BTR, BBR], G1_RIGHT, G1_EDGE, 1.5);  // right
    // Remaining visible edges
    g1Line(ctx, BBR, BTR, G1_EDGE, 1.5);
    g1Line(ctx, BTL, BTR, G1_EDGE, 1.5);
    g1Line(ctx, FBR, BBR, G1_EDGE, 1.5);
   }

   /* Highlight a face with color + alpha */
   function g1Face(ctx, pts, fill, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    g1Poly(ctx, pts, fill, null);
    ctx.restore();
   }

   function g1Frame(canvas, step, p) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const e = p * p * (3 - 2 * p);
    const D = g1D();
    const V = g1Verts(D);
    const { FBL, FBR, FTL, FTR, BBL, BBR, BTL, BTR } = V;
    const { a, b, h, aPx, hPx, dx } = D;
    const midX = FBL[0] + (BTR[0] - FBL[0]) / 2;   // visual center X
    const RX = midX + aPx / 2 + dx + 28;              // right info area X

    // ── Step 0: full cuboid with labels ─────────────────────────────────────
    if (step === 0) {
     g1DrawBase(ctx, D, V);
     // Vertex dots (8 顶点)
     ctx.save();
     ctx.fillStyle = '#C03000';
     [FBL, FBR, FTL, FTR, BBL, BBR, BTL, BTR].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
     });
     ctx.restore();
     // Label a (front bottom edge, below)
     const aMid = [(FBL[0]+FBR[0])/2, FBL[1] + 16];
     g1Lbl(ctx, 'a = '+a, aMid[0], aMid[1], G1_CA, 12, 'center', 'bold', 'rgba(255,255,255,0.8)');
     // Label b (right depth edge, outer)
     const bMid = [(FBR[0]+BBR[0])/2 + 18, (FBR[1]+BBR[1])/2 + 6];
     g1Lbl(ctx, 'b = '+b, bMid[0], bMid[1], G1_CB, 12, 'center', 'bold', 'rgba(255,255,255,0.8)');
     // Label h (right side, vertical)
     const hMid = [FBR[0] + 18, (FBR[1]+FTR[1])/2];
     g1Lbl(ctx, 'h = '+h, hMid[0], hMid[1], G1_CH, 12, 'center', 'bold', 'rgba(255,255,255,0.8)');
     // Info card on right
     const cw = 168, ch = 136;
     const cx = Math.max(RX, 245), cy = (H - ch) / 2;
     g1Box(ctx, cx, cy, cw, ch, 8, '#F8F6F0', '#8A7860', 1.5);
     g1Lbl(ctx, '长方体的特征', cx+cw/2, cy+18, '#4A3820', 13, 'center', 'bold');
     [
      ['12', '条棱', '#E07B39'],
      ['6',  '个面', '#2E9E6B'],
      ['8',  '个顶点','#5C7CE0'],
     ].forEach(([n, label, c], i) => {
      g1Lbl(ctx, n,     cx+28, cy+46+i*24, c,      20, 'center', 'bold');
      g1Lbl(ctx, label, cx+60, cy+46+i*24, '#333', 13, 'left');
     });
     g1Lbl(ctx, '相对的面完全相同', cx+cw/2, cy+120, '#888', 11, 'center');
    }

    // ── Step 1: highlight 3 pairs of opposite faces ──────────────────────────
    if (step === 1) {
     g1DrawBase(ctx, D, V);
     // 3 pairs, fade-cycle each across thirds of p
     const pairs = [
      [[FBL, FBR, FTR, FTL], [BBL, BBR, BTR, BTL]],  // front/back
      [[FTL, FTR, BTR, BTL], [FBL, FBR, BBR, BBL]],  // top/bottom
      [[FBR, FTR, BTR, BBR], [FBL, FTL, BTL, BBL]],  // right/left
     ];
     pairs.forEach((pair, i) => {
      // Each pair fades in at i*0.33 and stays
      const alpha = Math.min(1, Math.max(0, (e - i * 0.25) / 0.25));
      pair.forEach((face, fi) => {
       // Some faces are hidden → draw at lower alpha with dashed border
       const isHidden = fi === 1; // the "back" face of each pair
       ctx.save();
       ctx.globalAlpha = alpha * (isHidden ? 0.35 : 0.55);
       g1Poly(ctx, face, G1_FACE_PAIRS[i][fi], null);
       ctx.restore();
      });
     });
     // Redraw edges on top for clarity (no face fill — preserves color highlights)
     g1Line(ctx, BBL, BBR, G1_EDGE, 1, [4,3]);
     g1Line(ctx, BBL, BTL, G1_EDGE, 1, [4,3]);
     g1Line(ctx, FBL, BBL, G1_EDGE, 1, [4,3]);
     g1Poly(ctx, [FBL, FBR, FTR, FTL], null, G1_EDGE, 1.5);
     g1Poly(ctx, [FTL, FTR, BTR, BTL], null, G1_EDGE, 1.5);
     g1Poly(ctx, [FBR, FTR, BTR, BBR], null, G1_EDGE, 1.5);
     g1Line(ctx, BBR, BTR, G1_EDGE, 1.5);
     g1Line(ctx, BTL, BTR, G1_EDGE, 1.5);
     g1Line(ctx, FBR, BBR, G1_EDGE, 1.5);
     // Right info
     const cw = 168, ch = 116;
     const cx = Math.max(RX, 245), cy = (H - ch) / 2;
     g1Box(ctx, cx, cy, cw, ch, 8, '#FFF8F0', '#C07030', 1.5);
     g1Lbl(ctx, '相对的面完全相同', cx+cw/2, cy+18, '#6A3A00', 13, 'center', 'bold');
     g1Lbl(ctx, '一共 3 组相对面', cx+cw/2, cy+42, '#6A3A00', 13, 'center', 'bold');
     g1Lbl(ctx, '黄=前后  青=上下  粉=左右', cx+cw/2, cy+68, '#888', 11, 'center');
     g1Lbl(ctx, '两两配对，大小形状完全一样', cx+cw/2, cy+92, '#aaa', 10, 'center');
     g1Lbl(ctx, '6个面分3组相对面，每组面积相等', W/2+40, 264, '#555', 12, 'center');
    }

    // ── Step 2: color-coded edges by direction ───────────────────────────────
    if (step === 2) {
     g1DrawBase(ctx, D, V);
     const LW = 3.5;
     // 4 length-a edges (orange)
     [[FBL,FBR],[FTL,FTR],[BBL,BBR],[BTL,BTR]].forEach(([p1,p2]) =>
      g1Line(ctx, p1, p2, G1_CA, LW));
     // 4 depth-b edges (green) — hidden ones dashed
     [[FBR,BBR],[FTR,BTR]].forEach(([p1,p2]) => g1Line(ctx, p1, p2, G1_CB, LW));
     [[FBL,BBL],[FTL,BTL]].forEach(([p1,p2]) => g1Line(ctx, p1, p2, G1_CB, LW, [5,3]));
     // 4 height-h edges (blue)
     [[FBL,FTL],[FBR,FTR],[BBR,BTR]].forEach(([p1,p2]) => g1Line(ctx, p1, p2, G1_CH, LW));
     [[BBL,BTL]].forEach(([p1,p2]) => g1Line(ctx, p1, p2, G1_CH, LW, [5,3]));
     // Right legend
     const cw = 172, ch = 128;
     const cx = Math.max(RX, 242), cy = (H - ch) / 2;
     g1Box(ctx, cx, cy, cw, ch, 8, '#FAFAF8', '#888', 1.5);
     g1Lbl(ctx, '棱分3组，相对棱相等', cx+cw/2, cy+16, '#333', 12, 'center', 'bold');
     [
      [G1_CA, '×4  长 a = '+a,   '长方向'],
      [G1_CB, '×4  宽 b = '+b,   '宽方向'],
      [G1_CH, '×4  高 h = '+h,   '高方向'],
     ].forEach(([c, label, sub], i) => {
      const ey = cy + 42 + i * 26;
      g1Box(ctx, cx+10, ey-7, 14, 14, 3, c, null);
      g1Lbl(ctx, label, cx+30, ey, '#333', 12, 'left');
      g1Lbl(ctx, sub,   cx+cw-12, ey, '#aaa', 10, 'right');
     });
     g1Lbl(ctx, '共 12 条棱，每组 4 条', cx+cw/2, cy+114, '#888', 11, 'center');
     g1Lbl(ctx, '12条棱按方向分3组，同组棱长度相等', W/2+40, 264, '#555', 12, 'center');
    }

    // ── Step 3: cube as special case ─────────────────────────────────────────
    if (step === 3) {
     // Always draw as cube for this step (override D)
     const s3 = g1State.cubeMode ? a : 4;
     const cD = { a: s3, b: s3, h: s3,
      aPx: Math.min(s3*15,140), bPx: Math.min(s3*11,68), hPx: Math.min(s3*14,108),
      dx: Math.round(Math.min(s3*11,68)*0.52), dy: -Math.round(Math.min(s3*11,68)*0.28),
      x0: D.x0, y0: D.y0 };
     const cV = g1Verts(cD);
     g1DrawBase(ctx, cD, cV);
     // Color all 12 edges the same (gold)
     const LW = 2.5;
     const { FBL:cFBL, FBR:cFBR, FTL:cFTL, FTR:cFTR, BBL:cBBL, BBR:cBBR, BTL:cBTL, BTR:cBTR } = cV;
     const GOLD = '#C08000';
     [[cFBL,cFBR],[cFTL,cFTR],[cBBL,cBBR],[cBTL,cBTR]].forEach(([p1,p2]) => g1Line(ctx,p1,p2,GOLD,LW));
     [[cFBR,cBBR],[cFTR,cBTR]].forEach(([p1,p2]) => g1Line(ctx,p1,p2,GOLD,LW));
     [[cFBL,cBBL],[cFTL,cBTL]].forEach(([p1,p2]) => g1Line(ctx,p1,p2,GOLD,LW,[5,3]));
     [[cFBL,cFTL],[cFBR,cFTR],[cBBR,cBTR]].forEach(([p1,p2]) => g1Line(ctx,p1,p2,GOLD,LW));
     [[cBBL,cBTL]].forEach(([p1,p2]) => g1Line(ctx,p1,p2,GOLD,LW,[5,3]));
     // Label
     const mid = cD.x0 + cD.aPx/2;
     g1Lbl(ctx, 'a = b = h = '+s3, mid, cD.y0 + cD.hPx + 22, GOLD, 13, 'center', 'bold', 'rgba(255,255,255,0.9)');
     // Right info
     const cx = Math.max(cD.x0 + cD.aPx + cD.dx + 28, 240);
     const cw = 172, cy = 40, ch = 128;
     g1Box(ctx, cx, cy, cw, ch, 8, '#FFFBF0', '#C08000', 2);
     g1Lbl(ctx, '正方体', cx+cw/2, cy+20, '#8A6000', 16, 'center', 'bold');
     g1Lbl(ctx, '是长方体的特例', cx+cw/2, cy+40, '#8A6000', 12, 'center');
     g1Lbl(ctx, '长 = 宽 = 高 = a', cx+cw/2, cy+64, '#333', 13, 'center', 'bold');
     g1Lbl(ctx, '12条棱全部相等', cx+cw/2, cy+84, '#333', 12, 'center');
     g1Lbl(ctx, '6个面全是正方形', cx+cw/2, cy+104, '#333', 12, 'center');
     g1Lbl(ctx, `每面面积 a² = ${s3*s3}`, cx+cw/2, cy+ch-10, '#C08000', 12, 'center', 'bold');
     g1Lbl(ctx, '正方体：所有棱相等，所有面是正方形', W/2+40, 264, '#555', 12, 'center');
    }
   }

   function g1DrawStep(canvas) { g1Frame(canvas, g1State.curStep, 1); }
   function g1AnimFrame(canvas, p) { g1Frame(canvas, g1State.curStep, p); }

   function g1StartAnim(canvas, forceRestart, dur) {
    if (!forceRestart && (g1State.animRaf || g1State.animT0 === 0)) return;
    if (g1State.animRaf) { cancelAnimationFrame(g1State.animRaf); g1State.animRaf = null; }
    const SM = (typeof slowMode !== 'undefined' && slowMode) ? 1.9 : 1;
    const D = (dur || g1State.animDur) * SM;
    g1State.animT0 = performance.now();
    const t0 = g1State.animT0;
    let pausedMs = 0, pausedAt = 0;
    (function tick(now) {
     const isPaused = typeof animState !== 'undefined' && animState.paused;
     if (isPaused) { if (!pausedAt) pausedAt = now; g1State.animRaf = requestAnimationFrame(tick); return; }
     if (pausedAt) { pausedMs += now - pausedAt; pausedAt = 0; }
     const p = Math.min(1, (now - t0 - pausedMs) / D);
     g1AnimFrame(canvas, p);
     if (p < 1) { g1State.animRaf = requestAnimationFrame(tick); }
     else { g1State.animRaf = null; g1State.animT0 = 0; g1DrawStep(canvas); }
    })(t0);
   }

   function removeG1Canvas() {
    if (g1State.animRaf) { cancelAnimationFrame(g1State.animRaf); g1State.animRaf = null; }
    g1State.curStep = -1; g1State.animT0 = 0;
    const c = document.getElementById('g1-canvas');
    if (c) { const sv = c.parentElement?.querySelector('svg'); if (sv) sv.style.display = ''; c.remove(); }
    const o = document.getElementById('g1-overlay');
    if (o) o.remove();
   }

   function g1SyncSliders(canvas) {
    const D = g1D();
    const rv = document.getElementById('g1-a-val');
    if (rv) rv.textContent = D.a;
    const bEl = document.getElementById('g1-b'), bVEl = document.getElementById('g1-b-val');
    const hEl = document.getElementById('g1-h'), hVEl = document.getElementById('g1-h-val');
    if (g1State.cubeMode) {
     if (bEl) { bEl.value = D.a; bEl.disabled = true; bEl.style.opacity='0.4'; }
     if (bVEl) bVEl.textContent = D.a;
     if (hEl) { hEl.value = D.a; hEl.disabled = true; hEl.style.opacity='0.4'; }
     if (hVEl) hVEl.textContent = D.a;
    } else {
     if (bEl) { bEl.disabled = false; bEl.style.opacity='1'; }
     if (hEl) { hEl.disabled = false; hEl.style.opacity='1'; }
    }
    if (g1State.animRaf) { cancelAnimationFrame(g1State.animRaf); g1State.animRaf = null; }
    g1DrawStep(canvas);
    const sf = document.getElementById('sform');
    try { if (sf) sf.textContent = ANIMS[ct.id][cs].formula; } catch(e) {}
   }

   function getG1Canvas(sv) {
    const svg = sv.ownerSVGElement || sv;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('g1-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'g1-canvas'; canvas.width = 420; canvas.height = 280;
     Object.assign(canvas.style, { display:'block', maxWidth:'100%', height:'auto', borderRadius:'6px' });
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'g1-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'14px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:5px;color:${G1_CA};font-weight:600">
       长 <i>a</i>=<span id="g1-a-val">${g1State.a}</span>
       <input id="g1-a" type="range" min="2" max="8" step="1" value="${g1State.a}" style="width:72px;accent-color:${G1_CA}">
      </label>
      <label style="display:flex;align-items:center;gap:5px;color:${G1_CB};font-weight:600">
       宽 <i>b</i>=<span id="g1-b-val">${g1State.b}</span>
       <input id="g1-b" type="range" min="2" max="6" step="1" value="${g1State.b}" style="width:72px;accent-color:${G1_CB}">
      </label>
      <label style="display:flex;align-items:center;gap:5px;color:${G1_CH};font-weight:600">
       高 <i>h</i>=<span id="g1-h-val">${g1State.h}</span>
       <input id="g1-h" type="range" min="2" max="6" step="1" value="${g1State.h}" style="width:72px;accent-color:${G1_CH}">
      </label>
      <label style="display:flex;align-items:center;gap:4px;color:#8A6000;font-weight:600;font-size:12px">
       <input id="g1-cube" type="checkbox" ${g1State.cubeMode?'checked':''} style="accent-color:#C08000">
       正方体模式
      </label>`;
     wrap.after(overlay);
     const ref = canvas;
     document.getElementById('g1-a').addEventListener('input', function() {
      g1State.a = +this.value;
      if (g1State.cubeMode) { g1State.b = g1State.a; g1State.h = g1State.a; }
      g1SyncSliders(ref);
     });
     document.getElementById('g1-b').addEventListener('input', function() {
      g1State.b = +this.value;
      document.getElementById('g1-b-val').textContent = this.value;
      g1SyncSliders(ref);
     });
     document.getElementById('g1-h').addEventListener('input', function() {
      g1State.h = +this.value;
      document.getElementById('g1-h-val').textContent = this.value;
      g1SyncSliders(ref);
     });
     document.getElementById('g1-cube').addEventListener('change', function() {
      g1State.cubeMode = this.checked;
      if (g1State.cubeMode) { g1State.b = g1State.a; g1State.h = g1State.a; }
      g1SyncSliders(ref);
     });
    }
    return { canvas };
   }

// @@SECTION:anims@@

     {
      hint: '这是一个长方体：长a、宽b、高h。它有12条棱、6个面、8个顶点。拖动滑块改变大小。',
      formula: '长方体：12棱·6面·8顶点',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG1Canvas(s); g1State.curStep=0; g1DrawStep(canvas); },
     },
     {
      hint: '长方体有3组相对面，每组的两个面大小相同、形状一样（全等）。前面=后面，上面=下面，左面=右面。',
      formula: '6个面 = 3组相对面，每组面积相等',
      dur: 2400, noAutoFit: true,
      draw(s, p) { const {canvas}=getG1Canvas(s); g1State.curStep=1; g1StartAnim(canvas, p===0, 2400); },
     },
     {
      hint: '12条棱按方向分3组：4条长（a）、4条宽（b）、4条高（h）。同一组的4条棱长度相等。',
      formula: '12棱 = 长×4 + 宽×4 + 高×4',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG1Canvas(s); g1State.curStep=2; g1DrawStep(canvas); },
     },
     {
      hint: '正方体是长方体的特例：长=宽=高=a，12条棱全相等，6个面全是正方形。勾选"正方体模式"验证。',
      get formula() { const s=g1State.cubeMode?g1State.a:4; return `正方体：a=b=h=${s}，棱长${s}，面积${s*s}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG1Canvas(s); g1State.curStep=3; g1DrawStep(canvas); },
     },

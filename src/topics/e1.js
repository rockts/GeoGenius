// ================================================================
// GeoGenius Topic: e1 — 平行四边形面积 (Parallelogram Area)
// Canvas interactive derivation with sliders + translation animation
//
// Build system splits this file into two injection sections:
//   @@SECTION:helpers@@  → injected before `const ANIMS = {`
//   @@SECTION:anims@@    → injected as the body of ANIMS.e1 array
//
// Edit this file, then run `./build.sh` to update dist/index.html
// ================================================================

// @@SECTION:helpers@@

   /* ── e1 Canvas 交互推导器状态 ── */
   const e1State = {
    a: 8, h: 5,
    curStep: -1,
    transProgress: 0,
    transDone: false,
    transRaf: null,
   };

   function getE1Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('e1-canvas');
    let overlay = document.getElementById('e1-overlay');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'e1-canvas';
     canvas.width = 420;
     canvas.height = 220;
     Object.assign(canvas.style, {
      display: 'block',
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '6px',
     });
     wrap.appendChild(canvas);
     overlay = document.createElement('div');
     overlay.id = 'e1-overlay';
     Object.assign(overlay.style, {
      display: 'flex', gap: '14px', alignItems: 'center',
      justifyContent: 'center', flexWrap: 'wrap',
      padding: '6px 0 2px',
      fontSize: '13px', fontFamily: "'Noto Sans SC',sans-serif",
      whiteSpace: 'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#3A2A90;font-weight:600">
       底边 <i>a</i>&thinsp;=&thinsp;<span id="e1-a-val">${e1State.a}</span>
       <input id="e1-a" type="range" min="3" max="12" step="1" value="${e1State.a}"
        style="width:80px;accent-color:#5A4AC0">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="e1-h-val">${e1State.h}</span>
       <input id="e1-h" type="range" min="2" max="8" step="1" value="${e1State.h}"
        style="width:80px;accent-color:#C03030">
      </label>
      <button id="e1-play-btn" style="display:none;padding:4px 14px;border:1.5px solid #1A5FA8;
       border-radius:16px;background:#E8F1FB;color:#1A5FA8;font-size:12px;font-weight:700;
       cursor:pointer;font-family:inherit">
       ▶ 播放平移
      </button>`;
     wrap.parentNode.insertBefore(overlay, wrap.nextSibling);
     overlay.querySelector('#e1-a').addEventListener('input', function() {
      e1State.a = +this.value;
      overlay.querySelector('#e1-a-val').textContent = e1State.a;
      if (e1State.curStep === 2) {
       e1State.transProgress = 0; e1State.transDone = false;
       const btn = overlay.querySelector('#e1-play-btn');
       btn.textContent = '▶ 播放平移'; btn.disabled = false;
      }
      e1DrawStep(canvas);
     });
     overlay.querySelector('#e1-h').addEventListener('input', function() {
      e1State.h = +this.value;
      overlay.querySelector('#e1-h-val').textContent = e1State.h;
      if (e1State.curStep === 2) {
       e1State.transProgress = 0; e1State.transDone = false;
       const btn = overlay.querySelector('#e1-play-btn');
       btn.textContent = '▶ 播放平移'; btn.disabled = false;
      }
      e1DrawStep(canvas);
     });
     overlay.querySelector('#e1-play-btn').addEventListener('click', function() {
      if (e1State.transDone) {
       e1State.transProgress = 0; e1State.transDone = false;
      }
      if (e1State.transRaf) return;
      const start = performance.now(), dur = 1200, btn = this;
      btn.disabled = true;
      function tick(now) {
       const p = Math.min(1, (now - start) / dur);
       const te = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2,2)/2;
       e1State.transProgress = te;
       e1DrawStep(canvas);
       if (p < 1) {
        e1State.transRaf = requestAnimationFrame(tick);
       } else {
        e1State.transRaf = null; e1State.transDone = true;
        btn.disabled = false; btn.textContent = '↺ 重播平移';
        e1DrawStep(canvas);
       }
      }
      e1State.transRaf = requestAnimationFrame(tick);
     });
    }
    return { canvas, overlay };
   }

   function removeE1Canvas() {
    if (e1State.transRaf) { cancelAnimationFrame(e1State.transRaf); e1State.transRaf = null; }
    document.getElementById('e1-canvas')?.remove();
    document.getElementById('e1-overlay')?.remove();
    const svg = document.getElementById('asvg');
    if (svg) svg.style.display = '';
    e1State.curStep = -1;
    e1State.transProgress = 0;
    e1State.transDone = false;
   }

   function e1DrawStep(canvas) {
    const ctx = canvas.getContext('2d');
    const W = 420, H = 220;
    ctx.clearRect(0, 0, W, H);

    const a = e1State.a, h = e1State.h;
    const sc = 13;          // px per unit
    const offset = 30;      // fixed visual slant (px): top edge shifted right by this
    const baseY = 172;
    const aW = a * sc;      // base width in px
    const hH = h * sc;      // height in px

    // Center the parallelogram horizontally
    const ax = Math.round(210 - aW / 2 - offset / 2);

    // Vertices: A=bottom-left, B=bottom-right, D=top-left (shifted), C=top-right
    const Ax = ax,           Ay = baseY;
    const Bx = ax + aW,      By = baseY;
    const Dx = ax + offset,  Dy = baseY - hH;   // top-left (x = ax+offset)
    const Cx = Bx + offset,  Cy = baseY - hH;   // top-right
    // Height foot F (directly below D on bottom edge AB)
    const Fx = Dx, Fy = baseY;

    function fillPoly(pts, fill, stroke, lw) {
     ctx.beginPath();
     ctx.moveTo(pts[0][0], pts[0][1]);
     for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
     ctx.closePath();
     ctx.fillStyle = fill; ctx.fill();
     if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
    }
    function label(text, x, y, color, size, align) {
     ctx.save();
     ctx.fillStyle = color || '#333';
     ctx.font = `600 ${size || 13}px 'Noto Sans SC',sans-serif`;
     ctx.textAlign = align || 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(text, x, y); ctx.restore();
    }
    function dashedLine(x1, y1, x2, y2, color, lw) {
     ctx.save();
     ctx.strokeStyle = color; ctx.lineWidth = lw || 1.8;
     ctx.setLineDash([5, 3]);
     ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
     ctx.setLineDash([]); ctx.restore();
    }
    function solidLine(x1, y1, x2, y2, color, lw) {
     ctx.save();
     ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
     ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
     ctx.restore();
    }
    function rightAngleMark(x, y, sz, col) {
     ctx.save();
     ctx.strokeStyle = col || '#C03030'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
     ctx.beginPath();
     // bracket at (x, y): foot of height going upward, bracket opens right
     ctx.moveTo(x, y - sz); ctx.lineTo(x + sz, y - sz); ctx.lineTo(x + sz, y);
     ctx.stroke(); ctx.restore();
    }

    const step = e1State.curStep;

    /* ── Step 0: 展示平行四边形 ── */
    if (step === 0) {
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#EEECFE', '#5A4AC0', 2);
     dashedLine(Dx, Dy, Fx, Fy, '#C03030', 1.8);
     rightAngleMark(Fx, Fy, 9, '#C03030');
     label('高 h = ' + h, Fx - 6, (Dy + Fy) / 2, '#C03030', 12, 'right');
     solidLine(Ax, Ay + 14, Bx, By + 14, '#3A2A90', 1.5);
     label('底 a = ' + a, (Ax + Bx) / 2, Ay + 26, '#3A2A90', 12);
     label('A', Ax - 10, Ay + 10, '#5A4AC0', 11);
     label('B', Bx + 10, By + 10, '#5A4AC0', 11);
     label('C', Cx + 10, Cy - 10, '#5A4AC0', 11);
     label('D', Dx - 10, Dy - 10, '#5A4AC0', 11);

    /* ── Step 1: 沿高剪切，高亮左侧三角形 ── */
    } else if (step === 1) {
     fillPoly([[Ax,Ay],[Bx,By],[Cx,Cy],[Dx,Dy]], '#EEECFE', '#5A4AC0', 2);
     solidLine(Dx, Dy, Fx, Fy, '#C03030', 2.5);
     rightAngleMark(Fx, Fy, 9, '#C03030');
     label('高 h', Fx - 6, (Dy + Fy) / 2, '#C03030', 12, 'right');
     ctx.save(); ctx.globalAlpha = 0.75;
     fillPoly([[Ax,Ay],[Fx,Fy],[Dx,Dy]], '#FECACA', '#C03030', 2);
     ctx.restore();
     label('剪！', (Ax + Fx * 2 + Dx) / 4, (Ay + Fy + Dy) / 3 + 8, '#C03030', 14);
     label('底 a = ' + a, (Ax + Bx) / 2, Ay + 24, '#3A2A90', 12);

    /* ── Step 2: 平移动画 ── */
    } else if (step === 2) {
     const p = e1State.transProgress;
     const dx = p * aW;   // triangle translates rightward by aW total

     if (p >= 1) {
      // Completed: rectangle D→C→(Cx,Fy)→F
      fillPoly([[Dx,Dy],[Cx,Cy],[Cx,Fy],[Fx,Fy]], '#E8F1FB', '#1A5FA8', 2.5);
      label('拼成长方形！', (Fx + Cx) / 2, (Fy + Dy) / 2, '#0D3F6E', 13);
     } else {
      // Remaining trapezoid: F, B, C, D
      fillPoly([[Fx,Fy],[Bx,By],[Cx,Cy],[Dx,Dy]], '#E2E0F6', '#5A4AC0', 1.5);
      // Moving left triangle: A→F→D translated by dx
      ctx.save(); ctx.globalAlpha = 0.85;
      fillPoly([[Ax+dx,Ay],[Fx+dx,Fy],[Dx+dx,Dy]], '#FECACA', '#C03030', 2);
      ctx.restore();
     }
     label('底 a = ' + a, (Fx + Cx) / 2, Fy + 24, '#3A2A90', 12);

    /* ── Step 3: 公式 S = ah ── */
    } else if (step === 3) {
     fillPoly([[Dx,Dy],[Cx,Cy],[Cx,Fy],[Fx,Fy]], '#E8F1FB', '#1A5FA8', 2.5);
     // base annotation
     solidLine(Fx, Fy + 14, Cx, Fy + 14, '#1A5FA8', 1.5);
     label('底 a = ' + a, (Fx + Cx) / 2, Fy + 26, '#0D3F6E', 12);
     // height annotation (left of rectangle)
     dashedLine(Dx - 16, Dy, Dx - 16, Fy, '#C03030', 1.5);
     solidLine(Dx - 20, Dy, Dx - 12, Dy, '#C03030', 1.5);
     solidLine(Dx - 20, Fy, Dx - 12, Fy, '#C03030', 1.5);
     label('高 h = ' + h, Dx - 22, (Dy + Fy) / 2, '#C03030', 12, 'right');
     // formula box (right of rectangle)
     const bx0 = Cx + 14, by0 = (Dy + Fy) / 2 - 34;
     const bw = 100, bh = 68, br = 8;
     ctx.save();
     ctx.fillStyle = '#E8F1FB'; ctx.strokeStyle = '#1A5FA8'; ctx.lineWidth = 1.5;
     ctx.beginPath();
     ctx.moveTo(bx0+br,by0); ctx.lineTo(bx0+bw-br,by0); ctx.arcTo(bx0+bw,by0,bx0+bw,by0+br,br);
     ctx.lineTo(bx0+bw,by0+bh-br); ctx.arcTo(bx0+bw,by0+bh,bx0+bw-br,by0+bh,br);
     ctx.lineTo(bx0+br,by0+bh); ctx.arcTo(bx0,by0+bh,bx0,by0+bh-br,br);
     ctx.lineTo(bx0,by0+br); ctx.arcTo(bx0,by0,bx0+br,by0,br);
     ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
     label('S = a × h', bx0 + bw/2, by0 + 18, '#0D3F6E', 13);
     label('= ' + a + ' × ' + h, bx0 + bw/2, by0 + 38, '#5A4AC0', 13);
     label('= ' + (a * h), bx0 + bw/2, by0 + 56, '#0A7050', 15);
    }
   }

// @@SECTION:anims@@

     {
      hint: '平行四边形 ABCD：底边 AB = a，高 h 是两平行边之间的垂直距离。拖动滑块改变 a 和 h，图形实时联动。',
      formula: '平行四边形：底边 a，高 h',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE1Canvas(s);
       if (e1State.curStep !== 0) {
        e1State.curStep = 0;
        overlay.querySelector('#e1-play-btn').style.display = 'none';
        e1DrawStep(canvas);
       }
      },
     },
     {
      hint: '从顶点 D 向底边 AB 作垂线（高 h），垂足为 F，切下左侧直角三角形 ADF。',
      formula: '作高 h（⊥底边）→ 切下左侧三角形',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE1Canvas(s);
       if (e1State.curStep !== 1) {
        e1State.curStep = 1;
        overlay.querySelector('#e1-play-btn').style.display = 'none';
        e1DrawStep(canvas);
       }
      },
     },
     {
      hint: '把左侧三角形向右平移，补到右侧，拼成与原图等面积的长方形。底 a 和高 h 都没变！',
      formula: '三角形平移到右侧 → 拼成长方形',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE1Canvas(s);
       if (e1State.curStep !== 2) {
        e1State.curStep = 2;
        e1State.transProgress = 0; e1State.transDone = false;
        const btn = overlay.querySelector('#e1-play-btn');
        btn.style.display = ''; btn.disabled = false; btn.textContent = '▶ 播放平移';
        e1DrawStep(canvas);
       }
      },
     },
     {
      hint: '长方形面积 = 底 × 高 = a × h，与原平行四边形底高完全相同，所以 S = ah。',
      formula: 'S = ah',
      dur: 100,
      noAutoFit: true,
      draw(s, t) {
       const { canvas, overlay } = getE1Canvas(s);
       if (e1State.curStep !== 3) {
        e1State.curStep = 3;
        e1State.transProgress = 1;
        overlay.querySelector('#e1-play-btn').style.display = 'none';
        e1DrawStep(canvas);
       }
      },
     },

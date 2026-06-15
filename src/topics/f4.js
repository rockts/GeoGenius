// ================================================================
// GeoGenius Topic: f4 — 圆柱的体积 (Cylinder Volume)
// @@SECTION:helpers@@  → before ANIMS
// @@SECTION:anims@@    → body of ANIMS.f4
// 推导方式：竖切成扇形柱 → 交错排开 → 近似3D长方体 → V=πr²h
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

   function f4RoundRect(ctx, x, y, w, h, radius, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke();
    ctx.restore();
   }

   function f4Cylinder(ctx, cx, cy, rx, hPx, colTop, colSide, colStroke, lw) {
    colTop    = colTop    || '#E4F6EE';
    colSide   = colSide   || '#C8E6D4';
    colStroke = colStroke || '#0A7050';
    lw = lw || 2;
    const ry = Math.max(6, Math.round(rx * 0.28));
    ctx.save();
    ctx.strokeStyle = colStroke; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.ellipse(cx, cy+hPx, rx, ry, 0, 0, Math.PI, false); ctx.stroke();
    ctx.fillStyle = colSide;
    ctx.beginPath();
    ctx.moveTo(cx-rx, cy); ctx.lineTo(cx-rx, cy+hPx);
    ctx.ellipse(cx, cy+hPx, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx+rx, cy);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, true);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx-rx, cy); ctx.lineTo(cx-rx, cy+hPx); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+rx, cy); ctx.lineTo(cx+rx, cy+hPx); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2*Math.PI);
    ctx.fillStyle = colTop; ctx.fill(); ctx.strokeStyle = colStroke; ctx.stroke();
    ctx.restore();
   }

   /* Draw a single sector (used during animation) */
   function f4Sector(ctx, cx, cy, r, alpha, midAngle, fill, stroke) {
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(midAngle);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,r,-alpha,alpha); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=stroke; ctx.lineWidth=0.8; ctx.stroke();
    ctx.restore();
   }

   /* Draw top-view pie circle with n sectors (orange/blue) */
   function f4Pie(ctx, cx, cy, rs, n) {
    const pi = Math.PI;
    const alpha = pi/n;
    const col = [{fill:'#FDDCB5',stroke:'#C06020'},{fill:'#D4E4FF',stroke:'#3050C0'}];
    for (let i=0; i<n; i++) {
     const mid = (i/n + 0.5/n)*2*pi - pi/2;
     const c = col[i%2];
     ctx.save(); ctx.translate(cx,cy); ctx.rotate(mid);
     ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,rs,-alpha,alpha); ctx.closePath();
     ctx.fillStyle=c.fill; ctx.fill(); ctx.strokeStyle=c.stroke; ctx.lineWidth=0.7; ctx.stroke();
     ctx.restore();
    }
   }

   /* Draw 3D block: top face (h-dimension) + right face + front face (sector band) */
   function f4Block(ctx, n, bandY, rArr, depX, depY) {
    const pi = Math.PI;
    const totalW = 2*pi*rArr;
    const startX = (420-totalW)/2;
    const top = bandY-rArr, bot = bandY+rArr;
    const col = [{fill:'#FDDCB5',stroke:'#C06020'},{fill:'#D4E4FF',stroke:'#3050C0'}];
    const alpha = pi/n;
    const arcW = totalW/n;

    // Top face (represents h dimension) – draw before front face
    ctx.save();
    ctx.fillStyle = 'rgba(180,220,180,0.30)';
    ctx.strokeStyle = '#336633'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, top);
    ctx.lineTo(startX+totalW, top);
    ctx.lineTo(startX+totalW+depX, top+depY);
    ctx.lineTo(startX+depX, top+depY);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Right face (shows depth=h)
    ctx.save();
    ctx.fillStyle = 'rgba(100,150,220,0.22)';
    ctx.strokeStyle = '#334499'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX+totalW, top);
    ctx.lineTo(startX+totalW+depX, top+depY);
    ctx.lineTo(startX+totalW+depX, bot+depY);
    ctx.lineTo(startX+totalW, bot);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Front face: sector band
    for (let i=0; i<n; i++) {
     const openDown = (i%2===0);
     const cx_ = startX+(i+0.5)*arcW;
     const cy_ = openDown ? top : bot;
     const mid = openDown ? pi/2 : -pi/2;
     const c = col[i%2];
     ctx.save();
     ctx.translate(cx_, cy_); ctx.rotate(mid);
     ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,rArr,-alpha,alpha); ctx.closePath();
     ctx.fillStyle=c.fill; ctx.fill(); ctx.strokeStyle=c.stroke; ctx.lineWidth=0.8; ctx.stroke();
     ctx.restore();
    }
    // Front face border
    ctx.save(); ctx.strokeStyle='#444'; ctx.lineWidth=1.5;
    ctx.strokeRect(startX, top, totalW, 2*rArr); ctx.restore();

    return { startX, totalW, top, bot };
   }

   function getF4Canvas(s) {
    const svg = s.ownerSVGElement || s;
    const wrap = svg.closest('.canvas-wrap') || svg.parentElement;
    let canvas = document.getElementById('f4-canvas');
    if (!canvas) {
     svg.style.display = 'none';
     canvas = document.createElement('canvas');
     canvas.id = 'f4-canvas';
     canvas.width = 420; canvas.height = 260;
     Object.assign(canvas.style, {display:'block',maxWidth:'100%',height:'auto',borderRadius:'6px'});
     wrap.appendChild(canvas);
     const overlay = document.createElement('div');
     overlay.id = 'f4-overlay';
     Object.assign(overlay.style, {
      display:'flex', gap:'20px', alignItems:'center', justifyContent:'center',
      flexWrap:'wrap', padding:'6px 0 2px',
      fontSize:'13px', fontFamily:"'Noto Sans SC',sans-serif", whiteSpace:'nowrap',
     });
     overlay.innerHTML = `
      <label style="display:flex;align-items:center;gap:6px;color:#0A7050;font-weight:600">
       底面半径 <i>r</i>&thinsp;=&thinsp;<span id="f4-r-val">${f4State.r}</span>
       <input id="f4-r" type="range" min="2" max="5" step="1" value="${f4State.r}" style="width:80px;accent-color:#0A7050">
      </label>
      <label style="display:flex;align-items:center;gap:6px;color:#C03030;font-weight:600">
       高 <i>h</i>&thinsp;=&thinsp;<span id="f4-h-val">${f4State.h}</span>
       <input id="f4-h" type="range" min="2" max="8" step="1" value="${f4State.h}" style="width:80px;accent-color:#C03030">
      </label>`;
     wrap.after(overlay);
     function onSlider() {
      if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf=null; f4State.animDone=true; }
      f4DrawStep(canvas);
      const sf = document.getElementById('sform');
      if (sf) sf.textContent = ANIMS[ct.id][cs].formula;
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
    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf=null; }
    const c=document.getElementById('f4-canvas'), o=document.getElementById('f4-overlay');
    if (c) { const sv=c.parentElement&&c.parentElement.querySelector('svg'); if(sv) sv.style.display=''; c.remove(); }
    if (o) o.remove();
    f4State.curStep=-1;
   }

   function f4DrawStep(canvas) {
    const W=420, H=260, pi=Math.PI;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    const r=f4State.r, h=f4State.h, step=f4State.curStep;
    const RARR=36, bandY=148;
    const depX=Math.min(h*8,56), depY=-Math.min(h*4,28);
    const totalW_=2*pi*RARR, startX_=(W-totalW_)/2;

    if (step===0) {
     const cx=110, cy=22, rx=Math.max(25,r*10), hPx=Math.max(36,h*10);
     f4Cylinder(ctx,cx,cy,rx,hPx);
     ctx.save(); ctx.strokeStyle='#0A7050'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+rx,cy); ctx.stroke(); ctx.restore();
     f4Label(ctx,`r = ${r}`,cx+rx/2,cy-10,'#0A7050',14,'center','600');
     const hx=cx+rx+14;
     ctx.save(); ctx.strokeStyle='#C03030'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
     ctx.beginPath(); ctx.moveTo(hx,cy); ctx.lineTo(hx,cy+hPx); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5,cy); ctx.lineTo(hx+5,cy); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5,cy+hPx); ctx.lineTo(hx+5,cy+hPx); ctx.stroke();
     ctx.restore();
     f4Label(ctx,`h = ${h}`,hx+6,cy+hPx/2,'#C03030',14,'left','600');
     f4RoundRect(ctx,240,30,162,120,8,'#FFF8E7','#9A5800',1.5);
     f4Label(ctx,'圆柱体积',321,54,'#9A5800',13,'center','600');
     f4Label(ctx,'V = ?',321,80,'#A03060',22,'center','700');
     f4Label(ctx,'底面积 × 高',321,114,'#9A5800',12);
     f4Label(ctx,'= πr² × h',321,134,'#9A5800',12);
    }
    else if (step===1) {
     // Top-view pie (8 sectors) + arrow + 3D block
     const CX=30, CY=46, RS=26;
     f4Pie(ctx,CX,CY,RS,8);
     f4Label(ctx,'俯视图(8刀)',CX,CY+RS+11,'#555',10);
     // Arrow from pie to block
     const ang=Math.atan2(bandY-CY, startX_-6-CX);
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS*Math.cos(ang),CY+RS*Math.sin(ang)); ctx.lineTo(startX_-6,bandY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath();
     ctx.moveTo(startX_-6,bandY);
     ctx.lineTo(startX_-6-9*Math.cos(ang-0.35),bandY-9*Math.sin(ang-0.35));
     ctx.lineTo(startX_-6-9*Math.cos(ang+0.35),bandY-9*Math.sin(ang+0.35));
     ctx.fill();
     ctx.restore();
     // 3D block (8 sectors)
     const {top,bot}=f4Block(ctx,8,bandY,RARR,depX,depY);
     f4Label(ctx,'8个扇形柱',W/2,bot+18,'#333',12,'center','600');
     // h label on top face
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.88)';
     ctx.fillRect(startX_+totalW_/2+depX/2-28,top+depY/2-9,56,18); ctx.restore();
     f4Label(ctx,`高h=${h}`,startX_+totalW_/2+depX/2,top+depY/2,'#C03030',12,'center','600');
    }
    else if (step===2) {
     // Top-view pie (16 sectors) + 3D block end state
     const CX=30, CY=46, RS=26;
     f4Pie(ctx,CX,CY,RS,16);
     f4Label(ctx,'俯视图(16刀)',CX,CY+RS+11,'#555',10);
     const ang=Math.atan2(bandY-CY, startX_-6-CX);
     ctx.save(); ctx.strokeStyle='#888'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(CX+RS*Math.cos(ang),CY+RS*Math.sin(ang)); ctx.lineTo(startX_-6,bandY); ctx.stroke();
     ctx.fillStyle='#888';
     ctx.beginPath();
     ctx.moveTo(startX_-6,bandY);
     ctx.lineTo(startX_-6-9*Math.cos(ang-0.35),bandY-9*Math.sin(ang-0.35));
     ctx.lineTo(startX_-6-9*Math.cos(ang+0.35),bandY-9*Math.sin(ang+0.35));
     ctx.fill(); ctx.restore();
     const {top,bot}=f4Block(ctx,16,bandY,RARR,depX,depY);
     f4Label(ctx,'16个扇形柱，锯齿减少，越来越像长方体！',W/2,bot+18,'#555',11,'center');
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.88)';
     ctx.fillRect(startX_+totalW_/2+depX/2-28,top+depY/2-9,56,18); ctx.restore();
     f4Label(ctx,`高h=${h}`,startX_+totalW_/2+depX/2,top+depY/2,'#C03030',12,'center','600');
    }
    else if (step===3) {
     // 32 sectors → 3D rectangular block, all 3 dimensions labeled
     const {startX,totalW,top,bot}=f4Block(ctx,32,bandY,RARR,depX,depY);
     // Title above block
     f4Label(ctx,'32个扇形柱 ≈ 近似长方体',W/2,top-24,'#333',12,'center','600');
     // 高h label: place near the back-right corner of the top face to avoid title overlap
     const hLx=startX+totalW+depX/2, hLy=top+depY-4;
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.90)';
     ctx.fillRect(hLx-28,hLy-9,56,18); ctx.restore();
     f4Label(ctx,`高h=${h}`,hLx,hLy,'#C03030',12,'center','600');
     // 宽=r label inside right of front face
     ctx.save(); ctx.fillStyle='rgba(255,255,255,0.88)'; ctx.fillRect(startX+totalW-60,bandY-11,58,22); ctx.restore();
     f4Label(ctx,`宽=r=${r}`,startX+totalW-4,bandY,'#C06020',12,'right','600');
     // 长≈πr brace below front face
     ctx.save(); ctx.strokeStyle='#0A7050'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(startX,bot+14); ctx.lineTo(startX+totalW,bot+14); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bot+9); ctx.lineTo(startX,bot+19); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX+totalW,bot+9); ctx.lineTo(startX+totalW,bot+19); ctx.stroke();
     ctx.restore();
     f4Label(ctx,`长≈πr = π×${r}≈${(pi*r).toFixed(1)}`,W/2,bot+30,'#0A7050',12,'center','600');
     f4Label(ctx,`× 高h=${h}  →  V≈πr×r×h = πr²h`,W/2,bot+48,'#555',11);
    }
    else if (step===4) {
     const cx=66,cy=20,rx=40,hPx=Math.max(50,Math.min(h*14,140));
     f4Cylinder(ctx,cx,cy,rx,hPx);
     ctx.save(); ctx.strokeStyle='#0A7050'; ctx.lineWidth=1.5;
     ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+rx,cy); ctx.stroke(); ctx.restore();
     f4Label(ctx,`r=${r}`,cx+rx/2,cy-10,'#0A7050',13,'center','600');
     const hx=cx+rx+14;
     ctx.save(); ctx.strokeStyle='#C03030'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
     ctx.beginPath(); ctx.moveTo(hx,cy); ctx.lineTo(hx,cy+hPx); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5,cy); ctx.lineTo(hx+5,cy); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(hx-5,cy+hPx); ctx.lineTo(hx+5,cy+hPx); ctx.stroke();
     ctx.restore();
     f4Label(ctx,`h=${h}`,hx+6,cy+hPx/2,'#C03030',13,'left','600');
     const vol=(3.14*r*r*h).toFixed(2);
     f4RoundRect(ctx,163,18,244,152,8,'#FFF8E7','#9A5800',1.5);
     f4Label(ctx,'推导过程',285,36,'#9A5800',12,'center','600');
     f4Label(ctx,'V = 底面积 × 高',285,58,'#555',13);
     f4Label(ctx,'= πr² × h',285,80,'#555',13);
     f4Label(ctx,'= πr²h',285,108,'#A03060',20,'center','700');
     f4Label(ctx,`r=${r}, h=${h} → V=3.14×${r}²×${h}`,285,134,'#555',12);
     f4Label(ctx,`= 3.14×${r*r}×${h} ≈ ${vol}`,285,154,'#A03060',14,'center','700');
     f4RoundRect(ctx,48,186,322,55,8,'#E8F5E9','#2E7D32',1.5);
     f4Label(ctx,'圆柱体积公式：V = πr²h',W/2,207,'#2E7D32',15,'center','700');
     f4Label(ctx,'切得越细越准确！',W/2,229,'#2E7D32',12,'center','600');
    }
   }

   /* Animation: sectors fly from reference circle to band, then f4DrawStep finishes it */
   function f4AnimFrame(canvas, n, bandY, RARR, p) {
    const W=420, pi=Math.PI;
    const CX=30, CY=46, RS=26;
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,W,260);
    const alpha=pi/n, arcW=2*pi*RARR/n, totalW=n*arcW, startX=(W-totalW)/2;
    const STAGGER=0.65, FLIGHT_DUR=1-STAGGER*(n-1)/n;
    const col=[{fill:'#FDDCB5',stroke:'#C06020'},{fill:'#D4E4FF',stroke:'#3050C0'}];
    function tOf(i){ return Math.max(0,Math.min(1,(p-STAGGER*i/n)/FLIGHT_DUR)); }
    // Band guide lines fade in
    if (p>0.2) {
     const la=Math.min(1,(p-0.2)/0.4);
     ctx.save(); ctx.globalAlpha=la; ctx.setLineDash([5,4]); ctx.strokeStyle='#aaa'; ctx.lineWidth=1;
     ctx.beginPath(); ctx.moveTo(startX,bandY-RARR); ctx.lineTo(startX+totalW,bandY-RARR); ctx.stroke();
     ctx.beginPath(); ctx.moveTo(startX,bandY+RARR); ctx.lineTo(startX+totalW,bandY+RARR); ctx.stroke();
     ctx.restore();
    }
    // Flying sectors
    for (let i=0; i<n; i++) {
     const t=tOf(i); if(t<=0) continue;
     const ease=t*t*(3-2*t);
     const c=col[i%2], openDown=(i%2===0);
     const srcMid=(i/n+0.5/n)*2*pi-pi/2;
     const tX=startX+(i+0.5)*arcW, tY=openDown?(bandY-RARR):(bandY+RARR);
     const tMid=openDown?pi/2:-pi/2;
     const curX=CX+(tX-CX)*ease, curY=CY+(tY-CY)*ease;
     let dA=tMid-srcMid;
     while(dA>pi) dA-=2*pi; while(dA<-pi) dA+=2*pi;
     f4Sector(ctx,curX,curY,RS+(RARR-RS)*ease,alpha,srcMid+dA*ease,c.fill,c.stroke);
    }
    // Reference circle fades out
    const ca=Math.max(0,1-p*2);
    if (ca>0) {
     ctx.save(); ctx.globalAlpha=ca;
     ctx.beginPath(); ctx.arc(CX,CY,RS,0,2*pi);
     ctx.strokeStyle='#ccc'; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
    }
    f4Label(ctx,`${n}个扇形柱`,CX,CY+RS+10,'#555',10);
   }

   function f4StartAnim(canvas, n) {
    const RARR=36, bandY=148, dur=(n===32)?2500:2200;
    if (f4State.animRaf) { cancelAnimationFrame(f4State.animRaf); f4State.animRaf=null; }
    f4State.animDone=false;
    const t0=performance.now();
    (function tick(now) {
     const p=Math.min(1,(now-t0)/dur);
     f4AnimFrame(canvas,n,bandY,RARR,p);
     if (p<1) { f4State.animRaf=requestAnimationFrame(tick); }
     else { f4State.animRaf=null; f4State.animDone=true; f4DrawStep(canvas); }
    })(performance.now());
   }

// @@SECTION:anims@@

     {
      hint: '这是一个底面半径r、高h的圆柱。体积怎么算？拖动滑块改变大小，观察圆柱变化。',
      formula: 'V = ?（目标：推导圆柱体积公式 V = πr²h）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=0; f4DrawStep(canvas); },
     },
     {
      hint: '沿高度方向竖切——切成8个扇形柱。注意每个扇形柱是3D的：底面是扇形，高度就是圆柱的高h！',
      formula: '圆柱 → 竖切成8个扇形柱（底面=扇形，高=h的3D柱体）',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=1; f4DrawStep(canvas); },
     },
     {
      hint: '把16个扇形柱一正一反交错排开，整体越来越像一个3D长方体。切得越多越像！',
      formula: '16个扇形柱交错排开 → 越来越像3D长方体',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=2; f4StartAnim(canvas,16); },
     },
     {
      hint: '32个扇形柱≈3D长方体！长≈πr（半圆周），宽=r（扇形半径），高=h（圆柱高度）。',
      formula: '32个扇形柱≈长方体：长≈πr，宽=r，高=h → V≈πr·r·h = πr²h',
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=3; f4StartAnim(canvas,32); },
     },
     {
      hint: '切得越细越准确！长方体体积=底面积×高=πr²×h，这就是圆柱体积公式 V=πr²h！',
      get formula() { const r=f4State.r,h=f4State.h; return `V = πr²h，r=${r}，h=${h} → V = 3.14×${r}²×${h} ≈ ${(3.14*r*r*h).toFixed(2)}`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getF4Canvas(s); f4State.curStep=4; f4DrawStep(canvas); },
     },

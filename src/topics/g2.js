// @@SECTION:helpers@@
   const g2State = { tx: 150, curStep: -1, animRaf: null, animT0: 0, animDur: 200 };

   const G2_CA = '#D94040';
   const G2_CB = '#2E9E6B';
   const G2_CC = '#4F72D9';

   function g2Lbl(ctx, text, x, y, color, size, align, weight, bg) {
    ctx.save();
    ctx.font = `${weight||'normal'} ${size||13}px 'Noto Sans SC',sans-serif`;
    const tw = ctx.measureText(text).width;
    if (bg) {
     const tx0 = align==='right' ? x-tw : align==='center' ? x-tw/2 : x;
     ctx.fillStyle = bg;
     ctx.fillRect(tx0-3, y-(size||13)/2-2, tw+6, (size||13)+4);
    }
    ctx.fillStyle = color||'#333';
    ctx.textAlign = align||'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
   }

   function g2Box(ctx, x, y, w, h, rad, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad||6);
    else ctx.rect(x, y, w, h);
    if (fill)   { ctx.fillStyle=fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   function g2Ang(p1, v, p2) {
    const ax=p1[0]-v[0], ay=p1[1]-v[1];
    const bx=p2[0]-v[0], by=p2[1]-v[1];
    const d=ax*bx+ay*by;
    const m=Math.sqrt(ax*ax+ay*ay)*Math.sqrt(bx*bx+by*by);
    return Math.round(Math.acos(Math.max(-1,Math.min(1,d/m)))*180/Math.PI);
   }

   function g2Classify(aA, aB, aC) {
    const mx=Math.max(aA,aB,aC);
    if (Math.abs(mx-90)<=1) return { type:'直角三角形', color:'#8B4000' };
    if (mx>90)              return { type:'钝角三角形', color:'#6030B0' };
    return                         { type:'锐角三角形', color:'#1A7A40' };
   }

   function g2DrawTri(ctx, pts, fill, stroke, lw) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    if (fill)   { ctx.fillStyle=fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle=stroke; ctx.lineWidth=lw||1.5; ctx.stroke(); }
    ctx.restore();
   }

   /* Draw filled angle sector at vertex v, between rays to p1 and p2 */
   function g2Arc(ctx, v, p1, p2, r, color, alpha) {
    const a1=Math.atan2(p1[1]-v[1], p1[0]-v[0]);
    const a2=Math.atan2(p2[1]-v[1], p2[0]-v[0]);
    let d=a2-a1;
    if (d>Math.PI)  d-=2*Math.PI;
    if (d<-Math.PI) d+=2*Math.PI;
    ctx.save();
    ctx.globalAlpha = alpha||0.45;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(v[0],v[1]);
    ctx.arc(v[0],v[1],r,a1,a1+d,d<0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
   }

   /* Right-angle square marker */
   function g2RightMark(ctx, v, p1, p2, sz, color) {
    const d1=[p1[0]-v[0],p1[1]-v[1]], d2=[p2[0]-v[0],p2[1]-v[1]];
    const n1=Math.hypot(d1[0],d1[1]), n2=Math.hypot(d2[0],d2[1]);
    const u1=[d1[0]/n1*sz,d1[1]/n1*sz], u2=[d2[0]/n2*sz,d2[1]/n2*sz];
    ctx.save();
    ctx.strokeStyle=color||'#555'; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(v[0]+u1[0],         v[1]+u1[1]);
    ctx.lineTo(v[0]+u1[0]+u2[0],   v[1]+u1[1]+u2[1]);
    ctx.lineTo(v[0]+u2[0],         v[1]+u2[1]);
    ctx.stroke();
    ctx.restore();
   }

   /* Tick marks on a side (equal-sides convention) */
   function g2Tick(ctx, p1, p2, n, color) {
    const mx=(p1[0]+p2[0])/2, my=(p1[1]+p2[1])/2;
    const dx=p2[0]-p1[0], dy=p2[1]-p1[1];
    const len=Math.hypot(dx,dy);
    const nx=-dy/len*6, ny=dx/len*6;
    const ux=dx/len, uy=dy/len;
    ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=1.8;
    for (let i=0;i<n;i++) {
     const off=(i-(n-1)/2)*5;
     ctx.beginPath();
     ctx.moveTo(mx+nx+ux*off, my+ny+uy*off);
     ctx.lineTo(mx-nx+ux*off, my-ny+uy*off);
     ctx.stroke();
    }
    ctx.restore();
   }

   /* Current interactive triangle vertices */
   function g2MainPts() {
    const A=[80,215], B=[232,215];
    const cx=Math.max(50,Math.min(270,g2State.tx));
    return { A, B, C:[cx,64] };
   }

   function g2Frame(canvas, step, p) {
    const ctx=canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    const e=p*p*(3-2*p);

    // ── Step 0: 认识三角形 ─────────────────────────────────────────────────────
    if (step===0) {
     const {A,B,C}=g2MainPts();
     const aA=g2Ang(B,A,C), aB=g2Ang(A,B,C), aC=g2Ang(A,C,B);
     const cls=g2Classify(aA,aB,aC);

     g2DrawTri(ctx,[A,B,C],'rgba(100,150,255,0.1)','#3060B0',2);

     // Angle arcs / right-angle mark
     [[A,B,C,G2_CA],[B,A,C,G2_CB],[C,A,B,G2_CC]].forEach(([v,p1,p2,col])=>{
      const ang=g2Ang(p1,v,p2);
      if (Math.abs(ang-90)<=1) g2RightMark(ctx,v,p1,p2,13,col);
      else g2Arc(ctx,v,p1,p2,20,col,0.3);
     });

     // Vertex dots + labels
     [[A,'A',G2_CA,-16,13],[B,'B',G2_CB,16,13],[C,'C',G2_CC,0,-16]].forEach(([pt,lbl,col,ox,oy])=>{
      ctx.save(); ctx.fillStyle=col;
      ctx.beginPath(); ctx.arc(pt[0],pt[1],5,0,Math.PI*2); ctx.fill(); ctx.restore();
      g2Lbl(ctx,lbl,pt[0]+ox,pt[1]+oy,col,13,'center','bold','rgba(255,255,255,0.85)');
     });

     // Side labels at midpoints
     g2Lbl(ctx,'c',(A[0]+B[0])/2,(A[1]+B[1])/2+15,'#3060B0',12,'center','bold','rgba(255,255,255,0.85)');
     g2Lbl(ctx,'b',(A[0]+C[0])/2-17,(A[1]+C[1])/2,'#3060B0',12,'center','bold','rgba(255,255,255,0.85)');
     g2Lbl(ctx,'a',(B[0]+C[0])/2+17,(B[1]+C[1])/2,'#3060B0',12,'center','bold','rgba(255,255,255,0.85)');

     // Angle values near vertices
     g2Lbl(ctx,aA+'°',A[0]+26,A[1]-10,G2_CA,10,'center');
     g2Lbl(ctx,aB+'°',B[0]-26,B[1]-10,G2_CB,10,'center');
     g2Lbl(ctx,aC+'°',C[0]+4,C[1]+22,G2_CC,10,'center');

     // Info card
     const RX=256,cw=154,ch=136,cy=(H-ch)/2;
     g2Box(ctx,RX,cy,cw,ch,8,'#F0F4FF','#3060B0',1.5);
     g2Lbl(ctx,'三角形的组成',RX+cw/2,cy+18,'#1A3A8A',13,'center','bold');
     [['3','个顶点',G2_CA],['3','条边','#3060B0'],['3','个角',G2_CC]].forEach(([n,lbl,c],i)=>{
      g2Lbl(ctx,n,RX+26,cy+46+i*24,c,20,'center','bold');
      g2Lbl(ctx,lbl,RX+56,cy+46+i*24,'#333',13,'left');
     });
     g2Lbl(ctx,cls.type,RX+cw/2,cy+120,cls.color,12,'center','bold');
     g2Lbl(ctx,'∠A+∠B+∠C = 180°',RX+cw/2,cy+ch-10,'#888',10,'center');

     g2Lbl(ctx,'三条边 + 三个角 + 三个顶点',W/2-14,265,'#555',11,'center');
    }

    // ── Step 1: 按角分类 ──────────────────────────────────────────────────────
    if (step===1) {
     const specs=[
      { label:'锐角三角形', sub:'三个角都 < 90°', color:'#1A7A40', fill:'rgba(40,180,90,0.1)',
        A:[15,200], B:[127,200], C:[70,100] },
      { label:'直角三角形', sub:'一个角 = 90°',   color:'#8B4000', fill:'rgba(220,130,30,0.13)',
        A:[155,205], B:[267,205], C:[155,110] },
      { label:'钝角三角形', sub:'一个角 > 90°',   color:'#6030B0', fill:'rgba(140,60,240,0.1)',
        A:[295,205], B:[407,205], C:[275,140] },
     ];
     specs.forEach(({label,sub,color,fill,A,B,C},i)=>{
      const alpha=Math.min(1,Math.max(0,(e-i*0.3)/0.4));
      const aA=g2Ang(B,A,C), aB=g2Ang(A,B,C), aC=g2Ang(A,C,B);
      const mx=Math.max(aA,aB,aC);

      ctx.save(); ctx.globalAlpha=alpha;
      g2DrawTri(ctx,[A,B,C],fill,color,2);

      // Angle mark: right square or colored sector
      if (Math.abs(mx-90)<=2) {
       g2RightMark(ctx,A,B,C,12,color);
      } else {
       const [v,p1,p2]=mx===aA?[A,B,C]:mx===aB?[B,A,C]:[C,A,B];
       g2Arc(ctx,v,p1,p2,20,color,0.45);
      }

      // Angle degree labels
      g2Lbl(ctx,aA+'°',A[0]+22,A[1]-10,color,10,'center');
      g2Lbl(ctx,aB+'°',B[0]-22,B[1]-10,color,10,'center');
      g2Lbl(ctx,aC+'°',C[0]+(i===1?14:0),C[1]-16,color,10,'center');

      // Type label below
      const midX=(A[0]+B[0])/2;
      g2Lbl(ctx,label,midX,A[1]+22,color,12,'center','bold');
      g2Lbl(ctx,sub,midX,A[1]+37,color,10,'center');
      ctx.restore();
     });
     g2Lbl(ctx,'按最大角分类——锐角 / 直角 / 钝角三角形',W/2,265,'#555',11,'center');
    }

    // ── Step 2: 按边分类 ──────────────────────────────────────────────────────
    if (step===2) {
     const defs2=[
      { label:'等边三角形', sub:'三边相等 a=b=c', color:'#1A5FA8', fill:'rgba(50,110,230,0.1)',
        A:[15,205], B:[120,205], C:[68,114], tk:[1,1,1] },
      { label:'等腰三角形', sub:'两边相等 a=b≠c', color:'#C07020', fill:'rgba(220,150,30,0.12)',
        A:[150,205], B:[258,205], C:[204,115], tk:[1,1,2] },
      { label:'不等边三角形', sub:'三边都不相等',  color:'#A03060', fill:'rgba(200,50,110,0.1)',
        A:[280,205], B:[400,205], C:[330,120], tk:[0,0,0] },
     ];
     defs2.forEach(({label,sub,color,fill,A,B,C,tk},i)=>{
      const alpha=Math.min(1,Math.max(0,(e-i*0.3)/0.4));
      ctx.save(); ctx.globalAlpha=alpha;
      g2DrawTri(ctx,[A,B,C],fill,color,2);
      // Tick marks: tk=[nAC, nBC, nAB]
      if (tk[0]) g2Tick(ctx,A,C,tk[0],color);
      if (tk[1]) g2Tick(ctx,B,C,tk[1],color);
      if (tk[2]) g2Tick(ctx,A,B,tk[2],color);
      // Labels
      const midX=(A[0]+B[0])/2;
      g2Lbl(ctx,label,midX,A[1]+22,color,12,'center','bold');
      g2Lbl(ctx,sub,midX,A[1]+37,color,10,'center');
      ctx.restore();
     });
     g2Lbl(ctx,'按边长分类——等边 / 等腰 / 不等边三角形',W/2,265,'#555',11,'center');
    }

    // ── Step 3: 内角和 = 180° ─────────────────────────────────────────────────
    if (step===3) {
     const {A,B,C}=g2MainPts();
     const aA=g2Ang(B,A,C), aB=g2Ang(A,B,C), aC=g2Ang(A,C,B);
     const sumAng=aA+aB+aC;

     g2DrawTri(ctx,[A,B,C],'rgba(100,150,255,0.08)','#3060B0',2);

     // Colored angle sectors
     g2Arc(ctx,A,B,C,28,G2_CA,0.35);
     g2Arc(ctx,B,A,C,28,G2_CB,0.35);
     g2Arc(ctx,C,A,B,28,G2_CC,0.35);

     // Angle labels
     g2Lbl(ctx,'∠A='+aA+'°',A[0]+32,A[1]-10,G2_CA,10,'center','bold','rgba(255,255,255,0.9)');
     g2Lbl(ctx,'∠B='+aB+'°',B[0]-32,B[1]-10,G2_CB,10,'center','bold','rgba(255,255,255,0.9)');
     g2Lbl(ctx,'∠C='+aC+'°',C[0],C[1]+24,G2_CC,10,'center','bold','rgba(255,255,255,0.9)');

     // Colored bar proof: three angle pieces form a straight line
     const barY=241, barX=28, barW=200, pxpd=barW/180;
     let bx=barX;
     [[aA,G2_CA,'A'],[aB,G2_CB,'B'],[aC,G2_CC,'C']].forEach(([ang,col,lbl])=>{
      const w=ang*pxpd;
      g2Box(ctx,bx,barY-11,w,22,2,col,null);
      if (w>24) g2Lbl(ctx,'∠'+lbl,bx+w/2,barY,'#fff',9,'center','bold');
      bx+=w;
     });
     // Summary
     g2Lbl(ctx,'= '+sumAng+'°',barX+barW+8,barY,'#C04000',12,'left','bold');

     // Info card
     const RX=256,cw=154,ch=108,cy=28;
     g2Box(ctx,RX,cy,cw,ch,8,'#FFF8E8','#C08000',2);
     g2Lbl(ctx,'三角形内角和',RX+cw/2,cy+18,'#8A5000',13,'center','bold');
     g2Lbl(ctx,'∠A+∠B+∠C = 180°',RX+cw/2,cy+44,'#333',14,'center','bold');
     g2Lbl(ctx,aA+'°+'+aB+'°+'+aC+'° = '+sumAng+'°',RX+cw/2,cy+66,'#555',11,'center');
     g2Lbl(ctx,'拖动滑块改变形状→验证',RX+cw/2,cy+86,'#C04000',10,'center','bold');
     g2Lbl(ctx,'三角形内角和始终 = 180°',RX+cw/2,cy+ch-8,'#888',10,'center');

     g2Lbl(ctx,'三个内角拼在一起，恰好组成一条直线（180°）',W/2-14,265,'#555',10,'center');
    }
   }

   function g2DrawStep(canvas) { g2Frame(canvas, g2State.curStep, 1); }
   function g2AnimFrame(canvas, p) { g2Frame(canvas, g2State.curStep, p); }

   function g2StartAnim(canvas, forceRestart, dur) {
    if (!forceRestart && (g2State.animRaf || g2State.animT0===0)) return;
    if (g2State.animRaf) { cancelAnimationFrame(g2State.animRaf); g2State.animRaf=null; }
    const SM=(typeof slowMode!=='undefined'&&slowMode)?1.9:1;
    const D=(dur||g2State.animDur)*SM;
    g2State.animT0=performance.now();
    const t0=g2State.animT0;
    let pausedMs=0, pausedAt=0;
    (function tick(now){
     const isPaused=typeof animState!=='undefined'&&animState.paused;
     if (isPaused) { if(!pausedAt) pausedAt=now; g2State.animRaf=requestAnimationFrame(tick); return; }
     if (pausedAt) { pausedMs+=now-pausedAt; pausedAt=0; }
     const p=Math.min(1,(now-t0-pausedMs)/D);
     g2AnimFrame(canvas,p);
     if (p<1) { g2State.animRaf=requestAnimationFrame(tick); }
     else { g2State.animRaf=null; g2State.animT0=0; g2DrawStep(canvas); }
    })(t0);
   }

   function removeG2Canvas() {
    if (g2State.animRaf) { cancelAnimationFrame(g2State.animRaf); g2State.animRaf=null; }
    g2State.curStep=-1; g2State.animT0=0;
    const c=document.getElementById('g2-canvas');
    if (c) { const sv=c.parentElement?.querySelector('svg'); if(sv) sv.style.display=''; c.remove(); }
    const o=document.getElementById('g2-overlay');
    if (o) o.remove();
   }

   function g2UpdateInfo() {
    const {A,B,C}=g2MainPts();
    const aA=g2Ang(B,A,C), aB=g2Ang(A,B,C), aC=g2Ang(A,C,B);
    const cls=g2Classify(aA,aB,aC);
    const el=document.getElementById('g2-info');
    if (el) {
     el.textContent=`∠A=${aA}°  ∠B=${aB}°  ∠C=${aC}°　→　${cls.type}`;
     el.style.color=cls.color;
    }
   }

   function getG2Canvas(sv) {
    const svg=sv.ownerSVGElement||sv;
    const wrap=svg.closest('.canvas-wrap')||svg.parentElement;
    let canvas=document.getElementById('g2-canvas');
    if (!canvas) {
     svg.style.display='none';
     canvas=document.createElement('canvas');
     canvas.id='g2-canvas'; canvas.width=420; canvas.height=280;
     Object.assign(canvas.style,{display:'block',maxWidth:'100%',height:'auto',borderRadius:'6px'});
     wrap.appendChild(canvas);
     const overlay=document.createElement('div');
     overlay.id='g2-overlay';
     Object.assign(overlay.style,{
      display:'flex',gap:'10px',alignItems:'center',justifyContent:'center',
      flexWrap:'wrap',padding:'6px 0 2px',
      fontSize:'13px',fontFamily:"'Noto Sans SC',sans-serif",whiteSpace:'nowrap',
     });
     overlay.innerHTML=`
      <label style="display:flex;align-items:center;gap:6px;color:#3060B0;font-weight:600">
       顶点位置
       <input id="g2-tx" type="range" min="50" max="270" step="5" value="${g2State.tx}" style="width:130px;accent-color:#3060B0">
      </label>
      <span id="g2-info" style="font-size:11px;color:#555;font-weight:600"></span>`;
     wrap.after(overlay);
     const ref=canvas;
     document.getElementById('g2-tx').addEventListener('input',function(){
      g2State.tx=+this.value;
      g2UpdateInfo();
      if (g2State.animRaf) { cancelAnimationFrame(g2State.animRaf); g2State.animRaf=null; }
      g2DrawStep(ref);
      const sf=document.getElementById('sform');
      try { if(sf) sf.textContent=ANIMS[ct.id][cs].formula; } catch(e2){}
     });
     g2UpdateInfo();
    }
    return { canvas };
   }

// @@SECTION:anims@@

     {
      hint: '三角形有3条边、3个角、3个顶点。拖动下方滑块移动顶点C，观察三角形形状和分类的变化。',
      get formula() { const {A,B,C}=g2MainPts(); const aA=g2Ang(B,A,C),aB=g2Ang(A,B,C),aC=g2Ang(A,C,B); return `三角形：∠A=${aA}°  ∠B=${aB}°  ∠C=${aC}°`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG2Canvas(s); g2State.curStep=0; g2DrawStep(canvas); },
     },
     {
      hint: '按最大角分类：三个角都小于90°是锐角三角形；有一个90°角是直角三角形；有一个角大于90°是钝角三角形。',
      formula: '三角形按角分类：锐角 / 直角 / 钝角三角形',
      dur: 1200, noAutoFit: true,
      draw(s, p) { const {canvas}=getG2Canvas(s); g2State.curStep=1; g2StartAnim(canvas, p===0, 1200); },
     },
     {
      hint: '按边长分类：三边相等是等边三角形（也叫正三角形）；两边相等是等腰三角形；三边都不相等是不等边三角形。',
      formula: '三角形按边分类：等边 / 等腰 / 不等边三角形',
      dur: 1200, noAutoFit: true,
      draw(s, p) { const {canvas}=getG2Canvas(s); g2State.curStep=2; g2StartAnim(canvas, p===0, 1200); },
     },
     {
      hint: '无论三角形形状如何，三个内角之和永远等于180°。彩色色块拼在一起恰好是一条直线。拖动滑块验证！',
      get formula() { const {A,B,C}=g2MainPts(); const aA=g2Ang(B,A,C),aB=g2Ang(A,B,C),aC=g2Ang(A,C,B); return `∠A(${aA}°)+∠B(${aB}°)+∠C(${aC}°)=${aA+aB+aC}°`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG2Canvas(s); g2State.curStep=3; g2DrawStep(canvas); },
     },

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

   /* Current interactive triangle vertices.
      A=[69,215], B=[243,215]: AB=174px. Height=151px → equilateral side≈174px,
      so tx≈156 (slider midpoint) gives equilateral; tx<69 or tx>243 gives obtuse. */
   function g2MainPts() {
    const A=[69,215], B=[243,215];
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

    // ── Step 1: 按角分类（纯滑块驱动） ─────────────────────────────────────────
    if (step===1) {
     const {A,B,C}=g2MainPts();
     const aA=g2Ang(B,A,C), aB=g2Ang(A,B,C), aC=g2Ang(A,C,B);
     const cls=g2Classify(aA,aB,aC);
     const mx=Math.max(aA,aB,aC);

     g2DrawTri(ctx,[A,B,C],cls.color+'18',cls.color,2);

     // Angle arcs — largest angle highlighted
     [[A,B,C,G2_CA,aA],[B,A,C,G2_CB,aB],[C,A,B,G2_CC,aC]].forEach(([v,p1,p2,col,ang])=>{
      const isMax=ang===mx;
      if (Math.abs(ang-90)<=1) g2RightMark(ctx,v,p1,p2,14,col);
      else g2Arc(ctx,v,p1,p2,isMax?28:16,col,isMax?0.55:0.18);
     });

     // Vertex dots
     [[A,G2_CA],[B,G2_CB],[C,G2_CC]].forEach(([pt,col])=>{
      ctx.save(); ctx.fillStyle=col;
      ctx.beginPath(); ctx.arc(pt[0],pt[1],4,0,Math.PI*2); ctx.fill(); ctx.restore();
     });

     // Angle value labels — smart offsets to avoid overlap
     const bg='rgba(255,255,255,0.9)';
     // A is bottom-left: label right and up
     g2Lbl(ctx,aA+'°',A[0]+30,A[1]-8,G2_CA,11,'center','bold',bg);
     // B is bottom-right: label left and up
     g2Lbl(ctx,aB+'°',B[0]-30,B[1]-8,G2_CB,11,'center','bold',bg);
     // C is top-center: label below-center, nudge away from edges
     const cLx=Math.max(40,Math.min(380,C[0]));
     g2Lbl(ctx,aC+'°',cLx,C[1]+20,G2_CC,11,'center','bold',bg);

     // Bottom classification bar
     const clsDesc1={'锐角三角形':'三个角都小于 90°','直角三角形':'有一个角等于 90°','钝角三角形':'有一个角大于 90°'};
     g2Box(ctx,8,222,404,28,6,cls.color+'14',cls.color,1.5);
     g2Lbl(ctx,cls.type,100,236,cls.color,15,'center','bold');
     g2Lbl(ctx,clsDesc1[cls.type],255,236,'#333',11,'center');
     g2Lbl(ctx,'最大角 '+mx+'°',385,236,cls.color,11,'center','bold');
     g2Lbl(ctx,'拖动"顶点位置"滑块，观察分类变化',W/2,264,'#888',10,'center');
    }

    // ── Step 2: 按边分类（纯滑块驱动） ─────────────────────────────────────────
    if (step===2) {
     const {A,B,C}=g2MainPts();
     const rAB=Math.hypot(B[0]-A[0],B[1]-A[1]);
     const rAC=Math.hypot(C[0]-A[0],C[1]-A[1]);
     const rBC=Math.hypot(C[0]-B[0],C[1]-B[1]);
     // Relative-tolerance side equality: within 10% of harmonic mean
     const near=(a,b)=>Math.abs(a-b)/((a+b)/2)<0.10;
     const eqAC_BC=near(rAC,rBC), eqAB_AC=near(rAB,rAC), eqAB_BC=near(rAB,rBC);
     let sc;
     if (eqAC_BC&&eqAB_AC&&eqAB_BC) sc={type:'等边三角形',color:'#1A5FA8',rel:'a = b = c'};
     else if (eqAC_BC||eqAB_AC||eqAB_BC) sc={type:'等腰三角形',color:'#C07020',rel:'两腰相等'};
     else sc={type:'不等边三角形',color:'#A03060',rel:'三边各不相等'};

     g2DrawTri(ctx,[A,B,C],sc.color+'18',sc.color,2);

     // Tick marks on equal sides
     if (eqAC_BC||eqAB_AC&&eqAB_BC) {
      if (eqAC_BC) g2Tick(ctx,A,C,1,sc.color);
      if (eqAC_BC) g2Tick(ctx,B,C,1,sc.color);
      if (eqAB_AC) g2Tick(ctx,A,B,eqAC_BC?1:2,sc.color);
      if (eqAB_BC&&!eqAB_AC) g2Tick(ctx,A,B,2,sc.color);
      if (eqAB_BC&&!eqAC_BC) g2Tick(ctx,B,C,2,sc.color);
      if (eqAB_AC&&!eqAC_BC) g2Tick(ctx,A,C,2,sc.color);
     }

     // Side length labels (in /8 units, 1 decimal)
     const bg2='rgba(255,255,255,0.9)';
     const lAB=(rAB/8).toFixed(1), lAC=(rAC/8).toFixed(1), lBC=(rBC/8).toFixed(1);
     // b = AC (left side): label left of midpoint
     const bmx=(A[0]+C[0])/2, bmy=(A[1]+C[1])/2;
     g2Lbl(ctx,'b='+lAC,bmx-20,bmy,sc.color,10,'center','bold',bg2);
     // a = BC (right side): label right of midpoint
     const amx=(B[0]+C[0])/2, amy=(B[1]+C[1])/2;
     g2Lbl(ctx,'a='+lBC,amx+20,amy,sc.color,10,'center','bold',bg2);
     // c = AB (base): label ABOVE the base to avoid bar overlap
     g2Lbl(ctx,'c='+lAB,(A[0]+B[0])/2,A[1]-10,sc.color,10,'center','bold',bg2);

     // Vertex dots + labels (A,B at side to avoid bar at y=222+)
     [[A,sc.color],[B,sc.color],[C,sc.color]].forEach(([pt,col])=>{
      ctx.save(); ctx.fillStyle=col;
      ctx.beginPath(); ctx.arc(pt[0],pt[1],4,0,Math.PI*2); ctx.fill(); ctx.restore();
     });
     g2Lbl(ctx,'A',A[0]-16,A[1]-4,sc.color,11,'center','bold',bg2);
     g2Lbl(ctx,'B',B[0]+16,B[1]-4,sc.color,11,'center','bold',bg2);
     const cLx2=Math.max(20,Math.min(400,C[0]));
     g2Lbl(ctx,'C',cLx2,C[1]-14,sc.color,11,'center','bold',bg2);

     // Bottom classification bar
     g2Box(ctx,8,222,404,28,6,sc.color+'14',sc.color,1.5);
     g2Lbl(ctx,sc.type,100,236,sc.color,15,'center','bold');
     g2Lbl(ctx,sc.rel,240,236,'#333',11,'center');
     g2Lbl(ctx,'a='+lBC+'  b='+lAC+'  c='+lAB,365,236,sc.color,10,'center','bold');
     g2Lbl(ctx,'拖动"顶点位置"滑块，观察边长分类变化',W/2,264,'#888',10,'center');
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

   function g2SideCls() {
    const {A,B,C}=g2MainPts();
    const rAB=Math.hypot(B[0]-A[0],B[1]-A[1]);
    const rAC=Math.hypot(C[0]-A[0],C[1]-A[1]);
    const rBC=Math.hypot(C[0]-B[0],C[1]-B[1]);
    const near=(a,b)=>Math.abs(a-b)/((a+b)/2)<0.10;
    const eAC_BC=near(rAC,rBC),eAB_AC=near(rAB,rAC),eAB_BC=near(rAB,rBC);
    if (eAC_BC&&eAB_AC&&eAB_BC) return {type:'等边三角形',color:'#1A5FA8',la:(rAB/8).toFixed(1),lb:(rAC/8).toFixed(1),lc:(rAB/8).toFixed(1)};
    if (eAC_BC||eAB_AC||eAB_BC) return {type:'等腰三角形',color:'#C07020',la:(rBC/8).toFixed(1),lb:(rAC/8).toFixed(1),lc:(rAB/8).toFixed(1)};
    return {type:'不等边三角形',color:'#A03060',la:(rBC/8).toFixed(1),lb:(rAC/8).toFixed(1),lc:(rAB/8).toFixed(1)};
   }

   function g2UpdateInfo() {
    const el=document.getElementById('g2-info');
    if (!el) return;
    if (g2State.curStep===2) {
     const sc=g2SideCls();
     el.textContent=`a=${sc.la}  b=${sc.lb}  c=${sc.lc}　→　${sc.type}`;
     el.style.color=sc.color;
     return;
    }
    const {A,B,C}=g2MainPts();
    const aA=g2Ang(B,A,C), aB=g2Ang(A,B,C), aC=g2Ang(A,C,B);
    const cls=g2Classify(aA,aB,aC);
    el.textContent=`∠A=${aA}°  ∠B=${aB}°  ∠C=${aC}°　→　${cls.type}`;
    el.style.color=cls.color;
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
      <button id="g2-reset" style="font-size:11px;padding:2px 10px;border:1px solid #aaa;border-radius:12px;background:#fff;color:#666;cursor:pointer">恢复默认</button>
      <span id="g2-info" style="font-size:11px;color:#555;font-weight:600"></span>`;
     wrap.after(overlay);
     const ref=canvas;
     const onTxChange=()=>{
      g2UpdateInfo();
      if (g2State.animRaf) { cancelAnimationFrame(g2State.animRaf); g2State.animRaf=null; }
      g2DrawStep(ref);
      const sf=document.getElementById('sform');
      try { if(sf&&g2State.curStep>=0) sf.textContent=ANIMS['g2'][g2State.curStep].formula; } catch(e2){}
     };
     document.getElementById('g2-tx').addEventListener('input',function(){ g2State.tx=+this.value; onTxChange(); });
     document.getElementById('g2-reset').addEventListener('click',function(){
      g2State.tx=150; document.getElementById('g2-tx').value=150; onTxChange();
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
      draw(s) { const {canvas}=getG2Canvas(s); g2State.curStep=0; g2DrawStep(canvas); g2UpdateInfo(); },
     },
     {
      hint: '按最大角分类：三个角都小于90°是锐角三角形；有一个90°角是直角三角形；有一个角大于90°是钝角三角形。拖动滑块实时切换类型！',
      get formula() { const {A,B,C}=g2MainPts(); const aA=g2Ang(B,A,C),aB=g2Ang(A,B,C),aC=g2Ang(A,C,B); return g2Classify(aA,aB,aC).type+'（最大角='+Math.max(aA,aB,aC)+'°）'; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG2Canvas(s); g2State.curStep=1; g2DrawStep(canvas); g2UpdateInfo(); },
     },
     {
      hint: '按边长分类：三边相等是等边三角形；两边相等是等腰三角形；三边都不相等是不等边三角形。拖动滑块移动顶点C，边长数字实时更新，分类自动判定。',
      get formula() { const sc=g2SideCls(); return sc.type+'：a='+sc.la+'  b='+sc.lb+'  c='+sc.lc; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG2Canvas(s); g2State.curStep=2; g2DrawStep(canvas); g2UpdateInfo(); },
     },
     {
      hint: '无论三角形形状如何，三个内角之和永远等于180°。彩色色块拼在一起恰好是一条直线。拖动滑块验证！',
      get formula() { const {A,B,C}=g2MainPts(); const aA=g2Ang(B,A,C),aB=g2Ang(A,B,C),aC=g2Ang(A,C,B); return `∠A(${aA}°)+∠B(${aB}°)+∠C(${aC}°)=${aA+aB+aC}°`; },
      dur: 100, noAutoFit: true,
      draw(s) { const {canvas}=getG2Canvas(s); g2State.curStep=3; g2DrawStep(canvas); g2UpdateInfo(); },
     },

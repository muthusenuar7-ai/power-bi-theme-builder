/* ─── SVG Chart renderers ───
   Each function returns an <svg> element; viewBox-based,
   uses var(--c1)..var(--c8) for theme reactive colors.
   ──────────────────────────── */

window.Charts = (function(){
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (t,a={},...k)=>U.svg(t,a,...k);
  const txt = (x,y,s,opts={})=>sv('text',
    Object.assign({x,y,'font-family':'var(--theme-font, Segoe UI), Segoe UI, sans-serif',
      'font-size':opts.size||10, fill: opts.fill||'#595959', 'text-anchor': opts.anchor||'start',
      'font-weight': opts.weight||400 }, opts.attrs||{}), s);
  const grid = (x1,y1,x2,y2,d=null) => sv('line',{x1,y1,x2,y2, stroke:'#E8E8E8','stroke-width':0.6, 'stroke-dasharray':d||null});
  const axisLine = (x1,y1,x2,y2)=>sv('line',{x1,y1,x2,y2, stroke:'#C0C0C0','stroke-width':1});

  // build SVG root
  const root = (vb)=>{
    const s = document.createElementNS(NS,'svg');
    s.setAttribute('viewBox', vb);
    s.setAttribute('preserveAspectRatio','xMidYMid meet');
    return s;
  };

  // Sample data
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul'];
  const cats4  = ['Q1','Q2','Q3','Q4'];

  function drawClusteredCol(){
    const W=400, H=240, P={l:32,r:12,t:14,b:30};
    const data = [42,68,55,80,72,90,65];
    const max = 100;
    const s = root(`0 0 ${W} ${H}`);
    // gridlines
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
      s.appendChild(txt(P.l-6, y+3, (i*25), {anchor:'end', fill:'#595959'}));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    const bw = (W-P.l-P.r)/data.length * 0.6;
    const step = (W-P.l-P.r)/data.length;
    data.forEach((v,i)=>{
      const x = P.l + i*step + (step-bw)/2;
      const h = (v/max) * (H-P.t-P.b);
      const y = H-P.b-h;
      s.appendChild(sv('rect',{x, y, width:bw, height:h, rx:2, fill:'var(--c1)'}));
      s.appendChild(txt(x+bw/2, H-P.b+14, months[i], {anchor:'middle'}));
    });
    return s;
  }

  function drawBar(){
    const W=400, H=240, P={l:60,r:40,t:10,b:20};
    const data = [['Enterprise',92],['Mid-Market',74],['SMB',56],['Self-serve',42],['Channel',31]];
    const max = 100;
    const s = root(`0 0 ${W} ${H}`);
    const bh = (H-P.t-P.b)/data.length * 0.7;
    const step = (H-P.t-P.b)/data.length;
    data.forEach(([lbl,v],i)=>{
      const y = P.t + i*step + (step-bh)/2;
      const w = (v/max) * (W-P.l-P.r);
      s.appendChild(sv('rect',{x:P.l,y,width:w,height:bh,rx:2, fill:'var(--c1)'}));
      s.appendChild(txt(P.l-6, y+bh/2+3, lbl, {anchor:'end'}));
      s.appendChild(txt(P.l+w+5, y+bh/2+3, v, {anchor:'start', fill:'#252423', weight:600}));
    });
    s.appendChild(axisLine(P.l, P.t, P.l, H-P.b));
    return s;
  }

  function drawLine(){
    const W=400, H=240, P={l:32,r:12,t:14,b:30};
    const series = [
      [22,38,30,52,48,65,72],
      [18,28,34,38,52,55,60],
      [12,20,18,30,28,38,42]
    ];
    const target = [30,32,34,36,40,42,44];
    const max = 80;
    const s = root(`0 0 ${W} ${H}`);
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
      s.appendChild(txt(P.l-6, y+3, (i*20), {anchor:'end'}));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    const step = (W-P.l-P.r)/(months.length-1);
    months.forEach((m,i)=>{
      s.appendChild(txt(P.l+i*step, H-P.b+14, m, {anchor:'middle'}));
    });
    // target dashed
    const tpath = target.map((v,i)=>`${i?'L':'M'}${P.l+i*step},${H-P.b-(v/max)*(H-P.t-P.b)}`).join(' ');
    s.appendChild(sv('path',{d:tpath, fill:'none', stroke:'#94A3B8','stroke-width':1.2,'stroke-dasharray':'4 3'}));
    series.forEach((arr, idx)=>{
      const p = arr.map((v,i)=>`${i?'L':'M'}${P.l+i*step},${H-P.b-(v/max)*(H-P.t-P.b)}`).join(' ');
      s.appendChild(sv('path',{d:p, fill:'none', stroke:`var(--c${idx+1})`,'stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round'}));
      arr.forEach((v,i)=>{
        s.appendChild(sv('circle',{cx:P.l+i*step, cy:H-P.b-(v/max)*(H-P.t-P.b), r:2.6, fill:'#fff', stroke:`var(--c${idx+1})`,'stroke-width':1.6}));
      });
    });
    return s;
  }

  function drawStackedCol(){
    const W=400, H=240, P={l:32,r:12,t:14,b:30};
    const data = [[20,15,25],[28,22,18],[32,30,15],[40,28,20],[35,35,22],[45,30,28],[42,38,30]];
    const totals = data.map(d=>d.reduce((a,b)=>a+b));
    const max = Math.max(...totals)*1.1;
    const s = root(`0 0 ${W} ${H}`);
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
      s.appendChild(txt(P.l-6, y+3, Math.round(max*i/4), {anchor:'end'}));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    const step = (W-P.l-P.r)/data.length;
    const bw = step*0.6;
    data.forEach((d,i)=>{
      const x = P.l + i*step + (step-bw)/2;
      let yacc = H-P.b;
      d.forEach((v,j)=>{
        const h = (v/max)*(H-P.t-P.b);
        s.appendChild(sv('rect',{x, y:yacc-h, width:bw, height:h, rx: j===d.length-1?2:0, fill:`var(--c${j+1})`}));
        yacc -= h;
      });
      s.appendChild(txt(x+bw/2, H-P.b+14, months[i], {anchor:'middle'}));
    });
    return s;
  }

  function drawClusteredBar(){
    const W=400, H=240, P={l:80,r:12,t:14,b:20};
    const data = [['North',[42,30]],['South',[38,28]],['East',[55,40]],['West',[48,35]],['Central',[60,45]]];
    const max = 70;
    const s = root(`0 0 ${W} ${H}`);
    const grp = (H-P.t-P.b)/data.length;
    const bh = (grp*0.7)/2;
    data.forEach(([lbl,arr],i)=>{
      const y0 = P.t + i*grp + grp*0.15;
      arr.forEach((v,j)=>{
        const w = (v/max)*(W-P.l-P.r);
        s.appendChild(sv('rect',{x:P.l, y:y0+j*bh, width:w, height:bh-1, rx:2, fill:`var(--c${j+1})`}));
      });
      s.appendChild(txt(P.l-6, y0+bh+3, lbl, {anchor:'end'}));
    });
    s.appendChild(axisLine(P.l, P.t, P.l, H-P.b));
    return s;
  }

  function drawStackedBar(){
    const W=400, H=240, P={l:60,r:12,t:14,b:20};
    const data = [['Direct',[40,25,15]],['Channel',[30,30,20]],['Online',[50,20,10]],['Field',[25,40,30]]];
    const totals = data.map(d=>d[1].reduce((a,b)=>a+b));
    const max = Math.max(...totals)*1.05;
    const s = root(`0 0 ${W} ${H}`);
    const grp = (H-P.t-P.b)/data.length;
    const bh = grp*0.6;
    data.forEach(([lbl,arr],i)=>{
      const y = P.t + i*grp + (grp-bh)/2;
      let xacc = P.l;
      arr.forEach((v,j)=>{
        const w = (v/max)*(W-P.l-P.r);
        s.appendChild(sv('rect',{x:xacc, y, width:w, height:bh, rx: j===arr.length-1?2:0, fill:`var(--c${j+1})`}));
        xacc += w;
      });
      s.appendChild(txt(P.l-6, y+bh/2+3, lbl, {anchor:'end'}));
    });
    return s;
  }

  function drawDonut(){
    const W=400, H=240;
    const cx=120, cy=H/2, r=78, ir=48;
    const data = [38, 22, 18, 12, 10];
    const labels = ['Enterprise','Mid','SMB','Self','Other'];
    const total = data.reduce((a,b)=>a+b);
    const s = root(`0 0 ${W} ${H}`);
    let a0 = -Math.PI/2;
    data.forEach((v,i)=>{
      const a1 = a0 + (v/total)*Math.PI*2;
      const large = (a1-a0) > Math.PI ? 1 : 0;
      const x0 = cx+r*Math.cos(a0), y0 = cy+r*Math.sin(a0);
      const x1 = cx+r*Math.cos(a1), y1 = cy+r*Math.sin(a1);
      const xi0 = cx+ir*Math.cos(a0), yi0 = cy+ir*Math.sin(a0);
      const xi1 = cx+ir*Math.cos(a1), yi1 = cy+ir*Math.sin(a1);
      const d = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${ir},${ir} 0 ${large} 0 ${xi0},${yi0} Z`;
      s.appendChild(sv('path',{d, fill:`var(--c${i+1})`}));
      a0 = a1;
    });
    // center value
    s.appendChild(txt(cx, cy-2, '$4.8M', {anchor:'middle', size:18, weight:700, fill:'#252423'}));
    s.appendChild(txt(cx, cy+13, 'Total', {anchor:'middle', size:9, fill:'#605E5C'}));
    // legend
    labels.forEach((lb,i)=>{
      const ly = 50 + i*22;
      s.appendChild(sv('rect',{x: 240, y: ly-9, width:11, height:11, rx:2, fill:`var(--c${i+1})`}));
      s.appendChild(txt(258, ly, lb, {size:11, fill:'#252423'}));
      s.appendChild(txt(W-12, ly, ((data[i]/total)*100).toFixed(0)+'%', {anchor:'end', size:11, weight:600, fill:'#252423'}));
    });
    return s;
  }

  function drawPie(){
    const W=400, H=240;
    const cx=W/2, cy=H/2, r=92;
    const data = [32, 24, 18, 14, 12];
    const total = data.reduce((a,b)=>a+b);
    const s = root(`0 0 ${W} ${H}`);
    let a0 = -Math.PI/2;
    data.forEach((v,i)=>{
      const a1 = a0 + (v/total)*Math.PI*2;
      const large = (a1-a0) > Math.PI ? 1 : 0;
      const x0 = cx+r*Math.cos(a0), y0 = cy+r*Math.sin(a0);
      const x1 = cx+r*Math.cos(a1), y1 = cy+r*Math.sin(a1);
      const d = `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`;
      s.appendChild(sv('path',{d, fill:`var(--c${i+1})`}));
      const am = (a0+a1)/2;
      const lx = cx + (r*0.65)*Math.cos(am);
      const ly = cy + (r*0.65)*Math.sin(am);
      s.appendChild(txt(lx, ly+3, ((v/total)*100).toFixed(0)+'%', {anchor:'middle', size:11, weight:700, fill:'#fff'}));
      a0 = a1;
    });
    return s;
  }

  function drawArea(){
    const W=400, H=240, P={l:32,r:12,t:14,b:30};
    const data = [22,38,30,52,48,65,72];
    const max=80;
    const s = root(`0 0 ${W} ${H}`);
    const id = 'ag'+Math.random().toString(36).slice(2,8);
    const grad = sv('defs',{},
      sv('linearGradient',{id, x1:0,x2:0,y1:0,y2:1},
        sv('stop',{offset:'0%','stop-color':'var(--c1)','stop-opacity':0.55}),
        sv('stop',{offset:'100%','stop-color':'var(--c1)','stop-opacity':0.05})
      )
    );
    s.appendChild(grad);
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
      s.appendChild(txt(P.l-6, y+3, (i*20), {anchor:'end'}));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    const step = (W-P.l-P.r)/(data.length-1);
    const pts = data.map((v,i)=>[P.l+i*step, H-P.b-(v/max)*(H-P.t-P.b)]);
    const path = pts.map(([x,y],i)=>`${i?'L':'M'}${x},${y}`).join(' ');
    s.appendChild(sv('path',{d:path+`L${pts[pts.length-1][0]},${H-P.b}L${pts[0][0]},${H-P.b}Z`, fill:`url(#${id})`}));
    s.appendChild(sv('path',{d:path, fill:'none', stroke:'var(--c1)','stroke-width':2}));
    months.forEach((m,i)=>s.appendChild(txt(P.l+i*step, H-P.b+14, m, {anchor:'middle'})));
    return s;
  }

  function drawScatter(){
    const W=400, H=240, P={l:32,r:12,t:14,b:30};
    const groups = [
      Array.from({length:14},()=>[Math.random()*100, Math.random()*60+30]),
      Array.from({length:14},()=>[Math.random()*100, Math.random()*60+10]),
      Array.from({length:14},()=>[Math.random()*100, Math.random()*40+0])
    ];
    const s = root(`0 0 ${W} ${H}`);
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    s.appendChild(axisLine(P.l, P.t, P.l, H-P.b));
    groups.forEach((g, idx)=>{
      g.forEach(([x,y])=>{
        const cx = P.l + (x/100)*(W-P.l-P.r);
        const cy = H-P.b - (y/100)*(H-P.t-P.b);
        s.appendChild(sv('circle',{cx, cy, r: 4, fill:`var(--c${idx+1})`, opacity:0.6}));
      });
    });
    return s;
  }

  function drawTreemap(){
    const W=400, H=240;
    const blocks = [
      {x:0,y:0,w:0.55,h:0.6, lbl:'Cloud', val:'$2.1M'},
      {x:0.55,y:0,w:0.45,h:0.35, lbl:'Services', val:'$1.3M'},
      {x:0.55,y:0.35,w:0.25,h:0.25, lbl:'Support', val:'$430K'},
      {x:0.8,y:0.35,w:0.2,h:0.25, lbl:'Train', val:'$320K'},
      {x:0,y:0.6,w:0.35,h:0.4, lbl:'License', val:'$680K'},
      {x:0.35,y:0.6,w:0.3,h:0.4, lbl:'Hardware', val:'$540K'},
      {x:0.65,y:0.6,w:0.35,h:0.4, lbl:'Other', val:'$210K'}
    ];
    const s = root(`0 0 ${W} ${H}`);
    blocks.forEach((b,i)=>{
      const x=b.x*W, y=b.y*H, w=b.w*W-2, h=b.h*H-2;
      s.appendChild(sv('rect',{x, y, width:w, height:h, fill:`var(--c${i+1})`}));
      if(w>40 && h>30){
        s.appendChild(txt(x+8, y+18, b.lbl, {size:11, weight:600, fill:'#fff'}));
        s.appendChild(txt(x+8, y+32, b.val, {size:10, fill:'rgba(255,255,255,.85)'}));
      }
    });
    return s;
  }

  function drawFunnel(){
    const W=400, H=240, P={l:8,r:8,t:8,b:8};
    const stages = [['Visitors',5400,100],['Leads',2800,52],['MQL',1400,26],['SQL',520,10],['Won',180,3]];
    const s = root(`0 0 ${W} ${H}`);
    const sh = (H-P.t-P.b)/stages.length;
    stages.forEach(([lbl,v,pct],i)=>{
      const w = (pct/100)*(W-P.l-P.r-100);
      const x = P.l + ((W-P.l-P.r-100) - w)/2 + 50;
      const y = P.t + i*sh + 2;
      s.appendChild(sv('rect',{x, y, width:w, height: sh-4, rx:2, fill:`var(--c${i+1})`}));
      s.appendChild(txt(P.l+8, y+sh/2+3, lbl, {size:11, weight:600, fill:'#252423'}));
      s.appendChild(txt(x+w/2, y+sh/2+3, pct+'%', {anchor:'middle', size:11, weight:700, fill:'#fff'}));
      s.appendChild(txt(W-P.r-2, y+sh/2+3, v.toLocaleString(), {anchor:'end', size:10, fill:'#605E5C'}));
    });
    return s;
  }

  function drawLineColumn(){
    const W=400, H=240, P={l:32,r:32,t:14,b:30};
    const cols = [38,52,46,68,60,74,82];
    const line = [22,28,32,40,46,52,58];
    const max=100, max2=80;
    const s = root(`0 0 ${W} ${H}`);
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
      s.appendChild(txt(P.l-4, y+3, (i*25), {anchor:'end'}));
      s.appendChild(txt(W-P.r+4, y+3, (i*20), {anchor:'start'}));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    const step = (W-P.l-P.r)/cols.length;
    const bw = step*0.55;
    cols.forEach((v,i)=>{
      const x = P.l+i*step+(step-bw)/2;
      const h = (v/max)*(H-P.t-P.b);
      s.appendChild(sv('rect',{x, y:H-P.b-h, width:bw, height:h, rx:2, fill:'var(--c1)'}));
      s.appendChild(txt(x+bw/2, H-P.b+14, months[i], {anchor:'middle'}));
    });
    const path = line.map((v,i)=>`${i?'L':'M'}${P.l+i*step+step/2},${H-P.b-(v/max2)*(H-P.t-P.b)}`).join(' ');
    s.appendChild(sv('path',{d:path, fill:'none', stroke:'var(--c4)','stroke-width':2}));
    line.forEach((v,i)=>s.appendChild(sv('circle',{cx:P.l+i*step+step/2, cy:H-P.b-(v/max2)*(H-P.t-P.b), r:3, fill:'var(--c4)'})));
    return s;
  }

  function drawLineStacked(){
    const W=400, H=240, P={l:32,r:32,t:14,b:30};
    const data = [[20,15,12],[28,18,14],[24,22,16],[34,26,18],[30,28,20],[40,30,22],[44,34,26]];
    const line = [30,38,42,52,58,68,76];
    const totals = data.map(d=>d.reduce((a,b)=>a+b));
    const max = Math.max(...totals)*1.1;
    const max2 = 100;
    const s = root(`0 0 ${W} ${H}`);
    for(let i=0;i<=4;i++){
      const y = P.t + (H-P.t-P.b)*(1-i/4);
      s.appendChild(grid(P.l, y, W-P.r, y));
    }
    s.appendChild(axisLine(P.l, H-P.b, W-P.r, H-P.b));
    const step = (W-P.l-P.r)/data.length;
    const bw = step*0.55;
    data.forEach((d,i)=>{
      const x = P.l+i*step+(step-bw)/2;
      let yacc = H-P.b;
      d.forEach((v,j)=>{
        const h = (v/max)*(H-P.t-P.b);
        s.appendChild(sv('rect',{x, y:yacc-h, width:bw, height:h, rx: j===d.length-1?2:0, fill:`var(--c${j+1})`}));
        yacc -= h;
      });
      s.appendChild(txt(x+bw/2, H-P.b+14, months[i], {anchor:'middle'}));
    });
    const path = line.map((v,i)=>`${i?'L':'M'}${P.l+i*step+step/2},${H-P.b-(v/max2)*(H-P.t-P.b)}`).join(' ');
    s.appendChild(sv('path',{d:path, fill:'none', stroke:'var(--c5)','stroke-width':2.2}));
    line.forEach((v,i)=>s.appendChild(sv('circle',{cx:P.l+i*step+step/2, cy:H-P.b-(v/max2)*(H-P.t-P.b), r:3, fill:'#fff', stroke:'var(--c5)','stroke-width':1.6})));
    return s;
  }

  function drawGauge(){
    const W=400, H=240;
    const cx=W/2, cy=H*0.72, r=110;
    const s = root(`0 0 ${W} ${H}`);
    const arcSeg = (a0,a1,color)=>{
      const x0 = cx+r*Math.cos(a0), y0 = cy+r*Math.sin(a0);
      const x1 = cx+r*Math.cos(a1), y1 = cy+r*Math.sin(a1);
      const xi0 = cx+(r-22)*Math.cos(a0), yi0 = cy+(r-22)*Math.sin(a0);
      const xi1 = cx+(r-22)*Math.cos(a1), yi1 = cy+(r-22)*Math.sin(a1);
      const d = `M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1} L${xi1},${yi1} A${r-22},${r-22} 0 0 0 ${xi0},${yi0} Z`;
      return sv('path',{d, fill:color});
    };
    s.appendChild(arcSeg(Math.PI, Math.PI*1.33, 'var(--c-bad)'));
    s.appendChild(arcSeg(Math.PI*1.33, Math.PI*1.66, 'var(--c-neutral)'));
    s.appendChild(arcSeg(Math.PI*1.66, 2*Math.PI, 'var(--c-good)'));
    // needle
    const v = 0.72;
    const ang = Math.PI + v*Math.PI;
    const nx = cx+(r-30)*Math.cos(ang), ny = cy+(r-30)*Math.sin(ang);
    s.appendChild(sv('line',{x1:cx,y1:cy,x2:nx,y2:ny, stroke:'#252423','stroke-width':2.4,'stroke-linecap':'round'}));
    s.appendChild(sv('circle',{cx,cy,r:6, fill:'#252423'}));
    s.appendChild(txt(cx, cy-30, '72%', {anchor:'middle', size:24, weight:700, fill:'#252423'}));
    s.appendChild(txt(cx, cy-12, 'On track', {anchor:'middle', size:11, fill:'#605E5C'}));
    s.appendChild(txt(cx-r+8, cy+14, '0', {anchor:'middle', size:9, fill:'#605E5C'}));
    s.appendChild(txt(cx+r-8, cy+14, '100', {anchor:'middle', size:9, fill:'#605E5C'}));
    return s;
  }

  function drawTable(){
    const W=400, H=240;
    const rows = [
      ['North',  '$1,420K', '+12.4%', 'Active'],
      ['South',  '$  980K', '+ 4.1%', 'Active'],
      ['East',   '$1,210K', '+ 8.7%', 'Active'],
      ['West',   '$  840K', '- 2.3%', 'Review'],
      ['Central','$  720K', '+ 5.8%', 'Active'],
      ['Total',  '$5,170K', '+ 6.2%', '']
    ];
    const headers = ['Region','Revenue','Growth','Status'];
    const colW = [110,110,90,90];
    const rowH = 26;
    const s = root(`0 0 ${W} ${H}`);
    // header
    s.appendChild(sv('rect',{x:0,y:0,width:W,height:rowH, fill:'var(--c1)'}));
    let xacc = 8;
    headers.forEach((h,i)=>{
      s.appendChild(txt(xacc, rowH/2+3, h, {size:10.5, weight:600, fill:'#fff'}));
      xacc += colW[i];
    });
    // rows
    rows.forEach((r,i)=>{
      const y = rowH + i*rowH;
      const isTotal = i===rows.length-1;
      s.appendChild(sv('rect',{x:0, y, width:W, height:rowH, fill: isTotal? 'var(--c-table-accent)': (i%2? '#FAFAFA':'#fff')}));
      let xa = 8;
      r.forEach((v,j)=>{
        let fill = '#252423';
        let weight = isTotal?700:400;
        if(j===2 && !isTotal){ fill = v.includes('-') ? '#C72F2F':'#107C41'; weight=600; }
        s.appendChild(txt(xa, y+rowH/2+3, v, {size:11, weight, fill}));
        xa += colW[j];
      });
    });
    return s;
  }

  function drawMatrix(){
    const W=400, H=240;
    const rowH=22;
    const s = root(`0 0 ${W} ${H}`);
    s.appendChild(sv('rect',{x:0,y:0, width:W, height:rowH, fill:'var(--c1)'}));
    ['Category','Q1','Q2','Q3','Q4','Total'].forEach((h,i)=>{
      const x = i===0?8 : 110 + (i-1)*58;
      s.appendChild(txt(x, rowH/2+3, h, {size:10.5, weight:600, fill:'#fff', anchor: i===0?'start':'middle'}));
    });
    const groups = [
      {name:'Cloud', sub:[['IaaS',[210,240,265,290]],['PaaS',[180,205,225,250]],['SaaS',[320,350,380,420]]]},
      {name:'Services', sub:[['Consulting',[90,110,130,150]],['Support',[60,75,80,95]]]},
    ];
    let yacc = rowH;
    groups.forEach(g=>{
      const total = g.sub.reduce((a,b)=>a+b[1].reduce((x,y)=>x+y,0),0);
      s.appendChild(sv('rect',{x:0,y:yacc,width:W,height:rowH, fill:'var(--c-table-accent)'}));
      s.appendChild(txt(8, yacc+rowH/2+3, '▾ '+g.name, {size:11, weight:700, fill:'#252423'}));
      s.appendChild(txt(W-8, yacc+rowH/2+3, '$'+total+'K', {size:11, weight:700, anchor:'end', fill:'#252423'}));
      yacc += rowH;
      g.sub.forEach((row,ri)=>{
        s.appendChild(sv('rect',{x:0,y:yacc, width:W, height:rowH, fill: ri%2? '#FAFAFA':'#fff'}));
        s.appendChild(txt(20, yacc+rowH/2+3, row[0], {size:11, fill:'#252423'}));
        let total=0;
        row[1].forEach((v,i)=>{
          s.appendChild(txt(110+i*58, yacc+rowH/2+3, v, {size:11, anchor:'middle', fill:'#252423'}));
          total+=v;
        });
        s.appendChild(txt(W-8, yacc+rowH/2+3, total, {size:11, weight:600, anchor:'end', fill:'#252423'}));
        yacc += rowH;
      });
    });
    return s;
  }

  function drawMap(){
    const W=400, H=240;
    const s = root(`0 0 ${W} ${H}`);
    // simple "India" silhouette polygon (stylized placeholder)
    s.appendChild(sv('path',{
      d:'M150 25 L210 30 L240 60 L260 100 L255 140 L235 175 L210 205 L185 220 L165 215 L155 195 L150 175 L140 165 L130 145 L115 125 L100 100 L95 75 L110 50 Z',
      fill:'#EEF2F7', stroke:'#CBD5E1','stroke-width':1
    }));
    // dots
    const cities = [
      {x:170,y:70, r:10, lb:'Delhi',  v:1240},
      {x:140,y:140,r:14, lb:'Mumbai', v:2100},
      {x:200,y:140,r:8,  lb:'Kolkata',v:780},
      {x:185,y:185,r:9,  lb:'Chennai',v:920},
      {x:160,y:175,r:7,  lb:'Bangalore',v:660},
      {x:225,y:90, r:6,  lb:'Lucknow',v:430}
    ];
    cities.forEach((c,i)=>{
      s.appendChild(sv('circle',{cx:c.x, cy:c.y, r:c.r, fill:`var(--c${(i%8)+1})`, opacity:0.7, stroke:`var(--c${(i%8)+1})`,'stroke-width':1.4}));
      s.appendChild(sv('circle',{cx:c.x, cy:c.y, r:2, fill:'#fff'}));
    });
    // legend
    [200,800,1500,2200].forEach((v,i)=>{
      s.appendChild(sv('circle',{cx:300, cy: 40+i*32, r: 4+i*3, fill:'var(--c1)', opacity:0.5, stroke:'var(--c1)','stroke-width':1.2}));
      s.appendChild(txt(320, 43+i*32, v+'K', {size:10, fill:'#252423'}));
    });
    return s;
  }

  function drawSlicer(){
    const W=400, H=240;
    const s = root(`0 0 ${W} ${H}`);
    // search box
    s.appendChild(sv('rect',{x:8,y:8,width:W-16,height:24, rx:4, fill:'#fff', stroke:'#D2D0CE','stroke-width':1}));
    s.appendChild(sv('circle',{cx:18,cy:20, r:4.5, fill:'none', stroke:'#605E5C','stroke-width':1.4}));
    s.appendChild(sv('line',{x1:21,y1:23,x2:25,y2:27, stroke:'#605E5C','stroke-width':1.4,'stroke-linecap':'round'}));
    s.appendChild(txt(32, 24, 'Search', {size:11, fill:'#A19F9D'}));
    const items = [
      ['Enterprise', true],
      ['Mid-Market', true],
      ['Small Business', false],
      ['Self-serve', false],
      ['Channel Partner', true],
      ['Distributor', false],
      ['Reseller', true]
    ];
    items.forEach(([lbl,on],i)=>{
      const y = 44 + i*26;
      // checkbox
      s.appendChild(sv('rect',{x:10, y:y-9, width:14, height:14, rx:2, fill: on?'var(--c1)':'#fff', stroke: on?'var(--c1)':'#BBBBBB','stroke-width':1.4}));
      if(on){
        s.appendChild(sv('path',{d:`M${13},${y-2} l3,3 l5,-6`, stroke:'#fff','stroke-width':1.8, fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));
      }
      s.appendChild(txt(32, y+2, lbl, {size:11.5, fill:'#252423'}));
    });
    return s;
  }

  return {
    drawBar, drawClusteredCol, drawClusteredBar, drawStackedBar, drawStackedCol,
    drawLine, drawArea, drawDonut, drawPie, drawScatter,
    drawTreemap, drawFunnel, drawLineColumn, drawLineStacked,
    drawGauge, drawTable, drawMatrix, drawMap, drawSlicer
  };
})();

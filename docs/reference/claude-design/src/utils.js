/* ─── Utilities ─── */
window.U = {
  // hex helpers
  isHex(s){ return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s||'').trim()); },
  sanitizeHex(s, fb='#000000'){
    if(!s) return fb;
    let h = String(s).trim();
    if(!h.startsWith('#')) h = '#'+h;
    if(/^#[0-9a-f]{3}$/i.test(h)){
      h = '#'+h.slice(1).split('').map(c=>c+c).join('');
    }
    if(/^#[0-9a-f]{6}$/i.test(h)) return h.toUpperCase();
    return fb;
  },
  hexToRgb(hex){
    const h = U.sanitizeHex(hex).slice(1);
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  },
  rgbToHex(r,g,b){
    const t = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2,'0');
    return '#' + (t(r)+t(g)+t(b)).toUpperCase();
  },
  mix(a, b, t){
    const ra = U.hexToRgb(a), rb = U.hexToRgb(b);
    return U.rgbToHex(ra.r+(rb.r-ra.r)*t, ra.g+(rb.g-ra.g)*t, ra.b+(rb.b-ra.b)*t);
  },
  luminance(hex){
    const {r,g,b} = U.hexToRgb(hex);
    const a = [r,g,b].map(v=>{
      v/=255;
      return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
  },
  contrast(a,b){
    const la = U.luminance(a), lb = U.luminance(b);
    return (Math.max(la,lb)+0.05) / (Math.min(la,lb)+0.05);
  },
  isDark(hex){ return U.luminance(hex) < 0.5; },
  alpha(hex, a){
    const {r,g,b} = U.hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  },
  // dom
  el(tag, attrs={}, ...kids){
    const e = document.createElement(tag);
    for(const k in attrs){
      if(k==='class') e.className = attrs[k];
      else if(k==='style' && typeof attrs[k]==='object') Object.assign(e.style, attrs[k]);
      else if(k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if(attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(k=>{
      if(k==null||k===false) return;
      if(typeof k==='string'||typeof k==='number') e.appendChild(document.createTextNode(k));
      else e.appendChild(k);
    });
    return e;
  },
  svg(tag, attrs={}, ...kids){
    const NS='http://www.w3.org/2000/svg';
    const e = document.createElementNS(NS, tag);
    for(const k in attrs){
      if(attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(k=>{
      if(k==null||k===false) return;
      if(typeof k==='string'||typeof k==='number') e.appendChild(document.createTextNode(k));
      else e.appendChild(k);
    });
    return e;
  },
  caret(){
    return U.svg('svg',{class:'caret', viewBox:'0 0 16 16', fill:'none'},
      U.svg('path',{d:'M6 4l4 4-4 4', stroke:'currentColor', 'stroke-width':'1.6', 'stroke-linecap':'round', 'stroke-linejoin':'round'})
    );
  },
  toast(msg){
    let t = document.querySelector('.toast');
    if(!t){
      t = U.el('div',{class:'toast'});
      document.body.appendChild(t);
    }
    t.innerHTML = '';
    t.appendChild(icon('check'));
    t.appendChild(document.createTextNode(msg));
    requestAnimationFrame(()=>t.classList.add('show'));
    clearTimeout(t._tm);
    t._tm = setTimeout(()=>t.classList.remove('show'), 1900);
  },
  download(filename, content, mime='application/json'){
    const blob = content instanceof Blob ? content : new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  },
  copy(text){
    navigator.clipboard?.writeText(text).then(()=>U.toast('Copied to clipboard'));
  },
  parseColors(text){
    const m = String(text).match(/(?:#)?[0-9a-f]{6}/gi) || [];
    return [...new Set(m.map(s=>U.sanitizeHex(s)))];
  }
};

/* ─── Icon library (inline svg) ─── */
window.icon = function(name, size=16){
  const ns='http://www.w3.org/2000/svg';
  const wrap = (path, vb='0 0 24 24') => {
    const s = document.createElementNS(ns,'svg');
    s.setAttribute('class','ico');
    s.setAttribute('viewBox', vb);
    s.setAttribute('fill','none');
    s.setAttribute('stroke','currentColor');
    s.setAttribute('stroke-width','1.6');
    s.setAttribute('stroke-linecap','round');
    s.setAttribute('stroke-linejoin','round');
    s.setAttribute('width', size); s.setAttribute('height', size);
    path.forEach(d=>{
      const p = document.createElementNS(ns,'path');
      p.setAttribute('d', d);
      s.appendChild(p);
    });
    return s;
  };
  const wrapRaw = (children, vb='0 0 24 24') => {
    const s = document.createElementNS(ns,'svg');
    s.setAttribute('class','ico');
    s.setAttribute('viewBox', vb);
    s.setAttribute('fill','none');
    s.setAttribute('stroke','currentColor');
    s.setAttribute('stroke-width','1.6');
    s.setAttribute('stroke-linecap','round');
    s.setAttribute('stroke-linejoin','round');
    s.setAttribute('width', size); s.setAttribute('height', size);
    children.forEach(c=>s.appendChild(c));
    return s;
  };
  const I = {
    bar:           ['M3 5h11M3 10h7M3 15h13M3 20h9'],
    col:           ['M5 21V11M10 21V6M15 21V14M20 21V8'],
    stackedBar:    ['M3 6h10M3 12h14M3 18h8'],
    stackedCol:    ['M5 21V8M5 14h0M10 21V5M15 21V11M20 21V13'],
    clusteredBar:  ['M3 6h10M3 9h6M3 14h13M3 17h7M3 21h9M3 4h7'],
    clusteredCol:  ['M5 21V11M8 21V8M12 21V13M15 21V6M19 21V12M22 21V9'],
    donut:         ['M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16Z','M12 8v0a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z'],
    pie:           ['M12 4v8l5.7 5.7a8 8 0 1 1-5.7-13.7Z','M12 4a8 8 0 0 1 8 8h-8V4Z'],
    area:          ['M3 17l5-7 4 4 5-8 4 5v6H3z'],
    line:          ['M3 17l5-6 4 3 5-9 4 4'],
    scatter:       ['M5 19h0M9 13h0M13 16h0M17 9h0M20 14h0M7 6h0','M19 19v-2','M5 19V5h14'],
    funnel:        ['M3 5h18l-7 8v6l-4 2v-8L3 5Z'],
    treemap:       ['M3 4h18v8H3z','M3 12h10v8H3z','M13 12h8v8h-8z','M3 4v16','M21 4v16'],
    lineCol:       ['M5 21V13M10 21V9M15 21V14M20 21V7','M3 6l5 4 5-3 5 5 5-4'],
    lineStacked:   ['M5 21V12M10 21V9M15 21V14M20 21V11','M3 5l5 3 5-2 5 4 5-3'],
    gauge:         ['M4 16a8 8 0 1 1 16 0','M12 16l4-5'],
    table:         ['M3 5h18v14H3z','M3 9h18M3 14h18M9 5v14M15 5v14'],
    matrix:        ['M3 5h18v14H3z','M3 9h18','M3 14h18','M9 5v14','M15 5v14','M9 9h6v5H9z'],
    map:           ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z','M9 4v14','M15 6v14'],
    slicer:        ['M4 6h16','M4 12h16','M4 18h16','M9 6h0','M14 12h0','M11 18h0'],
    dashboard:     ['M3 5h7v6H3z','M14 5h7v3h-7z','M14 11h7v8h-7z','M3 14h7v5H3z'],
    download:      ['M12 4v12','M7 11l5 5 5-5','M5 20h14'],
    copy:          ['M9 4h11v11','M4 9h11v11H4z'],
    upload:        ['M12 20V8','M7 13l5-5 5 5','M5 4h14'],
    plus:          ['M12 5v14','M5 12h14'],
    check:         ['M5 12l4 4L19 7'],
    grid:          ['M4 4h7v7H4z','M13 4h7v7h-7z','M4 13h7v7H4z','M13 13h7v7h-7z'],
    chevL:         ['M14 6l-6 6 6 6'],
    chevR:         ['M10 6l6 6-6 6'],
    arrL:          ['M19 12H5','M11 18l-6-6 6-6'],
    layer:         ['M12 4 3 9l9 5 9-5-9-5Z','M3 14l9 5 9-5'],
    settings:      ['M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z','M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.5-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.4a7 7 0 0 0-2 1.2l-2.3-.9-2 3.5 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.5 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.4c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.5-2-1.6c.1-.4.1-.8.1-1.2Z'],
    sparkle:       ['M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4Z'],
    pin:           ['M12 4v16','M9 4h6','M9 10h6'],
    eye:           ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z','M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z'],
    palette:       ['M12 4a8 8 0 0 0-1 16c1 .1 2-.7 2-1.5s-.7-1.5-1.2-1.5H10a2 2 0 0 1-2-2c0-1.1.9-2 2-2h2a4 4 0 0 0 4-4c0-3.3-2.7-5-6-5Z','M8 12h0','M11 8h0','M16 11h0'],
    trendUp:       ['M5 17l5-5 4 3 5-8','M14 7h5v5'],
    trendDn:       ['M5 7l5 5 4-3 5 8','M14 17h5v-5'],
    sun:           ['M12 4v2','M12 18v2','M4 12h2','M18 12h2','M6 6l1.4 1.4','M16.6 16.6 18 18','M6 18l1.4-1.4','M16.6 7.4 18 6','M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'],
    moon:          ['M20 14a8 8 0 0 1-10-10 8 8 0 1 0 10 10Z'],
    pkg:           ['M3 7l9-3 9 3v10l-9 3-9-3V7Z','M3 7l9 3 9-3','M12 10v10']
  };
  if(I[name]) return wrap(I[name]);
  return wrap(['M4 4h16v16H4z']);
};

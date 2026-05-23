/* ─── App init ─── */
(function(){
  const app = document.getElementById('app');

  function render(){
    app.innerHTML = '';
    const sb = U.el('div',{}); Sidebar.render(sb); app.appendChild(sb.firstChild);
    const cv = U.el('div',{style:{minWidth:0, display:'flex'}}); CanvasView.render(cv); app.appendChild(cv.firstChild);
    const rp = U.el('div',{}); RightPanel.render(rp); app.appendChild(rp.firstChild);
  }

  bus.on(render);

  window.addEventListener('resize', ()=>{
    // re-fit canvas without full re-render
    const c = document.querySelector('#pbi-canvas');
    if(!c) return;
    const area = document.querySelector('.canvas-area');
    const sz = PAGE_SIZES[state.pageSize];
    let scale = 1;
    if(state.zoom==='fit'){
      const aw = area.clientWidth - 48;
      const ah = area.clientHeight - 48 - 60;
      scale = Math.min(aw/sz.w, ah/sz.h, 1);
    } else { scale = (+state.zoom)/100; }
    c.style.transform = `scale(${scale})`;
    c.style.marginBottom = `-${(1-scale)*sz.h}px`;
    c.style.marginRight = `-${(1-scale)*sz.w}px`;
  });

  render();
})();

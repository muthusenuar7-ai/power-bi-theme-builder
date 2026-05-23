/* ─── Canvas (toolbar + visual selector + dashboard) ─── */
window.CanvasView = (function(){

  function render(host){
    host.innerHTML = '';
    host.appendChild(U.el('div',{class:'canvas-col'},
      toolbar(),
      visualBar(),
      U.el('div',{class:'canvas-area'},
        canvasStage(),
        pageNav()
      )
    ));
    fitCanvas(host);
  }

  function toolbar(){
    const sizeOpts = Object.keys(PAGE_SIZES);
    const tb = U.el('div',{class:'toolbar'});

    // Page size
    tb.appendChild(group('Page',
      U.el('select',{class:'select', onchange: e=>setState({pageSize:e.target.value})},
        ...sizeOpts.map(k=>U.el('option',{value:k, selected: state.pageSize===k? 'selected':false}, PAGE_SIZES[k].label))
      )
    ));

    // Zoom
    tb.appendChild(divider());
    tb.appendChild(group('Zoom',
      U.el('select',{class:'select', onchange: e=>setState({zoom:e.target.value})},
        ...['fit','25','50','75','100'].map(z=>U.el('option',{value:z, selected: state.zoom===z?'selected':false},
          z==='fit'?'Fit': z+'%'))
      )
    ));

    // Slicers
    tb.appendChild(divider());
    tb.appendChild(group('Slicers',
      U.el('select',{class:'select', style:{width:'58px'}, onchange:e=>setState({layout:{...state.layout, numSlicers:+e.target.value}})},
        ...[0,1,2,3,4,5].map(n=>U.el('option',{value:n, selected: state.layout.numSlicers===n?'selected':false}, n))
      ),
      U.el('select',{class:'select', style:{width:'72px'}, onchange:e=>setState({layout:{...state.layout, slicerPos:e.target.value}})},
        ...['Top','Left','Right'].map(p=>U.el('option',{value:p, selected: state.layout.slicerPos===p?'selected':false}, p))
      )
    ));

    // KPIs
    tb.appendChild(divider());
    tb.appendChild(group('KPIs',
      U.el('select',{class:'select', style:{width:'58px'}, onchange:e=>setState({layout:{...state.layout, numKpis:+e.target.value}})},
        ...[0,2,3,4,5,6,8].map(n=>U.el('option',{value:n, selected: state.layout.numKpis===n?'selected':false}, n))
      )
    ));

    // Spacing
    tb.appendChild(divider());
    tb.appendChild(group('Spacing',
      U.el('div',{class:'slider-row',style:{width:'130px'}},
        U.el('input',{class:'slider', type:'range', min:4, max:28, value:state.spacing,
          oninput: e=>setState({spacing:+e.target.value})
        }),
        U.el('div',{class:'slider-val'}, state.spacing+'px')
      )
    ));

    // Exports
    tb.appendChild(U.el('div',{style:{marginLeft:'auto', display:'flex', gap:'6px'}},
      U.el('button',{class:'btn sm', onclick: ()=>Exports.png()}, icon('download',12),'PNG'),
      U.el('button',{class:'btn sm', onclick: ()=>Exports.layoutJSON()}, icon('layer',12),'Layout'),
      U.el('button',{class:'btn sm', onclick: ()=>Exports.pbiTemplate()}, icon('pkg',12),'PBI Template'),
      U.el('button',{class:'btn brand sm', onclick: ()=>Exports.themeJSON()}, icon('download',12),'Export theme')
    ));

    return tb;
  }

  function group(label, ...kids){
    return U.el('div',{class:'tb-group'},
      U.el('span',{class:'tb-label'}, label),
      ...kids
    );
  }
  function divider(){ return U.el('div',{class:'tb-divider'}); }

  function visualBar(){
    const bar = U.el('div',{class:'vsel-bar'});
    // Dashboard button
    const dashBtn = U.el('button',{class:'vbtn'+(state.focusVisual===null?' active':''), 'data-dashboard':'true',
      onclick: ()=> setState({focusVisual:null, selectedVisual:null})
    }, icon('dashboard',14), 'Dashboard');
    bar.appendChild(dashBtn);
    bar.appendChild(U.el('div',{class:'sep'}));
    // unique visuals
    const seen = new Set();
    VISUALS.forEach(v=>{
      if(seen.has(v.id)) return;
      seen.add(v.id);
      const b = U.el('button',{
        class:'vbtn'+(state.focusVisual===v.id?' active':''),
        title: v.name,
        onclick: ()=> setState({focusVisual: v.id, selectedVisual: v.id})
      }, icon(v.icon,18));
      bar.appendChild(b);
    });
    return bar;
  }

  function canvasStage(){
    const stage = U.el('div',{class:'canvas-stage', id:'canvas-stage'});
    const sz = PAGE_SIZES[state.pageSize];
    const bgIsDark = U.isDark(state.bg);
    const cardBg = bgIsDark ? '#1F2937' : '#FFFFFF';
    const cardBorder = bgIsDark ? '#334155' : '#E4E4E4';
    const fgMuted = bgIsDark ? '#94A3B8' : '#605E5C';
    const radius = state.formatProps['adv.radius'] != null ? state.formatProps['adv.radius'] : 6;

    const canvas = U.el('div',{class:'pbi-canvas', id:'pbi-canvas'});
    canvas.style.width = sz.w+'px';
    canvas.style.height = sz.h+'px';
    // Inject CSS variables for theme reactivity
    canvas.style.setProperty('--canvas-bg', state.bg);
    canvas.style.setProperty('--theme-fg', state.fg);
    canvas.style.setProperty('--theme-fg-muted', fgMuted);
    canvas.style.setProperty('--theme-primary', state.primary);
    canvas.style.setProperty('--theme-accent', state.accent);
    canvas.style.setProperty('--theme-font', state.font);
    canvas.style.setProperty('--card-bg', cardBg);
    canvas.style.setProperty('--card-border', cardBorder);
    canvas.style.setProperty('--card-radius', radius+'px');
    const showShadow = state.formatProps['adv.shadow'] !== false;
    const showBorder = state.formatProps['adv.border'] === true;
    canvas.style.setProperty('--card-shadow', showShadow ? '0 1px 3px rgba(0,0,0,.06)' : 'none');
    canvas.style.setProperty('--card-border', showBorder ? cardBorder : 'transparent');
    canvas.style.setProperty('--cc-title-size', state.fs.title+'px');
    canvas.style.setProperty('--cc-title-color', state.fg);
    canvas.style.setProperty('--gap', state.spacing+'px');
    canvas.style.setProperty('--card-pad', Math.max(8, state.spacing)+'px');
    state.dataColors.forEach((c,i)=>canvas.style.setProperty('--c'+(i+1), c));
    canvas.style.setProperty('--c-good', state.good);
    canvas.style.setProperty('--c-bad', state.bad);
    canvas.style.setProperty('--c-neutral', state.neutral);
    canvas.style.setProperty('--c-table-accent', state.tableAccent);

    if(state.focusVisual){
      canvas.appendChild(focusView());
    } else {
      canvas.appendChild(dashboardView());
    }

    // canvas tag
    canvas.appendChild(U.el('div',{class:'canvas-tag'},
      icon(state.focusVisual? VISUALS.find(v=>v.id===state.focusVisual)?.icon || 'eye' : 'dashboard', 11),
      U.el('span',{}, state.focusVisual? VISUALS.find(v=>v.id===state.focusVisual).name : (PAGES[state.currentPage].name+' · Dashboard')),
      U.el('span',{class:'px'}, sz.w+'×'+sz.h)
    ));
    if(state.focusVisual){
      canvas.appendChild(U.el('button',{class:'exit-focus', onclick:()=>setState({focusVisual:null})},
        icon('arrL',12),'Dashboard'
      ));
    }

    stage.appendChild(canvas);
    return stage;
  }

  function dashboardView(){
    const sz = PAGE_SIZES[state.pageSize];
    const layout = state.layout;
    const page = PAGES[state.currentPage];
    const charts = PAGE_CHARTS[page.name] || PAGE_CHARTS.Overview;

    let dashClass = 'dash';
    if(layout.numSlicers>0){
      if(layout.slicerPos==='Left') dashClass += ' with-left';
      else if(layout.slicerPos==='Right') dashClass += ' with-right';
      else dashClass += ' with-top';
    } else {
      dashClass += ' no-slicers';
    }

    const dash = U.el('div',{class: dashClass});

    // Header
    dash.appendChild(U.el('div',{class:'card d-header'},
      U.el('div',{},
        U.el('h1',{}, page.name),
        U.el('div',{class:'sub'}, page.sub)
      ),
      U.el('div',{class:'filter-pills'},
        ...['All','Q1','Q2','Q3','Q4'].map((p,i)=>U.el('button',{class:'pill'+(i===0?' active':'')}, p))
      )
    ));

    // KPIs
    if(layout.numKpis>0){
      const kpiData = [
        ['Revenue','$4.82M','+12.4%','up','trendUp'],
        ['Customers','24,180','+ 8.6%','up','trendUp'],
        ['ARPU','$199','-1.4%','dn','trendDn'],
        ['NPS','62','+ 4','up','sparkle'],
        ['Churn','2.1%','-0.3%','up','trendDn'],
        ['Pipeline','$11.6M','+18.2%','up','trendUp'],
        ['Win rate','38%','+ 2.1%','up','trendUp'],
        ['Avg deal','$48K','+ 6.8%','up','trendUp']
      ].slice(0, layout.numKpis);
      const kpis = U.el('div',{class:'d-kpis'});
      kpis.style.gridTemplateColumns = `repeat(${layout.numKpis}, 1fr)`;
      kpiData.forEach((k,i)=>{
        const accent = state.dataColors[i % state.dataColors.length];
        const card = U.el('div',{class:'kpi-card'});
        card.style.setProperty('--kpi-accent', accent);
        card.appendChild(U.el('div',{class:'kpi-label'}, icon(k[4],11), k[0]));
        const val = U.el('div',{class:'kpi-val'}, k[1]);
        val.style.fontSize = state.fs.callout+'px';
        card.appendChild(val);
        if(state.formatProps['card.trend'] !== false){
          card.appendChild(U.el('div',{class:'kpi-trend '+k[3]}, icon(k[3]==='up'?'trendUp':'trendDn',10), k[2]));
        }
        kpis.appendChild(card);
      });
      dash.appendChild(kpis);
    }

    // Slicers
    if(layout.numSlicers>0){
      const slicerNames = ['Region','Segment','Period','Channel','Product'];
      const slicerVals = [
        ['North','South','East','West'],
        ['Enterprise','Mid','SMB'],
        ['Q1','Q2','Q3','Q4'],
        ['Direct','Channel','Online'],
        ['Cloud','SaaS','PaaS']
      ];
      const sl = U.el('div',{class: layout.slicerPos==='Top'?'d-topsl':'d-sidebar'});
      for(let i=0;i<layout.numSlicers;i++){
        const items = U.el('div',{class:'sl-items'});
        slicerVals[i].forEach((v,j)=>{
          items.appendChild(U.el('div',{class:'sl-item'},
            U.el('div',{class:'sl-box'+(j<2?' on':'')}),
            v
          ));
        });
        sl.appendChild(U.el('div',{class:'slicer'},
          U.el('div',{class:'sl-head'}, slicerNames[i]),
          items
        ));
      }
      dash.appendChild(sl);
    }

    // Charts grid
    const numCharts = sz.w>=2200? 8 : sz.w>=1600? 6 : 4;
    const grid = U.el('div',{class:'d-charts ' + (numCharts===8?'g-4x2': numCharts===6?'g-3x2':'g-2x2')});
    const titles = [
      ['Revenue trend','Last 7 months'],
      ['Pipeline by region','Current quarter'],
      ['Revenue mix','By product line'],
      ['Top accounts','Gross margin %'],
      ['Customer growth','Trailing 12 months'],
      ['Conversion funnel','Lead → Won'],
      ['Geographic spread','Active regions'],
      ['Quarterly attainment','Plan vs actual']
    ];
    for(let i=0;i<numCharts;i++){
      const vid = charts[i] || charts[0];
      const v = VISUALS.find(x=>x.id===vid) || VISUALS[0];
      const card = U.el('div',{class:'chart-card', onclick: ()=> setState({focusVisual: v.id, selectedVisual: v.id})});
      card.appendChild(U.el('div',{class:'chart-title'}, titles[i][0]));
      card.appendChild(U.el('div',{class:'chart-sub'}, titles[i][1]));
      const wrap = U.el('div',{class:'chart-svg-wrap'});
      wrap.appendChild(Charts[v.draw]());
      card.appendChild(wrap);
      grid.appendChild(card);
    }
    dash.appendChild(grid);

    return dash;
  }

  function focusView(){
    const v = VISUALS.find(x=>x.id===state.focusVisual);
    const wrap = U.el('div',{style:{
      position:'absolute', inset:'40px 24px 24px 24px',
      display:'flex', flexDirection:'column', gap:'12px'
    }});
    const card = U.el('div',{class:'card', style:{flex:'1', display:'flex', flexDirection:'column'}});
    card.appendChild(U.el('div',{class:'chart-title', style:{fontSize:'18px'}}, v.name));
    card.appendChild(U.el('div',{class:'chart-sub'}, 'Live theme preview'));
    const svgWrap = U.el('div',{class:'chart-svg-wrap', style:{flex:1, marginTop:'10px'}});
    const svg = Charts[v.draw]();
    svg.style.maxHeight = '100%';
    svgWrap.appendChild(svg);
    card.appendChild(svgWrap);
    wrap.appendChild(card);
    return wrap;
  }

  function pageNav(){
    return U.el('div',{class:'page-nav'},
      U.el('button',{onclick:()=> setState({currentPage: Math.max(0, state.currentPage-1)}),
        disabled: state.currentPage===0? 'disabled':false}, icon('chevL',14)),
      U.el('div',{class:'dots'},
        ...PAGES.map((p,i)=>U.el('button',{class:'dot'+(i===state.currentPage?' active':''),
          onclick:()=>setState({currentPage:i}), title: p.name}))
      ),
      U.el('button',{onclick:()=> setState({currentPage: Math.min(PAGES.length-1, state.currentPage+1)}),
        disabled: state.currentPage===PAGES.length-1? 'disabled':false}, icon('chevR',14)),
      U.el('div',{class:'pn-label'}, `Page ${state.currentPage+1} of ${PAGES.length} · ${PAGES[state.currentPage].name}`)
    );
  }

  function fitCanvas(host){
    requestAnimationFrame(()=>{
      const c = host.querySelector('.pbi-canvas');
      if(!c) return;
      const area = host.querySelector('.canvas-area');
      const sz = PAGE_SIZES[state.pageSize];
      let scale = 1;
      if(state.zoom==='fit'){
        const aw = area.clientWidth - 48;
        const ah = area.clientHeight - 48 - 60; // pagenav
        scale = Math.min(aw/sz.w, ah/sz.h, 1);
      } else {
        scale = (+state.zoom)/100;
      }
      c.style.transform = `scale(${scale})`;
      c.style.marginBottom = `-${(1-scale)*sz.h}px`;
      c.style.marginRight = `-${(1-scale)*sz.w}px`;
    });
  }

  return { render };
})();

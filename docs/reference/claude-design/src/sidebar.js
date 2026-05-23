/* ─── Left sidebar ─── */
window.Sidebar = (function(){
  const $ = (s,r=document)=>r.querySelector(s);

  function render(host){
    host.innerHTML = '';
    const el = U.el;
    host.appendChild(el('aside',{class:'sidebar'},
      // head
      el('div',{class:'sb-head'},
        el('div',{class:'sb-mark'}, 'DC'),
        el('div',{},
          el('div',{class:'sb-title'},'Theme Studio'),
          el('div',{class:'sb-sub'},'Power BI · Datacense')
        )
      ),
      // name
      el('div',{class:'sb-name'},
        el('label',{},'Theme name'),
        el('input',{
          class:'input', type:'text', value: state.themeName,
          oninput: e => setState({themeName: e.target.value})
        })
      ),
      // sections
      el('div',{class:'sb-scroll'},
        section('Preset Themes', 'presets', presetSection(), `${PRESETS.length}`),
        section('Coolors Import', 'coolors', coolorsSection()),
        section('Brand', 'brand', brandSection()),
        section('Colors', 'colors', colorsSection()),
        section('Typography', 'type', typeSection()),
        section('Canvas', 'canvas', canvasSection()),
        section('Visuals', 'visuals', visualsSection()),
        section('Tables & Matrix', 'table', tableSection()),
        section('Cards & KPIs', 'card', cardSection()),
        section('Advanced', 'advanced', advancedSection()),
      )
    ));
  }

  function section(title, key, body, badge){
    const head = U.el('button',{class:'acc-head'+(state.open[key]?' open':''),
      onclick: e => { state.open[key] = !state.open[key]; e.currentTarget.parentElement.classList.toggle('open'); e.currentTarget.classList.toggle('open'); }
    },
      U.caret(),
      U.el('span',{class:'acc-title'}, title),
      badge ? U.el('span',{class:'acc-badge'}, badge) : null
    );
    return U.el('div',{class:'acc'+(state.open[key]?' open':'')}, head, U.el('div',{class:'acc-body'}, body));
  }

  function presetSection(){
    const wrap = U.el('div',{});
    const cats = U.el('div',{class:'preset-cats'});
    PRESET_CATS.forEach(c=>{
      cats.appendChild(U.el('button',{
        class: state.presetCat===c?'active':'',
        onclick: ()=>{ setState({presetCat: c}); }
      }, c));
    });
    wrap.appendChild(cats);

    const grid = U.el('div',{class:'preset-grid'});
    const list = state.presetCat==='All' ? PRESETS : PRESETS.filter(p=>p.cat===state.presetCat);
    list.forEach((p, idx)=>{
      const card = U.el('button',{
        class: 'preset-card'+(state.presetActive===PRESETS.indexOf(p)?' active':''),
        onclick: ()=>applyPreset(PRESETS.indexOf(p))
      });
      const strip = U.el('div',{class:'pc-strip'});
      p.colors.forEach(c=>{
        const sp = document.createElement('span');
        sp.style.background = c;
        strip.appendChild(sp);
      });
      card.appendChild(strip);
      card.appendChild(U.el('div',{class:'pc-name'}, p.name));
      card.appendChild(U.el('div',{class:'pc-cat'}, p.cat));
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    return wrap;
  }

  function applyPreset(i){
    const p = PRESETS[i];
    setState({
      dataColors: [...p.colors],
      bg: p.bg, fg: p.fg,
      primary: p.colors[0],
      accent: p.colors[1],
      themeName: p.name + ' Theme',
      presetActive: i
    });
    U.toast('Applied "'+p.name+'"');
  }

  function coolorsSection(){
    const url = U.el('input',{class:'input', type:'text', placeholder:'paste coolors.co/...'});
    const swatches = U.el('div',{class:'coolors-swatches'});
    let extracted = [];
    function show(colors){
      extracted = colors.slice(0,8);
      swatches.innerHTML = '';
      while(extracted.length<8) extracted.push('#E2E8F0');
      extracted.forEach(c=>{
        const d = document.createElement('div');
        d.style.background = c;
        swatches.appendChild(d);
      });
    }
    show(state.dataColors);
    const apply = U.el('button',{class:'btn primary sm', onclick:()=>{
      if(extracted.length){
        setState({dataColors:[...extracted].slice(0,8)});
        U.toast('Imported palette');
      }
    }}, icon('check',12), 'Apply');
    const fileBtn = U.el('button',{class:'btn sm', onclick:()=>fi.click()}, icon('upload',12),'File');
    const fi = U.el('input',{type:'file', accept:'.txt,.csv,.json', class:'file-input',
      onchange: e=>{
        const f = e.target.files[0]; if(!f) return;
        const r = new FileReader();
        r.onload = ()=> show(U.parseColors(r.result));
        r.readAsText(f);
      }
    });
    return U.el('div',{},
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Coolors URL'),
        U.el('div',{class:'row'},
          url,
          U.el('button',{class:'btn sm', onclick:()=>{ show(U.parseColors(url.value)); }}, 'Read')
        )
      ),
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Or upload .txt / .csv / .json'),
        fi,
        U.el('div',{class:'row', style:{gap:'6px'}},
          fileBtn,
          U.el('div',{class:'helper-text', style:{flex:'1',marginTop:0}}, 'Hex codes auto-detected')
        )
      ),
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Preview'),
        swatches,
        U.el('div',{class:'row'}, apply,
          U.el('div',{class:'helper-text',style:{marginTop:0}}, 'Maps → 8 dataColors')
        )
      )
    );
  }

  function colorPicker(label, key){
    return U.el('div',{class:'field'},
      U.el('label',{class:'field-label'}, label),
      makeSwatch(state[key], hex=>{ const o={}; o[key]=hex; setState(o); })
    );
  }

  function makeSwatch(value, onChange){
    const sw = U.el('div',{class:'swatch'});
    const chip = U.el('div',{class:'chip'});
    chip.style.background = value;
    sw.appendChild(chip);
    sw.appendChild(U.el('span',{class:'hex'}, value));
    const picker = U.el('input',{type:'color', value: value,
      oninput: e=> onChange(U.sanitizeHex(e.target.value))
    });
    sw.appendChild(picker);
    return sw;
  }

  function brandSection(){
    return U.el('div',{},
      colorPicker('Primary', 'primary'),
      colorPicker('Accent', 'accent'),
      U.el('div',{class:'row',style:{gap:'8px',marginTop:'8px'}},
        U.el('div',{style:{flex:1}}, U.el('label',{class:'field-label'},'Background'), makeSwatch(state.bg, hex=>setState({bg:hex}))),
        U.el('div',{style:{flex:1}}, U.el('label',{class:'field-label'},'Foreground'), makeSwatch(state.fg, hex=>setState({fg:hex})))
      ),
      U.el('div',{class:'row',style:{gap:'8px',marginTop:'8px'}},
        U.el('div',{style:{flex:1}}, U.el('label',{class:'field-label'},'Good'), makeSwatch(state.good, hex=>setState({good:hex}))),
        U.el('div',{style:{flex:1}}, U.el('label',{class:'field-label'},'Neutral'), makeSwatch(state.neutral, hex=>setState({neutral:hex}))),
        U.el('div',{style:{flex:1}}, U.el('label',{class:'field-label'},'Bad'), makeSwatch(state.bad, hex=>setState({bad:hex})))
      )
    );
  }

  function colorsSection(){
    const grid = U.el('div',{class:'color-row'});
    state.dataColors.forEach((c,i)=>{
      const tile = U.el('div',{class:'color-tile', style:{background:c, color: U.isDark(c)?'#fff':'#0f172a'}}, 'C'+(i+1));
      const inp = U.el('input',{type:'color', value:c, oninput: e=>{
        const arr = [...state.dataColors];
        arr[i] = U.sanitizeHex(e.target.value);
        setState({dataColors: arr});
      }});
      tile.appendChild(inp);
      grid.appendChild(tile);
    });
    return U.el('div',{},
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'8 Data colors'),
        grid
      ),
      U.el('div',{class:'row', style:{marginTop:'10px',gap:'6px'}},
        U.el('button',{class:'btn sm ghost', onclick: ()=>{
          // generate from primary by hue rotation
          const arr = generatePalette(state.primary);
          setState({dataColors: arr});
        }}, icon('sparkle',12),'From primary'),
        U.el('button',{class:'btn sm ghost', onclick: ()=>{
          const arr = [...state.dataColors].sort(()=>Math.random()-.5);
          setState({dataColors: arr});
        }}, 'Shuffle')
      ),
      U.el('div',{class:'helper-text'},'Logo color extraction is automatic from imports.')
    );
  }

  function generatePalette(seed){
    const {r,g,b} = U.hexToRgb(seed);
    // convert to HSL
    const max=Math.max(r,g,b)/255, min=Math.min(r,g,b)/255;
    let h, s, l=(max+min)/2;
    const d=max-min;
    s = d===0?0 : (l>0.5? d/(2-max-min): d/(max+min));
    if(d===0) h=0;
    else if(max===r/255) h=((g-b)/255/d + (g<b?6:0))/6;
    else if(max===g/255) h=((b-r)/255/d + 2)/6;
    else h=((r-g)/255/d + 4)/6;
    const out=[];
    for(let i=0;i<8;i++){
      const hh = (h + i/8) % 1;
      out.push(hslHex(hh, Math.max(.45,s), Math.min(.6, Math.max(.4, l))));
    }
    return out;
  }
  function hslHex(h,s,l){
    let r,g,b;
    if(s===0) r=g=b=l;
    else {
      const q = l<.5? l*(1+s):l+s-l*s;
      const p = 2*l-q;
      const conv=(t)=>{if(t<0)t+=1;if(t>1)t-=1;
        if(t<1/6) return p+(q-p)*6*t;
        if(t<1/2) return q;
        if(t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;
      };
      r=conv(h+1/3); g=conv(h); b=conv(h-1/3);
    }
    return U.rgbToHex(r*255,g*255,b*255);
  }

  function typeSection(){
    const sel = U.el('select',{class:'select', onchange: e=>setState({font: e.target.value})});
    FONTS.forEach(f=>{
      const o = U.el('option',{value:f, selected: state.font===f? 'selected':false}, f);
      sel.appendChild(o);
    });
    const sizeRow = (lbl,key)=>U.el('div',{class:'field'},
      U.el('label',{class:'field-label'}, lbl + ' (' + state.fs[key] + 'px)'),
      U.el('div',{class:'slider-row'},
        U.el('input',{class:'slider', type:'range', min: key==='callout'?16:8, max: key==='callout'?56:24, value:state.fs[key],
          oninput: e=>{ const fs = {...state.fs}; fs[key] = +e.target.value; setState({fs}); }
        }),
        U.el('div',{class:'slider-val'}, state.fs[key])
      )
    );
    return U.el('div',{},
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Font family'),
        sel
      ),
      sizeRow('Title', 'title'),
      sizeRow('Header', 'header'),
      sizeRow('Label', 'label'),
      sizeRow('Callout (KPI)', 'callout')
    );
  }

  function canvasSection(){
    const dark = U.isDark(state.bg);
    return U.el('div',{},
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Page background'),
        makeSwatch(state.bg, hex=>setState({bg: hex}))
      ),
      U.el('div',{class:'field'},
        U.el('div',{class:'row',style:{justifyContent:'space-between'}},
          U.el('label',{class:'field-label',style:{marginBottom:0}}, 'Mode'),
          U.el('div',{class:'seg'},
            U.el('button',{class:!dark?'active':'', onclick:()=>setState({bg:'#F8FAFC',fg:'#0F172A'})},'Light'),
            U.el('button',{class:dark?'active':'', onclick:()=>setState({bg:'#0F172A',fg:'#F1F5F9'})},'Dark')
          )
        )
      ),
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Table accent row'),
        makeSwatch(state.tableAccent, hex=>setState({tableAccent: hex}))
      )
    );
  }

  function visualsSection(){
    return U.el('div',{},
      U.el('div',{class:'helper-text'},'Properties shared across visuals. Use the Format pane on the right to customize per visual.'),
      toggleRow('Show data labels', 'visuals.dataLabels', true),
      toggleRow('Show legend', 'visuals.legend', true),
      toggleRow('Show gridlines', 'visuals.gridlines', true),
      toggleRow('Rounded corners', 'visuals.rounded', true),
    );
  }

  function tableSection(){
    return U.el('div',{},
      toggleRow('Banded rows', 'table.banded', true),
      toggleRow('Show grid', 'table.grid', false),
      toggleRow('Bold totals', 'table.boldTotals', true),
      toggleRow('Conditional growth color', 'table.cond', true)
    );
  }

  function cardSection(){
    return U.el('div',{},
      toggleRow('Show category label', 'card.catLabel', true),
      toggleRow('Word wrap', 'card.wrap', true),
      toggleRow('Trend indicator', 'card.trend', true),
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Callout size ('+state.fs.callout+'px)'),
        U.el('input',{class:'slider', type:'range', min:16, max:56, value: state.fs.callout,
          oninput: e=>{ const fs = {...state.fs}; fs.callout = +e.target.value; setState({fs}); }
        })
      )
    );
  }

  function advancedSection(){
    return U.el('div',{},
      toggleRow('Card shadow', 'adv.shadow', true),
      toggleRow('Card border', 'adv.border', false),
      U.el('div',{class:'field'},
        U.el('label',{class:'field-label'},'Card radius'),
        U.el('input',{class:'slider', type:'range', min:0, max:16, value:(state.formatProps['adv.radius']||6),
          oninput: e=>{ const fp = {...state.formatProps}; fp['adv.radius']=+e.target.value; setState({formatProps:fp}); }
        })
      ),
      U.el('div',{class:'helper-text'},'Advanced styling cascades into all visuals via theme JSON.')
    );
  }

  function toggleRow(label, key, def=false){
    const cur = key in state.formatProps ? state.formatProps[key] : def;
    return U.el('div',{class:'row', style:{justifyContent:'space-between',marginTop:'8px'}},
      U.el('label',{class:'field-label',style:{marginBottom:0}}, label),
      U.el('button',{class:'tgl'+(cur?' on':''),
        onclick: e=>{
          const fp = {...state.formatProps};
          fp[key] = !cur;
          setState({formatProps: fp});
        }
      })
    );
  }

  return { render };
})();

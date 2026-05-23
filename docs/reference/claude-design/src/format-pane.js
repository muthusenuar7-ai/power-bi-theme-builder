/* ─── Format pane (per-visual) ─── */
window.FormatPane = (function(){

  // Map visual id → property tree by skill level
  // Each property: {key, label, type:'toggle'|'color'|'slider'|'select'|'text', def, min, max, opts}
  const PROPS = {
    bar: visualBarProps('bar'),
    col: visualBarProps('col'),
    stackedBar: visualBarProps('stackedBar'),
    stackedCol: visualBarProps('stackedCol'),
    clusteredBar: visualBarProps('clusteredBar'),
    clusteredCol: visualBarProps('clusteredCol'),
    line: lineProps('line'),
    area: lineProps('area'),
    pie: pieProps('pie'),
    donut: pieProps('donut'),
    table: tableProps('table'),
    matrix: matrixProps(),
    card: cardProps(),
    slicer: slicerProps(),
    gauge: gaugeProps(),
    funnel: funnelProps(),
    treemap: treemapProps(),
    scatter: scatterProps(),
    map: mapProps(),
    lineCol: lineColProps(),
    lineStacked: lineColProps()
  };

  function visualBarProps(id){
    return {
      basic: [
        section('Data labels', [
          {k:`${id}.dataLabels.show`, l:'Show', t:'toggle', d:true},
          {k:`${id}.dataLabels.color`, l:'Color', t:'color', d:'#252423'}
        ]),
        section('X axis', [
          {k:`${id}.xAxis.show`, l:'Show', t:'toggle', d:true},
          {k:`${id}.xAxis.color`, l:'Color', t:'color', d:'#605E5C'}
        ]),
        section('Y axis', [
          {k:`${id}.yAxis.show`, l:'Show', t:'toggle', d:true}
        ])
      ],
      intermediate: [
        section('Bar properties', [
          {k:`${id}.bar.cornerRadius`, l:'Corner radius', t:'slider', d:2, min:0, max:12},
          {k:`${id}.bar.padding`, l:'Inner padding', t:'slider', d:30, min:0, max:80}
        ]),
        section('Legend', [
          {k:`${id}.legend.show`, l:'Show', t:'toggle', d:true},
          {k:`${id}.legend.position`, l:'Position', t:'select', d:'Top', opts:['Top','Right','Bottom','Left']}
        ])
      ],
      advanced: [
        section('Plot area', [
          {k:`${id}.plot.gridlinesShow`, l:'Show gridlines', t:'toggle', d:true},
          {k:`${id}.plot.gridColor`, l:'Gridline color', t:'color', d:'#E8E8E8'}
        ]),
        section('Reference line', [
          {k:`${id}.refLine.show`, l:'Show', t:'toggle', d:false},
          {k:`${id}.refLine.color`, l:'Color', t:'color', d:'#94A3B8'},
          {k:`${id}.refLine.value`, l:'Value', t:'text', d:'avg'}
        ])
      ]
    };
  }
  function lineProps(id){
    return {
      basic: [
        section('Line', [
          {k:`${id}.line.thickness`, l:'Thickness', t:'slider', d:2, min:1, max:6},
          {k:`${id}.line.smooth`, l:'Smooth', t:'toggle', d:false}
        ]),
        section('Markers', [
          {k:`${id}.markers.show`, l:'Show', t:'toggle', d:true},
          {k:`${id}.markers.size`, l:'Size', t:'slider', d:3, min:1, max:8}
        ])
      ],
      intermediate: [
        section('Data labels', [{k:`${id}.dataLabels.show`,l:'Show',t:'toggle',d:false}]),
        section('Axis', [{k:`${id}.axis.show`,l:'Show',t:'toggle',d:true}])
      ],
      advanced: [
        section('Anomaly', [{k:`${id}.anomaly.show`,l:'Detect anomalies',t:'toggle',d:false}]),
        section('Trend line', [{k:`${id}.trend.show`,l:'Show',t:'toggle',d:false}])
      ]
    };
  }
  function pieProps(id){
    return {
      basic: [
        section('Detail labels', [
          {k:`${id}.detailLabels.show`,l:'Show',t:'toggle',d:true},
          {k:`${id}.detailLabels.position`,l:'Position',t:'select',d:'Outside',opts:['Outside','Inside','Both']}
        ]),
        id==='donut'? section('Inner radius',[{k:`${id}.inner`,l:'Inner radius %',t:'slider',d:60,min:0,max:90}]) : null,
        section('Slice', [{k:`${id}.slice.stroke`,l:'Show stroke',t:'toggle',d:true}])
      ].filter(Boolean),
      intermediate: [section('Legend',[{k:`${id}.legend.show`,l:'Show',t:'toggle',d:true}])],
      advanced: [section('Rotation',[{k:`${id}.rotation`,l:'Start angle',t:'slider',d:0,min:0,max:360}])]
    };
  }
  function tableProps(id){
    return {
      basic: [
        section('Column headers', [
          {k:`${id}.colHead.bg`,l:'Background',t:'color',d:'#1E2D8A'},
          {k:`${id}.colHead.fg`,l:'Text',t:'color',d:'#FFFFFF'}
        ]),
        section('Values', [{k:`${id}.values.bandedRows`,l:'Banded rows',t:'toggle',d:true}])
      ],
      intermediate: [
        section('Total', [{k:`${id}.total.show`,l:'Show',t:'toggle',d:true},{k:`${id}.total.bg`,l:'Bg',t:'color',d:'#F1F5F9'}]),
        section('Grid', [{k:`${id}.grid.h`,l:'Horizontal',t:'toggle',d:false},{k:`${id}.grid.v`,l:'Vertical',t:'toggle',d:false}])
      ],
      advanced: [section('Conditional formatting',[{k:`${id}.cond.icons`,l:'Show icons',t:'toggle',d:false}])]
    };
  }
  function matrixProps(){
    const id='matrix';
    return {
      basic:[
        section('Row headers',[{k:`${id}.rowHead.bg`,l:'Bg',t:'color',d:'#FFFFFF'},{k:`${id}.rowHead.fg`,l:'Text',t:'color',d:'#252423'}]),
        section('Column headers',[{k:`${id}.colHead.bg`,l:'Bg',t:'color',d:'#1E2D8A'}])
      ],
      intermediate:[section('Subtotals',[{k:`${id}.sub.row`,l:'Row',t:'toggle',d:true},{k:`${id}.sub.col`,l:'Column',t:'toggle',d:true}])],
      advanced:[section('Stepped layout',[{k:`${id}.stepped`,l:'Stepped',t:'toggle',d:true}])]
    };
  }
  function cardProps(){
    const id='card';
    return {
      basic:[
        section('Callout value',[
          {k:`${id}.callout.size`,l:'Size',t:'slider',d:32,min:16,max:64},
          {k:`${id}.callout.color`,l:'Color',t:'color',d:'#252423'}
        ]),
        section('Category label',[{k:`${id}.cat.show`,l:'Show',t:'toggle',d:true}])
      ],
      intermediate:[section('Word wrap',[{k:`${id}.wrap`,l:'Wrap',t:'toggle',d:true}])],
      advanced:[section('Number formatting',[{k:`${id}.format.compact`,l:'Compact',t:'toggle',d:true}])]
    };
  }
  function slicerProps(){
    const id='slicer';
    return {
      basic:[
        section('Header',[{k:`${id}.header.show`,l:'Show',t:'toggle',d:true},{k:`${id}.header.bg`,l:'Bg',t:'color',d:'#FFFFFF'}]),
        section('Items',[{k:`${id}.items.bg`,l:'Bg',t:'color',d:'#FFFFFF'},{k:`${id}.items.fg`,l:'Text',t:'color',d:'#252423'}])
      ],
      intermediate:[
        section('Style',[{k:`${id}.style`,l:'Style',t:'select',d:'List',opts:['List','Tile','Dropdown','Between']}]),
        section('Orientation',[{k:`${id}.orient`,l:'Orientation',t:'select',d:'Vertical',opts:['Vertical','Horizontal']}])
      ],
      advanced:[section('Search',[{k:`${id}.search`,l:'Show search',t:'toggle',d:true}])]
    };
  }
  function gaugeProps(){
    const id='gauge';
    return {
      basic:[
        section('Callout value',[{k:`${id}.callout.show`,l:'Show',t:'toggle',d:true}]),
        section('Target',[{k:`${id}.target.show`,l:'Show line',t:'toggle',d:true},{k:`${id}.target.color`,l:'Color',t:'color',d:'#252423'}])
      ],
      intermediate:[section('Zones',[{k:`${id}.zones.bad`,l:'Bad',t:'color',d:'#DC2626'},{k:`${id}.zones.good`,l:'Good',t:'color',d:'#16A34A'}])],
      advanced:[section('Range',[{k:`${id}.range.min`,l:'Min',t:'text',d:'0'},{k:`${id}.range.max`,l:'Max',t:'text',d:'100'}])]
    };
  }
  function funnelProps(){
    const id='funnel';
    return {
      basic:[section('Bars',[{k:`${id}.bar.height`,l:'Height %',t:'slider',d:80,min:30,max:100}])],
      intermediate:[section('Conversion',[{k:`${id}.conv.show`,l:'Show %',t:'toggle',d:true}])],
      advanced:[section('Sort',[{k:`${id}.sort`,l:'Order',t:'select',d:'Desc',opts:['Desc','Asc']}])]
    };
  }
  function treemapProps(){
    const id='treemap';
    return {
      basic:[section('Labels',[{k:`${id}.labels.show`,l:'Show',t:'toggle',d:true}])],
      intermediate:[section('Layout',[{k:`${id}.layout`,l:'Algorithm',t:'select',d:'Squarified',opts:['Squarified','Slice','Dice']}])],
      advanced:[section('Borders',[{k:`${id}.border.show`,l:'Show',t:'toggle',d:true}])]
    };
  }
  function scatterProps(){
    const id='scatter';
    return {
      basic:[section('Markers',[{k:`${id}.marker.size`,l:'Size',t:'slider',d:5,min:2,max:14}])],
      intermediate:[section('Categories',[{k:`${id}.cat.show`,l:'Color by category',t:'toggle',d:true}])],
      advanced:[section('Trend',[{k:`${id}.trend.show`,l:'Show line',t:'toggle',d:false}])]
    };
  }
  function mapProps(){
    const id='map';
    return {
      basic:[section('Bubbles',[{k:`${id}.bubble.size`,l:'Bubble size',t:'slider',d:5,min:1,max:12}])],
      intermediate:[section('Heat',[{k:`${id}.heat`,l:'Heat overlay',t:'toggle',d:false}])],
      advanced:[section('Bing',[{k:`${id}.bing.style`,l:'Style',t:'select',d:'Road',opts:['Road','Aerial','Hybrid']}])]
    };
  }
  function lineColProps(){
    const id='lineCol';
    return {
      basic:[
        section('Columns',[{k:`${id}.col.color`,l:'Color',t:'color',d:'#1E2D8A'}]),
        section('Line',[{k:`${id}.line.color`,l:'Color',t:'color',d:'#2DA9F1'},{k:`${id}.line.thick`,l:'Thickness',t:'slider',d:2,min:1,max:6}])
      ],
      intermediate:[section('Dual axis',[{k:`${id}.dualY`,l:'Show secondary Y',t:'toggle',d:true}])],
      advanced:[section('Combine',[{k:`${id}.share`,l:'Shared scale',t:'toggle',d:false}])]
    };
  }

  function GENERAL_PROPS(){
    return {
      basic: [
        section('Title',[
          {k:'gen.title.show',l:'Show',t:'toggle',d:true},
          {k:'gen.title.text',l:'Text',t:'text',d:''},
          {k:'gen.title.color',l:'Color',t:'color',d:state.fg},
          {k:'gen.title.size',l:'Size',t:'slider',d:state.fs.title,min:8,max:24}
        ]),
        section('Background',[
          {k:'gen.bg.show',l:'Show',t:'toggle',d:true},
          {k:'gen.bg.color',l:'Color',t:'color',d:'#FFFFFF'}
        ])
      ],
      intermediate: [
        section('Border',[
          {k:'gen.border.show',l:'Show',t:'toggle',d:false},
          {k:'gen.border.color',l:'Color',t:'color',d:'#E2E8F0'},
          {k:'gen.border.radius',l:'Radius',t:'slider',d:6,min:0,max:20}
        ]),
        section('Shadow',[
          {k:'gen.shadow.show',l:'Show',t:'toggle',d:true},
          {k:'gen.shadow.intensity',l:'Intensity',t:'slider',d:2,min:0,max:8}
        ])
      ],
      advanced: [
        section('Padding',[{k:'gen.pad',l:'Padding',t:'slider',d:12,min:0,max:32}]),
        section('Header icons',[{k:'gen.hdr.icons',l:'Show icons',t:'toggle',d:true}]),
        section('Tooltip',[{k:'gen.tooltip',l:'Style',t:'select',d:'Default',opts:['Default','Card','Report page']}])
      ]
    };
  }

  function section(title, fields){ return {title, fields}; }

  function render(){
    const wrap = U.el('div',{});
    const vid = state.selectedVisual || 'col';
    const props = state.activeFormatTab === 'general' ? GENERAL_PROPS() : (PROPS[vid] || PROPS.col);
    const showLevels = state.skillLevel==='basic' ? ['basic']
                      : state.skillLevel==='intermediate' ? ['basic','intermediate']
                      : ['basic','intermediate','advanced'];
    showLevels.forEach(level => {
      (props[level]||[]).forEach(sec=>{
        wrap.appendChild(renderSection(sec, level));
      });
    });
    if(!state.selectedVisual && state.activeFormatTab==='visual'){
      wrap.prepend(U.el('div',{class:'fp-body', style:{padding:'14px'}},
        U.el('div',{class:'helper-text'},'Click a chart on the canvas, or pick a visual from the bar above, to see its properties.')
      ));
    }
    return wrap;
  }

  function renderSection(sec, level){
    const open = state.formatProps['_open.'+sec.title] !== false;
    const head = U.el('button',{class:'fp-head'+(open?' open':''),
      onclick: e=>{
        const fp = {...state.formatProps};
        fp['_open.'+sec.title] = !open;
        setState({formatProps: fp});
      }
    },
      U.caret(),
      U.el('span',{}, sec.title),
      level!=='basic'? U.el('span',{class:'tag-chip'}, level==='intermediate'?'Int.':'Adv.') : null
    );
    const body = U.el('div',{class:'fp-body'});
    sec.fields.forEach(f=> body.appendChild(renderField(f)));
    return U.el('div',{class:'fp-section'+(open?' open':'')}, head, body);
  }

  function get(k, d){
    return k in state.formatProps ? state.formatProps[k] : d;
  }
  function set(k, v){
    const fp = {...state.formatProps};
    fp[k] = v;
    setState({formatProps: fp});
  }

  function renderField(f){
    const cur = get(f.k, f.d);
    if(f.t==='toggle'){
      return U.el('div',{class:'row',style:{justifyContent:'space-between',marginTop:'8px'}},
        U.el('label',{class:'field-label',style:{marginBottom:0}}, f.l),
        U.el('button',{class:'tgl'+(cur?' on':''), onclick:()=>set(f.k, !cur)})
      );
    }
    if(f.t==='color'){
      return U.el('div',{class:'field'},
        U.el('label',{class:'field-label'}, f.l),
        makeSwatch(cur, hex=>set(f.k, hex))
      );
    }
    if(f.t==='slider'){
      return U.el('div',{class:'field'},
        U.el('label',{class:'field-label'}, f.l + ' ('+cur+')'),
        U.el('div',{class:'slider-row'},
          U.el('input',{class:'slider', type:'range', min:f.min, max:f.max, value:cur,
            oninput: e=>set(f.k, +e.target.value)
          }),
          U.el('div',{class:'slider-val'}, cur)
        )
      );
    }
    if(f.t==='select'){
      const sel = U.el('select',{class:'select', onchange:e=>set(f.k, e.target.value)});
      f.opts.forEach(o=> sel.appendChild(U.el('option',{value:o, selected: cur===o?'selected':false}, o)));
      return U.el('div',{class:'field'}, U.el('label',{class:'field-label'}, f.l), sel);
    }
    if(f.t==='text'){
      return U.el('div',{class:'field'}, U.el('label',{class:'field-label'}, f.l),
        U.el('input',{class:'input',type:'text',value: cur||'', oninput: e=>set(f.k, e.target.value)})
      );
    }
    return U.el('div',{});
  }

  function makeSwatch(value, onChange){
    const sw = U.el('div',{class:'swatch'});
    const chip = U.el('div',{class:'chip'});
    chip.style.background = value;
    sw.appendChild(chip);
    sw.appendChild(U.el('span',{class:'hex'}, value));
    sw.appendChild(U.el('input',{type:'color', value, oninput: e=>onChange(U.sanitizeHex(e.target.value))}));
    return sw;
  }

  return { render, PROPS, GENERAL_PROPS };
})();

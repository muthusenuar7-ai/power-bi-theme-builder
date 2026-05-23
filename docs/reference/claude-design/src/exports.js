/* ─── Exports ─── */
window.Exports = (function(){

  function buildThemeJSON(){
    const dc = state.dataColors.map(c=>U.sanitizeHex(c));
    const solid = h => ({ solid: { color: U.sanitizeHex(h) } });
    const fp = state.formatProps || {};
    const tableHeadBg = fp['table.colHead.bg'] || state.primary;
    const tableHeadFg = fp['table.colHead.fg'] || '#FFFFFF';
    const radius = fp['adv.radius'] != null ? fp['adv.radius'] : 6;
    const showShadow = fp['adv.shadow'] !== false;
    const showBorder = fp['adv.border'] === true;

    const titleStyle = {
      fontFace: state.font,
      fontSize: state.fs.title,
      fontColor: solid(state.fg),
      show: true,
      titleWrap: true
    };
    const labelStyle = {
      fontFace: state.font,
      fontSize: state.fs.label,
      color: solid(state.fg)
    };

    const visualStyle = (extras={})=>({
      '*': [{
        background: [{ show: true, color: solid('#FFFFFF'), transparency: 0 }],
        border: [{ show: showBorder, color: solid('#E2E8F0'), radius }],
        dropShadow: [{ show: showShadow, preset: 'outer', color: solid('#0F172A'), position: 'Outer', strength: 30 }],
        title: [titleStyle],
        labels: [labelStyle],
        ...extras
      }]
    });

    const theme = {
      name: state.themeName || 'Datacense Custom Theme',
      dataColors: dc,
      good: U.sanitizeHex(state.good),
      neutral: U.sanitizeHex(state.neutral),
      bad: U.sanitizeHex(state.bad),
      background: U.sanitizeHex(state.bg),
      foreground: U.sanitizeHex(state.fg),
      tableAccent: U.sanitizeHex(state.tableAccent),
      textClasses: {
        callout: { fontFace: state.font, fontSize: state.fs.callout, color: U.sanitizeHex(state.fg) },
        title:   { fontFace: state.font, fontSize: state.fs.title,   color: U.sanitizeHex(state.fg) },
        header:  { fontFace: state.font, fontSize: state.fs.header,  color: U.sanitizeHex(state.fg) },
        label:   { fontFace: state.font, fontSize: state.fs.label,   color: U.sanitizeHex(state.fg) }
      },
      visualStyles: {
        '*': {
          '*': {
            background:  [{ show: true,  color: solid('#FFFFFF') }],
            border:      [{ show: showBorder, color: solid('#E2E8F0'), radius }],
            dropShadow:  [{ show: showShadow, color: solid('#0F172A'), position: 'Outer', preset: 'outer' }],
            title:       [titleStyle],
            visualHeader:[{ show: true, background: solid('#FFFFFF'), foreground: solid(state.fg) }]
          }
        },
        barChart:           buildBar(),
        clusteredBarChart:  buildBar(),
        stackedBarChart:    buildBar(),
        columnChart:        buildBar(),
        clusteredColumnChart: buildBar(),
        stackedColumnChart: buildBar(),
        lineChart:          buildLine(),
        areaChart:          buildLine(),
        lineStackedColumnComboChart: buildLine(),
        lineClusteredColumnComboChart: buildLine(),
        pieChart:           buildPie(),
        donutChart:         buildPie(),
        funnel:             { '*': [{ dataLabels:[{show: fp['funnel.conv.show']!==false}] }] },
        treemap:            { '*': [{ dataLabels:[{show: fp['treemap.labels.show']!==false}] }] },
        scatterChart:       { '*': [{ dataPoint:[{ defaultColor: solid(dc[0]) }] }] },
        gauge:              buildGauge(),
        tableEx:            buildTable(),
        pivotTable:         buildTable(),
        matrix:             buildMatrix(),
        card:               buildCard(),
        multiRowCard:       buildCard(),
        newCard:            buildCard(),
        slicer:             buildSlicer(),
        map:                { '*': [{ dataPoint:[{ defaultColor: solid(dc[0]) }] }] },
        filledMap:          { '*': [{ dataPoint:[{ defaultColor: solid(dc[0]) }] }] }
      }
    };

    function buildBar(){
      return {
        '*': [{
          dataLabels: [{
            show: fp['col.dataLabels.show'] !== false,
            color: solid(fp['col.dataLabels.color'] || state.fg),
            fontSize: state.fs.label
          }],
          categoryAxis: [{
            show: fp['col.xAxis.show'] !== false,
            color: solid(fp['col.xAxis.color'] || '#605E5C'),
            fontSize: state.fs.label
          }],
          valueAxis: [{
            show: fp['col.yAxis.show'] !== false,
            color: solid('#605E5C'),
            fontSize: state.fs.label
          }],
          legend: [{
            show: fp['col.legend.show'] !== false,
            position: fp['col.legend.position'] || 'Top',
            color: solid(state.fg)
          }],
          plotArea: [{
            transparency: 0
          }],
          dataPoint: [{ defaultColor: solid(dc[0]) }]
        }]
      };
    }
    function buildLine(){
      return {
        '*': [{
          lineStyles: [{
            strokeWidth: fp['line.line.thickness'] || 2,
            strokeLineJoin: 'round',
            lineStyle: 'solid'
          }],
          markers: [{
            show: fp['line.markers.show'] !== false,
            markerSize: fp['line.markers.size'] || 3
          }]
        }]
      };
    }
    function buildPie(){
      return {
        '*': [{
          detailLabels: [{
            show: fp['pie.detailLabels.show'] !== false,
            position: fp['pie.detailLabels.position'] || 'Outside'
          }],
          slices: [{ stroke: { color: solid('#FFFFFF'), width: 1 } }]
        }]
      };
    }
    function buildGauge(){
      return {
        '*': [{
          callout: [{ show: fp['gauge.callout.show'] !== false }],
          target: [{
            show: fp['gauge.target.show'] !== false,
            color: solid(fp['gauge.target.color'] || state.fg)
          }],
          axis: [{
            min: fp['gauge.range.min'] || 0,
            max: fp['gauge.range.max'] || 100
          }]
        }]
      };
    }
    function buildTable(){
      return {
        '*': [{
          columnHeaders: [{
            backColor: solid(tableHeadBg),
            fontColor: solid(tableHeadFg),
            fontSize: state.fs.header,
            bold: true
          }],
          values: [{
            backColor: solid('#FFFFFF'),
            backColorPrimary: solid('#FFFFFF'),
            backColorSecondary: solid(state.tableAccent),
            fontColor: solid(state.fg),
            fontSize: state.fs.label
          }],
          total: [{
            show: fp['table.total.show'] !== false,
            backColor: solid(fp['table.total.bg'] || state.tableAccent),
            fontColor: solid(state.fg),
            bold: true
          }],
          grid: [{
            gridHorizontal: !!fp['table.grid.h'],
            gridVertical:   !!fp['table.grid.v'],
            color: solid('#E2E8F0')
          }]
        }]
      };
    }
    function buildMatrix(){
      return {
        '*': [{
          rowHeaders: [{
            backColor: solid(fp['matrix.rowHead.bg'] || '#FFFFFF'),
            fontColor: solid(fp['matrix.rowHead.fg'] || state.fg),
            fontSize: state.fs.label,
            stepped: fp['matrix.stepped'] !== false
          }],
          columnHeaders: [{
            backColor: solid(fp['matrix.colHead.bg'] || tableHeadBg),
            fontColor: solid('#FFFFFF'),
            fontSize: state.fs.header,
            bold: true
          }],
          values: [{
            backColorPrimary: solid('#FFFFFF'),
            backColorSecondary: solid(state.tableAccent),
            fontColor: solid(state.fg),
            fontSize: state.fs.label
          }],
          subTotals: [{
            rowSubtotals: fp['matrix.sub.row'] !== false,
            columnSubtotals: fp['matrix.sub.col'] !== false
          }]
        }]
      };
    }
    function buildCard(){
      return {
        '*': [{
          calloutValue: [{
            color: solid(fp['card.callout.color'] || state.fg),
            fontSize: fp['card.callout.size'] || state.fs.callout,
            fontFace: state.font
          }],
          categoryLabel: [{
            show: fp['card.cat.show'] !== false,
            color: solid('#605E5C'),
            fontSize: state.fs.label
          }],
          wordWrap: [{ show: fp['card.wrap'] !== false }]
        }]
      };
    }
    function buildSlicer(){
      return {
        '*': [{
          header: [{
            show: fp['slicer.header.show'] !== false,
            background: solid(fp['slicer.header.bg'] || '#FFFFFF'),
            fontColor: solid(state.fg),
            fontSize: state.fs.header
          }],
          items: [{
            background: solid(fp['slicer.items.bg'] || '#FFFFFF'),
            fontColor: solid(fp['slicer.items.fg'] || state.fg),
            fontSize: state.fs.label
          }],
          general: [{
            orientation: fp['slicer.orient'] || 'Vertical'
          }],
          search: [{ show: fp['slicer.search'] !== false }]
        }]
      };
    }

    return theme;
  }

  function themeJSON(){
    const json = buildThemeJSON();
    U.download((state.themeName||'theme').replace(/[^a-z0-9_-]+/gi,'_')+'.json',
      JSON.stringify(json, null, 2));
    U.toast('Exported theme JSON');
  }

  function buildLayoutJSON(){
    const sz = PAGE_SIZES[state.pageSize];
    return {
      schema: 'datacense.layout.v1',
      pageSize: { width: sz.w, height: sz.h, label: sz.label },
      spacing: state.spacing,
      pages: PAGES.map((p,i)=>({
        index: i,
        name: p.name,
        subtitle: p.sub,
        slicers: { count: state.layout.numSlicers, position: state.layout.slicerPos },
        kpis: { count: state.layout.numKpis },
        chartGrid: PAGE_CHARTS[p.name],
        gridDimensions: sz.w>=2200? '4x2' : sz.w>=1600? '3x2' : '2x2'
      }))
    };
  }

  function layoutJSON(){
    const json = buildLayoutJSON();
    U.download((state.themeName||'layout').replace(/[^a-z0-9_-]+/gi,'_')+'_layout.json',
      JSON.stringify(json, null, 2));
    U.toast('Exported layout JSON');
  }

  function pbiTemplate(){
    const sz = PAGE_SIZES[state.pageSize];
    const tpl = `<!doctype html><html><head><meta charset="utf-8"/>
<title>${state.themeName} · PBI Background</title>
<style>
  body { margin:0; background:#0F172A; color:#E2E8F0; font-family:'Outfit',sans-serif; }
  .wrap { max-width: 1100px; margin: 24px auto; padding: 24px; }
  .card { background:#1E293B; border:1px solid #334155; border-radius:12px; padding:20px; margin-bottom:16px; }
  h1 { margin:0 0 8px; font-size:22px; }
  h2 { font-size:14px; color:#94A3B8; margin:0 0 16px; font-weight:500; letter-spacing:.04em; text-transform:uppercase; }
  .canvas { background:${state.bg}; width:${sz.w}px; height:${sz.h}px; position:relative; transform-origin:top left; }
  .scale { overflow:hidden; border-radius:8px; border:1px solid #334155; }
  .ph { position:absolute; background:rgba(${U.hexToRgb(state.primary).r},${U.hexToRgb(state.primary).g},${U.hexToRgb(state.primary).b},.08);
        border:1.5px dashed ${state.primary}; border-radius:6px; display:flex; align-items:center; justify-content:center;
        font-size:13px; color:${state.primary}; font-weight:500; }
  .spec { font-family:'JetBrains Mono',monospace; font-size:12px; line-height:1.7; color:#CBD5E1; }
  .spec b { color:#5EEAD4; }
</style></head><body>
<div class="wrap">
  <div class="card">
    <h1>${state.themeName} — Power BI Background Template</h1>
    <h2>How to use</h2>
    <ol style="line-height:1.7">
      <li>Take a screenshot of the canvas below at full size (${sz.w}×${sz.h}).</li>
      <li>In Power BI, go to <b>View → Page → Canvas background → Browse</b>.</li>
      <li>Upload the screenshot and set transparency to 0%.</li>
      <li>Snap your visuals to the highlighted regions. Apply <b>${state.themeName}.json</b> for full styling.</li>
    </ol>
  </div>
  <div class="card">
    <h2>Layout · ${sz.label}</h2>
    <div class="scale" style="height:${Math.min(700, sz.h*0.6)}px">
      <div class="canvas" style="transform:scale(${Math.min(1, 1000/sz.w)})">
        <div class="ph" style="left:${state.spacing}px; top:${state.spacing}px; right:${state.spacing}px; height:60px;">Header · Page title</div>
        ${state.layout.slicerPos==='Left' && state.layout.numSlicers ?
          `<div class="ph" style="left:${state.spacing}px; top:${state.spacing*2+60}px; width:220px; bottom:${state.spacing}px;">Slicer column · ${state.layout.numSlicers} cards</div>`:''}
        <div class="ph" style="left:${state.layout.slicerPos==='Left'?(state.spacing*2+220):state.spacing}px;
             right:${state.layout.slicerPos==='Right'?(state.spacing*2+220):state.spacing}px;
             top:${state.spacing*2+60}px; height:90px;">KPI strip · ${state.layout.numKpis} cards</div>
        <div class="ph" style="left:${state.layout.slicerPos==='Left'?(state.spacing*2+220):state.spacing}px;
             right:${state.layout.slicerPos==='Right'?(state.spacing*2+220):state.spacing}px;
             top:${state.spacing*3+150}px; bottom:${state.spacing}px;">Chart grid · ${sz.w>=2200?'4×2':sz.w>=1600?'3×2':'2×2'}</div>
      </div>
    </div>
  </div>
  <div class="card">
    <h2>Spec sheet</h2>
    <div class="spec">
      Page size .......... <b>${sz.w} × ${sz.h}</b><br>
      Spacing ............ <b>${state.spacing}px</b> uniform<br>
      Header height ...... <b>60px</b><br>
      KPI row height ..... <b>90px</b> · ${state.layout.numKpis} cards<br>
      Slicer width ....... <b>220px</b> · ${state.layout.numSlicers} cards · ${state.layout.slicerPos}<br>
      Card radius ........ <b>${state.formatProps['adv.radius']||6}px</b><br>
      Primary ............ <b>${state.primary}</b><br>
      Background ......... <b>${state.bg}</b><br>
      Font ............... <b>${state.font}</b>
    </div>
  </div>
</div></body></html>`;
    U.download((state.themeName||'pbi-template').replace(/[^a-z0-9_-]+/gi,'_')+'_template.html', tpl, 'text/html');
    U.toast('PBI template downloaded');
  }

  function png(){
    const canvas = document.querySelector('#pbi-canvas');
    if(!canvas){ U.toast('No canvas to export'); return; }
    const sz = PAGE_SIZES[state.pageSize];
    const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz.w}" height="${sz.h}">
      <foreignObject x="0" y="0" width="${sz.w}" height="${sz.h}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${sz.w}px;height:${sz.h}px;background:${state.bg};font-family:${state.font},sans-serif">
          ${cleanHTML(canvas.outerHTML)}
        </div>
      </foreignObject></svg>`;
    const blob = new Blob([html], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = ()=>{
      const cv = document.createElement('canvas');
      cv.width = sz.w; cv.height = sz.h;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = state.bg; ctx.fillRect(0,0,sz.w,sz.h);
      ctx.drawImage(img, 0, 0);
      cv.toBlob(b=>{
        U.download((state.themeName||'theme').replace(/[^a-z0-9_-]+/gi,'_')+'.png', b, 'image/png');
        URL.revokeObjectURL(url);
        U.toast('PNG exported');
      }, 'image/png');
    };
    img.onerror = ()=>{ U.toast('PNG export failed (CORS) — use screenshot instead'); URL.revokeObjectURL(url); };
    img.src = url;
  }

  function cleanHTML(html){
    return html.replace(/transform:[^;"]+/g,'').replace(/margin-bottom:[^;"]+/g,'').replace(/margin-right:[^;"]+/g,'');
  }

  return { themeJSON, layoutJSON, pbiTemplate, png, buildThemeJSON, buildLayoutJSON };
})();

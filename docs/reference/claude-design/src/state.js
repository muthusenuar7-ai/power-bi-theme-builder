/* Global state + event bus */
window.state = {
  themeName: 'Datacense Custom Theme',
  dataColors: ['#1E2D8A','#2DA9F1','#0EA5E9','#14B8A6','#8B5CF6','#F472B6','#FB923C','#FACC15'],
  primary: '#1E2D8A',
  accent: '#2DA9F1',
  bg: '#F8FAFC',
  fg: '#0F172A',
  good: '#16A34A',
  neutral: '#94A3B8',
  bad: '#DC2626',
  tableAccent: '#F1F5F9',
  font: 'Segoe UI',
  fs: { title: 14, header: 12, label: 11, callout: 28 },
  pageSize: '16:9',
  zoom: 'fit',
  spacing: 10,
  layout: { numSlicers: 2, slicerPos: 'Left', numKpis: 4 },
  currentPage: 0,
  focusVisual: null,
  skillLevel: 'basic',
  activeFormatTab: 'visual',
  formatProps: {},
  selectedVisual: null,
  presetCat: 'All',
  presetActive: 0,
  // collapsed state
  open: { brand:false, colors:false, presets:false, coolors:false, type:false,
          canvas:false, visuals:false, table:false, card:false, advanced:false,
          jsonPreview:true, score:false, validation:false }
};

window.PAGE_SIZES = {
  '16:9':       { w: 1280, h: 720,  label: '16:9 HD' },
  'FullHD':     { w: 1920, h: 1080, label: 'Full HD' },
  'QHD':        { w: 2560, h: 1440, label: 'QHD 2K' },
  '4:3':        { w: 1024, h: 768,  label: '4:3' },
  'Letter':     { w: 1100, h: 850,  label: 'US Letter' },
  'A4-L':       { w: 1169, h: 826,  label: 'A4 Landscape' },
  'A4-P':       { w: 826,  h: 1169, label: 'A4 Portrait' },
  'Tooltip':    { w: 320,  h: 240,  label: 'Tooltip' },
  'Mobile':     { w: 360,  h: 760,  label: 'Mobile' },
  'Square':     { w: 900,  h: 900,  label: 'Square' }
};

window.PAGES = [
  { name: 'Overview',   sub: 'Executive summary' },
  { name: 'Sales',      sub: 'Revenue & pipeline' },
  { name: 'Operations', sub: 'Throughput & SLA' },
  { name: 'Finance',    sub: 'P&L and cash' }
];

window.VISUALS = [
  { id:'bar',          name:'Stacked Bar',     icon:'bar',         draw:'drawBar' },
  { id:'col',          name:'Clustered Column',icon:'col',         draw:'drawClusteredCol' },
  { id:'stackedBar',   name:'Stacked Bar',     icon:'stackedBar',  draw:'drawStackedBar' },
  { id:'stackedCol',   name:'Stacked Column',  icon:'stackedCol',  draw:'drawStackedCol' },
  { id:'clusteredBar', name:'Clustered Bar',   icon:'clusteredBar',draw:'drawClusteredBar' },
  { id:'clusteredCol', name:'Clustered Column',icon:'clusteredCol',draw:'drawClusteredCol' },
  { id:'donut',        name:'Donut',           icon:'donut',       draw:'drawDonut' },
  { id:'pie',          name:'Pie',             icon:'pie',         draw:'drawPie' },
  { id:'area',         name:'Area',            icon:'area',        draw:'drawArea' },
  { id:'line',         name:'Line',            icon:'line',        draw:'drawLine' },
  { id:'scatter',      name:'Scatter',         icon:'scatter',     draw:'drawScatter' },
  { id:'funnel',       name:'Funnel',          icon:'funnel',      draw:'drawFunnel' },
  { id:'treemap',      name:'Treemap',         icon:'treemap',     draw:'drawTreemap' },
  { id:'lineCol',      name:'Line + Column',   icon:'lineCol',     draw:'drawLineColumn' },
  { id:'lineStacked',  name:'Line + Stacked',  icon:'lineStacked', draw:'drawLineStacked' },
  { id:'gauge',        name:'Gauge',           icon:'gauge',       draw:'drawGauge' },
  { id:'table',        name:'Table',           icon:'table',       draw:'drawTable' },
  { id:'matrix',       name:'Matrix',          icon:'matrix',      draw:'drawMatrix' },
  { id:'map',          name:'Map',             icon:'map',         draw:'drawMap' },
  { id:'slicer',       name:'Slicer',          icon:'slicer',      draw:'drawSlicer' }
];

// Default page chart compositions (which visual goes in each grid slot)
window.PAGE_CHARTS = {
  Overview:   ['col','line','donut','table','area','funnel','map','gauge'],
  Sales:      ['clusteredCol','stackedBar','treemap','lineCol','pie','scatter','area','table'],
  Operations: ['bar','line','gauge','matrix','funnel','clusteredBar','stackedCol','donut'],
  Finance:    ['lineCol','area','table','col','donut','treemap','line','matrix']
};

window.bus = {
  listeners: [],
  on(fn){ this.listeners.push(fn); },
  emit(){ this.listeners.forEach(fn=>fn()); }
};

window.setState = function(patch, opts={}){
  Object.assign(window.state, patch);
  if (!opts.silent) window.bus.emit();
};

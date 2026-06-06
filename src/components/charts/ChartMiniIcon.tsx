'use client'

export function ChartMiniIcon({ id, size = 18 }: { id: string; size?: number }) {
  const c1 = 'var(--c1, #0D9488)'
  const c2 = 'var(--c2, #3B82F6)'
  const c3 = 'var(--c3, #8B5CF6)'
  const props = { viewBox: '0 0 18 18', width: size, height: size }
  switch (id) {
    case 'bar':
      return <svg {...props}><rect x="3" y="2" width="10" height="4" fill={c1}/><rect x="3" y="7" width="7" height="4" fill={c1} opacity=".7"/><rect x="3" y="12" width="9" height="4" fill={c1} opacity=".5"/></svg>
    case 'column':
      return <svg {...props}><rect x="2" y="6" width="4" height="10" fill={c1}/><rect x="7" y="9" width="4" height="7" fill={c1} opacity=".7"/><rect x="12" y="4" width="4" height="12" fill={c1} opacity=".5"/></svg>
    case 'clusteredbar':
      return <svg {...props}><rect x="3" y="2" width="9" height="3" fill={c1}/><rect x="3" y="5.5" width="6" height="3" fill={c2}/><rect x="3" y="10" width="8" height="3" fill={c1} opacity=".75"/><rect x="3" y="13.5" width="5" height="3" fill={c2} opacity=".75"/></svg>
    case 'clusteredcol':
      return <svg {...props}><rect x="2" y="7" width="3" height="9" fill={c1}/><rect x="5.5" y="10" width="3" height="6" fill={c2}/><rect x="10" y="5" width="3" height="11" fill={c1} opacity=".75"/><rect x="13.5" y="8" width="3" height="8" fill={c2} opacity=".75"/></svg>
    case 'stackedbar':
      return <svg {...props}><rect x="2" y="3" width="5" height="5" fill={c1}/><rect x="7" y="3" width="4" height="5" fill={c2}/><rect x="11" y="3" width="5" height="5" fill={c3}/><rect x="2" y="10" width="6" height="5" fill={c1}/><rect x="8" y="10" width="4" height="5" fill={c2}/><rect x="12" y="10" width="4" height="5" fill={c3}/></svg>
    case 'stackedcol':
      return <svg {...props}><rect x="2" y="10" width="4" height="6" fill={c1}/><rect x="2" y="6" width="4" height="4" fill={c2}/><rect x="2" y="3" width="4" height="3" fill={c3}/><rect x="7" y="8" width="4" height="8" fill={c1}/><rect x="7" y="5" width="4" height="3" fill={c2}/><rect x="12" y="12" width="4" height="4" fill={c1}/><rect x="12" y="8" width="4" height="4" fill={c2}/></svg>
    case 'hundredstackedbar':
      return <svg {...props}><rect x="2" y="4" width="5" height="4" fill={c1}/><rect x="7" y="4" width="4" height="4" fill={c2}/><rect x="11" y="4" width="5" height="4" fill={c3}/><rect x="2" y="10" width="6" height="4" fill={c1}/><rect x="8" y="10" width="3" height="4" fill={c2}/><rect x="11" y="10" width="5" height="4" fill={c3}/></svg>
    case 'hundredstackedcol':
      return <svg {...props}><rect x="2" y="2" width="4" height="5" fill={c3}/><rect x="2" y="7" width="4" height="4" fill={c2}/><rect x="2" y="11" width="4" height="5" fill={c1}/><rect x="7" y="2" width="4" height="6" fill={c3}/><rect x="7" y="8" width="4" height="3" fill={c2}/><rect x="7" y="11" width="4" height="5" fill={c1}/><rect x="12" y="2" width="4" height="4" fill={c3}/><rect x="12" y="6" width="4" height="5" fill={c2}/><rect x="12" y="11" width="4" height="5" fill={c1}/></svg>
    case 'line':
      return <svg {...props}><polyline points="2,14 6,8 10,11 14,4 16,6" stroke={c1} strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round"/><polyline points="2,16 6,13 10,15 14,10 16,12" stroke={c2} strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round"/></svg>
    case 'area':
      return <svg {...props}><polygon points="2,16 2,10 6,6 10,9 14,4 16,7 16,16" fill={c1} opacity=".35"/><polyline points="2,10 6,6 10,9 14,4 16,7" stroke={c1} strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round"/></svg>
    case 'stackedarea':
      return <svg {...props}><polygon points="2,16 2,12 6,10 10,11 14,8 16,9 16,16" fill={c2} opacity=".45"/><polygon points="2,16 2,9 6,6 10,8 14,4 16,6 16,16" fill={c1} opacity=".35"/><polyline points="2,9 6,6 10,8 14,4 16,6" stroke={c1} strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>
    case 'ribbon':
      return <svg {...props}><path d="M2,4 C6,4 6,14 10,14 C14,14 14,8 16,8" stroke={c1} strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M2,10 C6,10 6,6 10,6 C14,6 14,12 16,12" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
    case 'treemap':
      return <svg {...props}><rect x="1.5" y="1.5" width="9" height="9" rx=".5" fill={c1}/><rect x="11" y="1.5" width="5.5" height="4.5" rx=".5" fill={c2}/><rect x="11" y="7" width="5.5" height="4" rx=".5" fill={c3}/><rect x="1.5" y="11" width="6" height="5.5" rx=".5" fill={c2} opacity=".7"/><rect x="8.5" y="11" width="8" height="5.5" rx=".5" fill={c3} opacity=".7"/></svg>
    case 'waterfall':
      return <svg {...props}><rect x="2" y="8" width="3" height="6" fill={c1}/><rect x="6" y="5" width="3" height="3" fill={c1} opacity=".7"/><rect x="10" y="10" width="3" height="4" fill="#EF4444" opacity=".7"/><rect x="14" y="4" width="3" height="10" fill={c2}/></svg>
    case 'bubble':
      return <svg {...props}><circle cx="5" cy="13" r="3.5" fill={c1} opacity=".8"/><circle cx="12" cy="9" r="5" fill={c2} opacity=".6"/><circle cx="15" cy="4" r="2" fill={c3} opacity=".8"/></svg>
    case 'scatter':
      return <svg {...props}><circle cx="4" cy="13" r="1.4" fill={c1}/><circle cx="7" cy="9" r="1.4" fill={c1}/><circle cx="10" cy="12" r="1.4" fill={c2}/><circle cx="13" cy="5" r="1.4" fill={c2}/><circle cx="15" cy="10" r="1.4" fill={c1} opacity=".7"/><circle cx="5" cy="5" r="1.4" fill={c2} opacity=".7"/></svg>
    case 'lineclustered':
      return <svg {...props}><rect x="2" y="9" width="3" height="7" fill={c1} opacity=".8"/><rect x="6" y="12" width="3" height="4" fill={c1} opacity=".8"/><rect x="10" y="7" width="3" height="9" fill={c1} opacity=".8"/><rect x="14" y="10" width="3" height="6" fill={c1} opacity=".8"/><polyline points="3.5,8 7.5,5 11.5,9 15.5,4" stroke={c2} strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round"/></svg>
    case 'linestacked':
      return <svg {...props}><rect x="2" y="12" width="3" height="4" fill={c1}/><rect x="2" y="9" width="3" height="3" fill={c2}/><rect x="6" y="10" width="3" height="6" fill={c1}/><rect x="6" y="7" width="3" height="3" fill={c2}/><rect x="10" y="8" width="3" height="8" fill={c1}/><rect x="10" y="5" width="3" height="3" fill={c2}/><polyline points="3.5,5 7.5,4 11.5,3" stroke={c3} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round"/></svg>
    case 'pie':
      return <svg {...props}><circle cx="9" cy="9" r="7" fill={c2}/><path d="M9,9 L9,2 A7,7 0 0,1 14.95,12.5 Z" fill={c1}/><path d="M9,9 L14.95,12.5 A7,7 0 0,1 3.5,14.5 Z" fill={c3}/></svg>
    case 'donut':
      return <svg {...props}><circle cx="9" cy="9" r="7" fill={c2}/><path d="M9,9 L9,2 A7,7 0 0,1 14.95,12.5 Z" fill={c1}/><path d="M9,9 L14.95,12.5 A7,7 0 0,1 3.5,14.5 Z" fill={c3}/><circle cx="9" cy="9" r="3.5" fill="white"/></svg>
    case 'decompositiontree':
      return <svg {...props}><rect x="6.5" y="1" width="5" height="4" rx=".5" fill={c1}/><line x1="9" y1="5" x2="9" y2="8" stroke="#999" strokeWidth=".8"/><line x1="4" y1="8" x2="14" y2="8" stroke="#999" strokeWidth=".8"/><line x1="4" y1="8" x2="4" y2="10" stroke="#999" strokeWidth=".8"/><line x1="9" y1="8" x2="9" y2="10" stroke="#999" strokeWidth=".8"/><line x1="14" y1="8" x2="14" y2="10" stroke="#999" strokeWidth=".8"/><rect x="1.5" y="10" width="5" height="3.5" rx=".5" fill={c2}/><rect x="6.5" y="10" width="5" height="3.5" rx=".5" fill={c3}/><rect x="11.5" y="10" width="5" height="3.5" rx=".5" fill={c1} opacity=".6"/></svg>
    case 'table':
      return <svg {...props}><rect x="2" y="2" width="14" height="3.5" fill={c1}/><rect x="2" y="6.5" width="4" height="2.5" fill={c1} opacity=".4"/><rect x="7" y="6.5" width="4" height="2.5" fill={c1} opacity=".4"/><rect x="12" y="6.5" width="4" height="2.5" fill={c1} opacity=".4"/><rect x="2" y="10" width="4" height="2.5" fill={c1} opacity=".25"/><rect x="7" y="10" width="4" height="2.5" fill={c1} opacity=".25"/><rect x="12" y="10" width="4" height="2.5" fill={c1} opacity=".25"/><rect x="2" y="13.5" width="14" height="2.5" fill={c1} opacity=".55"/></svg>
    case 'matrix':
      return <svg {...props}><rect x="1" y="1" width="16" height="3" fill={c1}/><rect x="1" y="5" width="7" height="2" fill={c2} opacity=".7"/><rect x="9" y="5" width="8" height="2" fill={c2} opacity=".7"/><rect x="3" y="8" width="14" height="2" fill={c1} opacity=".2"/><rect x="3" y="11" width="14" height="2" fill={c1} opacity=".2"/><rect x="1" y="8" width="1.5" height="2" fill={c3} opacity=".7"/><rect x="1" y="11" width="1.5" height="2" fill={c3} opacity=".7"/><rect x="1" y="14.5" width="16" height="2.5" fill={c1} opacity=".55"/></svg>
    case 'funnel':
      return <svg {...props}><path d="M1,2 L17,2 L13,7 L5,7 Z" fill={c1}/><path d="M5,8 L13,8 L11,12 L7,12 Z" fill={c2}/><path d="M7,13 L11,13 L10,17 L8,17 Z" fill={c3}/></svg>
    default:
      return <svg {...props}><rect x="2" y="2" width="14" height="14" rx="2" fill={c1} opacity=".3"/></svg>
  }
}

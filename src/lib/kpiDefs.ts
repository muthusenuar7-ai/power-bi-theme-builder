import type { KpiDef } from '@/types'

export const KPI_DEFS: KpiDef[] = [
  { lbl: 'Total Sales',      val: '₹48.6L',  trend: 'up',   delta: '12.4%', icon: 'currency' },
  { lbl: 'Total Orders',     val: '3,842',   trend: 'up',   delta: '8.7%',  icon: 'cart'     },
  { lbl: 'Avg Order Value',  val: '₹12,650', trend: 'up',   delta: '3.2%',  icon: 'card'     },
  { lbl: 'Profit Margin',    val: '24.8%',   trend: 'down', delta: '1.1%',  icon: 'pulse'    },
  { lbl: 'Active Customers', val: '18,420',  trend: 'up',   delta: '15.6%', icon: 'users'    },
  { lbl: 'Conversion Rate',  val: '4.2%',    trend: 'up',   delta: '0.8%',  icon: 'trend'    },
  { lbl: 'Returns Rate',     val: '2.1%',    trend: 'down', delta: '0.4%',  icon: 'return'   },
  { lbl: 'Customer LTV',     val: '₹62K',    trend: 'up',   delta: '9.3%',  icon: 'star'     },
]

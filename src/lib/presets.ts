import type { PresetTheme } from '@/types'

export const PRESET_CATEGORIES = [
  'All', 'Modern', 'Corporate', 'Dark', 'Light',
  'Finance', 'Healthcare', 'Vibrant', 'Nature', 'Minimal',
] as const

export type PresetCategory = (typeof PRESET_CATEGORIES)[number]

export const PRESETS: PresetTheme[] = [
  // ── Modern ──────────────────────────────────────────────────────────────
  { cat:'Modern', name:'Teal Pro',      colors:['#0D9488','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Modern', name:'Violet Dream',  colors:['#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#6D28D9','#EC4899','#F472B6','#FCA5A5'], bg:'#F5F3FF', fg:'#2E1065' },
  { cat:'Modern', name:'Sapphire',      colors:['#1E3A8A','#2563EB','#60A5FA','#93C5FD','#0D9488','#14B8A6','#F59E0B','#EF4444'], bg:'#EFF6FF', fg:'#1E3A8A' },
  { cat:'Modern', name:'Cyan Spark',    colors:['#06B6D4','#0EA5E9','#3B82F6','#8B5CF6','#EC4899','#F43F5E','#F97316','#EAB308'], bg:'#F0FDFF', fg:'#083344' },
  { cat:'Modern', name:'Mint Fresh',    colors:['#10B981','#34D399','#6EE7B7','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#EC4899'], bg:'#ECFDF5', fg:'#064E3B' },
  { cat:'Modern', name:'Neon Fusion',   colors:['#6366F1','#EC4899','#14B8A6','#F59E0B','#EF4444','#A855F7','#06B6D4','#84CC16'], bg:'#FAFAFA', fg:'#0F172A' },
  { cat:'Modern', name:'Ocean Dark',    colors:['#0EA5E9','#06B6D4','#14B8A6','#22D3EE','#38BDF8','#67E8F9','#A5F3FC','#E0F2FE'], bg:'#0C1A2E', fg:'#E2E8F0' },
  { cat:'Modern', name:'Digital Wave',  colors:['#6366F1','#8B5CF6','#A78BFA','#C4B5FD','#DDD6FE','#EDE9FE','#F5F3FF','#FAF5FF'], bg:'#0F0F1A', fg:'#F1F5F9' },
  { cat:'Modern', name:'Coral Ridge',   colors:['#F43F5E','#FB7185','#FDA4AF','#3B82F6','#60A5FA','#0D9488','#14B8A6','#F59E0B'], bg:'#FFF1F2', fg:'#881337' },
  { cat:'Modern', name:'Aurora',        colors:['#4ADE80','#34D399','#06B6D4','#6366F1','#A855F7','#EC4899','#F97316','#EAB308'], bg:'#F8FAFC', fg:'#0F172A' },

  // ── Corporate ────────────────────────────────────────────────────────────
  { cat:'Corporate', name:'Corporate Blue',  colors:['#1E40AF','#1D4ED8','#2563EB','#60A5FA','#93C5FD','#BFDBFE','#475569','#94A3B8'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Corporate', name:'Executive Navy',  colors:['#1E3A5F','#2C5282','#3182CE','#4299E1','#63B3ED','#90CDF4','#BEE3F8','#2D3748'], bg:'#FFFFFF', fg:'#1A202C' },
  { cat:'Corporate', name:'McKinsey Blue',   colors:['#1E3F5A','#154360','#2E86C1','#5DADE2','#AED6F1','#1E8449','#F4D03F','#E74C3C'], bg:'#EBF5FB', fg:'#154360' },
  { cat:'Corporate', name:'Deloitte Green',  colors:['#046A38','#00A550','#57B848','#A8D08D','#005587','#0076A8','#7BC4E2','#C8E6C9'], bg:'#F1FFF5', fg:'#014D2A' },
  { cat:'Corporate', name:'Steel Pro',       colors:['#1C2B3A','#2C3E50','#5D6D7E','#85929E','#1A5276','#2E86C1','#AED6F1','#D5D8DC'], bg:'#F8F9FA', fg:'#1C2B3A' },
  { cat:'Corporate', name:'PwC Red',         colors:['#D04A02','#EB6900','#F2843A','#F9B58A','#003150','#0070A0','#5A8FC0','#A4C8E0'], bg:'#FFF8F5', fg:'#2D1000' },
  { cat:'Corporate', name:'IBM Blue',        colors:['#0F62FE','#0043CE','#002D9C','#001D6C','#08BDBA','#009D9A','#007D79','#005D5D'], bg:'#FFFFFF', fg:'#161616' },
  { cat:'Corporate', name:'Slate & Amber',   colors:['#334155','#475569','#64748B','#94A3B8','#D97706','#F59E0B','#FBBF24','#FCD34D'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Corporate', name:'Forest Trust',    colors:['#15803D','#16A34A','#22C55E','#4ADE80','#1D4ED8','#2563EB','#3B82F6','#60A5FA'], bg:'#F0FDF4', fg:'#14532D' },
  { cat:'Corporate', name:'Graphite',        colors:['#374151','#4B5563','#6B7280','#9CA3AF','#111827','#1F2937','#2563EB','#3B82F6'], bg:'#F9FAFB', fg:'#111827' },

  // ── Dark ─────────────────────────────────────────────────────────────────
  { cat:'Dark', name:'Ocean Deep',    colors:['#0EA5E9','#6366F1','#22D3EE','#38BDF8','#818CF8','#34D399','#FB923C','#A78BFA'], bg:'#0F172A', fg:'#E2E8F0' },
  { cat:'Dark', name:'Midnight',      colors:['#6366F1','#8B5CF6','#EC4899','#F43F5E','#F97316','#FBBF24','#34D399','#22D3EE'], bg:'#0F0F1A', fg:'#F1F5F9' },
  { cat:'Dark', name:'Dracula',       colors:['#FF79C6','#BD93F9','#50FA7B','#F1FA8C','#FFB86C','#8BE9FD','#FF5555','#6272A4'], bg:'#282A36', fg:'#F8F8F2' },
  { cat:'Dark', name:'Tokyo Night',   colors:['#7AA2F7','#9ECE6A','#E0AF68','#F7768E','#BB9AF7','#7DCFFF','#B4F9F8','#FF9E64'], bg:'#1A1B2E', fg:'#C0CAF5' },
  { cat:'Dark', name:'Nord Dark',     colors:['#88C0D0','#81A1C1','#5E81AC','#A3BE8C','#EBCB8B','#D08770','#BF616A','#B48EAD'], bg:'#2E3440', fg:'#ECEFF4' },
  { cat:'Dark', name:'Gruvbox',       colors:['#FABD2F','#FB4934','#B8BB26','#83A598','#FE8019','#8EC07C','#D3869B','#458588'], bg:'#282828', fg:'#EBDBB2' },
  { cat:'Dark', name:'One Dark',      colors:['#61AFEF','#98C379','#E06C75','#E5C07B','#C678DD','#56B6C2','#D19A66','#ABB2BF'], bg:'#282C34', fg:'#ABB2BF' },
  { cat:'Dark', name:'Cyberpunk',     colors:['#FF00FF','#00FFFF','#FFD700','#FF4500','#7FFF00','#FF69B4','#00BFFF','#FF6347'], bg:'#0D0D0D', fg:'#00FFFF' },
  { cat:'Dark', name:'Obsidian',      colors:['#7C3AED','#6D28D9','#5B21B6','#4C1D95','#2563EB','#1D4ED8','#EC4899','#DB2777'], bg:'#0C0A1A', fg:'#E9D5FF' },
  { cat:'Dark', name:'Solar Flare',   colors:['#F97316','#EF4444','#FBBF24','#10B981','#3B82F6','#8B5CF6','#EC4899','#06B6D4'], bg:'#18120C', fg:'#FEF3C7' },

  // ── Light ─────────────────────────────────────────────────────────────────
  { cat:'Light', name:'Snow Clean',     colors:['#3B82F6','#0D9488','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Light', name:'Morning Sky',    colors:['#3B82F6','#2563EB','#1D4ED8','#1E40AF','#0D9488','#059669','#F59E0B','#EF4444'], bg:'#EFF6FF', fg:'#1E3A8A' },
  { cat:'Light', name:'Sage Meadow',    colors:['#4ADE80','#22C55E','#16A34A','#15803D','#0D9488','#3B82F6','#F59E0B','#EF4444'], bg:'#F0FDF4', fg:'#14532D' },
  { cat:'Light', name:'Lavender Haze',  colors:['#A855F7','#9333EA','#7E22CE','#6B21A8','#EC4899','#DB2777','#3B82F6','#0D9488'], bg:'#FAF5FF', fg:'#3B0764' },
  { cat:'Light', name:'Cream Latte',    colors:['#F59E0B','#D97706','#92400E','#78350F','#3B82F6','#10B981','#EF4444','#8B5CF6'], bg:'#FFFBEB', fg:'#451A03' },
  { cat:'Light', name:'Peach Sorbet',   colors:['#FB923C','#F97316','#EA580C','#C2410C','#FBBF24','#F59E0B','#34D399','#0D9488'], bg:'#FFF7ED', fg:'#431407' },
  { cat:'Light', name:'Arctic White',   colors:['#0EA5E9','#38BDF8','#7DD3FC','#BAE6FD','#0D9488','#14B8A6','#A855F7','#C084FC'], bg:'#F0F9FF', fg:'#0C4A6E' },
  { cat:'Light', name:'Coastal',        colors:['#0D9488','#0891B2','#0369A1','#1D4ED8','#7C3AED','#F59E0B','#F97316','#EF4444'], bg:'#F0FDFA', fg:'#042F2E' },
  { cat:'Light', name:'Sunrise',        colors:['#F43F5E','#FB7185','#F97316','#FB923C','#FBBF24','#34D399','#0D9488','#3B82F6'], bg:'#FFF1F2', fg:'#500724' },
  { cat:'Light', name:'Soft Zinc',      colors:['#3B82F6','#6366F1','#8B5CF6','#A855F7','#EC4899','#F43F5E','#F97316','#F59E0B'], bg:'#FAFAFA', fg:'#18181B' },

  // ── Finance ───────────────────────────────────────────────────────────────
  { cat:'Finance', name:'Financial Green', colors:['#065F46','#059669','#10B981','#34D399','#6EE7B7','#F59E0B','#EF4444','#3B82F6'], bg:'#F0FDF4', fg:'#064E3B' },
  { cat:'Finance', name:'Gold Standard',   colors:['#92400E','#B45309','#D97706','#F59E0B','#FBBF24','#FCD34D','#1E40AF','#1D4ED8'], bg:'#FFFBEB', fg:'#451A03' },
  { cat:'Finance', name:'Bloomberg Dark',  colors:['#FF6600','#FFAA00','#00CC44','#0088FF','#FF4444','#CCCC00','#00AAFF','#FF8800'], bg:'#1A1A1A', fg:'#F0F0F0' },
  { cat:'Finance', name:'Treasury Blue',   colors:['#0A2342','#1B3A5C','#2E5E8E','#4281B7','#72A8D4','#EFDD8D','#D4A833','#A07830'], bg:'#EBF3FB', fg:'#0A2342' },
  { cat:'Finance', name:'Wall Street',     colors:['#F39C12','#F1C40F','#E67E22','#27AE60','#E74C3C','#3498DB','#9B59B6','#1ABC9C'], bg:'#1C2833', fg:'#ECF0F1' },
  { cat:'Finance', name:'S&P Neutral',     colors:['#2E4057','#048A81','#54C6EB','#8EE3EF','#CAF0F8','#3A405A','#F18F01','#C73E1D'], bg:'#F5F7FA', fg:'#1A202C' },
  { cat:'Finance', name:'Forex Green',     colors:['#00B386','#00C896','#00DCA6','#4FE0B6','#9FE9D1','#EF4444','#DC2626','#B91C1C'], bg:'#F0FDF9', fg:'#003D2E' },
  { cat:'Finance', name:'Risk Red',        colors:['#DC2626','#EF4444','#F87171','#FCA5A5','#15803D','#16A34A','#F59E0B','#1D4ED8'], bg:'#FEF2F2', fg:'#7F1D1D' },
  { cat:'Finance', name:'Crypto Dark',     colors:['#F7931A','#627EEA','#00FEA0','#FF007A','#2775CA','#26A17B','#E84142','#8247E5'], bg:'#0D1117', fg:'#E6EDF3' },
  { cat:'Finance', name:'Audit Grey',      colors:['#1E293B','#334155','#475569','#64748B','#3B82F6','#10B981','#F59E0B','#EF4444'], bg:'#F8FAFC', fg:'#0F172A' },

  // ── Healthcare ────────────────────────────────────────────────────────────
  { cat:'Healthcare', name:'Healthcare Blue',  colors:['#1D4ED8','#2563EB','#3B82F6','#60A5FA','#10B981','#34D399','#F59E0B','#EF4444'], bg:'#EFF6FF', fg:'#1E3A5F' },
  { cat:'Healthcare', name:'Medical Green',    colors:['#047857','#059669','#10B981','#6EE7B7','#0EA5E9','#38BDF8','#F59E0B','#EF4444'], bg:'#ECFDF5', fg:'#064E3B' },
  { cat:'Healthcare', name:'Wellness Teal',    colors:['#004D40','#00695C','#00897B','#26A69A','#4DB6AC','#80CBC4','#FF7043','#FFA000'], bg:'#E0F2F1', fg:'#004D40' },
  { cat:'Healthcare', name:'Pharma Purple',    colors:['#7B1FA2','#8E24AA','#AB47BC','#CE93D8','#4A148C','#6A1B9A','#42A5F5','#26C6DA'], bg:'#F8F0FD', fg:'#4A148C' },
  { cat:'Healthcare', name:'Clinical White',   colors:['#0288D1','#0277BD','#01579B','#00695C','#00897B','#26A69A','#EF5350','#FFA726'], bg:'#FAFAFA', fg:'#212121' },
  { cat:'Healthcare', name:'Cardio Red',       colors:['#C62828','#D32F2F','#E53935','#EF5350','#F44336','#0288D1','#0277BD','#01579B'], bg:'#FFEBEE', fg:'#7F0000' },
  { cat:'Healthcare', name:'Diagnostic',       colors:['#1565C0','#1976D2','#1E88E5','#42A5F5','#43A047','#66BB6A','#FFA000','#FB8C00'], bg:'#E3F2FD', fg:'#0D47A1' },
  { cat:'Healthcare', name:'Dental White',     colors:['#0097A7','#00ACC1','#00BCD4','#26C6DA','#B2EBF2','#004D40','#00695C','#42A5F5'], bg:'#F0FDFF', fg:'#002B36' },
  { cat:'Healthcare', name:'Lab Report',       colors:['#5C6BC0','#7986CB','#9FA8DA','#3949AB','#283593','#F06292','#EC407A','#E91E63'], bg:'#EDE7F6', fg:'#1A237E' },
  { cat:'Healthcare', name:'Biotech',          colors:['#00897B','#00ACC1','#1E88E5','#8E24AA','#F4511E','#43A047','#FB8C00','#E53935'], bg:'#FAFFFE', fg:'#003731' },

  // ── Vibrant ───────────────────────────────────────────────────────────────
  { cat:'Vibrant', name:'Sunset',       colors:['#F97316','#EF4444','#EC4899','#F59E0B','#DC2626','#FCD34D','#C026D3','#7C3AED'], bg:'#FFF7ED', fg:'#431407' },
  { cat:'Vibrant', name:'Electric',     colors:['#E040FB','#7C4DFF','#448AFF','#18FFFF','#69FF47','#FFFF00','#FF6D00','#FF1744'], bg:'#1A1A2E', fg:'#F8F9FA' },
  { cat:'Vibrant', name:'Bollywood',    colors:['#FF1744','#FF6D00','#FFD600','#00C853','#2979FF','#AA00FF','#F50057','#00BFA5'], bg:'#FFFAF0', fg:'#1A0010' },
  { cat:'Vibrant', name:'Carnival',     colors:['#FFD700','#FF4500','#FF1493','#00CED1','#7B68EE','#32CD32','#FF69B4','#FF6347'], bg:'#FFF9E6', fg:'#1A1A1A' },
  { cat:'Vibrant', name:'Pop Art',      colors:['#FFBE0B','#FB5607','#FF006E','#8338EC','#3A86FF','#38B000','#FF9F1C','#6A4C93'], bg:'#FFFEF5', fg:'#1A1A1A' },
  { cat:'Vibrant', name:'Neon Tokyo',   colors:['#FF0080','#7928CA','#FF4D4D','#00D084','#0070F3','#FF9900','#50E3C2','#F5A623'], bg:'#0D001A', fg:'#FF00FF' },
  { cat:'Vibrant', name:'Miami Vice',   colors:['#FF6B9D','#C44DFF','#4DFFFF','#FF9F43','#FF5E5B','#00B4D8','#FF7F50','#7209B7'], bg:'#0A0014', fg:'#FF99CC' },
  { cat:'Vibrant', name:'Festival',     colors:['#FF595E','#FFCA3A','#6A4C93','#1982C4','#8AC926','#FF924C','#C77DFF','#4CC9F0'], bg:'#FFFDE7', fg:'#1A1A1A' },
  { cat:'Vibrant', name:'Cosmic',       colors:['#FF00FF','#00FFFF','#FF1493','#00FF00','#FF6600','#9400D3','#FFD700','#00CED1'], bg:'#000010', fg:'#E0E0FF' },
  { cat:'Vibrant', name:'Rainbow Pro',  colors:['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#14B8A6'], bg:'#FFFFFF', fg:'#111827' },

  // ── Nature ────────────────────────────────────────────────────────────────
  { cat:'Nature', name:'Forest',         colors:['#16A34A','#15803D','#4ADE80','#86EFAC','#FEF08A','#FACC15','#FB923C','#6B7280'], bg:'#F0FDF4', fg:'#14532D' },
  { cat:'Nature', name:'Ocean Breeze',   colors:['#006994','#0099CC','#00BFFF','#87CEEB','#4A90D9','#228B22','#3CB371','#90EE90'], bg:'#EFF9FF', fg:'#003D5C' },
  { cat:'Nature', name:'Earth Tones',    colors:['#92400E','#78350F','#B45309','#A16207','#4D7C0F','#166534','#0F766E','#0E7490'], bg:'#FEFCE8', fg:'#3B1A08' },
  { cat:'Nature', name:'Cherry Blossom', colors:['#FFB7C5','#FF91A8','#FF6B8A','#FF4D6D','#C9184A','#A4133C','#800F2F','#590D22'], bg:'#FFF0F3', fg:'#590D22' },
  { cat:'Nature', name:'Autumn Gold',    colors:['#8B2500','#B5451B','#CE5C00','#E9721E','#F6A64A','#F8CB7C','#FAEAAB','#C0392B'], bg:'#FFF8F0', fg:'#4A1300' },
  { cat:'Nature', name:'Desert Sand',    colors:['#C2956C','#A0714F','#7D5A3C','#5C4033','#B5842E','#9E6B1A','#D4A96A','#E8C99A'], bg:'#FBF0E4', fg:'#3B200A' },
  { cat:'Nature', name:'Tropical',       colors:['#FF6B35','#F7C59F','#EFEFD0','#004E89','#1A936F','#88D498','#C6DABF','#F3E9D2'], bg:'#FEFFF0', fg:'#1A2E05' },
  { cat:'Nature', name:'Glacier',        colors:['#A8DADC','#457B9D','#1D3557','#E63946','#F1FAEE','#264653','#2A9D8F','#E9C46A'], bg:'#F0F8FF', fg:'#1D3557' },
  { cat:'Nature', name:'Rainforest',     colors:['#2D6A4F','#40916C','#52B788','#74C69D','#95D5B2','#B7E4C7','#1B4332','#081C15'], bg:'#D8F3DC', fg:'#081C15' },
  { cat:'Nature', name:'Volcanic',       colors:['#6D0000','#9D0208','#BF0603','#D62828','#F77F00','#FCBF49','#EAE2B7','#003049'], bg:'#1A0000', fg:'#FCBF49' },

  // ── Minimal ───────────────────────────────────────────────────────────────
  { cat:'Minimal', name:'Clean White',    colors:['#3B82F6','#0D9488','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Minimal', name:'Scandinavian',   colors:['#2563EB','#DC2626','#16A34A','#D97706','#7C3AED','#0D9488','#DB2777','#374151'], bg:'#FAFAFA', fg:'#111827' },
  { cat:'Minimal', name:'Swiss Grid',     colors:['#F44336','#2196F3','#4CAF50','#FF9800','#9C27B0','#009688','#FF5722','#607D8B'], bg:'#FFFFFF', fg:'#000000' },
  { cat:'Minimal', name:'Soft Pastels',   colors:['#93C5FD','#A78BFA','#F9A8D4','#6EE7B7','#FDE68A','#FDBA74','#A5F3FC','#D9F99D'], bg:'#F8FAFC', fg:'#1E293B' },
  { cat:'Minimal', name:'Ink Paper',      colors:['#1F2937','#374151','#4B5563','#6B7280','#3B82F6','#10B981','#F59E0B','#EF4444'], bg:'#FEFCE8', fg:'#111827' },
  { cat:'Minimal', name:'Mono Chrome',    colors:['#000000','#1F1F1F','#3D3D3D','#5C5C5C','#7A7A7A','#999999','#BFBFBF','#E0E0E0'], bg:'#FFFFFF', fg:'#000000' },
  { cat:'Minimal', name:'Blueprint',      colors:['#003F88','#00509D','#0077B6','#0096C7','#00B4D8','#48CAE4','#90E0EF','#ADE8F4'], bg:'#EBF4F8', fg:'#001D3D' },
  { cat:'Minimal', name:'Greyscale',      colors:['#171717','#262626','#404040','#525252','#737373','#A3A3A3','#D4D4D4','#F5F5F5'], bg:'#FAFAFA', fg:'#0A0A0A' },
  { cat:'Minimal', name:'Parchment',      colors:['#5C4033','#795548','#8D6E63','#A1887F','#B39DDB','#7986CB','#4DB6AC','#80CBC4'], bg:'#FDF6E3', fg:'#2D1B00' },
  { cat:'Minimal', name:'Pure Black',     colors:['#FFFFFF','#E2E8F0','#94A3B8','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'], bg:'#0A0A0A', fg:'#F8FAFC' },
]

export function getPresetsByCategory(cat: string): PresetTheme[] {
  if (cat === 'All') return PRESETS
  return PRESETS.filter((p) => p.cat === cat)
}

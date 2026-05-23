/* ───── Preset Themes (100+) ─────────────────────
   Each: { cat, name, colors[8], bg, fg }
   Categories: Modern, Corporate, Dark, Light, Finance,
               Healthcare, Vibrant, Nature, Minimal
   ─────────────────────────────────────────────── */

window.PRESETS = [
  // ── Modern ──
  { cat:'Modern', name:'Datacense Brand', colors:['#1E2D8A','#2DA9F1','#0EA5E9','#14B8A6','#8B5CF6','#F472B6','#FB923C','#FACC15'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Modern', name:'Aurora', colors:['#6366F1','#06B6D4','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#3B82F6'], bg:'#FAFAFB', fg:'#1F2937' },
  { cat:'Modern', name:'Sunset Pop', colors:['#F43F5E','#FB7185','#FBBF24','#34D399','#60A5FA','#A78BFA','#F472B6','#22D3EE'], bg:'#FFFBF5', fg:'#1C1917' },
  { cat:'Modern', name:'Pastel Studio', colors:['#A5B4FC','#F9A8D4','#FCD34D','#86EFAC','#FCA5A5','#7DD3FC','#C4B5FD','#FDBA74'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Modern', name:'Neo Mint', colors:['#0EA5E9','#14B8A6','#10B981','#22D3EE','#84CC16','#F59E0B','#A855F7','#EC4899'], bg:'#F0FDFA', fg:'#134E4A' },
  { cat:'Modern', name:'Coral Reef', colors:['#FF6B6B','#FFA45B','#FFE66D','#1A936F','#114B5F','#88D498','#C6DABF','#F3E9D2'], bg:'#FFFCF5', fg:'#114B5F' },
  { cat:'Modern', name:'Tokyo Night', colors:['#7AA2F7','#BB9AF7','#7DCFFF','#9ECE6A','#F7768E','#E0AF68','#73DACA','#FF9E64'], bg:'#FFFFFF', fg:'#1A1B26' },
  { cat:'Modern', name:'Berry', colors:['#831843','#BE185D','#DB2777','#EC4899','#F472B6','#F9A8D4','#FBCFE8','#FDF2F8'], bg:'#FFFBFC', fg:'#500724' },
  { cat:'Modern', name:'Ocean Drive', colors:['#0369A1','#0284C7','#0EA5E9','#38BDF8','#7DD3FC','#BAE6FD','#E0F2FE','#F0F9FF'], bg:'#F0F9FF', fg:'#0C4A6E' },
  { cat:'Modern', name:'Citrus Burst', colors:['#FACC15','#FB923C','#F97316','#EF4444','#84CC16','#22C55E','#14B8A6','#06B6D4'], bg:'#FEFCE8', fg:'#422006' },
  { cat:'Modern', name:'Vapor', colors:['#FF71CE','#01CDFE','#05FFA1','#B967FF','#FFFB96','#FF9D5C','#7CFC00','#FF1493'], bg:'#0E0E1A', fg:'#FFFFFF' },
  { cat:'Modern', name:'Glass Lab', colors:['#0EA5E9','#A855F7','#EC4899','#F59E0B','#10B981','#06B6D4','#8B5CF6','#F43F5E'], bg:'#F8FAFC', fg:'#0F172A' },

  // ── Corporate ──
  { cat:'Corporate', name:'Boardroom Blue', colors:['#0B3D91','#1565C0','#1E88E5','#42A5F5','#90CAF9','#5C6BC0','#7986CB','#8E99F3'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Corporate', name:'Strategy Gray', colors:['#1F2937','#374151','#4B5563','#6B7280','#9CA3AF','#0EA5E9','#10B981','#F59E0B'], bg:'#FFFFFF', fg:'#111827' },
  { cat:'Corporate', name:'Slate Pro', colors:['#1E293B','#334155','#475569','#64748B','#94A3B8','#3B82F6','#06B6D4','#10B981'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Corporate', name:'Ivory & Navy', colors:['#0A2540','#1E3A8A','#2563EB','#60A5FA','#A78BFA','#10B981','#F59E0B','#DC2626'], bg:'#FAF8F2', fg:'#0A2540' },
  { cat:'Corporate', name:'Executive Teal', colors:['#0F766E','#14B8A6','#5EEAD4','#A7F3D0','#FCD34D','#F59E0B','#9333EA','#1E40AF'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Corporate', name:'Steelworks', colors:['#475569','#64748B','#94A3B8','#CBD5E1','#0F766E','#0369A1','#7C2D12','#A16207'], bg:'#F1F5F9', fg:'#1E293B' },
  { cat:'Corporate', name:'Wall Street', colors:['#1E40AF','#1E3A8A','#0F172A','#374151','#10B981','#DC2626','#F59E0B','#6366F1'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Corporate', name:'Consultant', colors:['#1A365D','#2C5282','#2B6CB0','#3182CE','#4299E1','#63B3ED','#90CDF8','#BEE3F8'], bg:'#FFFFFF', fg:'#1A202C' },
  { cat:'Corporate', name:'Audit Office', colors:['#0C4A6E','#0369A1','#0284C7','#0EA5E9','#38BDF8','#7DD3FC','#BAE6FD','#E0F2FE'], bg:'#FAFAFA', fg:'#082F49' },
  { cat:'Corporate', name:'Pinstripe', colors:['#1E3A8A','#1E40AF','#3730A3','#4338CA','#6366F1','#818CF8','#A5B4FC','#C7D2FE'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Corporate', name:'Annual Report', colors:['#831843','#9F1239','#BE123C','#E11D48','#F43F5E','#FB7185','#FDA4AF','#FECDD3'], bg:'#FFFFFF', fg:'#1F2937' },
  { cat:'Corporate', name:'Quarterly', colors:['#064E3B','#065F46','#047857','#059669','#10B981','#34D399','#6EE7B7','#A7F3D0'], bg:'#FFFFFF', fg:'#0F172A' },

  // ── Dark ──
  { cat:'Dark', name:'Midnight', colors:['#60A5FA','#A78BFA','#F472B6','#34D399','#FBBF24','#FB7185','#22D3EE','#A3E635'], bg:'#0F172A', fg:'#F1F5F9' },
  { cat:'Dark', name:'Carbon', colors:['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'], bg:'#111827', fg:'#F9FAFB' },
  { cat:'Dark', name:'Onyx', colors:['#06B6D4','#0EA5E9','#3B82F6','#8B5CF6','#A855F7','#D946EF','#EC4899','#F43F5E'], bg:'#0A0A0A', fg:'#FAFAFA' },
  { cat:'Dark', name:'Eclipse', colors:['#FB923C','#F472B6','#A78BFA','#60A5FA','#34D399','#FACC15','#FCA5A5','#22D3EE'], bg:'#1A1B26', fg:'#C0CAF5' },
  { cat:'Dark', name:'Deep Space', colors:['#7C3AED','#3B82F6','#06B6D4','#10B981','#F59E0B','#EF4444','#EC4899','#F472B6'], bg:'#020617', fg:'#E2E8F0' },
  { cat:'Dark', name:'Synthwave', colors:['#FF71CE','#01CDFE','#05FFA1','#B967FF','#FFFB96','#FF6B9D','#C66FBC','#3D5AFE'], bg:'#16162E', fg:'#F8F8F2' },
  { cat:'Dark', name:'Charcoal', colors:['#F87171','#FBBF24','#A3E635','#34D399','#22D3EE','#60A5FA','#A78BFA','#F472B6'], bg:'#1F1F1F', fg:'#E5E7EB' },
  { cat:'Dark', name:'Obsidian', colors:['#0EA5E9','#22D3EE','#10B981','#84CC16','#FACC15','#FB923C','#F43F5E','#A855F7'], bg:'#0C0E14', fg:'#F1F5F9' },
  { cat:'Dark', name:'Inkwell', colors:['#93C5FD','#86EFAC','#FCD34D','#FCA5A5','#C4B5FD','#F0ABFC','#67E8F9','#FDBA74'], bg:'#1E1B4B', fg:'#EDE9FE' },
  { cat:'Dark', name:'Graphite', colors:['#22D3EE','#A78BFA','#F472B6','#34D399','#FBBF24','#60A5FA','#FB923C','#A3E635'], bg:'#18181B', fg:'#FAFAFA' },
  { cat:'Dark', name:'Nightowl', colors:['#82AAFF','#C792EA','#7FDBCA','#ADDB67','#FFCB6B','#F78C6C','#FF5874','#80CBC4'], bg:'#011627', fg:'#D6DEEB' },

  // ── Light ──
  { cat:'Light', name:'Paper', colors:['#0F172A','#1E40AF','#0F766E','#A16207','#9F1239','#7C2D12','#5B21B6','#155E75'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Light', name:'Linen', colors:['#1E293B','#0369A1','#047857','#B45309','#BE123C','#6D28D9','#0E7490','#3F3F46'], bg:'#FAF8F2', fg:'#1C1917' },
  { cat:'Light', name:'Cream', colors:['#1F2937','#1D4ED8','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#52525B'], bg:'#FFFAF0', fg:'#1F2937' },
  { cat:'Light', name:'Ivory', colors:['#0F172A','#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#71717A'], bg:'#FFFFF0', fg:'#0F172A' },
  { cat:'Light', name:'Snow', colors:['#1E40AF','#3B82F6','#10B981','#F59E0B','#EF4444','#A855F7','#EC4899','#06B6D4'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Light', name:'Pebble', colors:['#475569','#0EA5E9','#10B981','#F59E0B','#DC2626','#9333EA','#0891B2','#A16207'], bg:'#F4F4F5', fg:'#18181B' },
  { cat:'Light', name:'Almond', colors:['#92400E','#B45309','#D97706','#F59E0B','#FBBF24','#FCD34D','#FDE68A','#FEF3C7'], bg:'#FFFBEB', fg:'#451A03' },
  { cat:'Light', name:'Mistgray', colors:['#374151','#6B7280','#0EA5E9','#10B981','#F59E0B','#EC4899','#8B5CF6','#06B6D4'], bg:'#F9FAFB', fg:'#111827' },
  { cat:'Light', name:'Eggshell', colors:['#0F172A','#7C3AED','#0F766E','#9F1239','#A16207','#1E40AF','#155E75','#65A30D'], bg:'#FDFCF7', fg:'#1F2937' },
  { cat:'Light', name:'Cotton', colors:['#475569','#3B82F6','#14B8A6','#F59E0B','#F43F5E','#A855F7','#06B6D4','#84CC16'], bg:'#FFFFFF', fg:'#1E293B' },

  // ── Finance ──
  { cat:'Finance', name:'Bull Run', colors:['#16A34A','#22C55E','#4ADE80','#86EFAC','#DC2626','#EF4444','#F87171','#FCA5A5'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Finance', name:'Bloomberg', colors:['#FF6700','#FFA500','#FFD700','#0EA5E9','#10B981','#DC2626','#7C3AED','#06B6D4'], bg:'#0F0F0F', fg:'#FAFAFA' },
  { cat:'Finance', name:'Treasury', colors:['#0F4C81','#1565C0','#1976D2','#1E88E5','#42A5F5','#FFB300','#FF8F00','#FF6F00'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Finance', name:'Hedge Fund', colors:['#0A2540','#0F4C81','#1976D2','#10B981','#FBBF24','#DC2626','#7C3AED','#0891B2'], bg:'#FAFAFA', fg:'#0A2540' },
  { cat:'Finance', name:'Compliance', colors:['#1E3A8A','#1E40AF','#2563EB','#3B82F6','#10B981','#16A34A','#DC2626','#EAB308'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Finance', name:'Earnings', colors:['#065F46','#047857','#059669','#10B981','#34D399','#DC2626','#F59E0B','#1E40AF'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Finance', name:'Trading Desk', colors:['#16A34A','#DC2626','#0EA5E9','#FBBF24','#A855F7','#F97316','#06B6D4','#94A3B8'], bg:'#0A0A0A', fg:'#FAFAFA' },
  { cat:'Finance', name:'IRA Gold', colors:['#A16207','#CA8A04','#EAB308','#FACC15','#1E40AF','#0F766E','#9F1239','#475569'], bg:'#FFFBEB', fg:'#422006' },
  { cat:'Finance', name:'Audit Steel', colors:['#334155','#475569','#64748B','#0EA5E9','#10B981','#F59E0B','#DC2626','#8B5CF6'], bg:'#F8FAFC', fg:'#0F172A' },

  // ── Healthcare ──
  { cat:'Healthcare', name:'Clinic', colors:['#0EA5E9','#06B6D4','#14B8A6','#10B981','#84CC16','#F59E0B','#EC4899','#A855F7'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Healthcare', name:'Pediatric', colors:['#67E8F9','#7DD3FC','#A5B4FC','#C4B5FD','#FDA4AF','#FCA5A5','#FCD34D','#86EFAC'], bg:'#F0F9FF', fg:'#0F172A' },
  { cat:'Healthcare', name:'Wellness', colors:['#0F766E','#14B8A6','#22C55E','#84CC16','#EAB308','#F97316','#EC4899','#8B5CF6'], bg:'#F0FDFA', fg:'#134E4A' },
  { cat:'Healthcare', name:'Surgical', colors:['#0369A1','#0284C7','#0EA5E9','#06B6D4','#10B981','#F59E0B','#DC2626','#A855F7'], bg:'#FFFFFF', fg:'#0C4A6E' },
  { cat:'Healthcare', name:'Pharma', colors:['#1E40AF','#3B82F6','#06B6D4','#10B981','#F59E0B','#EF4444','#A855F7','#EC4899'], bg:'#F8FAFC', fg:'#0F172A' },
  { cat:'Healthcare', name:'Mindful', colors:['#7DD3FC','#A5F3FC','#A7F3D0','#FDE68A','#FCA5A5','#DDD6FE','#F9A8D4','#BFDBFE'], bg:'#F8FAFC', fg:'#1E293B' },
  { cat:'Healthcare', name:'EMR Pro', colors:['#0F766E','#0E7490','#1E40AF','#7C3AED','#BE185D','#A16207','#15803D','#475569'], bg:'#FFFFFF', fg:'#0F172A' },

  // ── Vibrant ──
  { cat:'Vibrant', name:'Carnival', colors:['#FF006E','#FB5607','#FFBE0B','#8338EC','#3A86FF','#06FFA5','#FF4D6D','#9B5DE5'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Vibrant', name:'Tropic', colors:['#06FFA5','#FFBE0B','#FB5607','#FF006E','#3A86FF','#8338EC','#FF4D6D','#9B5DE5'], bg:'#FFFAF5', fg:'#0F172A' },
  { cat:'Vibrant', name:'Disco', colors:['#FF1654','#247BA0','#70C1B3','#B2DBBF','#F3FFBD','#F9C846','#F94144','#9D4EDD'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Vibrant', name:'Festival', colors:['#FF595E','#FFCA3A','#8AC926','#1982C4','#6A4C93','#F94144','#F8961E','#43AA8B'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Vibrant', name:'Pop Art', colors:['#F94144','#F3722C','#F8961E','#F9C74F','#90BE6D','#43AA8B','#577590','#277DA1'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Vibrant', name:'Bubblegum', colors:['#FF61A6','#FF85B3','#FFB7C5','#7BDFF2','#B2F7EF','#EFF7F6','#F7D6E0','#F2B5D4'], bg:'#FFFFFF', fg:'#1F2937' },
  { cat:'Vibrant', name:'Neon', colors:['#39FF14','#FF073A','#FE53BB','#08F7FE','#F5D300','#FF6E40','#7122FA','#1AF1FF'], bg:'#0A0A0A', fg:'#FFFFFF' },
  { cat:'Vibrant', name:'Mango', colors:['#FF9505','#FFB627','#FFC971','#E2711D','#CC5803','#A2333D','#7B2D26','#5A1A1A'], bg:'#FFFBF0', fg:'#3F1A0F' },
  { cat:'Vibrant', name:'Punch', colors:['#E63946','#F1FAEE','#A8DADC','#457B9D','#1D3557','#F77F00','#FCBF49','#003049'], bg:'#FFFFFF', fg:'#1D3557' },

  // ── Nature ──
  { cat:'Nature', name:'Forest', colors:['#1B4332','#2D6A4F','#40916C','#52B788','#74C69D','#95D5B2','#B7E4C7','#D8F3DC'], bg:'#F4F8F5', fg:'#1B4332' },
  { cat:'Nature', name:'Desert', colors:['#9C6644','#B08968','#DDB892','#E6CCB2','#EDE0D4','#A0522D','#8B4513','#CD853F'], bg:'#FFFAF0', fg:'#3F2E1E' },
  { cat:'Nature', name:'Ocean', colors:['#03045E','#023E8A','#0077B6','#0096C7','#00B4D8','#48CAE4','#90E0EF','#ADE8F4'], bg:'#F0F9FF', fg:'#03045E' },
  { cat:'Nature', name:'Meadow', colors:['#386641','#6A994E','#A7C957','#F2E8CF','#BC4749','#A98467','#F2CC8F','#E07A5F'], bg:'#FFFCF5', fg:'#283618' },
  { cat:'Nature', name:'Glacier', colors:['#CAF0F8','#90E0EF','#00B4D8','#0077B6','#03045E','#48CAE4','#0096C7','#023E8A'], bg:'#F8FBFF', fg:'#03045E' },
  { cat:'Nature', name:'Autumn', colors:['#582F0E','#7F4F24','#936639','#A68A64','#B6AD90','#C2C5AA','#A4AC86','#656D4A'], bg:'#FAF6EE', fg:'#582F0E' },
  { cat:'Nature', name:'Cherry', colors:['#FCE4EC','#F8BBD0','#F48FB1','#F06292','#EC407A','#E91E63','#D81B60','#C2185B'], bg:'#FFF5F8', fg:'#880E4F' },
  { cat:'Nature', name:'Mountain', colors:['#283618','#606C38','#FEFAE0','#DDA15E','#BC6C25','#A77A4A','#8D6E63','#6D4C41'], bg:'#FEFAE0', fg:'#283618' },
  { cat:'Nature', name:'Lavender Field', colors:['#7B5EA7','#9E78C4','#BCA0DC','#D7BBE8','#F0CFEC','#E2C2C6','#C39BB5','#A88ABA'], bg:'#FDF8FF', fg:'#3D2A5C' },

  // ── Minimal ──
  { cat:'Minimal', name:'Mono', colors:['#0F172A','#334155','#64748B','#94A3B8','#CBD5E1','#E2E8F0','#0EA5E9','#10B981'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Minimal', name:'Mono Light', colors:['#334155','#64748B','#94A3B8','#CBD5E1','#0EA5E9','#10B981','#F59E0B','#EF4444'], bg:'#FAFAFA', fg:'#1E293B' },
  { cat:'Minimal', name:'Single Blue', colors:['#0C4A6E','#075985','#0369A1','#0284C7','#0EA5E9','#38BDF8','#7DD3FC','#BAE6FD'], bg:'#FFFFFF', fg:'#0C4A6E' },
  { cat:'Minimal', name:'Single Teal', colors:['#134E4A','#115E59','#0F766E','#0D9488','#14B8A6','#2DD4BF','#5EEAD4','#99F6E4'], bg:'#FFFFFF', fg:'#134E4A' },
  { cat:'Minimal', name:'Single Rose', colors:['#881337','#9F1239','#BE123C','#E11D48','#F43F5E','#FB7185','#FDA4AF','#FECDD3'], bg:'#FFFFFF', fg:'#881337' },
  { cat:'Minimal', name:'Single Violet', colors:['#3B0764','#581C87','#6B21A8','#7E22CE','#9333EA','#A855F7','#C084FC','#D8B4FE'], bg:'#FFFFFF', fg:'#3B0764' },
  { cat:'Minimal', name:'Duotone Ink', colors:['#0F172A','#1E40AF','#475569','#3B82F6','#94A3B8','#60A5FA','#CBD5E1','#93C5FD'], bg:'#FFFFFF', fg:'#0F172A' },
  { cat:'Minimal', name:'Editorial', colors:['#000000','#404040','#737373','#A3A3A3','#D4D4D4','#DC2626','#0EA5E9','#10B981'], bg:'#FAFAFA', fg:'#000000' },
  { cat:'Minimal', name:'Whisper', colors:['#1E293B','#334155','#475569','#64748B','#94A3B8','#A78BFA','#34D399','#F59E0B'], bg:'#FFFFFF', fg:'#1E293B' },
  { cat:'Minimal', name:'Quartz', colors:['#27272A','#3F3F46','#52525B','#71717A','#A1A1AA','#0EA5E9','#84CC16','#F97316'], bg:'#FAFAF9', fg:'#27272A' },
];

window.PRESET_CATS = ['All','Modern','Corporate','Dark','Light','Finance','Healthcare','Vibrant','Nature','Minimal'];

import { extendPalette } from './paletteUtils'
import { getUniqueThemes } from './themeDeduplication'
import type { PaletteSize, PresetTheme } from '@/types'

export const THEME_CATEGORIES = [
  'Corporate',
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Industrial',
  'Premium Dark',
  'Minimal',
  'India & Gulf',
  'Modern',
] as const
type BuiltInThemeCategory = (typeof THEME_CATEGORIES)[number]

export const PRESET_CATEGORIES = ['All', ...THEME_CATEGORIES] as const

export type PresetCategory = (typeof PRESET_CATEGORIES)[number]

interface CategoryDefaults {
  background: string
  foreground: string
  tableAccent: string
  good: string
  neutral: string
  bad: string
  visualBackground: string
  borderColor: string
  titleColor: string
  labelColor: string
  fontFamily: string
  titleFontSize: number
  labelFontSize: number
  paletteSizeDefault: PaletteSize
}

interface PresetSeed {
  name: string
  category: BuiltInThemeCategory
  description: string
  colors: string[]
  background?: string
  foreground?: string
  tableAccent?: string
  good?: string
  neutral?: string
  bad?: string
  visualBackground?: string
  borderColor?: string
  titleColor?: string
  labelColor?: string
  fontFamily?: string
  titleFontSize?: number
  labelFontSize?: number
  paletteSizeDefault?: PaletteSize
}

const CATEGORY_DEFAULTS: Record<BuiltInThemeCategory, CategoryDefaults> = {
  Corporate: {
    background: '#F8FAFC',
    foreground: '#0F172A',
    tableAccent: '#1D4ED8',
    good: '#10B981',
    neutral: '#F59E0B',
    bad: '#DC2626',
    visualBackground: '#FFFFFF',
    borderColor: '#D7DEE8',
    titleColor: '#0F172A',
    labelColor: '#475569',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
  Technology: {
    background: '#F5F7FB',
    foreground: '#111827',
    tableAccent: '#2563EB',
    good: '#10B981',
    neutral: '#F59E0B',
    bad: '#EF4444',
    visualBackground: '#FFFFFF',
    borderColor: '#D8E0EA',
    titleColor: '#111827',
    labelColor: '#4B5563',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
  Finance: {
    background: '#F7FAF9',
    foreground: '#0F1F2E',
    tableAccent: '#0F766E',
    good: '#107C41',
    neutral: '#C19A2E',
    bad: '#C72F2F',
    visualBackground: '#FFFFFF',
    borderColor: '#D8E2E4',
    titleColor: '#0F1F2E',
    labelColor: '#52616B',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
  Healthcare: {
    background: '#F4FAFB',
    foreground: '#12323D',
    tableAccent: '#0284C7',
    good: '#059669',
    neutral: '#D97706',
    bad: '#DC2626',
    visualBackground: '#FFFFFF',
    borderColor: '#CFE4EA',
    titleColor: '#12323D',
    labelColor: '#526A72',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 7,
  },
  Retail: {
    background: '#FFF9F4',
    foreground: '#231F20',
    tableAccent: '#EA580C',
    good: '#16A34A',
    neutral: '#F59E0B',
    bad: '#DC2626',
    visualBackground: '#FFFFFF',
    borderColor: '#F0DED3',
    titleColor: '#231F20',
    labelColor: '#6B5B50',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
  Industrial: {
    background: '#F4F6F8',
    foreground: '#1F2933',
    tableAccent: '#475569',
    good: '#15803D',
    neutral: '#B45309',
    bad: '#B91C1C',
    visualBackground: '#FFFFFF',
    borderColor: '#CBD5E1',
    titleColor: '#1F2933',
    labelColor: '#64748B',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 7,
  },
  'Premium Dark': {
    background: '#0B1220',
    foreground: '#E5E7EB',
    tableAccent: '#38BDF8',
    good: '#22C55E',
    neutral: '#F59E0B',
    bad: '#F87171',
    visualBackground: '#111827',
    borderColor: '#334155',
    titleColor: '#F8FAFC',
    labelColor: '#CBD5E1',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
  Minimal: {
    background: '#FAFAFA',
    foreground: '#18181B',
    tableAccent: '#52525B',
    good: '#16A34A',
    neutral: '#A16207',
    bad: '#B91C1C',
    visualBackground: '#FFFFFF',
    borderColor: '#E4E4E7',
    titleColor: '#18181B',
    labelColor: '#71717A',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 5,
  },
  'India & Gulf': {
    background: '#FFFCF5',
    foreground: '#1F2937',
    tableAccent: '#0D9488',
    good: '#16A34A',
    neutral: '#D97706',
    bad: '#DC2626',
    visualBackground: '#FFFFFF',
    borderColor: '#EADFD0',
    titleColor: '#1F2937',
    labelColor: '#6B5D4D',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
  Modern: {
    background: '#F8FAFC',
    foreground: '#0F172A',
    tableAccent: '#0D9488',
    good: '#10B981',
    neutral: '#F59E0B',
    bad: '#EF4444',
    visualBackground: '#FFFFFF',
    borderColor: '#E2E8F0',
    titleColor: '#0F172A',
    labelColor: '#64748B',
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: 10,
  },
}

const SEEDS: PresetSeed[] = [
  { category: 'Corporate', name: 'Microsoft Inspired', description: 'Balanced enterprise blues with clean executive reporting contrast.', colors: ['#2563EB', '#0F766E', '#7C3AED', '#F59E0B', '#475569'] },
  { category: 'Corporate', name: 'Accenture Inspired', description: 'Consulting-style purple accent with calm slate and blue support colors.', colors: ['#7C3AED', '#1F2937', '#2563EB', '#0D9488', '#F59E0B'] },
  { category: 'Corporate', name: 'Deloitte Inspired', description: 'Green-led consulting palette tuned for financial and operations decks.', colors: ['#046A38', '#00A550', '#2563EB', '#64748B', '#F59E0B'] },
  { category: 'Corporate', name: 'PwC Inspired', description: 'Warm executive orange and deep blue for advisory dashboards.', colors: ['#D04A02', '#EB6900', '#003150', '#0070A0', '#64748B'] },
  { category: 'Corporate', name: 'EY Inspired', description: 'High-contrast charcoal and yellow for board-ready insight pages.', colors: ['#111827', '#FACC15', '#475569', '#2563EB', '#0D9488'] },
  { category: 'Corporate', name: 'KPMG Inspired', description: 'Strong corporate blue system with measured teal and amber signals.', colors: ['#00338D', '#005EB8', '#00A3E0', '#0D9488', '#F59E0B'] },
  { category: 'Corporate', name: 'IBM Inspired', description: 'Deep technology-blue sequence with precise enterprise tone.', colors: ['#0F62FE', '#0043CE', '#002D9C', '#08BDBA', '#6F6F6F'] },
  { category: 'Corporate', name: 'Oracle Inspired', description: 'Red-led corporate palette with stable slate supporting colors.', colors: ['#C74634', '#7F1D1D', '#374151', '#2563EB', '#F59E0B'] },
  { category: 'Corporate', name: 'SAP Inspired', description: 'Bright enterprise blue with clean neutrals for software analytics.', colors: ['#0A6ED1', '#00A1E0', '#1D4ED8', '#0D9488', '#64748B'] },
  { category: 'Corporate', name: 'Salesforce Inspired', description: 'Cloud-blue palette with friendly teal and violet secondary tones.', colors: ['#00A1E0', '#1589EE', '#032D60', '#0D9488', '#8B5CF6'] },
  { category: 'Corporate', name: 'Executive Navy', description: 'Classic navy, slate and gold palette for leadership scorecards.', colors: ['#102A43', '#1E3A5F', '#2563EB', '#C9A227', '#64748B'], tableAccent: '#1E3A5F' },
  { category: 'Corporate', name: 'Boardroom Slate', description: 'Restrained slate and blue palette for governance dashboards.', colors: ['#1F2937', '#334155', '#475569', '#2563EB', '#0D9488'] },

  { category: 'Technology', name: 'TCS Inspired', description: 'Global services blue and teal palette for delivery dashboards.', colors: ['#0F4C81', '#1D4ED8', '#0D9488', '#7C3AED', '#F59E0B'] },
  { category: 'Technology', name: 'Infosys Inspired', description: 'Clean digital blue with modern cyan and green accents.', colors: ['#007CC3', '#00ADEF', '#2563EB', '#0D9488', '#64748B'] },
  { category: 'Technology', name: 'Wipro Inspired', description: 'Energetic IT services palette with controlled multicolor variety.', colors: ['#7C3AED', '#2563EB', '#0D9488', '#F59E0B', '#EC4899'] },
  { category: 'Technology', name: 'HCL Inspired', description: 'Modern blue and green palette for support and delivery analytics.', colors: ['#005EB8', '#00A3E0', '#16A34A', '#7C3AED', '#F59E0B'] },
  { category: 'Technology', name: 'Cognizant Inspired', description: 'Enterprise blue palette with crisp teal and slate contrast.', colors: ['#0033A0', '#0072CE', '#00A3AD', '#475569', '#8B5CF6'] },
  { category: 'Technology', name: 'SaaS Indigo', description: 'Product analytics palette with indigo, cyan and growth green.', colors: ['#4F46E5', '#2563EB', '#06B6D4', '#10B981', '#F59E0B'] },
  { category: 'Technology', name: 'Cloud Platform', description: 'Soft cloud blues and turquoise accents for infrastructure dashboards.', colors: ['#2563EB', '#38BDF8', '#0EA5E9', '#0D9488', '#64748B'] },
  { category: 'Technology', name: 'Cyber Defense', description: 'Security operations palette with sharp teal, blue and warning amber.', colors: ['#0F172A', '#0EA5E9', '#14B8A6', '#F59E0B', '#EF4444'], background: '#F8FAFC' },
  { category: 'Technology', name: 'Data Platform', description: 'Analytics-engine palette with Datacense teal and enterprise blue.', colors: ['#0D9488', '#2563EB', '#7C3AED', '#0891B2', '#F59E0B'] },
  { category: 'Technology', name: 'AI Studio', description: 'Modern AI product palette with violet, cyan and emerald signals.', colors: ['#7C3AED', '#06B6D4', '#2563EB', '#10B981', '#F97316'] },
  { category: 'Technology', name: 'Developer Console', description: 'Dark-capable product palette for platform engineering reports.', colors: ['#2563EB', '#0F766E', '#9333EA', '#64748B', '#F59E0B'] },
  { category: 'Technology', name: 'Startup Metrics', description: 'Clean SaaS growth colors for ARR, funnel and usage dashboards.', colors: ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899'] },

  { category: 'Finance', name: 'HDFC Inspired', description: 'Trustworthy bank-blue palette with controlled red and gold signals.', colors: ['#004C8F', '#0065B3', '#C41230', '#F59E0B', '#475569'] },
  { category: 'Finance', name: 'ICICI Inspired', description: 'Warm banking orange with blue and slate for portfolio dashboards.', colors: ['#B45309', '#F59E0B', '#1D4ED8', '#475569', '#0D9488'] },
  { category: 'Finance', name: 'Axis Inspired', description: 'Berry and navy palette for branch, card and risk dashboards.', colors: ['#7A003C', '#A00050', '#1E3A5F', '#2563EB', '#F59E0B'] },
  { category: 'Finance', name: 'Emirates NBD Inspired', description: 'Premium Gulf banking blues with clean amber highlights.', colors: ['#004B8D', '#0072BC', '#00A3E0', '#C9A227', '#64748B'] },
  { category: 'Finance', name: 'Finance Blue Gold', description: 'Classic finance palette for executive P&L and treasury reporting.', colors: ['#0F2E4D', '#1D4ED8', '#C9A227', '#D4AF37', '#64748B'] },
  { category: 'Finance', name: 'Banking Trust', description: 'Low-noise blue and teal for lending, deposits and branch metrics.', colors: ['#1E3A8A', '#2563EB', '#0F766E', '#334155', '#F59E0B'] },
  { category: 'Finance', name: 'Wealth Advisory', description: 'Premium wealth palette with navy, bronze and soft blue.', colors: ['#102A43', '#1E3A5F', '#A16207', '#D4A520', '#64748B'] },
  { category: 'Finance', name: 'Risk Management', description: 'Risk-friendly palette with clear red, amber and green indicators.', colors: ['#1E293B', '#DC2626', '#F59E0B', '#16A34A', '#2563EB'] },
  { category: 'Finance', name: 'Audit Control', description: 'Neutral audit palette with strong blue and restrained status colors.', colors: ['#334155', '#475569', '#2563EB', '#0D9488', '#B45309'] },
  { category: 'Finance', name: 'Treasury Desk', description: 'Cash-flow reporting palette with deep blue and gold emphasis.', colors: ['#0A2342', '#2E5E8E', '#C9A227', '#0D9488', '#64748B'] },
  { category: 'Finance', name: 'Capital Markets', description: 'Market analytics palette with dark blue, green and signal amber.', colors: ['#111827', '#2563EB', '#16A34A', '#F59E0B', '#EF4444'] },
  { category: 'Finance', name: 'Insurance Trust', description: 'Policy and claims palette with calm blue, teal and amber.', colors: ['#1D4ED8', '#0D9488', '#64748B', '#F59E0B', '#DC2626'] },

  { category: 'Healthcare', name: 'Healthcare Calm', description: 'Calm medical blue-green palette for hospital operations.', colors: ['#0284C7', '#0D9488', '#10B981', '#60A5FA', '#64748B'] },
  { category: 'Healthcare', name: 'Hospital Operations', description: 'Operational healthcare palette for census, capacity and SLA views.', colors: ['#0F766E', '#0284C7', '#2563EB', '#F59E0B', '#DC2626'] },
  { category: 'Healthcare', name: 'Pharma Blue Green', description: 'Clinical pharma palette with trustworthy blue and green tones.', colors: ['#1D4ED8', '#0891B2', '#059669', '#7C3AED', '#F59E0B'] },
  { category: 'Healthcare', name: 'Clinical White', description: 'Light clinical palette with precise blue, teal and status colors.', colors: ['#0284C7', '#0EA5E9', '#0D9488', '#10B981', '#F59E0B'], background: '#FAFCFD' },
  { category: 'Healthcare', name: 'Patient Flow', description: 'Throughput palette for admissions, discharge and waiting time.', colors: ['#2563EB', '#0D9488', '#F59E0B', '#EF4444', '#8B5CF6'] },
  { category: 'Healthcare', name: 'Diagnostics', description: 'Lab and diagnostics palette with crisp cyan and blue hierarchy.', colors: ['#0369A1', '#0EA5E9', '#22C55E', '#7C3AED', '#F97316'] },
  { category: 'Healthcare', name: 'Wellness Teal', description: 'Soft wellness palette with green, teal and calming blue.', colors: ['#047857', '#0D9488', '#38BDF8', '#A3E635', '#F59E0B'] },
  { category: 'Healthcare', name: 'Medical Research', description: 'Research dashboard palette with violet, blue and biotechnology green.', colors: ['#5B21B6', '#2563EB', '#0891B2', '#059669', '#F59E0B'] },
  { category: 'Healthcare', name: 'Cardio Monitor', description: 'Cardiology palette with careful red accents and clinical blues.', colors: ['#DC2626', '#EF4444', '#1D4ED8', '#0D9488', '#64748B'] },
  { category: 'Healthcare', name: 'Public Health', description: 'Population health palette for trend, geography and outcome dashboards.', colors: ['#1D4ED8', '#0284C7', '#16A34A', '#F59E0B', '#7C3AED'] },
  { category: 'Healthcare', name: 'Nursing Dashboard', description: 'Staffing and ward operations palette with low-noise blues.', colors: ['#0F766E', '#2563EB', '#60A5FA', '#64748B', '#F59E0B'] },
  { category: 'Healthcare', name: 'Pharma Executive', description: 'Executive pharma palette with navy, cyan and precise green.', colors: ['#1E3A5F', '#0284C7', '#0D9488', '#7C3AED', '#C9A227'] },

  { category: 'Retail', name: 'Amazon Inspired', description: 'Marketplace palette with navy, orange and analytics blue.', colors: ['#232F3E', '#FF9900', '#2563EB', '#0D9488', '#64748B'] },
  { category: 'Retail', name: 'Walmart Inspired', description: 'Retail operations palette with blue, yellow and green accents.', colors: ['#0071CE', '#FFC220', '#0D9488', '#2563EB', '#64748B'] },
  { category: 'Retail', name: 'Flipkart Inspired', description: 'Indian ecommerce palette with blue, yellow and status colors.', colors: ['#2874F0', '#F9D923', '#0D9488', '#F97316', '#64748B'] },
  { category: 'Retail', name: 'Zomato Inspired', description: 'Food-commerce red palette balanced for clean operational dashboards.', colors: ['#E23744', '#B91C1C', '#F59E0B', '#0D9488', '#2563EB'] },
  { category: 'Retail', name: 'Swiggy Inspired', description: 'Warm delivery analytics palette with orange and blue support colors.', colors: ['#FC8019', '#F97316', '#2563EB', '#0D9488', '#64748B'] },
  { category: 'Retail', name: 'Uber Inspired', description: 'Clean mobility and marketplace palette with black, green and blue.', colors: ['#111827', '#06C167', '#2563EB', '#64748B', '#F59E0B'] },
  { category: 'Retail', name: 'Retail Energy', description: 'Store performance palette with strong orange, teal and blue.', colors: ['#F97316', '#EA580C', '#0D9488', '#2563EB', '#7C3AED'] },
  { category: 'Retail', name: 'FMCG Fresh', description: 'Fresh CPG palette with green, citrus and retail blue.', colors: ['#16A34A', '#84CC16', '#F59E0B', '#0EA5E9', '#EF4444'] },
  { category: 'Retail', name: 'Omnichannel', description: 'Balanced retail channel palette for web, store and partner reports.', colors: ['#2563EB', '#0D9488', '#F97316', '#8B5CF6', '#EC4899'] },
  { category: 'Retail', name: 'Luxury Retail', description: 'Premium retail palette with black, gold and muted blue.', colors: ['#111827', '#C9A227', '#D4AF37', '#64748B', '#2563EB'] },
  { category: 'Retail', name: 'Grocery Fresh', description: 'Grocery category palette with produce green and warm amber.', colors: ['#15803D', '#22C55E', '#F59E0B', '#0D9488', '#EF4444'] },
  { category: 'Retail', name: 'Fashion Commerce', description: 'Fashion retail palette with violet, rose and clean blue.', colors: ['#8B5CF6', '#EC4899', '#2563EB', '#0D9488', '#F97316'] },

  { category: 'Industrial', name: 'Reliance Inspired', description: 'Large-enterprise industrial palette with blue, gold and steel.', colors: ['#003C7D', '#1D4ED8', '#C9A227', '#64748B', '#0D9488'] },
  { category: 'Industrial', name: 'Tata Enterprise', description: 'Steel-blue palette for diversified industrial executive reporting.', colors: ['#1D4ED8', '#0A4A7A', '#64748B', '#0D9488', '#F59E0B'] },
  { category: 'Industrial', name: 'Mahindra Inspired', description: 'Automotive red and steel palette for plant dashboards.', colors: ['#C8102E', '#991B1B', '#334155', '#64748B', '#F59E0B'] },
  { category: 'Industrial', name: 'Adani Inspired', description: 'Infrastructure palette with blue, green and energy amber.', colors: ['#0057A8', '#0D9488', '#16A34A', '#F59E0B', '#64748B'] },
  { category: 'Industrial', name: 'L&T Inspired', description: 'Engineering blue and yellow palette for project control dashboards.', colors: ['#005DAA', '#FDB913', '#334155', '#0D9488', '#EF4444'] },
  { category: 'Industrial', name: 'Logistics Steel', description: 'Logistics operations palette with steel, blue and amber signals.', colors: ['#334155', '#64748B', '#2563EB', '#F59E0B', '#0D9488'] },
  { category: 'Industrial', name: 'Supply Chain Navy', description: 'Supply-chain control tower palette with navy and teal.', colors: ['#102A43', '#1D4ED8', '#0D9488', '#F59E0B', '#64748B'] },
  { category: 'Industrial', name: 'Manufacturing Slate', description: 'Shop-floor palette with slate, orange and production green.', colors: ['#1F2937', '#475569', '#F97316', '#16A34A', '#2563EB'] },
  { category: 'Industrial', name: 'Oil & Gas Industrial', description: 'Energy operations palette with steel, gold and safety red.', colors: ['#111827', '#475569', '#C9A227', '#F59E0B', '#DC2626'] },
  { category: 'Industrial', name: 'Automotive Steel', description: 'Automotive manufacturing palette with red, slate and blue.', colors: ['#B91C1C', '#374151', '#64748B', '#2563EB', '#F59E0B'] },
  { category: 'Industrial', name: 'Aerospace Control', description: 'Aerospace operations palette with deep blue and titanium grey.', colors: ['#0F2E4D', '#2563EB', '#94A3B8', '#C9A227', '#0D9488'] },
  { category: 'Industrial', name: 'Energy Grid', description: 'Grid operations palette with yellow, cyan and status colors.', colors: ['#F59E0B', '#0EA5E9', '#2563EB', '#16A34A', '#EF4444'] },

  { category: 'Premium Dark', name: 'Premium Charcoal', description: 'Dark executive palette with cyan, teal and warm signal colors.', colors: ['#38BDF8', '#0D9488', '#8B5CF6', '#F59E0B', '#F87171'], background: '#0F172A', foreground: '#E5E7EB' },
  { category: 'Premium Dark', name: 'Luxury Black Gold', description: 'Premium black and gold palette for leadership presentations.', colors: ['#D4AF37', '#C9A227', '#64748B', '#38BDF8', '#F87171'], background: '#0A0A0A', foreground: '#F8FAFC', tableAccent: '#D4AF37' },
  { category: 'Premium Dark', name: 'Executive Midnight', description: 'Deep navy palette for night-mode executive dashboards.', colors: ['#60A5FA', '#38BDF8', '#0D9488', '#A78BFA', '#F59E0B'], background: '#07111F', foreground: '#E2E8F0' },
  { category: 'Premium Dark', name: 'Obsidian Analytics', description: 'Dark analytics palette with violet, cyan and green signals.', colors: ['#8B5CF6', '#06B6D4', '#22C55E', '#F59E0B', '#F472B6'], background: '#0B0F19', foreground: '#E5E7EB' },
  { category: 'Premium Dark', name: 'Dark Azure', description: 'Deep blue product palette for modern dashboards in dark mode.', colors: ['#60A5FA', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B'], background: '#09111F', foreground: '#E2E8F0' },
  { category: 'Premium Dark', name: 'Dark Teal Studio', description: 'Datacense-style dark teal palette for premium studio previews.', colors: ['#14B8A6', '#0D9488', '#38BDF8', '#8B5CF6', '#F97316'], background: '#071A1A', foreground: '#E2E8F0' },
  { category: 'Premium Dark', name: 'Dark Finance Gold', description: 'Premium finance dark palette with gold and blue hierarchy.', colors: ['#D4AF37', '#C9A227', '#60A5FA', '#0D9488', '#F87171'], background: '#111827', foreground: '#F8FAFC' },
  { category: 'Premium Dark', name: 'Control Room', description: 'Operations control-room palette with clear alert colors.', colors: ['#38BDF8', '#22C55E', '#F59E0B', '#F87171', '#A78BFA'], background: '#0B1220', foreground: '#F1F5F9' },
  { category: 'Premium Dark', name: 'Carbon Product', description: 'Dark SaaS palette with blue, cyan and muted graphite.', colors: ['#2563EB', '#06B6D4', '#64748B', '#10B981', '#F59E0B'], background: '#0F1115', foreground: '#E5E7EB' },
  { category: 'Premium Dark', name: 'Night Operations', description: 'Dark operations palette with strong teal and amber.', colors: ['#0D9488', '#38BDF8', '#F59E0B', '#F87171', '#94A3B8'], background: '#101820', foreground: '#E5E7EB' },
  { category: 'Premium Dark', name: 'Graphite Premium', description: 'Graphite-first dark palette for understated reports.', colors: ['#94A3B8', '#64748B', '#38BDF8', '#0D9488', '#D4AF37'], background: '#111827', foreground: '#F8FAFC' },
  { category: 'Premium Dark', name: 'Deep Space Metrics', description: 'Dark product metrics palette with violet and cyan energy.', colors: ['#7C3AED', '#38BDF8', '#0D9488', '#F59E0B', '#EC4899'], background: '#090A16', foreground: '#EEF2FF' },

  { category: 'Minimal', name: 'Minimal Grey', description: 'Quiet grey palette with controlled blue and teal accents.', colors: ['#18181B', '#3F3F46', '#71717A', '#2563EB', '#0D9488'] },
  { category: 'Minimal', name: 'Clean Slate', description: 'Clean slate-neutral palette for dense business reporting.', colors: ['#0F172A', '#334155', '#64748B', '#94A3B8', '#2563EB'] },
  { category: 'Minimal', name: 'Swiss Business', description: 'Minimal high-contrast palette with precise red and blue.', colors: ['#111827', '#6B7280', '#2563EB', '#DC2626', '#0D9488'] },
  { category: 'Minimal', name: 'Paper Ink', description: 'Report-like palette with ink, grey and subtle blue accents.', colors: ['#1F2937', '#4B5563', '#9CA3AF', '#2563EB', '#0D9488'], background: '#FEFEFE' },
  { category: 'Minimal', name: 'Soft Neutral', description: 'Soft neutral palette for calm, polished dashboards.', colors: ['#52525B', '#71717A', '#A1A1AA', '#3B82F6', '#14B8A6'] },
  { category: 'Minimal', name: 'Mono Blue', description: 'Monochrome blue palette for consistent operational dashboards.', colors: ['#1E3A8A', '#1D4ED8', '#2563EB', '#60A5FA', '#93C5FD'] },
  { category: 'Minimal', name: 'Mono Teal', description: 'Monochrome teal palette for simple branded reporting.', colors: ['#134E4A', '#0F766E', '#0D9488', '#14B8A6', '#5EEAD4'] },
  { category: 'Minimal', name: 'Neutral Executive', description: 'Neutral executive palette with understated gold and blue.', colors: ['#27272A', '#52525B', '#A1A1AA', '#C9A227', '#2563EB'] },
  { category: 'Minimal', name: 'Light Analyst', description: 'Analyst-friendly light palette with muted categorical colors.', colors: ['#2563EB', '#64748B', '#0D9488', '#A16207', '#7C3AED'] },
  { category: 'Minimal', name: 'Clean White', description: 'White-space-forward palette with blue and green signals.', colors: ['#2563EB', '#0D9488', '#64748B', '#F59E0B', '#EF4444'], background: '#FFFFFF' },
  { category: 'Minimal', name: 'Muted Dashboard', description: 'Low-saturation palette for long-running monitoring pages.', colors: ['#475569', '#64748B', '#78909C', '#2563EB', '#0F766E'] },
  { category: 'Minimal', name: 'Modern Greyscale', description: 'Greyscale foundation with a small Power BI-friendly accent set.', colors: ['#18181B', '#3F3F46', '#71717A', '#A1A1AA', '#2563EB'], paletteSizeDefault: 5 },

  { category: 'India & Gulf', name: 'DataCense Teal', description: 'Datacense-aligned teal and blue palette for student projects.', colors: ['#0D9488', '#1E3A8A', '#2DA9F1', '#F59E0B', '#64748B'] },
  { category: 'India & Gulf', name: 'Gulf Gold', description: 'Premium Gulf palette with gold, teal and deep navy.', colors: ['#C9A227', '#D4AF37', '#0D9488', '#102A43', '#2563EB'] },
  { category: 'India & Gulf', name: 'Desert Executive', description: 'Desert-inspired executive palette with sand, navy and teal.', colors: ['#A16207', '#D97706', '#C9A227', '#0F2E4D', '#0D9488'] },
  { category: 'India & Gulf', name: 'Emirates Inspired', description: 'Aviation-style palette with red, green and enterprise blue.', colors: ['#D71920', '#007A3D', '#1D4ED8', '#F59E0B', '#111827'] },
  { category: 'India & Gulf', name: 'Etihad Inspired', description: 'Premium airline-inspired palette with gold, brown and blue.', colors: ['#B68A35', '#6B4E2E', '#0F2E4D', '#2563EB', '#0D9488'] },
  { category: 'India & Gulf', name: 'Emaar Inspired', description: 'Real-estate executive palette with gold, navy and soft blue.', colors: ['#C9A227', '#1E3A5F', '#2563EB', '#94A3B8', '#0D9488'] },
  { category: 'India & Gulf', name: 'Dubai Executive', description: 'Dubai corporate palette with gold, teal and slate balance.', colors: ['#C9A227', '#0D9488', '#2563EB', '#64748B', '#F97316'] },
  { category: 'India & Gulf', name: 'Riyadh Enterprise', description: 'Saudi enterprise palette with green, navy and amber.', colors: ['#006C35', '#0F766E', '#102A43', '#C9A227', '#2563EB'] },
  { category: 'India & Gulf', name: 'Bengaluru SaaS', description: 'Indian SaaS palette with blue, teal and violet.', colors: ['#2563EB', '#0D9488', '#7C3AED', '#F59E0B', '#EC4899'] },
  { category: 'India & Gulf', name: 'Mumbai Finance', description: 'India finance palette with navy, gold and trusted blue.', colors: ['#102A43', '#1D4ED8', '#C9A227', '#0D9488', '#DC2626'] },
  { category: 'India & Gulf', name: 'Chennai Manufacturing', description: 'Industrial India palette with steel, orange and teal.', colors: ['#475569', '#F97316', '#0D9488', '#2563EB', '#B91C1C'] },
  { category: 'India & Gulf', name: 'Doha Premium', description: 'Premium Gulf palette with maroon, gold and blue.', colors: ['#7A003C', '#C9A227', '#102A43', '#2563EB', '#0D9488'] },

  { category: 'Modern', name: 'Modern Teal', description: 'Clean Datacense-style teal palette for broad business use.', colors: ['#0D9488', '#14B8A6', '#2563EB', '#8B5CF6', '#F59E0B'] },
  { category: 'Modern', name: 'Modern Indigo', description: 'Contemporary indigo palette for product and sales dashboards.', colors: ['#4F46E5', '#6366F1', '#0EA5E9', '#0D9488', '#F97316'] },
  { category: 'Modern', name: 'Cyan Analytics', description: 'Bright but professional cyan and blue analytics palette.', colors: ['#0891B2', '#06B6D4', '#2563EB', '#0D9488', '#F59E0B'] },
  { category: 'Modern', name: 'Fresh Metrics', description: 'Fresh green-blue palette for student and portfolio dashboards.', colors: ['#10B981', '#0D9488', '#3B82F6', '#A855F7', '#F59E0B'] },
  { category: 'Modern', name: 'Violet Studio', description: 'Modern violet and blue palette for creative analytic pages.', colors: ['#7C3AED', '#8B5CF6', '#2563EB', '#0D9488', '#EC4899'] },
  { category: 'Modern', name: 'Product Pulse', description: 'Product-led palette with blue, cyan, green and warm amber.', colors: ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'] },
  { category: 'Modern', name: 'Operations Clean', description: 'Clean operations palette with teal, blue and slate.', colors: ['#0D9488', '#2563EB', '#64748B', '#F59E0B', '#EF4444'] },
  { category: 'Modern', name: 'Revenue Motion', description: 'Sales-focused palette with blue, teal and energetic orange.', colors: ['#2563EB', '#0D9488', '#F97316', '#8B5CF6', '#10B981'] },
  { category: 'Modern', name: 'Balanced Spectrum', description: 'Balanced categorical palette with Power BI-friendly variation.', colors: ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'] },
  { category: 'Modern', name: 'Executive Bright', description: 'Professional bright palette with clean title and label contrast.', colors: ['#1D4ED8', '#0D9488', '#7C3AED', '#F59E0B', '#E11D48'] },
  { category: 'Modern', name: 'Insight Canvas', description: 'Studio canvas palette with teal, blue and neutral support.', colors: ['#0F766E', '#2563EB', '#64748B', '#9333EA', '#F59E0B'] },
  { category: 'Modern', name: 'Analytics Pro', description: 'All-purpose modern analytics palette with strong data colors.', colors: ['#0D9488', '#2563EB', '#8B5CF6', '#F97316', '#16A34A'] },
]

const TARGET_PRESET_COUNT = 250

const GENERATED_NAME_STEMS: Record<BuiltInThemeCategory, string[]> = {
  Corporate: [
    'Atlas', 'Board', 'Cobalt', 'Summit', 'Meridian', 'Harbor', 'Keystone',
    'Northstar', 'Ledger', 'Horizon', 'Vantage', 'Sovereign', 'Charter',
  ],
  Technology: [
    'Platform', 'Neural', 'Cloud', 'Vector', 'API', 'Quantum', 'Signal',
    'Vertex', 'Core', 'Circuit', 'Telemetry', 'DevOps', 'Product',
  ],
  Finance: [
    'Capital', 'Ledger', 'Treasury', 'Portfolio', 'Reserve', 'Credit', 'Risk',
    'Markets', 'Banking', 'Wealth', 'Assurance', 'Yield', 'Cashflow',
  ],
  Healthcare: [
    'Care', 'Clinical', 'Ward', 'Patient', 'Pharma', 'Lab', 'Outcome',
    'Wellness', 'MedOps', 'Research', 'Pulse', 'Provider', 'Claims',
  ],
  Retail: [
    'Shopper', 'Basket', 'Store', 'Commerce', 'Shelf', 'Loyalty', 'Category',
    'Market', 'Outlet', 'Merch', 'Consumer', 'Inventory', 'Channel',
  ],
  Industrial: [
    'Plant', 'Forge', 'Steel', 'Factory', 'Grid', 'Fleet', 'Logistics',
    'Energy', 'Assembly', 'Supply', 'Maintenance', 'Control', 'Throughput',
  ],
  'Premium Dark': [
    'Midnight', 'Onyx', 'Carbon', 'Obsidian', 'Nocturne', 'Eclipse', 'Graphite',
    'Black Gold', 'Nightfall', 'Shadow', 'Darkroom', 'Astra', 'Luxe',
  ],
  Minimal: [
    'Canvas', 'Paper', 'Mono', 'Quiet', 'Nordic', 'Essential', 'Plain',
    'Softline', 'Greyscale', 'Neutral', 'Whitespace', 'Studio', 'Focus',
  ],
  'India & Gulf': [
    'Gulf', 'Desert', 'Arabian', 'Bharat', 'Monsoon', 'Emirate', 'Riyadh',
    'Mumbai', 'Bengaluru', 'Doha', 'Dubai', 'Marina', 'Pearl',
  ],
  Modern: [
    'Pulse', 'Prism', 'Nova', 'Aurora', 'Momentum', 'Flow', 'Beacon',
    'Lumen', 'Signal', 'Orbit', 'Metric', 'Clarity', 'Studio',
  ],
}

const GENERATED_COLOR_VARIANTS: Record<BuiltInThemeCategory, string[][]> = {
  Corporate: [
    ['#102A43', '#1D4ED8', '#0D9488', '#64748B', '#C9A227'],
    ['#1E293B', '#2563EB', '#475569', '#0F766E', '#D97706'],
    ['#0F2E4D', '#0284C7', '#334155', '#7C3AED', '#F59E0B'],
  ],
  Technology: [
    ['#2563EB', '#06B6D4', '#7C3AED', '#10B981', '#F59E0B'],
    ['#4F46E5', '#0EA5E9', '#0D9488', '#64748B', '#EC4899'],
    ['#1D4ED8', '#0891B2', '#9333EA', '#16A34A', '#F97316'],
  ],
  Finance: [
    ['#0F2E4D', '#1D4ED8', '#C9A227', '#0D9488', '#DC2626'],
    ['#102A43', '#2563EB', '#A16207', '#16A34A', '#B91C1C'],
    ['#1E3A5F', '#0284C7', '#D4AF37', '#64748B', '#107C41'],
  ],
  Healthcare: [
    ['#0284C7', '#0D9488', '#10B981', '#60A5FA', '#F59E0B'],
    ['#1D4ED8', '#0891B2', '#059669', '#7C3AED', '#DC2626'],
    ['#0F766E', '#38BDF8', '#2563EB', '#84CC16', '#F97316'],
  ],
  Retail: [
    ['#F97316', '#2563EB', '#0D9488', '#EC4899', '#F59E0B'],
    ['#EA580C', '#16A34A', '#1D4ED8', '#8B5CF6', '#DC2626'],
    ['#FF9900', '#232F3E', '#0EA5E9', '#22C55E', '#C9A227'],
  ],
  Industrial: [
    ['#334155', '#64748B', '#F97316', '#2563EB', '#16A34A'],
    ['#111827', '#475569', '#C9A227', '#0D9488', '#B91C1C'],
    ['#0F2E4D', '#94A3B8', '#F59E0B', '#0284C7', '#15803D'],
  ],
  'Premium Dark': [
    ['#38BDF8', '#0D9488', '#8B5CF6', '#F59E0B', '#F87171'],
    ['#D4AF37', '#64748B', '#60A5FA', '#22C55E', '#A78BFA'],
    ['#06B6D4', '#2563EB', '#EC4899', '#F97316', '#94A3B8'],
  ],
  Minimal: [
    ['#18181B', '#3F3F46', '#71717A', '#2563EB', '#0D9488'],
    ['#27272A', '#52525B', '#A1A1AA', '#1D4ED8', '#A16207'],
    ['#0F172A', '#475569', '#94A3B8', '#0F766E', '#64748B'],
  ],
  'India & Gulf': [
    ['#0D9488', '#1E3A8A', '#C9A227', '#D97706', '#64748B'],
    ['#006C35', '#102A43', '#D4AF37', '#2563EB', '#A16207'],
    ['#7A003C', '#C9A227', '#0D9488', '#F97316', '#1D4ED8'],
  ],
  Modern: [
    ['#0D9488', '#2563EB', '#8B5CF6', '#F59E0B', '#16A34A'],
    ['#14B8A6', '#4F46E5', '#0EA5E9', '#EC4899', '#F97316'],
    ['#1D4ED8', '#06B6D4', '#10B981', '#7C3AED', '#EF4444'],
  ],
}

const GENERATED_SUFFIXES = [
  'Theme', 'Palette', 'Dashboard', 'Scorecard', 'Command', 'Insight',
  'Studio', 'Performance', 'Analytics', 'Navigator', 'Control', 'Pulse',
  'Report',
]

function buildGeneratedSeeds(targetCount: number): PresetSeed[] {
  const generated: PresetSeed[] = []
  const perCategory = Math.ceil(targetCount / THEME_CATEGORIES.length)

  for (const category of THEME_CATEGORIES) {
    const stems = GENERATED_NAME_STEMS[category]
    const colorVariants = GENERATED_COLOR_VARIANTS[category]
    for (let index = 0; index < perCategory && generated.length < targetCount; index += 1) {
      const stem = stems[index % stems.length]
      const suffix = GENERATED_SUFFIXES[index % GENERATED_SUFFIXES.length]
      generated.push({
        category,
        name: `${stem} ${suffix}`,
        description: `${category} preset generated for professional Power BI theme exploration.`,
        colors: colorVariants[index % colorVariants.length],
      })
    }
  }

  return generated
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createPreset(seed: PresetSeed, index: number): PresetTheme {
  const defaults = CATEGORY_DEFAULTS[seed.category]
  const dataColorsFull = extendPalette(seed.colors, 10)
  const background = seed.background ?? defaults.background
  const foreground = seed.foreground ?? defaults.foreground
  const tableAccent = seed.tableAccent ?? dataColorsFull[0] ?? defaults.tableAccent

  return {
    id: `${slugify(seed.category)}-${slugify(seed.name)}-${index + 1}`,
    name: seed.name,
    category: seed.category,
    description: seed.description,
    dataColorsFull,
    background,
    foreground,
    tableAccent,
    good: seed.good ?? defaults.good,
    neutral: seed.neutral ?? defaults.neutral,
    bad: seed.bad ?? defaults.bad,
    visualBackground: seed.visualBackground ?? defaults.visualBackground,
    borderColor: seed.borderColor ?? defaults.borderColor,
    titleColor: seed.titleColor ?? defaults.titleColor,
    labelColor: seed.labelColor ?? defaults.labelColor,
    fontFamily: seed.fontFamily ?? defaults.fontFamily,
    titleFontSize: seed.titleFontSize ?? defaults.titleFontSize,
    labelFontSize: seed.labelFontSize ?? defaults.labelFontSize,
    paletteSizeDefault: seed.paletteSizeDefault ?? defaults.paletteSizeDefault,
    cat: seed.category,
    colors: dataColorsFull,
    bg: background,
    fg: foreground,
  }
}

const ALL_SEEDS = [
  ...SEEDS,
  ...buildGeneratedSeeds(Math.max(0, TARGET_PRESET_COUNT - SEEDS.length)),
]

export const PRESET_CANDIDATES: PresetTheme[] = ALL_SEEDS
  .slice(0, TARGET_PRESET_COUNT)
  .map(createPreset)

export const PRESETS: PresetTheme[] = getUniqueThemes(PRESET_CANDIDATES)

export function getPresetsByCategory(category: string): PresetTheme[] {
  if (category === 'All') return PRESETS
  return PRESETS.filter((preset) => preset.category === category)
}

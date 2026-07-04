import type { IconLibraryCategory } from '@/types'

/**
 * Icon Library category taxonomy (production).
 *
 * Fine-grained business categories adapted from the reference libraries
 * (bi-icon-studio + icon-vault domains + authored currency). The label IS the
 * gallery category — plus the separate 'Countries' category owned by the ISO
 * flag registry (flagLibrary.ts), which is not listed here.
 */
export interface IconCategory {
  id: string
  label: IconLibraryCategory
  /** Which src/data/icon-library/ file holds the concepts. */
  dataFile: string
}

export const ICON_CATEGORIES: readonly IconCategory[] = [
  { id: 'analytics-3d', label: '3D Analytics', dataFile: 'analytics3d' },
  { id: 'analytics', label: 'Analytics & Reporting', dataFile: 'analytics' },
  { id: 'kpi', label: 'KPIs & Performance', dataFile: 'analytics' },
  { id: 'variance', label: 'Growth & Variance', dataFile: 'analytics' },
  { id: 'finance', label: 'Finance & Accounting', dataFile: 'finance' },
  { id: 'banking', label: 'Banking & Insurance', dataFile: 'finance' },
  { id: 'currency', label: 'Currency', dataFile: 'currency' },
  { id: 'sales', label: 'Sales & Marketing', dataFile: 'sales' },
  { id: 'cx', label: 'Customer Experience', dataFile: 'sales' },
  { id: 'hr', label: 'Human Resources', dataFile: 'hr' },
  { id: 'retail', label: 'Retail & E-commerce', dataFile: 'retail' },
  { id: 'fmcg', label: 'FMCG & Consumer Goods', dataFile: 'retail' },
  { id: 'operations', label: 'Operations & Manufacturing', dataFile: 'operations' },
  { id: 'procurement', label: 'Procurement & Inventory', dataFile: 'operations' },
  { id: 'logistics', label: 'Supply Chain & Logistics', dataFile: 'logistics' },
  { id: 'transportation', label: 'Transportation', dataFile: 'logistics' },
  { id: 'travel', label: 'Airline & Travel', dataFile: 'logistics' },
  { id: 'automotive', label: 'Automobile & Manufacturing', dataFile: 'manufacturing' },
  { id: 'it', label: 'IT & Software', dataFile: 'technology' },
  { id: 'cloud', label: 'Cloud & Data', dataFile: 'technology' },
  { id: 'cybersecurity', label: 'Cybersecurity', dataFile: 'technology' },
  { id: 'ai', label: 'AI & Automation', dataFile: 'technology' },
  { id: 'telecom', label: 'Telecom', dataFile: 'technology' },
  { id: 'project', label: 'Project Management', dataFile: 'projectManagement' },
  { id: 'strategy', label: 'Strategy & Planning', dataFile: 'projectManagement' },
  { id: 'product', label: 'Product Management', dataFile: 'projectManagement' },
  { id: 'navigation', label: 'Navigation & Actions', dataFile: 'navigation' },
  { id: 'status', label: 'Status & Alerts', dataFile: 'status' },
  { id: 'healthcare', label: 'Healthcare', dataFile: 'general' },
  { id: 'education', label: 'Education', dataFile: 'general' },
  { id: 'energy', label: 'Energy & Utilities', dataFile: 'general' },
  { id: 'esg', label: 'Sustainability & ESG', dataFile: 'general' },
  { id: 'real-estate', label: 'Real Estate', dataFile: 'general' },
  { id: 'government', label: 'Government', dataFile: 'general' },
  { id: 'general', label: 'General Business', dataFile: 'general' },
] as const

const BY_ID = new Map(ICON_CATEGORIES.map((c) => [c.id, c]))

export function getIconCategory(id: string): IconCategory | undefined {
  return BY_ID.get(id)
}

export function isIconCategoryId(id: string): boolean {
  return BY_ID.has(id)
}

/** Gallery display label for a concept's category id. */
export function categoryLabelFor(categoryId: string): IconLibraryCategory {
  return BY_ID.get(categoryId)?.label ?? 'General Business'
}

/* Backward-compatible aliases (registry/searchIndex import the V2 names). */
export const V2_CATEGORIES = ICON_CATEGORIES
export const getV2Category = getIconCategory
export const isV2CategoryId = isIconCategoryId

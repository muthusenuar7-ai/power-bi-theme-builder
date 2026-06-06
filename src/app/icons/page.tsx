import type { Metadata } from 'next'
import { IconLibraryStudio } from '@/components/icons/IconLibraryStudio'

export const metadata: Metadata = {
  title: 'Icon Studio | Datacense Power BI Theme Studio',
  description:
    'Customize, preview, and export thousands of Power BI-ready icons. A premium 3-panel Icon Studio: customization controls, a searchable icon grid, and a live selected-icon preview with download/copy actions.',
}

/**
 * /icons — standalone, premium 3-panel Icon Studio.
 *
 * Renders the self-contained {@link IconLibraryStudio}:
 *  - a DataCense top header (logo → Home, plus Home / Theme Builder),
 *  - a left customization panel (icon/background colour, gradient, opacity,
 *    shape, weight, size, padding),
 *  - a center browser (style cards, search, category chips, grid/list,
 *    multi-select, paginated grid), and
 *  - a right preview panel (live styled preview, Power BI context mockups,
 *    and download/copy/export actions).
 */
export default function IconsPage() {
  return <IconLibraryStudio />
}

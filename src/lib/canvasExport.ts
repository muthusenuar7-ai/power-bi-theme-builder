import { toPng } from 'html-to-image'
import type { ThemeState } from '@/types'
import { PAGE_SIZES } from './pageSizes'
import { downloadDataUrl, slugifyFilePart } from './exportUtils'

const CANVAS_SELECTOR = '[data-export-canvas="report"]'

export async function exportCanvasPNG(state: ThemeState): Promise<string> {
  if (typeof document === 'undefined') {
    throw new Error('PNG export is only available in the browser.')
  }

  const canvas = document.querySelector<HTMLElement>(CANVAS_SELECTOR)
  if (!canvas) {
    throw new Error('Unable to capture canvas. The report preview was not found.')
  }

  const pageSize = PAGE_SIZES[state.pageSize] ?? PAGE_SIZES['16:9']
  const mode = state.focusVisual ? `focus-${state.focusVisual}` : 'dashboard'
  const filename = `${slugifyFilePart(state.themeName)}-${mode}-preview.png`

  const dataUrl = await toPng(canvas, {
    width: pageSize.w,
    height: pageSize.h,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: state.bg,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      width: `${pageSize.w}px`,
      height: `${pageSize.h}px`,
    },
  })

  downloadDataUrl(filename, dataUrl)
  return filename
}

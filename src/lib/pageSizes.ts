import type { PageSizeDef } from '@/types'

export const PAGE_SIZES: Record<string, PageSizeDef> = {
  '16:9':   { key: '16:9',   label: '16:9 HD',       w: 1280, h: 720  },
  'fhd':    { key: 'fhd',    label: 'Full HD',        w: 1920, h: 1080 },
  'qhd':    { key: 'qhd',    label: 'QHD 2K',         w: 2560, h: 1440 },
  '4:3':    { key: '4:3',    label: '4:3',            w: 1024, h: 768  },
  'letter': { key: 'letter', label: 'US Letter',      w: 1100, h: 850  },
  'a4l':    { key: 'a4l',    label: 'A4 Landscape',   w: 1169, h: 826  },
  'a4p':    { key: 'a4p',    label: 'A4 Portrait',    w: 826,  h: 1169 },
  'tooltip':{ key: 'tooltip',label: 'Tooltip',        w: 320,  h: 240  },
  'mobile': { key: 'mobile', label: 'Mobile',         w: 360,  h: 760  },
  'square': { key: 'square', label: 'Square',         w: 900,  h: 900  },
}

export const PAGE_SIZE_KEYS = Object.keys(PAGE_SIZES)

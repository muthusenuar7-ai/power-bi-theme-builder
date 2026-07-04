// HAND-AUTHORED — Icon Library V2 currency collection.
// Every glyph is pure SVG path geometry (no <text>, no font dependency), drawn
// on the shared 24×24 / 1.6-stroke grid. Multi-letter codes without a single
// official glyph (SAR, QAR, OMR, KWD, BHD, BRL, AUD, CAD, SGD) use stroke-drawn
// letter monograms so they stay crisp at 16px and work in data URIs.
import type { IconConcept } from '@/lib/icon-library/types'

const CAT = 'currency'
const USES = ['Currency KPI cards', 'FX dashboards', 'Regional revenue reports']

function currency(
  id: string,
  name: string,
  isoCode: string,
  markup: string,
  extraKeywords: string[],
  subcategory: 'Fiat' | 'Crypto' | 'Concept' = 'Fiat',
  aliases: string[] = [],
): IconConcept {
  return {
    id: `v2-currency-${id}`,
    name,
    primaryCategory: CAT,
    subcategory,
    keywords: [...new Set([
      'currency', 'money', 'exchange', isoCode.toLowerCase(),
      ...name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
      ...extraKeywords.map((k) => k.toLowerCase()),
    ])],
    aliases: [isoCode, ...aliases],
    description: `${name} (${isoCode}) — professional currency icon for Power BI dashboards.`,
    recommendedUses: USES,
    viewBox: '0 0 24 24',
    monochromeSvg: markup,
    source: 'authored',
  }
}

/* Shared small-letter stroke glyphs for monogram currencies (x-offset applied
   inline). Letters are drawn 6 units wide, y 7→17. */
const S_LEFT = '<path d="M10.1 8.5c-.4-.8-1.3-1.4-2.3-1.4-1.4 0-2.4.9-2.4 2 0 2.6 4.9 1.6 4.9 4.2 0 1.2-1.1 2-2.5 2-1 0-1.9-.5-2.3-1.3"/>'
const DOLLAR_RIGHT = '<path d="M18.3 9.3c-.4-.7-1.2-1.2-2.1-1.2-1.2 0-2.2.8-2.2 1.8 0 2.3 4.4 1.4 4.4 3.7 0 1-1 1.8-2.2 1.8-.9 0-1.7-.5-2.1-1.2"/><path d="M16.2 6.5v1.6M16.2 15.4v1.7"/>'

export const CURRENCY_CONCEPTS: IconConcept[] = [
  currency('dollar', 'US Dollar', 'USD',
    '<path d="M15.4 8.3c-.6-1.1-1.9-1.9-3.4-1.9-2 0-3.6 1.3-3.6 3 0 3.8 7.2 2.3 7.2 6.1 0 1.7-1.6 3-3.6 3-1.5 0-2.8-.8-3.4-1.9"/><path d="M12 4.3v2.1M12 18.5v2.2"/>',
    ['dollar', 'usa', 'united states', 'america'], 'Fiat', ['Dollar', '$']),
  currency('euro', 'Euro', 'EUR',
    '<path d="M16.6 7.5a6 6 0 1 0 0 9"/><path d="M6.6 10.4h7.2M6.6 13.6h6.6"/>',
    ['euro', 'europe', 'eurozone', 'eu'], 'Fiat', ['€']),
  currency('pound', 'British Pound', 'GBP',
    '<path d="M15.6 8c0-1.9-1.5-3.4-3.4-3.4S8.8 6.1 8.8 8c0 2.6.7 4-.8 7.1-.3.7-.9 1.6-1.4 2.2h10.6"/><path d="M7.4 12.4h6.4"/>',
    ['pound', 'sterling', 'uk', 'britain', 'united kingdom'], 'Fiat', ['Sterling', '£']),
  currency('rupee', 'Indian Rupee', 'INR',
    '<path d="M7.4 4.8h9.2M7.4 8.3h9.2"/><path d="M10.2 4.8c3 0 4.8 1.5 4.8 3.5s-1.8 3.5-4.8 3.5H8.8l6.2 7.4"/>',
    ['rupee', 'india', 'bharat'], 'Fiat', ['₹']),
  currency('yen', 'Japanese Yen', 'JPY',
    '<path d="M7.8 4.8 12 10.6l4.2-5.8"/><path d="M12 10.6v8.6"/><path d="M8.5 12.5h7M8.5 15.4h7"/>',
    ['yen', 'japan', 'nippon'], 'Fiat', ['¥']),
  currency('yuan', 'Chinese Yuan', 'CNY',
    '<path d="M7.8 4.8 12 10.6l4.2-5.8"/><path d="M12 10.6v8.6"/><path d="M8.5 13.6h7"/>',
    ['yuan', 'renminbi', 'china', 'rmb'], 'Fiat', ['Renminbi', 'RMB']),
  currency('won', 'Korean Won', 'KRW',
    '<path d="M6.2 5.5 8.3 18l3.7-9.8 3.7 9.8 2.1-12.5"/><path d="M5.4 10.2h13.2M6 13h12"/>',
    ['won', 'korea', 'south korea'], 'Fiat', ['₩']),
  currency('ruble', 'Russian Ruble', 'RUB',
    '<path d="M9.6 19.2V4.8h4.1a4 4 0 0 1 0 8H7.6"/><path d="M7.6 16h6.1"/>',
    ['ruble', 'rouble', 'russia'], 'Fiat', ['₽']),
  currency('riyal-sar', 'Saudi Riyal', 'SAR',
    `${S_LEFT}<path d="M13.6 17.3V7h2.7a2.7 2.7 0 0 1 0 5.4h-2.7M16.6 12.4l2.2 4.9"/>`,
    ['riyal', 'saudi', 'saudi arabia', 'ksa'], 'Fiat', ['SR']),
  currency('dirham-aed', 'UAE Dirham', 'AED',
    '<path d="M9 19V5h2.3a7 7 0 0 1 0 14H9Z"/><path d="M6 9.7h11.2M6 14.3h10.6"/>',
    ['dirham', 'uae', 'emirates', 'dubai', 'abu dhabi'], 'Fiat', ['DH', 'DHS']),
  currency('riyal-qar', 'Qatari Riyal', 'QAR',
    '<circle cx="7.9" cy="12" r="3.7"/><path d="M9.9 14.6l2 2.3"/><path d="M14.6 17.3V7h2.7a2.7 2.7 0 0 1 0 5.4h-2.7M17.6 12.4l2 4.9"/>',
    ['riyal', 'qatar', 'doha'], 'Fiat', ['QR']),
  currency('rial-omr', 'Omani Rial', 'OMR',
    '<path d="M6.6 17.3V7h2.6a2.6 2.6 0 0 1 0 5.3H6.6M9.5 12.3l2.1 5"/><circle cx="17" cy="12.1" r="3.9"/>',
    ['rial', 'oman', 'muscat'], 'Fiat', ['RO']),
  currency('dinar-kwd', 'Kuwaiti Dinar', 'KWD',
    '<path d="M6.4 17.3V7M6.4 12.6 11 7M7.8 11l3.5 6.3"/><path d="M14.2 17.3V7h2.2a5.15 5.15 0 0 1 0 10.3h-2.2Z"/>',
    ['dinar', 'kuwait'], 'Fiat', ['KD']),
  currency('dinar-bhd', 'Bahraini Dinar', 'BHD',
    '<path d="M6.6 17.3V7h2.8a2.4 2.4 0 0 1 0 4.8H6.6h3a2.5 2.5 0 0 1 0 5.5H6.6Z"/><path d="M14.4 17.3V7h2.2a5.15 5.15 0 0 1 0 10.3h-2.2Z"/>',
    ['dinar', 'bahrain', 'manama'], 'Fiat', ['BD']),
  currency('dollar-aud', 'Australian Dollar', 'AUD',
    `<path d="M4.6 17.3 7.7 7l3.1 10.3M5.8 13.9h3.9"/>${DOLLAR_RIGHT}`,
    ['dollar', 'australia', 'aussie'], 'Fiat', ['A$']),
  currency('dollar-cad', 'Canadian Dollar', 'CAD',
    `<path d="M10.8 8.6a4.3 4.3 0 0 0-3.2-1.4c-2.4 0-4 2-4 4.9s1.6 4.9 4 4.9c1.3 0 2.4-.5 3.2-1.4"/>${DOLLAR_RIGHT}`,
    ['dollar', 'canada', 'loonie'], 'Fiat', ['C$']),
  currency('dollar-sgd', 'Singapore Dollar', 'SGD',
    `${S_LEFT}${DOLLAR_RIGHT}`,
    ['dollar', 'singapore'], 'Fiat', ['S$']),
  currency('franc-chf', 'Swiss Franc', 'CHF',
    '<path d="M9.6 19.2V4.8h6.6M9.6 11.2h5.4"/><path d="M7 15.5h6.6"/>',
    ['franc', 'switzerland', 'swiss'], 'Fiat', ['Fr', '₣']),
  currency('rand-zar', 'South African Rand', 'ZAR',
    '<path d="M8.8 19.2V4.8h3.8a4 4 0 0 1 0 8H8.8M13 12.8l3.4 6.4"/>',
    ['rand', 'south africa'], 'Fiat', ['R']),
  currency('real-brl', 'Brazilian Real', 'BRL',
    `<path d="M5.6 17.3V7h2.9a2.75 2.75 0 0 1 0 5.5H5.6M8.8 12.5l2.2 4.8"/>${DOLLAR_RIGHT}`,
    ['real', 'brazil', 'brasil'], 'Fiat', ['R$']),
  currency('lira-try', 'Turkish Lira', 'TRY',
    '<path d="M10.6 4.8v14.4c3.8 0 6.4-2.6 6.4-6.4"/><path d="M7.4 11.2l6.4-3.2M7.4 14.6l6.4-3.2"/>',
    ['lira', 'turkey', 'turkiye'], 'Fiat', ['₺']),
  currency('bitcoin', 'Bitcoin', 'BTC',
    '<path d="M9 18.4V5.6h3.5a2.9 2.9 0 0 1 1 5.6 3 3 0 0 1-.6 6H9Z"/><path d="M9 11.2h3.9"/><path d="M10.7 3.6v2M13.2 3.6v2M10.7 18.4v2M13.2 18.4v2"/>',
    ['bitcoin', 'crypto', 'cryptocurrency', 'btc', 'digital'], 'Crypto', ['₿']),
  currency('ethereum', 'Ethereum', 'ETH',
    '<path d="M12 3.4 17.6 12 12 15.6 6.4 12Z"/><path d="M6.9 13.8 12 20.6l5.1-6.8"/>',
    ['ethereum', 'crypto', 'cryptocurrency', 'eth', 'ether', 'digital'], 'Crypto'),
  currency('generic', 'Generic Currency', 'CUR',
    '<circle cx="12" cy="12" r="4.7"/><path d="M8.7 8.7 6.3 6.3M15.3 8.7l2.4-2.4M8.7 15.3l-2.4 2.4M15.3 15.3l2.4 2.4"/>',
    ['generic', 'sign', 'money', 'international'], 'Concept', ['¤']),
  currency('fx-conversion', 'Currency Conversion', 'FX',
    '<path d="M4 8.4h13.4"/><path d="M14 4.6l3.4 3.8-3.4 3.8"/><path d="M20 15.6H6.6"/><path d="M10 11.8l-3.4 3.8L10 19.4"/>',
    ['conversion', 'exchange', 'foreign exchange', 'convert', 'transfer'], 'Concept', ['FX Conversion']),
]

export interface CardKpiModel {
  label: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  delta?: string
}

export function createCardKpiModel(model: CardKpiModel): CardKpiModel {
  return model
}

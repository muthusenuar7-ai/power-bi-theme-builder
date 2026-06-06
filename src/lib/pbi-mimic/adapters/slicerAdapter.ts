export interface SlicerItemModel {
  label: string
  selected: boolean
}

export interface SlicerModel {
  title: string
  items: SlicerItemModel[]
  mode: 'list' | 'buttons' | 'dropdown' | 'slider'
}

export function createSlicerModel(model: SlicerModel): SlicerModel {
  return model
}

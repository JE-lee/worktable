import { InnerComponent } from '@/types'
import { InnerPreviewInput } from './InnerPreviewInput'
import { InnerPreviewSelect } from './InnerPreviewSelect'

const innerPreviewMap = {
  input: InnerPreviewInput,
  select: InnerPreviewSelect,
  datepicker: InnerPreviewInput,
}

export function getInnerPreview(key: string) {
  return innerPreviewMap[key.toLowerCase() as Exclude<InnerComponent, 'checkbox' | 'group'>]
}

export { InnerPreviewInput }

import { InnerComponent } from '@/types'
import { InnerPreviewInput } from './InnerPreviewInput'
import { InnerPreviewSelect } from './InnerPreviewSelect'

const innerPreviewMap = {
  input: InnerPreviewInput,
  select: InnerPreviewSelect,
  datepicker: InnerPreviewInput,
}

export function getInnerPreview(key: string) {
  // FIXME: keep Both Form component and Preview component of ui behaves consistently
  // return innerPreviewMap[
  //   key.toLowerCase() as Extract<InnerComponent, 'input' | 'select' | 'datepicker'>
  // ]
}

export { InnerPreviewInput }

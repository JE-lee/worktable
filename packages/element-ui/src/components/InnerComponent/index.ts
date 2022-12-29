import { Input, Checkbox } from 'element-ui'
import { InnerComponent, VueComponent } from '@/types'
import { InnerSelect } from './InnerSelect'
import { InnerDatePicker } from './InnerDatePicker'
import { InnerComponentGroup } from './InnerComponentGroup'
import { InnerText } from './InnerText'
import { InnerRawText } from './InnerRawText'

const innerComponentMap: {
  [props in InnerComponent]: VueComponent
} = {
  input: Input,
  select: InnerSelect,
  datepicker: InnerDatePicker,
  checkbox: Checkbox,
  text: InnerRawText,
  group: InnerComponentGroup,
}

export function getInnerComponent(key: InnerComponent) {
  return innerComponentMap[key.toLowerCase() as InnerComponent]
}

export { InnerSelect, InnerDatePicker, InnerComponentGroup, InnerText, InnerRawText }

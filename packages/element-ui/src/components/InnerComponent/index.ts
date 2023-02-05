import { Input, Checkbox } from 'element-ui'
import { InnerComponent, VueComponent } from '@/types'
import { InnerSelect } from './InnerSelect'
import { InnerAsyncSelect } from './InnerAsyncSelect'
import { InnerDatePicker } from './InnerDatePicker'
import { InnerRender } from './InnerRender'
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
  render: InnerRender,
  ['async-select']: InnerAsyncSelect,
}

export function getInnerComponent(key: InnerComponent) {
  return innerComponentMap[key.toLowerCase() as InnerComponent]
}

export { InnerSelect, InnerAsyncSelect, InnerDatePicker, InnerRender, InnerText, InnerRawText }

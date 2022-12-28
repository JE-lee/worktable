import { defineComponent, inject, h, getCurrentInstance, nextTick } from 'vue-demi'
import { VNodeData, VNode } from 'vue'
import { innerDefaultKey, makeRowProxy } from '@/shared'
import { Worktable, Column, Cell, CellValue } from '@worktable/core'
import { VueComponent, FocusAble, Options } from '@/types'
import { isString, isFunction } from 'lodash-es'
import { getInnerComponent, InnerText } from './InnerComponent'
import { getInnerPreview } from './InnerPreview'
import { Feedback } from './Feedback'
import { observer } from 'mobx-vue'

export const TableCell = observer(
  defineComponent({
    name: 'TableCell',
    props: {
      cell: {
        type: Object,
        required: true,
      },
      colDef: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const worktable = inject(innerDefaultKey) as Worktable

      return () => {
        const colDef = props.colDef as Column
        const cell = props.cell as Cell
        const row = worktable.getRowByRid(cell.position.rid)
        const rowProxy = makeRowProxy(row!)

        function runWithContext<T extends (...args: any[]) => any>(run: T) {
          return run({
            row: rowProxy,
          })
        }
        let colDefComponent = colDef.component
        if (isFunction(colDefComponent)) {
          colDefComponent = runWithContext(colDefComponent)
        }
        // 表单组件
        let component = getComponent(colDefComponent, getInnerComponent)
        // 预览态组件
        let preview = colDef.preview as any
        if (isFunction(preview)) {
          preview = runWithContext(preview)
        }
        preview = getComponent(
          isString(colDefComponent) ? colDefComponent : preview, // inner preview
          getInnerPreview
        )

        // dynamic props
        let componentProps: Record<string, any> = {}
        if (colDef.componentProps) {
          if (isFunction(colDef.componentProps)) {
            componentProps = runWithContext(colDef.componentProps)
          } else {
            componentProps = colDef.componentProps
          }
        }

        // enum
        const mergeProps = mergePropsFromColumn(colDef)
        if (component && preview) {
          component = mergePreview(preview, component)
        }

        const componentListener: VNodeData['on'] = {}
        console.log('cell render: ', colDef.field)
        if (component) {
          bindValueUpdateListener(componentListener, (val: CellValue) => {
            worktable.inputValue(cell.position, val)
            // 执行基本校验
            // validateCell(cell.position)
            // 事件响应
            // events.notify(
            //   colDef.field,
            //   EVENT_NAME.ON_FIELD_VALUE_CHANGE,
            //   {
            //     value: cell.value,
            //     row: getRowByRid(cell.position.rid),
            //   },
            //   {
            //     setComponentProps,
            //     setValuesIn,
            //     setCurrentRowValue: (values: Record<string, any>) => Object.assign(rowProxy, values),
            //   }
            // )
          })
        }
        return h(component || InnerText, {
          attrs: Object.assign(
            {},
            componentProps || {},
            props,
            mergeProps
            // (
            //   colDef as Column & {
            //     advanceComponentProps: Ref<Record<string, any>>
            //   }
            // ).advanceComponentProps.value
          ),
          on: componentListener,
        })
      }
    },
  }) as any
)

function getComponent(com: any, getInner: (key: any) => VueComponent) {
  return isString(com) ? getInner(com as any) : com
}

function mergePropsFromColumn(col: Column) {
  const options = col.enum || []
  return {
    options,
  }
}

export function mergePreview(Preview: VueComponent, component: VueComponent) {
  return observer(
    defineComponent({
      name: 'MergePreview',
      props: {
        cell: {
          type: Object,
          required: true,
        },
        colDef: {
          type: Object,
          required: true,
        },
      },
      setup(props, { attrs, listeners }) {
        const FORM_INPUT = 'formInput'
        const worktable = inject(innerDefaultKey) as Worktable
        const vm = getCurrentInstance()

        return () => {
          const cell = props.cell as Cell
          const colDef = props.colDef as Column
          console.log('merge preview render: ', colDef.field)
          function renderFormItemInner(): VNode {
            const value = cell.value
            if (cell.previewing) {
              const onDomClick = () => {
                worktable.setCellEditable(cell.position)
                nextTick(() => {
                  const instance = vm?.proxy.$refs[FORM_INPUT] as FocusAble | null
                  if (instance && instance.focus) {
                    instance.focus()
                  }
                })
              }
              const showText = getTextFromOptions(colDef.enum || [], value) || value
              return h(Preview, {
                attrs,
                props: { value: showText },
                nativeOn: { click: onDomClick },
              })
            } else {
              return h(component, {
                ref: FORM_INPUT,
                attrs: attrs,
                props: { value },
                on: Object.assign({}, listeners as any),
              })
            }
          }
          const errors = cell.errors
          const isError = errors.length > 0
          // 防止编辑的时候校验引起元素抖动
          if (isError || !cell.previewing) {
            return h(Feedback, { props: { feedback: errors.join(','), isError: isError } }, [
              renderFormItemInner(),
            ])
          } else {
            return renderFormItemInner()
          }
        }
      },
    }) as any
  )
}

function bindValueUpdateListener(on: VNodeData['on'], fn: (...args: any[]) => void) {
  if (on) {
    on['input'] = fn
  }
}

function getTextFromOptions(options: Options, val: any) {
  const option = options.find((item) => item.value === val)
  return option ? option.label : ''
}

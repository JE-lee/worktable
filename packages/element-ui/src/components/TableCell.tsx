import { defineComponent, inject, h, getCurrentInstance, nextTick } from 'vue-demi'
import { VNodeData, VNode } from 'vue'
import { innerDefaultKey } from '@/shared'
import { Column, Cell, CellValue, makeRowProxy } from '@edsheet/core'
import { VueComponent, FocusAble, Options, Context } from '@/types'
import { isString, isFunction, cloneDeep } from 'lodash-es'
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
      const { worktable } = inject(innerDefaultKey) as Context
      const colDef = props.colDef as Column
      const cell = props.cell as Cell
      const row = worktable.getRowByRid(cell.position.rid)
      if (!row && process.env.NODE_ENV === 'development') {
        console.warn(`not a validable row with rid ${cell.position.rid}`)
      }
      const rowProxy = makeRowProxy(row!)
      function runWithContext<T extends (...args: any[]) => any>(run: T) {
        return run(rowProxy)
      }

      function convertListener(listeners: { [key: string]: (...args: any[]) => void }) {
        const converted: { [key: string]: (...args: any[]) => void } = {}
        for (const event in listeners) {
          converted[event] = (...args: any[]) => listeners[event](...args, rowProxy)
        }
        return converted
      }
      return () => {
        let colDefComponent = colDef.component
        if (isFnComponent(colDefComponent)) {
          colDefComponent = runWithContext(colDefComponent)
        }
        // 表单组件
        let component = getComponent(colDefComponent, getInnerComponent)
        // 预览态组件
        // let preview = colDef.preview as any
        // if (isFnComponent(preview)) {
        //   preview = runWithContext(preview)
        // }
        // preview = getComponent(
        //   isString(colDefComponent) ? colDefComponent : preview, // inner preview
        //   getInnerPreview
        // )

        component = mergePreview(component || InnerText /* preview */)

        // dynamic props
        let componentProps: Record<string, any> = {}
        if (isFunction(colDef.componentProps)) {
          componentProps = runWithContext(colDef.componentProps)
        } else {
          componentProps = colDef.componentProps || {}
        }

        // enum
        const mergeProps = mergePropsFromColumn(colDef)

        const componentListener: VNodeData['on'] = convertListener(colDef.componentListeners || {})
        if (component) {
          const originInput = componentListener.input
          bindValueUpdateListener(componentListener, (val: CellValue) => {
            worktable.inputValue(cell.position, cloneDeep(val))
            if (isFunction(originInput)) {
              originInput(val, rowProxy)
            }
          })
        }
        return h(component, {
          style: { display: 'inline-block' },
          attrs: Object.assign(
            {},
            mergeProps,
            componentProps || {},
            props
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

export function mergePreview(component: VueComponent, Preview?: VueComponent) {
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
        const { worktable, layout } = inject(innerDefaultKey) as Context
        const vm = getCurrentInstance()

        return () => {
          const cell = props.cell as Cell
          const colDef = props.colDef as Column
          function renderFormItemInner(): VNode {
            const value = cell.value
            const mergeAttrs = Object.assign({ size: layout.size }, attrs, props)
            if (cell.previewing && Preview) {
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
                attrs: Object.assign(mergeAttrs, { value: showText }),
                nativeOn: { click: onDomClick },
              })
            } else {
              return h(component, {
                ref: FORM_INPUT,
                attrs: Object.assign(mergeAttrs, { value }),
                on: Object.assign({}, listeners as any),
              })
            }
          }
          const errors = cell.errors
          const isError = errors.length > 0
          // if (isError) {
          return h(Feedback, { props: { feedback: errors.join(','), isError: isError } }, [
            renderFormItemInner(),
          ])
          // } else {
          //   return renderFormItemInner()
          // }
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

function isFnComponent(fn: any) {
  return isFunction(fn) && !(fn as any).cid
}

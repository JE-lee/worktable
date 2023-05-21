import {
  defineComponent,
  inject,
  h,
  getCurrentInstance,
  nextTick,
  computed,
  provide,
} from 'vue-demi'
import type { VNodeData, VNode } from 'vue-demi'
import { innerDefaultKey, CELL_CONTEXT } from '@element-ui/shared'
import {
  Column,
  Cell,
  CellValue,
  makeRowProxy,
  StaticComponentProps,
  RowProxy,
  Worktable,
} from '@edsheet/core'
import type { VueComponent, FocusAble, Options, Context, CellContext } from '@element-ui/types'
import { isString, isFunction, cloneDeep } from 'lodash-es'
import { getInnerComponent, InnerText } from './InnerComponent'
import { getInnerPreview } from './InnerPreview'
import { Feedback } from './Feedback'
import { observer } from 'mobx-vue'
import { Loading } from './Loading'

export const TableCell: VueComponent = observer(
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
      colIndex: {
        type: Number,
        default: 0,
      },
    },
    setup(props) {
      const { worktable, componentCache } = inject(innerDefaultKey) as Context
      const cellCtx = computed<CellContext>(() => {
        return {
          cell: props.cell as Cell,
          colDef: props.colDef as Column,
        }
      })
      provide(CELL_CONTEXT, cellCtx)

      return () => {
        const colDef = props.colDef as Column
        const cell = props.cell as Cell
        const rowProxy = getRowProxy(cell, worktable)
        // console.log('tablecell render', !!rowProxy, cell.position.rid, colDef.field)
        if (!rowProxy) return

        let colDefComponent = colDef.component
        if (isFnComponent(colDefComponent)) {
          colDefComponent = runWithContext(colDefComponent, rowProxy)
        }
        // 表单组件
        let component = getComponent(colDefComponent, getInnerComponent) || InnerText
        // 预览态组件
        // let preview = colDef.preview as any
        // if (isFnComponent(preview)) {
        //   preview = runWithContext(preview)
        // }
        // preview = getComponent(
        //   isString(colDefComponent) ? colDefComponent : preview, // inner preview
        //   getInnerPreview
        // )

        let merged = componentCache.get([component])
        if (!merged) {
          merged = mergePreview(component /* preview */)
          componentCache.set([component], merged as VueComponent)
        }
        component = merged

        const componentListener: VNodeData['on'] = convertListener(
          colDef.componentListeners || {},
          rowProxy
        )
        if (component) {
          const originInput = componentListener.input
          bindValueUpdateListener(componentListener, (val: CellValue) => {
            val = cloneDeep(val)
            worktable.inputValue(cell.position, val)
            if (isFunction(originInput)) {
              originInput(val, rowProxy)
            }
          })
        }
        const style: Record<string, string> = { display: 'inline-block' }
        // The width of component of TableCell excepted the first column is 100%.
        // when the data of table is tree-like, element-ui will append a toggle icon in the first column.
        if (props.colIndex > 0) {
          style.width = '100%'
        }

        return h(component, {
          style, // FIXME: not 100% width
          attrs: Object.assign({}, props),
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
  const options = col.enum
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
          const rowProxy = getRowProxy(cell, worktable)
          if (!rowProxy) return

          let componentProps: StaticComponentProps = { ...cell.staticComponentProps }
          if (isFunction(colDef.componentProps)) {
            const dynamicComponentProps = runWithContext(colDef.componentProps, rowProxy)
            Object.assign(componentProps, dynamicComponentProps)
          }

          // dynamic disabled
          let disabled = !!colDef.disabled
          if (isFunction(colDef.disabled)) {
            disabled = runWithContext(colDef.disabled, rowProxy)
          }

          componentProps = Object.assign({ disabled }, componentProps)

          if (cell.loading) {
            componentProps.disabled = true
          }

          // enum
          const mergeProps = mergePropsFromColumn(colDef)

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
              return h(Loading, {
                props: { loading: cell.loading },
                scopedSlots: {
                  default: () =>
                    h(component, {
                      ref: FORM_INPUT,
                      attrs: Object.assign(mergeAttrs, mergeProps, componentProps, { value }),
                      on: Object.assign({}, listeners as any),
                    }),
                },
              })
            }
          }
          const errors = cell.errors
          const isError = errors.length > 0
          // if (isError) {
          return h(
            Feedback,
            { props: { feedback: getVisualErrorText(errors), isError: isError } },
            [renderFormItemInner()]
          )
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

function isFnComponent(fn: any): fn is (...arg: any) => any {
  return isFunction(fn) && !(fn as any).cid // is not a vue component
}

function convertListener(listeners: { [key: string]: (...args: any[]) => void }, row: RowProxy) {
  const converted: { [key: string]: (...args: any[]) => void } = {}
  for (const event in listeners) {
    converted[event] = (...args: any[]) => listeners[event](...args, row)
  }
  return converted
}

function runWithContext<T extends (...args: any[]) => any>(run: T, row: RowProxy) {
  return run(row)
}

function getRowProxy(cell: Cell, worktable: Worktable) {
  const row = worktable.getRowByRid(cell.position.rid)
  if (!row) {
    // if (process.env.NODE_ENV === 'development') {
    //   console.warn(`not a validable row with rid ${cell.position.rid}`)
    // }
    return null
  }
  return makeRowProxy(row!)
}

function getVisualErrorText(errors: string[]) {
  return errors.filter((str) => !!str)[0] ?? ''
}

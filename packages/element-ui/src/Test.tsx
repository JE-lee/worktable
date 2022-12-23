import { Column, Row, Worktable } from '@worktable/core'
import { defineComponent } from 'vue-demi'
import { observer } from 'mobx-vue'

const InnerTest = defineComponent({
  setup() {
    const columns: Column[] = [{ field: 'code' }]
    const worktable = new Worktable(columns)

    function doAddOneRow() {
      worktable.addRow()
    }
    function onInput(row: Row, field: string, val: any) {
      row.data[field].value = val
    }

    return () => (
      <div>
        <div class="head">
          <button onClick={doAddOneRow}>+Add one row</button>
        </div>
        <div>{worktable.rows.length}</div>
        <div class="content">
          {worktable.rows.map((row) => (
            <div class="rows">
              {columns.map((col) => {
                return (
                  <input
                    type="text"
                    value={row.data[col.field].value}
                    onInput={(val: any) => onInput(row, col.field, val)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  },
})

export const Test = observer(InnerTest)

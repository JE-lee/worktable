import { Worktable } from '../src'
import { Column } from '../src/types'

describe('Worktable', () => {
  test('constructor should accept array or object params', () => {
    const columns: Column[] = [{ field: 'code' }]
    const raws = [{ code: 'A', children: [{ code: 'A1' }] }]
    // array params
    const worktable1 = new Worktable(columns)
    worktable1.addRows(raws)
    // object options params
    const worktable2 = new Worktable({ columns, initialData: raws })
    expect(worktable1.getData()).toEqual(raws)
    expect(worktable1.getData()).toEqual(worktable2.getData())
  })

  test('default value', () => {
    const columns: Column[] = [
      { field: 'code', default: 'c1' },
      { field: 'value', default: () => 'v1' },
    ]
    const worktable = new Worktable(columns)
    worktable.addRow()
    expect(worktable.getData()).toEqual([{ code: 'c1', value: 'v1' }])
  })

  test('input value', () => {
    const columns: Column[] = [{ field: 'code' }]
    const worktable = new Worktable(columns)
    const row = worktable.addRow()
    worktable.inputValue({ rid: row.rid, field: 'code' }, 'c1')
    expect(worktable.getData()).toEqual([{ code: 'c1' }])
  })
})

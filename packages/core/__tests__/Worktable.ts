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

  test('should include extra datas', () => {
    const columns: Column[] = [{ field: 'code' }]
    const raws = [{ code: 'A', name: 'n1', children: [{ code: 'A1' }] }]
    const worktable = new Worktable({ columns, initialData: raws })
    expect(worktable.getData()).toEqual(raws)
  })

  test('should take value or function as default value of field', () => {
    const columns: Column[] = [
      { field: 'code', default: 'c1' },
      { field: 'value', default: () => 'v1' },
    ]
    const worktable = new Worktable(columns)
    worktable.addRow()
    expect(worktable.getData()).toEqual([{ code: 'c1', value: 'v1' }])
  })

  test('should be valid whild added new column', () => {
    const columns1: Column[] = [{ field: 'code', default: 'c1' }]
    const data = [{ code: 'c2', name: 'name1' }]
    const worktable = new Worktable({ columns: columns1, initialData: data })
    worktable.addRow()

    expect(worktable.getData()).toEqual([...data, { code: 'c1' }])

    // add new column
    worktable.setColumns([...columns1, { field: 'name', default: 'n2' }])
    worktable.addRow()
    expect(worktable.getData()).toEqual([
      ...data,
      { code: 'c1', name: 'n2' },
      { code: 'c1', name: 'n2' },
    ])
  })

  test('should update the value of field', () => {
    const columns: Column[] = [{ field: 'code' }]
    const worktable = new Worktable(columns)
    const row = worktable.addRow()
    worktable.inputValue({ rid: row.rid, field: 'code' }, 'c1')
    expect(worktable.getData()).toEqual([{ code: 'c1' }])
  })

  test('should not update any value of field', () => {
    const columns: Column[] = [{ field: 'code' }]
    const initialData = [{ code: 'c1' }]
    const worktable = new Worktable({ columns, initialData })
    expect(worktable.inputValue({ rid: 99, field: 'code' }, 'c2')).toBe(false)
    expect(worktable.getData()).toEqual(initialData)
  })
})

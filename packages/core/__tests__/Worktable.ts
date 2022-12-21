import { Worktable } from '../src'
import { Column } from '../src/types'
import { reaction } from 'mobx'

function generateWorktable() {
  const columns: Column[] = [{ field: 'code' }]
  const raws = [{ code: 'A', children: [{ code: 'A1' }] }]
  return new Worktable({ columns, initialData: raws })
}

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

  test('should be valid while added new column', () => {
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

  // reactivity
  test('should react when add new row', () => {
    const worktable = generateWorktable()
    const consumer = jest.fn(() => worktable.rows.length)
    reaction(() => worktable.rows.slice(0), consumer)

    worktable.addRow()
    expect(consumer.mock.calls.length).toBe(1)
    expect(consumer.mock.results[0].value).toBe(2)

    worktable.addRows([{}, { code: 'c3' }])
    expect(consumer.mock.calls.length).toBe(2)
    expect(consumer.mock.results[1].value).toBe(4)
  })

  test('should react when a new child row', () => {
    const worktable = generateWorktable()
    const head = worktable.rows[0]

    const consumer = jest.fn(() => head.children.length)
    reaction(() => head.children.slice(0), consumer)

    head.addRow()

    expect(consumer.mock.calls.length).toBe(1)
    expect(consumer.mock.results[0].value).toBe(2)
  })

  test('should react when change columns', () => {
    const columns: Column[] = [{ field: 'code' }]
    const raws = [{ code: 'c1' }, { code: 'c2', name: 'n1' }]
    const worktable = new Worktable({ columns, initialData: raws as any })
    const consumer1 = jest.fn()
    const consumer2 = jest.fn()
    reaction(() => worktable.columns.length, consumer1)
    reaction(() => worktable.rows[0], consumer2)

    worktable.setColumns([{ field: 'code' }, { field: 'name' }])

    expect(consumer1.mock.calls.length).toBe(1)
    expect(consumer2.mock.calls.length).toBe(1)
  })

  test('should react when updated value of the field', () => {
    const worktable = generateWorktable()
    const target = worktable.rows[0]
    const consumer = jest.fn(() => target.data['code'].value)
    reaction(() => target.data['code'].value, consumer)
    consumer()
    expect(consumer.mock.results[0].value).toBe('A')
    worktable.inputValue({ rid: target.rid, field: 'code' }, 'B')
    expect(consumer.mock.calls.length).toBe(2)
    expect(consumer.mock.results[1].value).toBe('B')
  })
})

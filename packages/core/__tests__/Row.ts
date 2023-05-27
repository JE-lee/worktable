import { Column, Worktable } from '../src'
import { Row } from '../src/Row'
import { reaction } from 'mobx'

describe('Row', () => {
  test('rIndex', () => {
    const columns: Column[] = [{ field: 'code' }]
    const row = new Row(columns, { code: 1 })
    row.addRow()
    row.addRow()
    expect(row.children[0].rIndex).toBe(0)
    expect(row.children[1].rIndex).toBe(1)
  })

  test('default value of type of number', () => {
    const columns1: Column[] = [{ field: 'code', type: 'number' }]
    const row1 = new Row(columns1, { code: 1 })
    expect(row1.data['code'].value).toBe(1)

    const row2 = new Row(columns1)
    expect(row2.data['code'].value).toBe(0)

    const row3 = new Row(columns1, { code: 0 })
    expect(row3.data['code'].value).toBe(0)

    const columns2: Column[] = [{ field: 'code', type: 'number', default: '' }]
    const row4 = new Row(columns2)
    expect(row4.data['code'].value).toBe('')

    const columns3: Column[] = [{ field: 'code', type: 'number', default: 0 }]
    const row5 = new Row(columns3)
    expect(row5.data['code'].value).toBe(0)

    const columns4: Column[] = [{ field: 'code', type: 'number', default: () => 1 }]
    const row6 = new Row(columns4)
    expect(row6.data['code'].value).toBe(1)
  })

  test('default value of type of string', () => {
    const columns1: Column[] = [{ field: 'code', type: 'string' }]
    const row1 = new Row(columns1, { code: '1' })
    expect(row1.data['code'].value).toBe('1')

    const row2 = new Row(columns1)
    expect(row2.data['code'].value).toBe('')

    const row3 = new Row(columns1, { code: '' })
    expect(row3.data['code'].value).toBe('')

    const columns2: Column[] = [{ field: 'code', type: 'number', default: '' }]
    const row4 = new Row(columns2)
    expect(row4.data['code'].value).toBe('')

    const columns3: Column[] = [{ field: 'code', type: 'number', default: () => '1' }]
    const row5 = new Row(columns3)
    expect(row5.data['code'].value).toBe('1')
  })

  test('default value of type of boolean', () => {
    const columns1: Column[] = [{ field: 'code', type: 'boolean' }]
    const row1 = new Row(columns1, { code: '1' })
    expect(row1.data['code'].value).toBe('1')

    const row2 = new Row(columns1)
    expect(row2.data['code'].value).toBe(false)

    const row3 = new Row(columns1, { code: true })
    expect(row3.data['code'].value).toBe(true)

    const columns2: Column[] = [{ field: 'code', type: 'number', default: true }]
    const row4 = new Row(columns2)
    expect(row4.data['code'].value).toBe(true)

    const columns3: Column[] = [{ field: 'code', type: 'number', default: () => true }]
    const row5 = new Row(columns3)
    expect(row5.data['code'].value).toBe(true)
  })

  test('default value of type of object', () => {
    const columns1: Column[] = [{ field: 'code', type: 'object' }]
    const row1 = new Row(columns1, { code: '1' })
    expect(row1.data['code'].value).toBe('1')

    const row2 = new Row(columns1)
    expect(row2.data['code'].value).toEqual({})

    const row3 = new Row(columns1, { code: { c: 1 } })
    expect(row3.data['code'].value).toEqual({ c: 1 })

    const columns2: Column[] = [{ field: 'code', type: 'number', default: { c: 2 } }]
    const row4 = new Row(columns2)
    expect(row4.data['code'].value).toEqual({ c: 2 })

    const columns3: Column[] = [{ field: 'code', type: 'number', default: () => ({ c: 3 }) }]
    const row5 = new Row(columns3)
    expect(row5.data['code'].value).toEqual({ c: 3 })
  })

  test('setLoading', () => {
    const columns: Column[] = [{ field: 'code' }]
    const row = new Row(columns, { code: '1' })

    row.setLoading('code', true)
    expect(row.data['code'].loading).toBe(true)
    row.data['code'].loading = false

    row.setLoading(['code'], true)
    expect(row.data['code'].loading).toBe(true)
    row.data['code'].loading = false

    row.setLoading(true)
    expect(row.data['code'].loading).toBe(true)
  })

  test('Row.index', async () => {
    const columns = [{ field: 'code' }]
    const wt = new Worktable(columns)
    const row1 = wt.add()
    expect(row1.index).toBe(0)
    const row2 = wt.add()
    expect(row2.index).toBe(1)

    wt.remove(row1.rid)
    expect(row2.index).toBe(0)
  })

  test('Row.index in children', async () => {
    const columns = [{ field: 'code' }]
    const wt = new Worktable(columns)
    const row = wt.add()
    const child1 = row.addRow()
    expect(child1.index).toBe(0)
    const child2 = row.addRow()
    expect(child2.index).toBe(1)

    wt.remove(child1.rid)
    expect(child2.index).toBe(0)
  })

  test('Row.index is Observable', async () => {
    const columns = [{ field: 'code' }]
    const wt = new Worktable(columns)
    const row1 = wt.add()
    const row2 = wt.add()
    const consumer = jest.fn(() => row2.index)
    reaction(() => wt.rows.slice(0), consumer)

    wt.add()
    expect(consumer.mock.results[0].value).toBe(1)
    wt.remove(row1.rid)
    expect(consumer.mock.results[1].value).toBe(0)
  })
})

import { Column } from '../src'
import { Row } from '../src/Row'

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
})

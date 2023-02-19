import { Worktable, Column } from '../src'

describe('dynamic props', () => {
  test('value', async () => {
    const columns: Column[] = [
      { field: 'price1', type: 'number' },
      { field: 'price2', type: 'number' },
      { field: 'total', value: (row) => +row.data.price1 + +row.data.price2 },
    ]
    const wt = new Worktable({ columns, initialData: [{ price1: 10, price2: 9 }] })
    let data = wt.getData()
    expect(data[0].total).toBe(19)

    wt.inputValue({ rid: wt.rows[0].rid, field: 'price1' }, 20)
    data = wt.getData()
    expect(data[0].total).toBe(29)
  })
})

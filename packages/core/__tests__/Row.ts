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
})

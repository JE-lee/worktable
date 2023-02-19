import { Worktable } from '../src'
import { deconstruct } from '../src/field-parser'

describe('field parser', () => {
  test('deconstruct', () => {
    let field = ''
    let meta = deconstruct(field)
    expect(meta).toBeUndefined()

    field = 'code'
    meta = deconstruct(field)
    expect(meta).toBeUndefined()

    field = '{ code: productCode }'
    meta = deconstruct(field)
    expect(meta?.type).toBe('object')
    expect(meta?.keyMaps).toEqual([['code', 'productCode']])

    field = '[{ code:productCode}, price]'
    meta = deconstruct(field)
    expect(meta?.type).toBe('array')
    expect(meta?.keyMaps).toEqual([
      ['[0].code', 'productCode'],
      ['1', 'price'],
    ])

    field = `{
      code: productCode
    }`
    meta = deconstruct(field)
    expect(meta?.type).toBe('object')
    expect(meta?.keyMaps).toEqual([['code', 'productCode']])
  })

  test('value of deconstructed object field', () => {
    const field = '{code:productCode}'
    const columns = [{ field }]
    const wt = new Worktable({ columns })

    const row = wt.addRow({ productCode: 's1' })

    expect(row.getRaw()[field]).toBeUndefined()
    expect(row.getRaw().productCode).toBe('s1')

    wt.inputValue({ rid: row.rid, field }, { code: 's2' })
    expect(row.getRaw()[field]).toBeUndefined()
    expect(row.getRaw().productCode).toBe('s2')
  })

  test('value of deconstructed array field', () => {
    const field = '[{code:productCode}, price]'
    const columns = [{ field }]
    const wt = new Worktable({ columns })

    const row = wt.addRow({ productCode: 's1', price: 12 })

    let raw = row.getRaw()
    expect(raw[field]).toBeUndefined()
    expect(raw.productCode).toBe('s1')
    expect(raw.price).toBe(12)

    wt.inputValue({ rid: row.rid, field }, [{ code: 's2' }, 100])

    raw = row.getRaw()
    expect(raw[field]).toBeUndefined()
    expect(raw.productCode).toBe('s2')
    expect(raw.price).toBe(100)
  })
})
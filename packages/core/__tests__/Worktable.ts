import { Worktable } from '../src'
import { Column } from '../src/types'

const columns: Column[] = [{ field: 'code' }]

describe('Worktable', () => {
  test('construct', () => {
    const raws = [{ code: 'A' }]
    const worktable1 = new Worktable(columns)
    worktable1.addRows(raws)
    const worktable2 = new Worktable({ columns, initialData: raws })
    expect(worktable1.getData()).toEqual(worktable2.getData())
  })
})

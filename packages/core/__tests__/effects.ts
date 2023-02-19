import { Worktable, Column, FIELD_EVENT_NAME } from '../src'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const message = 'code is required'

function generateWorktable(effects: Column['effects']) {
  const columns: Column[] = [
    {
      field: 'code',
      type: 'number',
      rule: {
        required: true,
        message,
      },
      effects,
    },
  ]

  return new Worktable({ columns, initialData: [{ code: 1 }] })
}

describe('effects', () => {
  test('event of field', async () => {
    const onFieldInit = jest.fn()
    const onFieldValueChange = jest.fn()
    const onFieldInputValueChange = jest.fn()
    const wt = generateWorktable({
      [FIELD_EVENT_NAME.ON_FIELD_INIT]: onFieldInit,
      [FIELD_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE]: onFieldInputValueChange,
      [FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE]: onFieldValueChange,
    })

    // onFieldInit
    expect(onFieldInit).toHaveBeenCalled()
    expect(onFieldInit.mock.calls[0][0]).toBe(1) // value
    expect(onFieldInit.mock.calls[0][1].data.code).toBe(1) // row

    // onFieldValueChange
    expect(onFieldValueChange).not.toHaveBeenCalled()
    // expect(onFieldValueChange.mock.calls[0][0]).toBe(1) // value
    // expect(onFieldValueChange.mock.calls[0][1].data.code).toBe(1) // row

    const row = wt.rows[0]
    wt.inputValue({ rid: row.rid, field: 'code' }, 2)
    expect(onFieldInputValueChange.mock.calls.length).toBe(1)
    expect(onFieldInputValueChange.mock.calls[0][0]).toBe(2) // value
    expect(onFieldInputValueChange.mock.calls[0][1].data.code).toBe(2) // row

    // onFieldValueChange
    expect(onFieldValueChange).toHaveBeenCalledTimes(1)
    expect(onFieldValueChange.mock.calls[0][0]).toBe(2) // value
    expect(onFieldValueChange.mock.calls[0][1].data.code).toBe(2) // row
  })

  test('event of field validating', async () => {
    const start = jest.fn((value, row) => [value, row.data.code])
    const finish = jest.fn((value, row) => [value, row.data.code])
    const success = jest.fn((value, row) => [value, row.data.code])
    const fail = jest.fn((errors, value, row) => [errors, value, row.data.code])
    const wt = generateWorktable({
      [FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_START]: start,
      [FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FINISH]: finish,
      [FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS]: success,
      [FIELD_EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FAIL]: fail,
    })

    expect(start.mock.calls.length).toBe(0)
    expect(finish.mock.calls.length).toBe(0)
    expect(success.mock.calls.length).toBe(0)
    expect(fail.mock.calls.length).toBe(0)

    await wt.validate()

    expect(start.mock.calls.length).toBe(1)
    expect(finish.mock.calls.length).toBe(1)
    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(0)

    const row = wt.rows[0]
    wt.inputValue({ rid: row.rid, field: 'code' }, '')

    await delay(10)

    expect(start.mock.calls.length).toBe(2)
    expect(finish.mock.calls.length).toBe(2)
    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(1)

    expect(success.mock.results[0].value).toEqual([1, 1])

    expect(start.mock.results[1].value).toEqual(['', ''])

    expect(finish.mock.results[1].value).toEqual(['', ''])

    expect(fail.mock.results[0].value).toEqual([[message], '', ''])
  })
})

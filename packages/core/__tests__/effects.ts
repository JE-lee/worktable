import { Worktable, Column, EVENT_NAME } from '../src'

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
  test('onFieldInputValueChange', async () => {
    const onFieldValueChange = jest.fn()
    const onFieldInputValueChange = jest.fn()
    const wt = generateWorktable({
      [EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE]: onFieldInputValueChange,
      [EVENT_NAME.ON_FIELD_VALUE_CHANGE]: onFieldValueChange,
    })

    // onFieldValueChange
    expect(onFieldValueChange).toHaveBeenCalled()
    expect(onFieldValueChange.mock.calls[0][0]).toBe(1) // value
    expect(onFieldValueChange.mock.calls[0][1].code).toBe(1) // row

    const row = wt.rows[0]
    wt.inputValue({ rid: row.rid, field: 'code' }, 2)
    expect(onFieldInputValueChange.mock.calls.length).toBe(1)
    expect(onFieldInputValueChange.mock.calls[0][0]).toBe(2) // value
    expect(onFieldInputValueChange.mock.calls[0][1].code).toBe(2) // row

    // onFieldValueChange
    expect(onFieldValueChange).toHaveBeenCalledTimes(2)
    expect(onFieldValueChange.mock.calls[1][0]).toBe(2) // value
    expect(onFieldValueChange.mock.calls[1][1].code).toBe(2) // row
  })

  test('event of validating field value', async () => {
    const start = jest.fn()
    const finish = jest.fn()
    const success = jest.fn()
    const fail = jest.fn()
    const wt = generateWorktable({
      [EVENT_NAME.ON_FIELD_VALUE_VALIDATE_START]: start,
      [EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FINISH]: finish,
      [EVENT_NAME.ON_FIELD_VALUE_VALIDATE_SUCCESS]: success,
      [EVENT_NAME.ON_FIELD_VALUE_VALIDATE_FAIL]: fail,
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

    expect(success.mock.calls[0][0]).toBe(1) // value
    expect(success.mock.calls[0][1].code).toBe(1) // row

    expect(start.mock.calls[1][0]).toBe('') // value
    expect(start.mock.calls[1][1].code).toBe('') // row

    expect(finish.mock.calls[1][0]).toBe('') // value
    expect(finish.mock.calls[1][1].code).toBe('') // row

    expect(fail.mock.calls[0][0]).toEqual([message]) // value
    expect(fail.mock.calls[0][1]).toBe('') // value
    expect(fail.mock.calls[0][2].code).toBe('') // row
  })
})

import { Worktable, FIELD_EVENT_NAME, TABLE_EVENT_NAME, RowProxy } from '../src'
import type { FieldEffectListener, TableEffectListener, Column } from '../src'

type ParamsFeidlEffectListener = Parameters<FieldEffectListener>
type ParamsTableEffectListener = Parameters<TableEffectListener>

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
    const fail = jest.fn((value, row, errors) => [value, row.data.code, errors])
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
    await delay(0)

    expect(start.mock.calls.length).toBe(2)
    expect(finish.mock.calls.length).toBe(2)
    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(1)

    expect(success.mock.results[0].value).toEqual([1, 1])
    expect(start.mock.results[1].value).toEqual(['', ''])
    expect(finish.mock.results[1].value).toEqual(['', ''])

    wt.inputValue({ rid: row.rid, field: 'code' }, 'ABC')
    await delay(0)
    expect(start.mock.calls.length).toBe(3)
    expect(finish.mock.calls.length).toBe(3)
    expect(success.mock.calls.length).toBe(1)
    expect(fail.mock.calls.length).toBe(2)

    expect(fail.mock.results[1].value).toEqual([NaN, NaN, [message]])
  })

  test('event of table', async () => {
    const onFieldInputValueChange = jest.fn<
      ParamsFeidlEffectListener[0],
      ParamsFeidlEffectListener
    >((val) => val)
    const onFieldValueChange = jest.fn<ParamsFeidlEffectListener[0], ParamsFeidlEffectListener>(
      (val) => val
    )
    const validateStart = jest.fn(() => 'called')
    const validateFinish = jest.fn(() => 'called')
    const validateSuccess = jest.fn(() => 'called')
    const validateFail = jest.fn<ParamsTableEffectListener[0], ParamsTableEffectListener>(
      (errors) => errors
    )

    const msg = "can't large than 10"
    const columns: Column[] = [
      {
        field: 'code',
        type: 'number',
        rule: {
          validator(value) {
            if ((value as number) > 10) throw msg
          },
        },
      },
    ]

    const wt = new Worktable(columns)
    wt.addEffect(TABLE_EVENT_NAME.ON_FIELD_INPUT_VALUE_CHANGE, onFieldInputValueChange)
    wt.addEffect(TABLE_EVENT_NAME.ON_FIELD_VALUE_CHANGE, onFieldValueChange)
    wt.addEffect(TABLE_EVENT_NAME.ON_VALIDATE_START, validateStart)
    wt.addEffect(TABLE_EVENT_NAME.ON_VALIDATE_FINISH, validateFinish)
    wt.addEffect(TABLE_EVENT_NAME.ON_VALIDATE_SUCCESS, validateSuccess)
    wt.addEffect(TABLE_EVENT_NAME.ON_VALIDATE_FAIL, validateFail)

    const row = wt.add()

    wt.inputValue({ rid: row.rid, field: 'code' }, 8)

    await delay(0)
    expect(onFieldInputValueChange).toBeCalledTimes(1)
    expect(onFieldValueChange).toBeCalledTimes(1)
    expect(validateStart).toBeCalledTimes(0)
    expect(validateFinish).toBeCalledTimes(0)
    expect(validateSuccess).toBeCalledTimes(0)
    expect(validateFail).toBeCalledTimes(0)

    await wt.validate()
    expect(validateStart).toBeCalledTimes(1)
    expect(validateFinish).toBeCalledTimes(1)
    expect(validateSuccess).toBeCalledTimes(1)
    expect(validateFail).toBeCalledTimes(0)

    row.data.code = 12
    await delay(0)
    expect(onFieldInputValueChange).toBeCalledTimes(1)
    expect(onFieldValueChange).toBeCalledTimes(2)

    try {
      await wt.validate()
    } catch {
      // not empty
    }
    expect(validateStart).toBeCalledTimes(2)
    expect(validateFinish).toBeCalledTimes(2)
    expect(validateSuccess).toBeCalledTimes(1)
    expect(validateFail).toBeCalledTimes(1)
    expect(validateFail).lastReturnedWith([{ code: [msg] }])
  })

  it('onFieldReact #1', () => {
    const columns: Column[] = [
      { field: 'a', type: 'number' },
      {
        field: 'b',
        title: 'double a',
        type: 'number',
        effects: {
          [FIELD_EVENT_NAME.ON_FIELD_REACT]: (row) => {
            row.data.b = row.data.c ? (row.data.a as number) * 2 : row.data.a
          },
        },
      },
      { field: 'c', type: 'boolean', default: true },
    ]

    const wt = new Worktable(columns)
    const row1 = wt.add({ a: 10 })
    expect(row1.data.b).toBe(20)

    wt.inputValue({ field: 'a', rid: row1.rid }, 20)
    expect(row1.data.b).toBe(40)

    wt.inputValue({ field: 'c', rid: row1.rid }, false)
    expect(row1.data.b).toBe(20)
  })

  it('onFieldReact#2', () => {
    const onFieldReact = jest.fn((row: RowProxy) => {
      row.data.b = (row.data.a as number) * 2
    })
    const columns: Column[] = [
      { field: 'a', type: 'number' },
      {
        field: 'b',
        title: 'double a',
        type: 'number',
        effects: {
          [FIELD_EVENT_NAME.ON_FIELD_REACT]: onFieldReact,
        },
      },
    ]

    const wt = new Worktable(columns)
    const row = wt.add({ a: 10 })
    expect(onFieldReact).toBeCalledTimes(1)

    wt.inputValue({ field: 'a', rid: row.rid }, 20)
    expect(onFieldReact).toBeCalledTimes(2)

    wt.inputValue({ field: 'a', rid: row.rid }, 20)
    expect(onFieldReact).toBeCalledTimes(2)
  })

  it('onFieldReact#3', () => {
    const onFieldReact = jest.fn((row: RowProxy) => {
      row.data.b = (row.data.a as number) * 2
    })
    const columns: Column[] = [
      { field: 'a', type: 'number' },
      {
        field: 'b',
        title: 'double a',
        type: 'number',
        effects: {
          [FIELD_EVENT_NAME.ON_FIELD_REACT]: [(row) => row.data.a, onFieldReact],
        },
      },
    ]

    const wt = new Worktable(columns)
    const row = wt.add({ a: 10 })
    expect(onFieldReact).toBeCalledTimes(0)

    wt.inputValue({ field: 'a', rid: row.rid }, 20)
    expect(onFieldReact).toBeCalledTimes(1)

    wt.inputValue({ field: 'a', rid: row.rid }, 20)
    expect(onFieldReact).toBeCalledTimes(1)
  })

  it('onFieldReact#4', () => {
    const onFieldReact = jest.fn((row: RowProxy) => {
      row.data.c = (((row.data.a as number) < 10 ? row.data.a : row.data.b) as number) * 2
    })
    const columns: Column[] = [
      { field: 'a', type: 'number' },
      { field: 'b', type: 'number' },
      {
        field: 'c',
        title: 'double a or b',
        type: 'number',
        effects: {
          [FIELD_EVENT_NAME.ON_FIELD_REACT]: [
            (row) => ((row.data.a as number) < 10 ? row.data.a : row.data.b),
            onFieldReact,
          ],
        },
      },
    ]

    const wt = new Worktable(columns)
    const row = wt.add({ a: 1 })
    expect(onFieldReact).toBeCalledTimes(0)

    // did not access b
    wt.inputValue({ field: 'a', rid: row.rid }, 2)
    expect(onFieldReact).toBeCalledTimes(1)

    wt.inputValue({ field: 'b', rid: row.rid }, 12)
    expect(onFieldReact).toBeCalledTimes(1)

    // accessed b
    wt.inputValue({ field: 'a', rid: row.rid }, 10)
    expect(onFieldReact).toBeCalledTimes(2)

    wt.inputValue({ field: 'b', rid: row.rid }, 12)
    expect(onFieldReact).toBeCalledTimes(2)

    wt.inputValue({ field: 'b', rid: row.rid }, 13)
    expect(onFieldReact).toBeCalledTimes(3)
  })

  it('re-set columns', () => {
    const onFieldValueChange1 = jest.fn()
    const onFieldValueChange2 = jest.fn()

    const columns: Column[] = [
      {
        field: 'code',
        effects: {
          [FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE]: onFieldValueChange1,
        },
      },
    ]
    const wt = new Worktable({ columns, initialData: [{ code: 1 }] })
    wt.addFieldEffect('code', FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE, onFieldValueChange2)
    wt.setColumns([...columns])

    const row = wt.findAll()[0]
    wt.inputValue({ field: 'code', rid: row.rid }, 2)
    expect(onFieldValueChange1).toBeCalledTimes(1)
    expect(onFieldValueChange2).toBeCalledTimes(1)
  })

  it('removeFieldEffect', () => {
    const onFieldValueChange = jest.fn()
    const columns: Column[] = [{ field: 'code', type: 'number' }]
    const wt = new Worktable({ columns, initialData: [{ code: 1 }] })
    const row = wt.findAll()[0]
    wt.addFieldEffect('code', FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE, onFieldValueChange)

    row.data.code = 2
    expect(onFieldValueChange).toBeCalledTimes(1)

    wt.removeFieldEffect('code', FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE, onFieldValueChange)
    row.data.code = 3
    expect(onFieldValueChange).toBeCalledTimes(1)

    wt.addFieldEffect('code', FIELD_EVENT_NAME.ON_FIELD_VALUE_CHANGE, onFieldValueChange)
    row.data.code = 4
    expect(onFieldValueChange).toBeCalledTimes(2)

    wt.removeFieldEffect('code')
    row.data.code = 5
    expect(onFieldValueChange).toBeCalledTimes(2)
  })
})

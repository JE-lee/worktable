import { Worktable } from '../src'
import { Column } from '../src/types'
import to from 'await-to-js'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('validate', () => {
  test('should respect "async-validator" lib', async () => {
    const requiredMessage = 'code is required'
    const columns: Column[] = [
      {
        field: 'code',
        type: 'string',
        rule: {
          required: true,
          message: requiredMessage,
        },
      },
    ]
    const worktable = new Worktable(columns)
    const row = worktable.addRow({ code: '' })
    const [err] = await to(worktable.validate())
    expect(err!.message).toBeDefined()
    const messages = worktable.getValidateErrors()
    expect(messages).toEqual([{ code: [requiredMessage] }])
    worktable.inputValue({ rid: row.rid, field: 'code' }, 'c1')
    const [err2] = await to(worktable.validate())
    expect(err2).not.toEqual(expect.anything())
  })

  test('rule should accept synchronous validator', async () => {
    const columns: Column[] = [
      {
        field: 'code',
        rule: {
          message: 'must be greater than 10',
          validator: (value) => {
            return value > 10
          },
        },
      },
    ]
    const worktable = new Worktable(columns)
    worktable.addRow({ code: 12 })
    const rows = await worktable.validate()
    expect(rows[0]).toEqual({ code: 12 })
    worktable.addRow({ code: 9 })
    const [err] = await to(worktable.validate())
    expect(err!.message).toBeDefined()
  })

  test('rule should accept asynchronous validator', async () => {
    const message = 'must be greater than 10'
    const columns: Column[] = [
      {
        field: 'code',
        rule: {
          validator: (value) => {
            return new Promise((resolve, reject) =>
              setTimeout(() => {
                if (value > 10) resolve('')
                else reject(message)
              }, 10)
            )
          },
        },
      },
    ]
    const worktable = new Worktable(columns)
    worktable.addRow({ code: 12 })
    const rows = await worktable.validate()
    expect(rows[0]).toEqual({ code: 12 })
    worktable.addRow({ code: 9 })
    const [err] = await to(worktable.validate())
    expect(err!.message).toBeDefined()
    const errors = worktable.getValidateErrors()
    expect(errors[1]).toEqual({ code: [message] })
  })

  test('should re-validate automatically #1', async () => {
    const message = 'must be greater than 10'
    const mockValidator = jest.fn((value) => value > 10)
    const columns: Column[] = [
      {
        field: 'code',
        rule: {
          message,
          validator: mockValidator,
        },
      },
    ]
    const worktable = new Worktable(columns)
    const row = worktable.addRow({ code: 12 }) // 1
    expect(mockValidator.mock.calls.length).toBe(1)
    await worktable.validate() // 2

    worktable.inputValue({ rid: row.rid, field: 'code' }, 9)
    // wait for worktable asynchronous validate process finished
    // TODO:
    await delay(20)
    expect(mockValidator.mock.calls.length).toBe(3)
    const errors = worktable.getValidateErrors()
    expect(errors[0]).toEqual({ code: [message] })
  })

  test('should re-validate automatically #2', async () => {
    const message = 'value of field code is required'
    const columns: Column[] = [
      {
        field: 'code',
        rule: {
          type: 'number',
          message,
          required: true,
        },
      },
    ]
    const worktable = new Worktable({ columns, initialData: [{ code: 12 }] })
    // TODO:
    await delay(10)
    const row = worktable.rows[0]
    expect(row.data['code'].errors.length).toBe(0)
    worktable.inputValue({ rid: row.rid, field: 'code' }, '')
    await delay(10)

    const errors = worktable.getValidateErrors()
    expect(errors[0]).toEqual({ code: [message] })

    worktable.inputValue({ rid: row.rid, field: 'code' }, 12)
    await delay(10)

    const errs = worktable.getValidateErrors()
    expect(errs[0].code.length).toBe(0)
  })

  test('child row should re-validate automatically', async () => {
    const message = 'must be greater than 10'
    const mockValidator = jest.fn((value) => value > 10)
    const columns: Column[] = [
      {
        field: 'code',
        rule: {
          message,
          validator: mockValidator,
        },
      },
    ]
    const worktable = new Worktable(columns)
    const parent = worktable.addRow({ code: 12, children: [{ code: 13 }] }) // 2
    const row = parent.children[0]
    expect(mockValidator.mock.calls.length).toBe(2)
    await worktable.validate() // 4 times

    worktable.inputValue({ rid: row.rid, field: 'code' }, 9) // 5 times
    // wait for worktable asynchronous validate process finished
    // TODO:
    await delay(20)
    expect(mockValidator.mock.calls.length).toBe(5)
    expect(row.data['code'].errors[0]).toEqual(message)
  })

  test('stop watching validation', async () => {
    const message = 'must be greater than 10'
    const mockValidator = jest.fn(({ value }) => value > 10)
    const columns: Column[] = [
      {
        field: 'code',
        rule: {
          message,
          validator: mockValidator,
        },
      },
    ]
    const worktable = new Worktable(columns)
    const row = worktable.addRow({ code: 12 })
    expect(mockValidator.mock.calls.length).toBe(1)
    worktable.inputValue({ rid: row.rid, field: 'code' }, 9)
    await delay(20)
    expect(mockValidator.mock.calls.length).toBe(2)

    worktable.stopWatchValidation()
    worktable.inputValue({ rid: row.rid, field: 'code' }, 9)
    await delay(20)
    expect(mockValidator.mock.calls.length).toBe(2)
  })

  test('should pass cell validation', async () => {
    const columns: Column[] = [
      { field: 'code', type: 'string', rule: { required: true } },
      { field: 'name', type: 'string', rule: { required: true } },
    ]
    const worktable = new Worktable(columns)
    const row = worktable.addRow()
    await worktable.validate().catch(() => ({}))
    expect(row.data['code'].errors.length).toBeGreaterThan(0)
    expect(row.data['name'].errors.length).toBeGreaterThan(0)

    worktable.inputValue({ rid: row.rid, field: 'code' }, 'c1')
    await delay(10)
    expect(row.data['code'].errors.length).toBe(0)
    expect(row.data['name'].errors.length).toBeGreaterThan(0)
  })
})

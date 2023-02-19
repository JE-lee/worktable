import { FieldDeconstructMeta } from './types'

export function deconstruct(field: string) {
  return tryDeconstructArray(field) || tryDeconstructObject(field)
}

function tryDeconstructArray(field: string): FieldDeconstructMeta | undefined {
  const pattern = /^\[(.+)\]$/ms
  if (pattern.test(field)) {
    const match = field.match(pattern)
    if (match && match[1]) {
      const nestItems = splitArrayField(match[1].trim())
      const props: Array<[string, string]> = []
      nestItems.forEach((nestField, index) => {
        nestField = nestField.trim()
        const objectDeconstructMeta = tryDeconstructObject(nestField)
        if (objectDeconstructMeta) {
          const nestedKeyMaps = objectDeconstructMeta.keyMaps.map(
            ([from, to]) => [`[${index}].${from}`, `${to}`] as [string, string]
          )
          props.push(...nestedKeyMaps)
        } else {
          props.push([`${index}`, nestField])
        }
      })
      return {
        type: 'array',
        keyMaps: props,
      }
    }
  }
}

function tryDeconstructObject(field: string): FieldDeconstructMeta | undefined {
  const pattern = /^\{(.+)\}$/ms
  if (pattern.test(field)) {
    const match = field.match(pattern)
    if (match && match[1]) {
      const props: Array<[string, string]> = match[1]
        .trim()
        .split(',')
        .map((prop) => prop.split(':'))
        .map(([from, to]) => {
          from = from?.trim()
          to = to?.trim()
          return to ? [from, to] : [from, from]
        })
      return {
        type: 'object',
        keyMaps: props,
      }
    }
  }
}

function splitArrayField(field: string): string[] {
  const items: string[] = []
  let isTokenStarted = false
  let slice = ''
  for (let i = 0; i < field.length; i++) {
    if (field[i] === '{') {
      isTokenStarted = true
    } else if (field[i] === '}') {
      isTokenStarted = false
    } else if (field[i] === ',') {
      if (!isTokenStarted) {
        items.push(slice)
        slice = ''
        continue
      }
    }
    slice += field[i]
  }
  if (slice) {
    items.push(slice)
  }
  return items
}

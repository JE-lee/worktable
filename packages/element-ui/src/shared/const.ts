export const defaultWorktableInjectKey = '__default'

export const getWorktableInjectKey = (key = defaultWorktableInjectKey) => `inject-edit-table-${key}`

export const innerDefaultKey = Symbol('__inner_default')

export const ROWID = '_rowid'

export const CLASS_PREFIX = 'worktable'

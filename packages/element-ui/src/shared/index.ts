import { Worktable } from '@edsheet/core'

export * from './const'
export * from './pos-key'
export * from './tree'
export * from './hooks'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

export function bindWorktable(worktable: Worktable) {
  return {
    pauseEffects: worktable.pause.bind(worktable),
    resumeEffects: worktable.resume.bind(worktable),
    addEffect: worktable.addEffect.bind(worktable),
    addFieldEffect: worktable.addFieldEffect.bind(worktable),
    removeEffect: worktable.removeEffect.bind(worktable),
    setColumns: worktable.setColumns.bind(worktable),
    setComponentProps: worktable.setComponentProps.bind(worktable),
    validate: worktable.validate.bind(worktable),
    remove: worktable.remove.bind(worktable),
    removeAll: worktable.removeAll.bind(worktable),
    add: worktable.addRow.bind(worktable),
    addRow: worktable.addRow.bind(worktable),
    addRows: worktable.addRows.bind(worktable),
    getData: worktable.getData.bind(worktable),
    getValues: worktable.getData.bind(worktable),
    setValuesInEach: worktable.setValuesInEach.bind(worktable),
    sort: worktable.sort.bind(worktable),
    sortChildInEach: worktable.sortChildInEach.bind(worktable),
    walk: worktable.walk.bind(worktable),
    forEach: worktable.forEach.bind(worktable),
    find: worktable.find.bind(worktable),
    findAll: worktable.findAll.bind(worktable),
    filter: worktable.filter.bind(worktable),
    getLength: () => worktable.rows.length,
  }
}

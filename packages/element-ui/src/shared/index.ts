import type { Worktable } from '@edsheet/core'

export * from './const'
export * from './pos-key'
export * from './tree'
export * from './hooks'
export * from './component'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

export function bindWorktable(worktable: Worktable) {
  return {
    walk: worktable.walk.bind(worktable),
    forEach: worktable.forEach.bind(worktable),
    find: worktable.find.bind(worktable),
    findAll: worktable.findAll.bind(worktable),
    filter: worktable.filter.bind(worktable),
    remove: worktable.remove.bind(worktable),
    removeAll: worktable.removeAll.bind(worktable),
    pauseEffects: worktable.pause.bind(worktable),
    resumeEffects: worktable.resume.bind(worktable),
    addEffect: worktable.addEffect.bind(worktable),
    addFieldEffect: worktable.addFieldEffect.bind(worktable),
    removeEffect: worktable.removeEffect.bind(worktable),
    setComponentProps: worktable.setComponentProps.bind(worktable),
    validate: worktable.validate.bind(worktable),
    submit: worktable.submit.bind(worktable),
    add: worktable.add.bind(worktable),
    addRow: worktable.addRow.bind(worktable),
    addRows: worktable.addRows.bind(worktable),
    setData: worktable.setData.bind(worktable),
    getData: worktable.getData.bind(worktable),
    setValuesInEach: worktable.setValuesInEach.bind(worktable),
    sort: worktable.sort.bind(worktable),
    sortChildInEach: worktable.sortChildInEach.bind(worktable),
    getLength: () => worktable.rows.length,
    toggleColumnVisibility: worktable.toggleColumnVisibility.bind(worktable),
  }
}

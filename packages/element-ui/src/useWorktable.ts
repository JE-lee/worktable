import { useWorkTableOpt } from './types'
import { Worktable } from '@worktable/core'
import { provide } from 'vue-demi'
import { getWorktableInjectKey } from './shared'

export function useWorktable(opt: useWorkTableOpt) {
  const worktable = new Worktable(opt)
  const injectKey = getWorktableInjectKey(opt.key)
  provide(injectKey, worktable)
}

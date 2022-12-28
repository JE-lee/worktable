import { useWorkTableOpt } from '@/types'
import { Worktable } from '@worktable/core'
import { provide } from 'vue'
import { getWorktableInjectKey } from '@/shared'

export function useWorktable(opt: useWorkTableOpt) {
  const worktable = new Worktable(opt)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.worktable = worktable
  const injectKey = getWorktableInjectKey(opt.key)
  provide(injectKey, worktable)

  return {
    validate: worktable.validate.bind(worktable),
  }
}

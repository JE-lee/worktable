import { Context, useWorkTableOpt } from '@/types'
import { Worktable } from '@worktable/core'
import { provide } from 'vue'
import { getWorktableInjectKey } from '@/shared'

export function useWorktable(opt: useWorkTableOpt) {
  const worktable = new Worktable(opt)
  const injectKey = getWorktableInjectKey(opt.key)
  const ctx: Context = { worktable, layout: opt.layout || {} }
  provide(injectKey, ctx)

  return {
    validate: worktable.validate.bind(worktable),
    remove: worktable.remove.bind(worktable),
  }
}

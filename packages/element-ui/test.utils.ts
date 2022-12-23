import { mount } from '@vue/test-utils'

type MountVC = Parameters<typeof mount>[0]
type MountOptions = Parameters<typeof mount>[1]

export function observerableMount(VC: MountVC, options?: MountOptions) {
  const $mount = VC.prototype.$mount
  const _options = {
    ...options,
    mocks: {
      ...options?.mocks,
      $mount,
    },
  }
  return mount(VC, _options)
}

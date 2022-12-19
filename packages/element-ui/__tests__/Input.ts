import { Input } from '../src/Input'
import { mount } from '@vue/test-utils'

describe('#test', () => {
  test('#1', () => {
    const wrapper = mount(Input)
    expect(wrapper.html()).toBe('<span>12</span>')
  })
})

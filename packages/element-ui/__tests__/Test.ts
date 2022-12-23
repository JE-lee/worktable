import { Test } from '../src/Test'
import { observerableMount } from '../test.utils'

describe('#Test', () => {
  test('#1', async () => {
    const wrapper = observerableMount(Test)
    expect(wrapper.findAll('.rows').length).toBe(0)

    const btnAdd = wrapper.find('.head button')
    await btnAdd.trigger('click')
    expect(wrapper.findAll('.rows').length).toBe(1)
  })
})

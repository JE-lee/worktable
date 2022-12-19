import { defineComponent, ref } from '@vue/composition-api'
const Input = defineComponent({
  setup() {
    const count = ref(12)
    return () => <span>{count.value}</span>
  },
})

export { Input }

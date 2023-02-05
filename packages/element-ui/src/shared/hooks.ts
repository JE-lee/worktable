import { ref, Ref } from 'vue-demi'
export function useFlashingValue(initialVal?: boolean) {
  const val = ref(!!initialVal)
  const flash = () => {
    val.value = !val.value
    setTimeout(() => {
      val.value = !val.value
    }, 0)
  }
  return [val, flash] as [Ref<boolean>, () => void]
}

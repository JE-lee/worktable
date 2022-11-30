export function flatten<T extends { children?: T[] }>(array: T[]) {
  const arr: T[] = []
  array.forEach((node) => {
    arr.push(node)
    if (node.children && node.children.length > 0) {
      arr.push(...flatten(node.children))
    }
  })
  return arr
}

export function walk<T extends { children?: T[] }>(
  arrs: T[] | T,
  action: (item: T, index: number) => void
) {
  const targets: T[] = Array.isArray(arrs) ? arrs : [arrs]
  targets.forEach((item, index) => {
    action(item, index)
    if (item.children) {
      walk(item.children, action)
    }
  })
}

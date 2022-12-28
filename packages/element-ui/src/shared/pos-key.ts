const DEFAULT_SEPERATOR = '$'
export const mergePosKey = (index: number, field: string, sperator = DEFAULT_SEPERATOR) =>
  `${index}${sperator}${field}`
export const splitPosKey = (key: string, sperator = DEFAULT_SEPERATOR) => {
  const [index, field] = key.split(sperator)
  return [+index, field] as [number, string]
}

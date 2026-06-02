export const hashPin = (pin: string) => {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString()
}

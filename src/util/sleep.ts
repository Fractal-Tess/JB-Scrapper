export const sleep = (count = 1): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, count * 1000))
}

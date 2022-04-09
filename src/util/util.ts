export * from './send-to-api.ts'
export * from './sleep.ts'
export * from './test-api.ts'
export * from './url-to-cheery.ts'

// export const imgToBuffer = async (
//   url: string | URL,
//   retry = 0
// ): Promise<Uint8Array | never> => {
//   if (retry > 5) {
//     const e = `Retry limit reached on trying to fetch image url: => ${url}`
//     log.error(e)
//     throw new Error(e)
//   }
//   try {
//     log.info(`Fetching image url:${url}`)
//     const res = await fetch(url)

//     if (res.status !== 200) {
//       log.error(`Fetching image url: ${url} resulted in status code: ${res.status}`)
//       sleep(5)
//       return await imgToBuffer(url, ++retry)
//     }
//     const buffer = await res.arrayBuffer()
//     return new Uint8Array(buffer)
//   } catch (e) {
//     log.error(
//       `Fetching url ${url}, resulted in an error of:\n\t=> ${e}\n\tAt retry: ${retry}\n`
//     )
//     return await imgToBuffer(url, ++retry)
//   }
// }

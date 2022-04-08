import { Root, Cheerio, cheerio } from '@deps'
import { APIStatus, Fiction } from '@types'

export const sleep = (count = 1): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, count * 1000))
}

export const urlToCheery = async (
  url: string,
  headers: Headers = new Headers(),
  count = 0
): Promise<(Root & Cheerio) | never> => {
  if (count >= 5)
    throw new Error(`Retry count exceeded when trying to fetch resource => ${url}`)

  const res = await fetch(url, {
    headers
  })

  if (res.status === 429) {
    // Too many requests
    await sleep(5)
    return await urlToCheery(url, headers, ++count)
  } else if (res.status !== 200) {
    throw new Error(
      `Fetching resource => ${url} resulted in status code of ${res.status}`
    )
  }

  const text = await res.text()
  const $ = cheerio.load(text)

  return $
}

export const sendToApi = async (fiction: Fiction): Promise<void | never> => {
  await fetch('http://localhost:8888/api/v1/fiction', {
    method: 'POST',
    body: JSON.stringify(fiction)
  })
}

export const TestAPI = async (): Promise<APIStatus> => {
  try {
    const res = await fetch('http://localhost:8888/api/v1/heartbeat')
    if (res.status === 200) return APIStatus.UP
    return APIStatus.DOWN
  } catch (_e) {
    // API is probably down
    return APIStatus.DOWN
  }
}

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

import { sleep } from '@util'
import { cheerio, Cheerio, Root } from '@deps'

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

import {
  Cheerio,
  cheerio,
  Root
} from 'https://deno.land/x/cheerio@1.0.4/mod.ts'
import config from '../config/config.ts'
import sleep from './sleep.ts'

let errCount = 0

const debug = config.ENV === 'dev'

export default async function UrlToCherry(
  url: string
): Promise<Root & Cheerio> {
  try {
    debug && console.time(`fetch for ${url}`)
    const res = await fetch(url)
    debug && console.timeEnd(`fetch for ${url}`)

    if (res.status === 200) {
      const text = await res.text()
      const $ = cheerio.load(text)
      return $
    } else {
      console.log(url + ' resulted in ' + res.status)

      await sleep(1000)
      return await UrlToCherry(url)
    }
  } catch (e) {
    errCount++
    console.error(e)
    await sleep(1)
    return UrlToCherry(url)
  }
}

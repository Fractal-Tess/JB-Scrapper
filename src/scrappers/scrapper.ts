// import { LightNovelPub } from './LightNovelPub/main.ts'
import { log } from '@deps'
import { BaseScrapper } from './base-fiction.ts'
import { sendToApi } from '@util'
import { ReadLightNovel } from './read-light-novel.ts'
import { RoyalRoad } from './royal-road.ts'

export const runScrapper = async () => {
  // const royalRoad = new RoyalRoad(1)
  // await scrapeIterator(royalRoad)

  // const readLightNovel = new ReadLightNovel(1)
  // await scrapeIterator(readLightNovel)

  const readLightNovel = new ReadLightNovel(20)
  await _debug(readLightNovel)
}

const scrapeIterator = async (scrapper: BaseScrapper) => {
  for await (const fiction of scrapper.runIndexer()) {
    try {
      await sendToApi(await fiction.getFiction())
      log.info(`[${scrapper.platform}] - OK: API posting of fiction: ${fiction.title}`)
    } catch (e) {
      log.info(
        `[${scrapper.platform}] - ERROR: API posting of fiction: ${fiction.title}`,
        e
      )
    }
  }
}

//** Used for development**/
const _debug = async (scrapper: BaseScrapper) => {
  for await (const fiction of scrapper.runIndexer()) {
    try {
      await fiction.getFiction()
      log.info(`[Successful scrape on fiction ${fiction.title} ]`)
      log
    } catch (e) {
      log.error(e)
      Deno.exit(0)
    }
  }
}

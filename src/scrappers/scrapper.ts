// import { LightNovelPub } from './LightNovelPub/main.ts'
import { log } from '@deps'
import { BaseScrapper } from './base-fiction.ts'
import { sendToApi } from '@util'
import { ReadLightNovel } from './read-light-novel.ts'
import { RoyalRoad } from './royal-road.ts'

export const runScrapper = async () => {
  const royalRoad = new RoyalRoad(1)
  await scrapeIterator(royalRoad)

  const readLightNovel = new ReadLightNovel(1)
  await scrapeIterator(readLightNovel)
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
const _debug = async (scrapperC: BaseScrapper) => {
  const iterator = await scrapperC.runIndexer()
  const result = await iterator.next()
  if (!result.done) {
    const scrapeObject = result.value
    const fiction = await scrapeObject.getFiction()
    console.log(fiction.abbreviation)
  }
}

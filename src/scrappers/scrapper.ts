import { log } from '@deps'
import { BaseScrapper } from './base-fiction.ts'
import { sendToApi } from '@util'
import { ReadLightNovel } from './platforms/read-light-novel.ts'
import { RoyalRoad } from './platforms/royal-road.ts'
import { test } from '../main.ts'
import type { ScrapeFiction, ScrapeFictionChapter } from '@types'

export const runScrapper = async () => {
  log.info('----------Starting scrapping----------')
  if (test) {
    log.info('Test mode enabled')
    const rln = new ReadLightNovel(10)
    const rr = new RoyalRoad(10)
    await Promise.all([test1(rln), test1(rr)])
    await Promise.all([test2(rln), test2(rr)])
    log.critical('Test passed')
  } else {
    const royalRoad = new RoyalRoad()
    const readLightNovel = new ReadLightNovel()
    await Promise.all([scrapeIterator(royalRoad), scrapeIterator(readLightNovel)])
  }

  log.info('----------Done scrapping----------')
}

export const getChapter = async (
  platform: ScrapeFiction['platform'],
  scrapeURL: string
): Promise<Partial<ScrapeFictionChapter> | never> => {
  switch (platform) {
    case 'ReadLightNovel':
      return await ReadLightNovel.scrapeChapter(scrapeURL)
    case 'RoyalRoad':
      return await RoyalRoad.scrapeChapter(scrapeURL)
    default:
      throw new Error(`[${platform}] platform not implemented`)
  }
}

const scrapeIterator = async (scrapper: BaseScrapper) => {
  for await (const fiction of scrapper.runIndexer()) {
    try {
      const f = await fiction.getFiction()
      await sendToApi(f)
      log.info(
        `[${f.platform}] ${' '.repeat(
          15 - f.platform.length
        )} - OK: API posting of fiction: ${f.title}`
      )
    } catch (e) {
      log.error(
        `[${fiction.platform}] ${' '.repeat(
          15 - fiction.platform.length
        )} - ERROR: API posting of fiction: ${fiction.title}`,
        e
      )
    }
  }
}

// Test index scrapping
const test1 = async (scrapper: BaseScrapper) => {
  for await (const fiction of scrapper.runIndexer()) {
    try {
      const f = await fiction.getFiction()

      log.info(
        `[${fiction.platform}] ${' '.repeat(
          15 - fiction.platform.length
        )} => Successful scrape on fiction ${fiction.title}]`
      )
    } catch (e) {
      console.log(fiction.title)
      log.error(e)
      Deno.exit(0)
    }
  }
}
// Test content scrapping
const test2 = async (scrapper: BaseScrapper) => {
  for await (const fiction of scrapper.runIndexer()) {
    try {
      const f = await fiction.getFiction()
      const n = Math.ceil(Math.random() * f.chapters.length - 1)
      const sc = await getChapter(f.platform, f.chapters[n].scrapeURL)
      log.info(
        `[${f.platform}] ${' '.repeat(
          15 - f.platform.length
        )} => Successful chapter scrape on fiction ${fiction.title}`
      )
      // Print first 1000 characters
      console.log(sc.content?.slice(0, 1000))
    } catch (e) {
      console.log(fiction.title)
      log.error(e)
      Deno.exit(0)
    }
  }
}

import RRScrape from './scrappers/RoyalRoad.ts'

export default async function update() {
  const scrapePromises = [RRScrape()]
  await Promise.all(scrapePromises)
}

import config from './src/config/config.ts'
import scrape from './src/scrapper.ts'

export const isDev = config.ENV === 'dev' ? true : false

// Scrape
await scrape()

console.log('Done scrapping. Exiting...')

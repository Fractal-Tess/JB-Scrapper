import { ScrapeFiction } from '@types'
import { testAPI } from '@util'
import { InitLogger } from '@logger'
import { Application, Router, log } from '@deps'
import { getChapter, runScrapper } from '@scrapper'

import { getQuery } from 'https://deno.land/x/oak@v10.5.1/helpers.ts'

export const test = false
export const API_HOST = 'http://localhost:8888'

const SCRAPE_INTERVAL = 12
const PORT = 7992

await InitLogger('overwrite')

await testAPI()

const app = new Application()

const router = new Router()

router.prefix('/api/v1/scrapper')
router
  .get('/heartbeat', ctx => {
    ctx.response.status = 200
    ctx.response.body = 'Scrapper is up!'
  })
  .get('/fiction/chapter', async ctx => {
    const { platform, scrapeURL } = getQuery(ctx) as unknown as {
      platform: ScrapeFiction['platform']
      scrapeURL: string
    }
    try {
      ctx.response.body = await getChapter(platform, scrapeURL)
    } catch (e) {
      log.error(`Error scrapping fiction chapter`, `Fiction url ${scrapeURL}`, e)
      ctx.response.status = 500
    }
  })

app.use(router.routes())
app.use(router.allowedMethods())

app.addEventListener('listen', evt => {
  log.info(`Server listening on port: ${evt.port}`)
  runScrapper()
  setInterval(runScrapper, 1000 * 60 * 60 * SCRAPE_INTERVAL)
})

await app.listen({ port: PORT })

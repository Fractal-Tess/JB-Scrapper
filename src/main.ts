import { ScrapeFictionChapter, ScrapeFiction } from '@types'
import { testAPI } from '@util'
import { InitLogger } from '@logger'
import { Application, Router, log } from '@deps'
import { getChapter, runScrapper } from '@scrapper'

export const test = false
export const API_HOST = 'http://localhost:8888'

const SCRAPE_INTERVAL = 12
const PORT = 7992

await InitLogger('overwrite')

await testAPI()

const app = new Application()

const router = new Router()

router.prefix('/api/v1')

router.get('/scrapper/fiction', async ctx => {
  const platform = ctx.request.url.searchParams.get(
    'platform'
  ) as ScrapeFiction['platform']
  const fictionChapter = (await ctx.request.body({ type: 'json' })
    .value) as ScrapeFictionChapter
  try {
    ctx.response.body = await getChapter(fictionChapter, platform)
  } catch (e) {
    log.error(`Error scrapping chapter`, `Fiction url ${fictionChapter.scrapeURL}`, e)
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

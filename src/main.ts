import { InitLogger } from '@logger'
import { Application, Router, log } from '@deps'
import { runScrapper } from '@scrapper'
import { TestAPI } from '@util'
import { APIStatus } from './types/types.ts'

await InitLogger('overwrite')

const PORT = 7992

const apiStatus = await TestAPI()
if (apiStatus === APIStatus.DOWN) {
  log.critical('API appears to be offline - Shutting down scrapper...')
  Deno.exit(0)
}

const app = new Application()

const router = new Router()

router.prefix('/api/v1')

router.get('/scrapper/chapter', ctx => {})

app.use(router.routes())
app.use(router.allowedMethods())

app.addEventListener('listen', evt => {
  log.info(`Server listening on port: ${evt.port}`)

  // setInterval(runScrapper, 1000 * 60 * 60 * 24)
  runScrapper()
})

await app.listen({ port: PORT })

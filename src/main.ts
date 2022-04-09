import { testAPI } from '@util'
import { InitLogger } from '@logger'
import { Application, Router, log } from '@deps'
import { runScrapper } from '@scrapper'

export const debug = false
export const API_HOST = 'http://localhost:8888'

await InitLogger('overwrite')

await testAPI()
const PORT = 7992

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

import { APIStatus } from '@types'
import { log } from '@deps'
import { API_HOST, debug } from '../main.ts'

export const testAPI = async (): Promise<void | never> => {
  log.debug(`Starting scrapper in ${debug ? 'debug' : 'production'} mode`)
  if (!debug) {
    const status = await heartbeat()
    if (status === APIStatus.UP) {
      log.info(`Successfully got an OK status from API host ${API_HOST}`)
    } else if (status === APIStatus.DOWN) {
      log.critical(`Cannot establish connection to API host ${API_HOST}`)
      Deno.exit(0)
    } else if (status === APIStatus.NotOK) {
      log.critical(`API host ${API_HOST} responded with !200 status`)
      Deno.exit(0)
    }
  }
}

const heartbeat = async (): Promise<APIStatus> => {
  try {
    const res = await fetch(API_HOST + '/api/v1/heartbeat')
    if (res.status === 200) return APIStatus.UP
    return APIStatus.NotOK
  } catch (_e) {
    return APIStatus.DOWN
  }
}

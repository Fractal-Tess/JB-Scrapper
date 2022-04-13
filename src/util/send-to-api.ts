import { ScrapeFiction } from '@types'
import { API_HOST } from '../main.ts'

export const sendToApi = async (fiction: ScrapeFiction): Promise<void | never> => {
  const res = await fetch(API_HOST + '/api/v1/fiction', {
    method: 'POST',
    body: JSON.stringify(fiction)
  })

  if (res.status !== 200) throw new Error(`Request resulted in ${res.status} status code`)
}

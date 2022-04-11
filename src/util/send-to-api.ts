import { ScrapeFiction } from '@types'
import { API_HOST } from '../main.ts'

export const sendToApi = async (fiction: ScrapeFiction): Promise<void | never> => {
  await fetch(API_HOST + '/api/v1/fiction', {
    method: 'POST',
    body: JSON.stringify(fiction)
  })
}

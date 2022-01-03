import { Index } from './../../types.ts'
import { Collection } from 'https://deno.land/x/mongo@v0.28.0/mod.ts'
import { FictionChapter } from '../../types.ts'

export interface iTitle {
  title: string
}

export async function RRExists(
  obj: iTitle,
  col: Collection<Index<FictionChapter>>
): Promise<boolean> {
  const { title } = obj
  const res = await col.findOne({ title })
  console.log(res)
  return false
}

export enum APIStatus {
  DOWN,
  NotOK,
  UP
}

type Asset = string | Uint8Array | null
type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

export type FictionContentScrape = RequireOnlyOne<
  Partial<ScrapeFictionChapter>,
  'content'
>

export interface ScrapeFiction {
  title: string
  author: string | null
  chapterCount: number
  ageRating: 'everyone' | 'teen' | 'mature' | null
  status: 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' | null
  genres: string[] | null
  description: string | string[] | null

  warning: string[] | null

  banner: Asset
  cover: Asset

  chapters: ScrapeFictionChapter[]
  indexURL: string
  platform: 'RoyalRoad' | 'ReadLightNovel'
}

export interface ScrapeFictionChapter {
  chapterTitle: string | null
  chapterNumber: number
  content: string[] | string | null
  uploadDate: Date | null
  scrapeURL: string
}

export enum APIStatus {
  DOWN,
  NotOK,
  UP
}

type Asset = string | Uint8Array | null

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

  lastPublicUpdate: Date
  lastHiddenUpdate: Date

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

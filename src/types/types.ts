import { Bson } from 'https://deno.land/x/mongo@v0.28.0/mod.ts'

export enum APIStatus {
  DOWN,
  NotOK,
  UP
}

type Asset = string | Uint8Array | null

export interface Fiction {
  _id?: Bson.ObjectId

  title: string
  abbreviation: string | null
  author: string
  chapterCount: number
  ageRating: 'Everyone' | 'Teen' | 'Mature' | 'unknown'
  status: 'completed' | 'hiatus' | 'ongoing' | 'unknown' | 'stub' | 'dropped'
  genres: string[]

  original_ratting: number
  original_views: number
  original_subscribers: number

  jb_subscribers: number
  jb_views: number
  jb_ratting: number

  description: string | string[]

  warning: {
    offenses: string[]
  } | null

  banner: Asset
  cover: Asset

  lastPublicUpdate: Date
  lastHiddenUpdate: Date

  chapters: FictionChapter[]
  fictionURL: string
  scrappedFrom: 'RoyalRoad' | 'ReadLightNovel'
}

export interface FictionChapter {
  chapterTitle: string | null
  chapterNumber: number
  content: string[] | string | null
  original_views: number
  original_likes: number
  jb_likes: number
  jb_views: number
  lastScrapped: Date
  uploadDate: Date | null
  scrapeUrl: string
}

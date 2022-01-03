import { Bson } from 'https://deno.land/x/mongo@v0.29.0/deps.ts'

export type mUrl = string

export interface Index<T> {
  _id?: Bson.ObjectId
  title: string
  abbreviation?: string

  author?: string

  contentCount: number

  type:
    | 'Fiction'
    | 'Book'
    | 'Manhwa'
    | 'Manga'
    | 'Anime'
    | 'Film'
    | 'Film Series'
    | 'Animated Series'

  ageRating?: 'E' | 'Y' | 'T' | 'OT' | 'M'
  status: 'completed' | 'hiatus' | 'ongoing' | 'unknown' | 'stub' | 'dropped'
  genres: string[]
  ratting: number // Number between 0/5
  views: number // init to 0
  subscribers: number //init to 0
  description: string

  coverImage: mUrl
  bigCover?: mUrl
  smallCover?: mUrl

  // Reference to entry in another db that holds the content (episodes/chapters)

  // Scrapper specific
  lastUpdated: Date

  episodes: T[]

  scrappedFrom: 'royalroad' // Used to determine which scrapper use
}

export interface FictionChapter {
  index: number
  chapterTitle: string
  content: string
  scrapped: boolean

  // Date of last upload/update of the specific content
  lastUploaded: Date

  // Scrapper specific
  lastScrapped: Date
  scrapeUrl: mUrl
}

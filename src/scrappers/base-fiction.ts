import { Fiction, FictionChapter } from '@types'

export abstract class BaseScrapper {
  protected limit: number
  abstract readonly platform: string

  constructor(limit: number) {
    this.limit = limit
  }
  abstract runIndexer(): AsyncGenerator<BaseFiction, void, unknown>
}

export abstract class BaseFiction {
  abstract readonly title: string

  protected defaultChapter: Omit<FictionChapter, 'scrapeUrl'> = {
    chapterTitle: null,
    chapterNumber: 0,
    original_views: 0,
    original_likes: 0,
    jb_views: 0,
    jb_likes: 0,
    content: null,
    uploadDate: null,
    lastScrapped: new Date()
  }

  protected defaultFiction: Omit<Fiction, 'scrappedFrom' | 'fictionURL'> = {
    title: '',
    abbreviation: '',
    author: '',
    chapterCount: 0,
    ageRating: 'unknown',
    status: 'unknown',
    cover: null,
    banner: null,
    genres: [],

    original_ratting: 0,
    original_subscribers: 0,
    original_views: 0,

    jb_ratting: 0,
    jb_subscribers: 0,
    jb_views: 0,
    description: '',
    warning: null,
    lastHiddenUpdate: new Date(),
    lastPublicUpdate: new Date(),

    chapters: []
  }

  protected getAbbreviation(): string {
    const acronym = this.title
      .match(/[\p{Alpha}\p{Nd}]+/gu)!
      .reduce(
        (previous, next) =>
          previous + (+next === 0 || parseInt(next) ? parseInt(next) : next[0] || ''),
        ''
      )
      .toUpperCase()
    return acronym
  }
  abstract getFiction(): Promise<Fiction | never>
}

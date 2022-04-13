import { log } from '@deps'
import { FictionContentScrape, ScrapeFiction, ScrapeFictionChapter } from '@types'

export abstract class BaseScrapper {
  protected limit: number
  abstract readonly platform: string

  constructor(limit = 999_999) {
    this.limit = limit
  }
  abstract runIndexer(): AsyncGenerator<BaseFiction, void, unknown>
  public static scrapeChapter(_scrapeURL: string): Promise<FictionContentScrape | never> {
    throw new Error('Not implemented')
  }
}

export abstract class BaseFiction {
  abstract readonly title: string
  abstract readonly platform: string

  // deno-lint-ignore require-await
  public static async scrapeChapter(
    // deno-lint-ignore no-unused-vars
    scrapeURL: string
  ): Promise<FictionContentScrape | never> {
    throw new Error(`Not implemented for current platform`)
  }

  protected static chapterDefaults: Omit<ScrapeFictionChapter, 'scrapeURL'> = {
    chapterTitle: null,
    chapterNumber: 0,
    content: null,
    uploadDate: null
  }

  protected static fictionDefaults: Omit<
    ScrapeFiction,
    'platform' | 'indexURL' | 'title'
  > = {
    author: null,
    chapterCount: 0,
    ageRating: null,
    status: null,

    cover: null,
    banner: null,
    genres: [],

    description: null,
    warning: null,
    lastHiddenUpdate: new Date(),
    lastPublicUpdate: new Date(),

    chapters: []
  }

  abstract getFiction(): Promise<ScrapeFiction | never>

  protected error(msg: string, thr = false): void {
    if (thr) throw new Error(msg)
    log.error(`[${this.title}] [${this.platform}]`, msg)
  }
}

// TODO: Add custom error class
export class F {
  msg: string
  constructor(msg: string) {
    this.msg = msg
  }
  error(msg: string, thr = false) {
    if (thr) throw new F(msg)
    return new F(msg)
  }
}

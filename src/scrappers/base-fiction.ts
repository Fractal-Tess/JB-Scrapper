import { log } from '@deps'
import { ScrapeFiction, ScrapeFictionChapter } from '@types'

export abstract class BaseScrapper {
  protected limit: number
  abstract readonly platform: string

  constructor(limit: number) {
    this.limit = limit
  }
  abstract runIndexer(): AsyncGenerator<BaseFiction, void, unknown>
  public static scrapeChapter(
    _chapter: ScrapeFictionChapter
  ): Promise<ScrapeFictionChapter | never> {
    throw new Error('Not implemented')
  }
}

export abstract class BaseFiction {
  abstract readonly title: string
  abstract readonly platform: string

  // deno-lint-ignore require-await
  public static async scrapeChapter(
    // deno-lint-ignore no-unused-vars
    chapter: ScrapeFictionChapter
  ): Promise<never | ScrapeFictionChapter> {
    throw new Error(`Not implemented for current platform`)
  }

  protected defaultChapter: Omit<ScrapeFictionChapter, 'scrapeURL'> = {
    chapterTitle: null,
    chapterNumber: 0,
    content: null,
    uploadDate: null
  }

  protected defaultFiction: Omit<ScrapeFiction, 'platform' | 'indexURL' | 'title'> = {
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

  protected error(msg: string, _throw = false): void {
    if (_throw) throw new Error(msg)
    log.error(`[${this.title}] [${this.platform}]`, msg)
  }
}

import { Fiction, FictionChapter } from '@types'
import { cheerio, Cheerio, Root, Page } from '@deps'
import { urlToCheery } from '@util'
import { BaseFiction, BaseScrapper } from './base-fiction.ts'

export class ReadLightNovel extends BaseScrapper {
  public get platform(): string {
    return 'ReadLightNovel'
  }

  constructor(limit = 999_999) {
    super(limit)
  }

  async *runIndexer() {
    for (let i = 0; i < this.limit; i++) {
      const $ = await urlToCheery(
        `https://www.readlightnovel.me/top-novels/top-rated/${i}`
      )
      if (!$ || !this.hasContent($)) return

      const fictions: ReadLightNovelFiction[] = []

      $('div.top-novel-block').each((_, e) => {
        const fiction = new ReadLightNovelFiction(cheerio.load(e))
        fictions.push(fiction)
      })

      for (const fiction of fictions) {
        yield fiction
      }
    }
  }

  private hasContent($: Cheerio & Root): boolean {
    return $('div.top-novel-block').length > 0
  }
}

class ReadLightNovelFiction extends BaseFiction {
  private r$: Cheerio & Root
  private i$!: Cheerio & Root
  private _fiction!: Fiction
  private _isInitialized = false

  constructor($: Cheerio & Root) {
    super()
    this.r$ = $
  }
  // done
  get title(): string {
    return this.r$('div.top-novel-header>h2>a').text()
  }

  async getFiction(): Promise<Fiction | never> {
    if (!this._isInitialized) await this.Initialize()
    return this._fiction
  }

  private async Initialize(): Promise<void | never> {
    if (this._isInitialized) return

    const fictionURL = this.getFictionUrl()
    this.i$ = await urlToCheery(fictionURL)

    this._fiction = {
      ...this.defaultFiction,

      title: this.title,
      abbreviation: this.getAbbreviation(),
      author: this.getAuthor(),
      description: this.getDescription(),

      cover: this.getCover(),

      status: this.getStatus(),
      genres: this.getGenres(),

      original_views: this.getViews(),
      original_ratting: this.getRatting(),

      fictionURL: fictionURL,
      scrappedFrom: 'ReadLightNovel',

      ...this.getChapters()
    }

    this._isInitialized = true
  }

  private getChapters(): { chapters: FictionChapter[]; chapterCount: number } | never {
    const chapters: FictionChapter[] = []
    let chapterCount = 0
    this.i$('div.tab-content>div>ul.chapter-chs>li').each((idx, e) => {
      const c$ = this.i$(e)
      const chapter: FictionChapter = {
        ...this.defaultChapter,
        scrapeUrl: this.getChapterUrl(c$),
        chapterNumber: idx + 1
      }
      chapters.push(chapter)
      chapterCount++
    })

    return { chapters, chapterCount }
  }
  private getChapterUrl(c$: Cheerio): string | never {
    const path = c$.find('a').attr('href')
    if (!path) throw new Error('Cannot get chapter url')
    return path
  }
  private getFallbackRatting(): number | never {
    const ratting = this.i$(
      'div.novel-right>div.novel-details>div:nth-child(4)>div.novel-detail-body'
    )
      .text()
      .trim()
    console.log(`Fallback ratting called on fiction ${this.title}`)
    return Number(ratting)
  }
  private getRatting(): number | never {
    let ratting = this.i$(
      'div.novel-right>div.novel-details>div:nth-child(5)>div.novel-detail-body'
    )
      .text()
      .trim()
    let rattingAsNumber = Number(ratting)
    if (isNaN(rattingAsNumber)) rattingAsNumber = this.getFallbackRatting()
    if (isNaN(rattingAsNumber)) throw new Error('Cannot get ratting ')
    return rattingAsNumber
  }
  private getCover(): string | null | never {
    const cover = this.i$('div.novel-cover>a>img').attr('src')
    if (!cover) throw new Error('Cannot get cover')
    if (cover === 'https://www.readlightnovel.me/assets/images/noimage.jpg') return null
    return cover
  }
  private getViews(): number | never {
    const views = this.i$(
      'div.novel-right>div.novel-details>div:nth-child(4)>div.novel-detail-body'
    )
      .text()
      .trim()
    const viewsAsNumber = Number(views)
    if (isNaN(viewsAsNumber)) throw new Error('Cannot get views')
    return viewsAsNumber
  }
  private getFallbackDescription(): string {
    console.log(`Fallback description called on fiction ${this.title}`)

    return this.i$('div.book-info').text().trim()
  }
  private getDescription(): string[] | never {
    const description: string[] = []
    this.i$('div.novel-details>div.novel-detail-item>div.novel-detail-body>p').each(
      (_, e) => {
        description.push(this.i$(e).text().trim())
      }
    )
    if (description.length === 0) description.push(this.getFallbackDescription())
    // throw new Error('Cannot get description')
    return description
  }
  private getStatus(): 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' | never {
    const status = this.r$('div.novel-item:nth-child(3)>div.content>a')
      .text()
      .trim()
      .toLocaleLowerCase()

    if (status.includes('completed')) {
      return 'completed'
    } else if (status.includes('ongoing')) {
      return 'ongoing'
    } else if (status.includes('hiatus')) {
      return 'hiatus'
    } else if (status.includes('stub')) {
      return 'stub'
    } else if (status.includes('dropped')) {
      return 'dropped'
    } else {
      throw new Error('Cannot get status')
    }
  }
  private getGenres(): string[] | never {
    const genres: string[] = []
    this.r$('div.content>ul>li>a').each((_, e) => {
      genres.push(this.r$(e).attr('title')!.trim().toLocaleLowerCase())
    })
    if (genres.length === 0) throw new Error('Cannot get genres')
    return genres
  }
  private getAuthor(): string | never {
    const author = this.r$('div.novel-item>div.content>a').first().text().trim()
    if (!author) throw new Error('Cannot get author')
    return author
  }
  private getFictionUrl(): string | never {
    const url = this.r$('div.top-novel-header>h2>a').attr('href')
    if (!url) throw new Error(`Error while getting URL to fiction`)
    return url
  }
}

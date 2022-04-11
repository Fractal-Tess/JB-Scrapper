import { ScrapeFiction, ScrapeFictionChapter } from '@types'
import { cheerio, Cheerio, Root, Page, log } from '@deps'
import { urlToCheery } from '@util'
import { BaseFiction, BaseScrapper } from '../base-fiction.ts'

export class ReadLightNovel extends BaseScrapper {
  public get platform(): string {
    return 'ReadLightNovel'
  }

  constructor(limit = 999_999) {
    super(limit)
  }

  // Scrape index
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

  // Scrape chapter
  public static override async scrapeChapter(
    chapter: ScrapeFictionChapter
  ): Promise<ScrapeFictionChapter | never> {
    return await ReadLightNovelFiction.scrapeChapter(chapter)
  }

  private hasContent($: Cheerio & Root): boolean {
    return $('div.top-novel-block').length > 0
  }
}

export class ReadLightNovelFiction extends BaseFiction {
  private r$: Cheerio & Root
  private i$!: Cheerio & Root
  private _fiction!: ScrapeFiction
  private _isInitialized = false

  constructor($: Cheerio & Root) {
    super()
    this.r$ = $
  }

  // Access
  get title(): string {
    return this.r$('div.top-novel-header>h2>a').text()
  }

  get platform(): ScrapeFiction['platform'] {
    return 'ReadLightNovel'
  }

  async getFiction(): Promise<ScrapeFiction | never> {
    if (!this._isInitialized) await this.Initialize()
    return this._fiction
  }

  public static override async scrapeChapter(
    chapter: ScrapeFictionChapter
  ): Promise<ScrapeFictionChapter | never> {
    const $ = await urlToCheery(chapter.scrapeURL)

    chapter.uploadDate = this.getChapterUploadDate($)
    chapter.content = this.getChapterContent($)
    chapter.chapterTitle = this.getChapterTitle(chapter.content)
    return chapter
  }

  private static getChapterTitle(content: string[]): string | null | never {
    const title = content.find(e => /^chapter /gi.test(e))
    if (!title) throw new Error('Cannot get title')
    return title.replace(/chapter .\d*(: | – )?/gi, '') || null
  }

  // Chapter scrapping
  private static getChapterContent($: Root & Cheerio): string[] | never {
    const content = $('div.chapter-content3>div.desc')
      .text()
      .replace(/If audio player doesn't work, press Stop then Play button again/gi, '')
      .replace(/Please report us if you find any errors so we can fix it asap!/gi, '')
      .replace(/Visit readlightnovel.me for extra chapters./gi, '')
      .split('\n')
      .map(e => e.trim())
      .filter(e => e != '')
    if (content.length === 0) throw new Error('Cannot get content of chapter')
    return content
  }
  private static getChapterUploadDate($: Cheerio & Root): Date | never {
    const scrapped_date = $('div.col-md-12>p')
      .text()
      .trim()
      .replace(new RegExp('\\s+'), '')
    const split_date = scrapped_date.split(' ')
    const day = split_date[0].replace('th', '')
    const month = split_date[2]
    const date = new Date(
      `${month}, ${day} ${split_date[3]} ${split_date[4]} ${split_date[5]}`
    )
    if (isNaN(date.getTime())) throw new Error('Cannot get chapter upload date')
    return date
  }

  // Indexing scrapping
  private async Initialize(): Promise<void | never> {
    if (this._isInitialized) return

    const indexURL = this.getFictionUrl()
    this.i$ = await urlToCheery(indexURL)

    this._fiction = {
      ...this.defaultFiction,

      title: this.title,
      abbreviation: this.getAbbreviation(),
      author: this.getAuthor(),
      description: this.getDescription(),

      cover: this.getCover(),

      status: this.getStatus(),
      genres: this.getGenres(),
      indexURL,

      platform: 'ReadLightNovel',

      ...this.getChapters()
    }

    this._isInitialized = true
  }
  private getChapters():
    | { chapters: ScrapeFictionChapter[]; chapterCount: number }
    | never {
    const chapters: ScrapeFictionChapter[] = []
    let chapterCount = 0
    this.i$('div.tab-content>div>ul.chapter-chs>li').each((idx, e) => {
      const c$ = this.i$(e)
      const chapter: ScrapeFictionChapter = {
        ...this.defaultChapter,
        scrapeURL: this.getChapterUrl(c$),
        chapterNumber: idx + 1
      }
      chapters.push(chapter)
      chapterCount++
    })

    return { chapters, chapterCount }
  }
  private getChapterUrl(c$: Cheerio): string | never {
    const path = c$.find('a').attr('href')
    if (!path) this.error('Cannot get chapter url', true)
    return `${path}`
  }
  private getCover(): string | null {
    const cover = this.i$('div.novel-cover>a>img').attr('src')
    if (!cover) {
      this.error('Cannot get cover')
      return null
    }
    if (cover === 'https://www.readlightnovel.me/assets/images/noimage.jpg') return null
    return cover
  }
  private getDescription(): string[] | null {
    const description: string[] = []
    this.i$('div.novel-details>div.novel-detail-item>div.novel-detail-body>p').each(
      (_, e) => {
        description.push(this.i$(e).text().trim())
      }
    )
    if (description.length === 0) description.push(this.i$('div.book-info').text().trim())
    if (description.length === 0) {
      description.push(
        this.i$(
          'div.novel-details>div.novel-detail-item>div.novel-detail-body>pre'
        ).text()
      )
    }
    if (description.length === 0) {
      console.log(description.length)
      this.error('Cannot get description')
      return null
    }

    return description
  }
  private getStatus(): 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' | null {
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
      this.error('Cannot get status')
      return null
    }
  }
  private getGenres(): string[] | null {
    const genres: string[] = []
    this.r$('div.content>ul>li>a').each((_, e) => {
      genres.push(this.r$(e).attr('title')!.trim().toLocaleLowerCase())
    })
    if (genres.length === 0) {
      this.error('Cannot get genres')
      return null
    }
    return genres
  }
  private getAuthor(): string | null {
    const author = this.r$('div.novel-item>div.content>a').first().text().trim()
    if (!author) log.error(`Cannot get author`)
    return author || null
  }
  private getFictionUrl(): string | never {
    const url = this.r$('div.top-novel-header>h2>a').attr('href')
    if (!url) this.error(`Cannot get URL to fiction`, true)
    return `${url}`
  }
}

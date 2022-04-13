import { ScrapeFiction, ScrapeFictionChapter } from '@types'
import { cheerio, Cheerio, Root } from '@deps'
import { urlToCheery } from '@util'
import { BaseFiction, BaseScrapper } from '../base-fiction.ts'

export class RoyalRoad extends BaseScrapper {
  public get platform(): string {
    return 'RoyalRoad'
  }

  constructor(limit: number) {
    super(limit)
  }

  async *runIndexer() {
    for (let i = 0; i < this.limit; i++) {
      const $ = await urlToCheery(
        `https://www.royalroad.com/fictions/best-rated?page=${i}`
      )
      if (!$ || !this.hasContent($)) return

      const fictions: RoyalFiction[] = []

      $('div.fiction-list-item.row').each((_, e) => {
        const fiction = new RoyalFiction(cheerio.load(e))
        fictions.push(fiction)
      })

      for (const fiction of fictions) {
        yield fiction
      }
    }
  }
  public static override async scrapeChapter(
    chapter: ScrapeFictionChapter
  ): Promise<ScrapeFictionChapter | never> {
    return await RoyalFiction.scrapeChapter(chapter)
  }

  private hasContent($: Cheerio & Root): boolean {
    return !$('div>h3').text().includes('There is nothing here')
  }
}

export class RoyalFiction extends BaseFiction {
  private r$: Cheerio & Root
  private i$!: Cheerio & Root
  #fiction!: ScrapeFiction
  #isInitialized = false

  constructor($: Cheerio & Root) {
    super()
    this.r$ = $
  }

  // Access
  get title(): string {
    return this.r$('div>h2>a').text().trim()
  }
  get platform(): ScrapeFiction['platform'] {
    return 'RoyalRoad'
  }
  async getFiction(): Promise<ScrapeFiction | never> {
    if (!this.#isInitialized) await this.Initialize()
    return this.#fiction
  }

  // Chapter scraping
  public static override async scrapeChapter(
    chapter: ScrapeFictionChapter
  ): Promise<ScrapeFictionChapter | never> {
    const $ = await urlToCheery(chapter.scrapeURL)
    chapter.content = this.getChapterContent($)
    return chapter
  }
  static getChapterContent($: Root & Cheerio): string[] | never {
    const content = $('div.chapter-inner')
      .text()
      .split('\n')
      .map(e => e.trim())
      .filter(e => e != '')

    if (content.length === 0) throw new Error('Cannot get chapter content')
    return content
  }

  // Indexing scrapping
  private async Initialize(): Promise<void | never> {
    if (this.#isInitialized) return

    const indexURL = this.getFictionUrl()
    this.i$ = await urlToCheery(indexURL)

    this.#fiction = {
      ...this.defaultFiction,

      platform: this.platform,

      title: this.title,
      author: this.getAuthor(),

      warning: this.getWarnings(),
      ageRating: this.getAgeRatting(),

      cover: this.getCover(),

      description: this.getDescription(),

      status: this.getStatus(),
      genres: this.getGenres(),

      indexURL,

      ...this.getChapters()
    }

    this.#isInitialized = true
  }
  private getChapters():
    | { chapterCount: number; chapters: ScrapeFictionChapter[] }
    | never {
    const chapters: ScrapeFictionChapter[] = []
    let chapterCount = 0
    this.i$('tbody>tr.chapter-row').each((idx, e) => {
      const c$ = this.i$(e)
      const chapter: ScrapeFictionChapter = {
        ...this.defaultChapter,
        chapterTitle: this.getChapterTitle(c$),
        uploadDate: this.getChapterUploadDate(c$),
        scrapeURL: this.getChapterUrl(c$),
        chapterNumber: idx + 1
      }
      chapters.push(chapter)
      chapterCount++
    })
    return { chapterCount, chapters }
  }
  private getChapterUrl(c$: Cheerio): string | never {
    const path = c$.find('td:not(.text-right)>a').attr('href')
    if (!path) {
      this.error('Cannot get chapter url', true)
    }
    return 'https://royalroad.com' + path
  }
  private getChapterTitle(c$: Cheerio): string | null {
    const chapterTitle = c$.find('td:not(.text-right)>a').text().trim()
    if (!chapterTitle) {
      this.error('Cannot get chapter title')
      return null
    }
    return chapterTitle
  }
  private getChapterUploadDate(c$: Cheerio): Date | null {
    const time = c$.find('td>a>time').attr('title')
    if (!time) {
      this.error('Cannot get time of chapter')
      return null
    }
    return new Date(time)
  }
  private getCover(): string | null {
    const cover = this.i$('img.thumbnail.inline-block')
      .attr('src')
      ?.replace('covers-full', 'covers-large')
      .replace(/\?.*/g, '')
    if (!cover) {
      this.error('Cannot get cover')
      return null
    }
    if (cover === '/dist/img/nocover-new-min.png') return null
    return cover
  }
  private getDescription(): string[] | null {
    const description = this.i$('div.description').text().trim().split('\n')
    if (!description) {
      this.error('Cannot get description')
      return null
    }
    return description
  }
  private getStatus(): 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' | null {
    const status = this.i$('span.label.label-default.label-sm.bg-blue-hoki')
      .text()
      .trim()
      .toLocaleLowerCase()
      .replace(/ +/g, '')
      .split('\n')

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
  private getWarnings(): string[] | null {
    if (this.hasWarning()) {
      let warnings: string[] = []
      this.i$('div.text-center.font-red-sunglo>ul.list-inline').each((_, e) => {
        warnings = this.i$(e).text().trim().replace(/ +/g, '').split('\n')
      })
      if (warnings.length === 0) {
        this.error('There was a warning, but no offenses could be extracted')
        return null
      }
      return warnings
    }
    return null
  }
  private getAgeRatting(): 'teen' | 'everyone' {
    if (this.hasWarning()) return 'teen'
    return 'everyone'
  }
  private hasWarning(): boolean {
    const warning = this.i$('div>strong').first().text().toLocaleLowerCase()
    return warning === 'warning'
  }
  private getGenres(): string[] | null {
    const genres: string[] = []
    this.i$('span.tags>a').each((_, e) => {
      genres.push(this.i$(e).text().trim())
    })
    if (genres.length === 0) {
      this.error('Cannot get genres')
      return null
    }
    return genres
  }
  private getAuthor(): string | null {
    const author = this.i$('h4>span>a').text().trim()
    if (!author) this.error('Cannot get author')
    return author || null
  }
  private getFictionUrl(): string | never {
    const slug = this.r$('div>h2>a').attr('href')
    if (!slug) this.error(`Cannot get URL to fiction`, true)
    return `https://www.royalroad.com${slug}`
  }
}

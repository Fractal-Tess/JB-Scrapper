import { Fiction, FictionChapter } from '@types'
import { cheerio, Cheerio, Root } from '@deps'
import { urlToCheery } from '@util'
import { BaseFiction, BaseScrapper } from './base-fiction.ts'

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

  private hasContent($: Cheerio & Root): boolean {
    return !$('div>h3').text().includes('There is nothing here')
  }
}

class RoyalFiction extends BaseFiction {
  private r$: Cheerio & Root
  private i$!: Cheerio & Root
  private _fiction!: Fiction
  private _isInitialized = false

  constructor($: Cheerio & Root) {
    super()
    this.r$ = $
  }

  get title(): string {
    return this.r$('div>h2>a').text().trim()
  }

  async getFiction(): Promise<Fiction | never> {
    if (!this._isInitialized) await this.Initialize()
    return this._fiction
  }

  private async Initialize(): Promise<void | never> {
    if (this._isInitialized) return

    const fictionURL = this.getFictionUrl()
    const _temp = await urlToCheery(fictionURL.href)
    if (!_temp) throw new Error(`Cannot fetch main page of ${this.title}`)
    this.i$ = _temp

    this._fiction = {
      ...this.defaultFiction,
      abbreviation: this.getAbbreviation(),
      fictionURL: fictionURL.toJSON(),
      scrappedFrom: 'RoyalRoad',
      title: this.title,
      author: this.getAuthor(),
      warning: this.hasWarning() ? this.getOffenses() : null,
      ageRating: this.hasWarning() ? 'Teen' : 'Everyone',
      cover: this.getCover(),
      description: this.getDescription(),
      status: this.getStatus(),
      genres: this.getGenres(),
      original_views: this.getViews(),
      original_subscribers: this.getSubs(),
      original_ratting: this.getRatting(),
      ...this.getChapters()
    }

    this._isInitialized = true
  }

  private getChapters(): { chapters: FictionChapter[]; chapterCount: number } | never {
    const chapters: FictionChapter[] = []
    let chapterCount = 0
    this.i$('tbody>tr.chapter-row').each((idx, e) => {
      const c$ = this.i$(e)
      const chapter: FictionChapter = {
        ...this.defaultChapter,
        chapterTitle: this.getChapterTitle(c$),
        uploadDate: this.getChapterUploadDate(c$),
        scrapeUrl: this.getChapterUrl(c$),
        chapterNumber: idx + 1
      }
      chapters.push(chapter)
      chapterCount++
    })

    return { chapters, chapterCount }
  }
  private getChapterUrl(c$: Cheerio): string | never {
    const path = c$.find('td:not(.text-right)>a').attr('href')
    if (!path) throw new Error('Cannot get chapter url')
    return 'https://royalroad.com' + path
  }
  private getChapterTitle(c$: Cheerio): string | never {
    const chapterTitle = c$.find('td:not(.text-right)>a').text().trim()
    if (!chapterTitle) throw new Error('Cannot get chapter title')
    return chapterTitle
  }
  private getChapterUploadDate(c$: Cheerio): Date | never {
    const time = c$.find('td>a>time').attr('title')
    if (!time) throw new Error('Cannot get time of chapter')
    return new Date(time)
  }

  private getRatting(): number | never {
    const ratting = this.i$('ul.list-unstyled>li:nth-child(2)>span')
      .attr('aria-label')
      ?.replace(' stars', '')
    if (!ratting) throw new Error('Cannot get ratting')
    const rattingAsNumber = Number(ratting)
    if (isNaN(rattingAsNumber)) throw new Error('Cannot convert ratting number')
    return rattingAsNumber
  }
  private getCover(): string | null | never {
    const cover = this.i$('img.thumbnail.inline-block')
      .attr('src')
      ?.replace('covers-full', 'covers-large')
      .replace(/\?.*/g, '')
    if (!cover) throw new Error('Cannot get cover')
    if (cover === '/dist/img/nocover-new-min.png') return null
    return cover
  }
  private getViews(): number | never {
    const views = this.i$('div.col-sm-6>ul.list-unstyled>li:nth-child(2)')
      .text()
      .trim()
      .replaceAll(',', '')
    const viewsAsNumber = Number(views)
    if (isNaN(viewsAsNumber)) throw new Error('Cannot get views')
    return viewsAsNumber
  }
  private getSubs(): number | never {
    const subs = this.i$('div.col-sm-6>ul.list-unstyled>li:nth-child(8)')
      .text()
      .trim()
      .replaceAll(',', '')
    const subsAsNumber = Number(subs)
    if (isNaN(subsAsNumber)) throw new Error('Cannot get views')
    return subsAsNumber
  }
  private getDescription(): string[] | never {
    const description = this.i$('div.description').text().trim().split('\n')
    if (!description) throw new Error('Cannot get description')
    return description
  }
  private getStatus(): 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' | never {
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
      throw new Error('Cannot get status')
    }
  }
  private getOffenses(): { offenses: string[] } | never {
    let offenses: string[] = []
    this.i$('div.text-center.font-red-sunglo>ul.list-inline').each((_, e) => {
      offenses = this.i$(e).text().trim().replace(/ +/g, '').split('\n')
    })
    if (offenses.length === 0)
      throw new Error('There was a warning, but no offenses could be extracted')
    return { offenses }
  }
  private hasWarning(): boolean {
    const warning = this.i$('div>strong').first().text().toLocaleLowerCase()
    return warning === 'warning'
  }
  private getGenres(): string[] | never {
    const genres: string[] = []
    this.i$('span.tags>a').each((_, e) => {
      genres.push(this.i$(e).text().trim())
    })
    if (genres.length === 0) throw new Error('Cannot get genres')
    return genres
  }
  private getAuthor(): string | never {
    const author = this.i$('h4>span>a').text().trim()
    if (!author) throw new Error('Cannot get author')
    return author
  }
  private getFictionUrl(): URL | never {
    const slug = this.r$('div>h2>a').attr('href')
    if (!slug) throw new Error(`Error while getting URL to fiction`)
    return new URL(`https://www.royalroad.com${slug}`)
  }
}

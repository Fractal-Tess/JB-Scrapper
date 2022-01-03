import { iTitle } from './../db/exists.ts'
import { cheerio } from 'https://deno.land/x/cheerio@1.0.4/mod.ts'
import { Cheerio, Root } from 'https://deno.land/x/cheerio@1.0.4/types.ts'
import { FictionChapter, Index, mUrl } from '../../types.ts'
import UrlToCherry from '../util/fetch.ts'
import config from '../config/config.ts'
import { Collection } from 'https://deno.land/x/mongo@v0.28.0/src/collection/mod.ts'

const debug = config.ENV === 'dev'
const limit = 500

export default async function* RRScrape() {
  for (let page = 1; page < limit; page++) {
    const url = `https://www.royalroad.com/fictions/best-rated?page=${page}`
    const $ = await UrlToCherry(url)

    console.log(
      `RR: Scrapping url: ${url} out of ${limit} => Progress: ${
        +(page / limit).toFixed(2) * 100
      }%`
    )

    // Check if page is not populated with content
    if (!RRFiction.PageExists($)) {
      if (debug) {
        debug &&
          console.log(`Page ${page} of RR rankings has no content; Breaking`)
      }
      break
    }

    const $rcs = RRFiction.PageToFictions($)

    debug &&
      console.log(`PageToFiction found ${$rcs.length} entries at url ${url}`)

    const fictions = await Promise.all(
      $rcs.map(async ($rc, _idx) => {
        const fiction = new RRFiction($rc)
        await fiction.Init($rc)
        fiction.build()
        return fiction
      })
    )
    yield fictions
  }
}

class RRFiction implements iTitle {
  $rc!: Cheerio & Root // Rankings Page Cheery
  $ic!: Cheerio & Root // Index Page Cheery

  // Access these only after calling build
  index!: Index<FictionChapter>

  platform: mUrl = 'https://www.royalroad.com'

  title!: string
  constructor($rc: Cheerio & Root) {
    this.$rc = $rc

    this.title = this.getTitle()
  }

  static PageToFictions($: Cheerio & Root): Array<Cheerio & Root> {
    const $rcs: Array<Root & Cheerio> = []
    $('div.fiction-list-item.row').each((_idx, e) => {
      $rcs.push(cheerio.load(e))
    })
    return $rcs
  }

  async Init($rc: Cheerio & Root): Promise<void> {
    this.$rc = $rc
    this.$ic = await UrlToCherry(this.getIcUrl())
  }

  build(): void {
    try {
      debug && console.log(`Beginning build for index of ${this.getTitle()}...`)
      const index: Index<FictionChapter> = {
        title: this.getTitle(),
        author: this.getAuthor(),

        contentCount: this.getContentLength(),

        type: 'Fiction',
        ageRating: 'E',
        subscribers: 0,
        ratting: 0,
        views: 0,

        status: this.getStatus(),
        genres: this.getGenres(),
        description: this.getDescription(),

        coverImage: this.getImageUrl(),
        lastUpdated: this.getLastUpdated(),

        scrappedFrom: 'royalroad',
        episodes: this.getChapters()
      }
      this.index = index
    } catch (error) {
      console.error(error)
      Deno.exit(1)
    }
  }

  private getChapters(): FictionChapter[] {
    debug &&
      console.log(`Beginning build for chapters of ${this.getTitle()}...`)

    const fictionChapters: FictionChapter[] = []
    this.$ic('tbody>tr.chapter-row').each((idx, e) => {
      const $ = this.$ic(e)
      const chapter: FictionChapter = {
        index: idx,
        scrapped: false,
        content: '',
        chapterTitle: this.getChapterTitle($),
        lastUploaded: this.getChapterUploadDate($),
        lastScrapped: new Date(),
        scrapeUrl: this.getScrapeUrl($)
      }
      fictionChapters.push(chapter)
    })
    return fictionChapters
  }

  getScrapeUrl($: Cheerio): mUrl {
    const url = $.find('td>a').first().attr('href')
    if (url) {
      return this.platform + url
    }
    throw new Error('getScrapedUrl failed')
  }

  private getChapterUploadDate($: Cheerio): Date {
    const time = $.find('td.text-right>a>time').attr('title')?.trim()
    if (time) {
      return new Date(time)
    }
    throw new Error('getChapterUploadDate Failed')
  }

  private getChapterTitle($: Cheerio): string {
    const title = $.find('td:not(.text-right)>a').text().trim()
    if (title) {
      return title
    }
    throw new Error('getChapterTitleFailed')
  }

  private getImageUrl(): mUrl {
    const url = this.$rc('img.img-responsive').attr('src')?.trim()
    if (url) {
      return url
    }
    throw new Error('getImageUrl failed')
  }

  private getLastUpdated(): Date {
    const time = this.$ic('tr').length
    if (time) {
      return new Date(time)
    }
    throw new Error('getLastUpdated Failed')
  }

  private getDescription(): string {
    const description = this.$ic('div[property*="description"]').text().trim()
    if (description) {
      return description
    }
    return ''
  }

  private getGenres(): string[] {
    const genres: string[] = []
    this.$ic('span.tags>a').each((_idx, e) => {
      const tag = this.$ic(e).text().trim()
      genres.push(tag)
    })
    return genres
  }

  private getStatus(): 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' {
    const status = this.$ic('span.label.label-default.label-sm.bg-blue-hoki')
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
      throw new Error('getStatus failed')
    }
  }

  private getAuthor(): string | undefined {
    const author = this.$ic('h4>span>a').text().trim()
    if (author) {
      return author
    }
    throw new Error('getAuthor Failed')
  }

  private getTitle(): string {
    const title = this.$rc('div>h2>a').text().trim()
    if (title) {
      return title
    }
    throw new Error('getTitle Failed')
  }

  private getIcUrl(): string {
    const fictionRelativePath = this.$rc('div>h2>a').attr('href')?.trim()
    if (fictionRelativePath) {
      const fullUrl = this.platform + fictionRelativePath
      return fullUrl
    }
    throw new Error('getIcUrl failed')
  }

  private getContentLength(): number {
    const length = this.$ic('tr').length
    if (!Number.isNaN(length) && length > 0) {
      return length
    }
    throw new Error('getContentLength failed')
  }

  static PageExists($: Cheerio & Root): boolean {
    if ($('div>h3').text().includes('There is nothing here')) {
      return false
    }
    return true
  }
}

import { Fiction } from '@types'
import { cheerio, Cheerio, Root } from '@deps'
import { urlToCheery } from '@util'
import { BaseFiction, BaseScrapper } from './base-fiction.ts'

// Undone
const headers = new Headers()
headers.append(
  'cookie',
  'cf_chl_2=f3301834156b793; cf_chl_prog=x12; cf_clearance=Dhf7kSgg5ZIOKHYvxejuVm4QqNxGPjq3EKdRddIbKas-1649330134-0-150; fsbotchecked=true; __cf_bm=rUobmqJaJnogqya3.3.Yw4V2.I0Xlbt.udI0JPblQ.E-1649330135-0-AdMcgk1d1IDoWaAmbtOctytOrJscRu0CueP2giByL3TYCgOwD1tNemvNmwD/VattIYZ1UPyVeLp9maD4aLAt4insS4rFg6SNsVjgNS55ZVT0sRQvMVkSwLoMYO2jRdtKYw==; _ga_KTGYXQDRG9=GS1.1.1649329301.1.1.1649330134.0; _ga=GA1.2.1858725555.1649330135; _gid=GA1.2.932430250.1649330135; _gat_gtag_UA_997028_13=1; _fssid=04774427-d3ce-4477-b924-fa649f246c3a; _pbjs_userid_consent_data=3524755945110770; _pubcid=5d7848e7-7e77-4da0-80e1-f4f1a6a5ccb0; cto_bidid=rSNLo19iTlRjR2t5VUI5YmxTaEh0ZFJLc0Z6RDNpbVZ5aDdBUXEybVZQSWV4eEdSMzZjb1BPMlNwd3N0JTJCVE4yekFXeHJIUUpjb25yZHdkNHN5NVFOZzhFR05UeVp5Yjl6VHRickU2Nk9WM05Vc1N1SFByME1RazBlT1JmJTJCYyUyRiUyRnVNR3hP; cto_bundle=jpnQGl9lV0VEbDVRU0hjUTNjYXJPeGJ6bG1jcEhIVSUyQkQ3TDJJWndmaUpZaTRXd2MyU1lESzBBZEJmS0FuRFF2ZWVLUmEwZ0I0N2IlMkJTUGJFb0l1dG9rNURWZm1SSndMZSUyQjhlc2tEeDRid2VNUTR4emk5M0RGMlhqT2ZEbVJ3eGRoQnlkVUZUTUVlczZtVnBCZTFDNkVoSXl3N3clM0QlM0Q; _lr_retry_request=true; _lr_env_src_ats=false; panoramaId_expiry=1649416541740; cookie={}'
)
headers.append(
  'user-agent',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.60 Safari/537.36'
)

export class LightNovelPub extends BaseScrapper {
  public get platform(): string {
    return 'LightNovelPub'
  }

  constructor(limit: number) {
    super(limit)
  }

  async *runIndexer() {
    for (let i = 1; i <= this.limit; i++) {
      const $ = await urlToCheery(
        `https://www.lightnovelpub.com/genre/all/popular/all/${i}`,
        headers
      )
      if (!$ || !this.hasContent($)) return

      const fictions: LightNovelPubFiction[] = []

      $('li.novel-item').each((_, e) => {
        const fiction = new LightNovelPubFiction(cheerio.load(e))
        fictions.push(fiction)
      })

      for (const fiction of fictions) {
        yield fiction
      }
    }
  }

  private hasContent($: Cheerio & Root): boolean {
    return $('main>article>ul>li').length > 0
  }
}

class LightNovelPubFiction extends BaseFiction {
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

  public async getFiction(): Promise<Fiction | never> {
    if (this._isInitialized) return this._fiction
    await this.initialize()
    return this._fiction
  }
  private async initialize(): Promise<void | never> {
    this._isInitialized = true

    const fictionURL = this.getFictionUrl()
    const _temp = await urlToCheery(fictionURL.href, headers)
    if (!_temp) throw new Error(`Cannot fetch main page of ${this.title}`)
    this.i$ = _temp
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
    const views = this.i$("small:contains('Views')")
      .parent()
      .text()
      .trim()
      .replace('.', '')
      .replace('Views', '')
      .replace('K', '000')
      .replace('M', '000000')

    const viewsAsNumber = Number(views)
    if (isNaN(viewsAsNumber)) throw new Error('Cannot get views')
    return viewsAsNumber
  }
  private getSubs(): number | never {
    const subs = this.i$("small:contains('Bookmarked')")
      .parent()
      .text()
      .trim()
      .replace('.', '')
      .replace('Bookmarked', '')
      .replace('K', '000')
      .replace('M', '000000')

    const subsAsNumber = Number(subs)
    if (isNaN(subsAsNumber)) throw new Error('Cannot get views')
    return subsAsNumber
  }
  private getDescription(): string[] | never {
    const description = this.i$('div.content').text().trim().split('\n')
    if (!description) throw new Error('Cannot get description')
    return description
  }
  private getStatus(): 'completed' | 'hiatus' | 'ongoing' | 'stub' | 'dropped' | never {
    const status = this.i$("small:contains('Status')")
      .prev()
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
  private getOffenses(): { offenses: string[] } | never {
    const offenses: string[] = []
    if (this.getGenres().includes('mature')) offenses.push('mature')
    return { offenses }
  }
  private hasWarning(): boolean {
    return this.getGenres().includes('mature')
  }
  private getGenres(): string[] | never {
    const genres: string[] = []

    this.i$('div.categories>ul>li>a').each((idx, e) => {
      genres.push(this.i$(e).text().trim().toLowerCase())
    })

    if (genres.length === 0) throw new Error('Cannot get genres')
    return genres
  }
  private getAuthor(): string | never {
    const author = this.i$('span[itemprop=author]').text().trim()
    if (!author) throw new Error('Cannot get author')
    return author
  }
  private getFictionUrl(): URL | never {
    const slug = this.r$.find('a').attr('href')
    if (!slug) throw new Error(`Error while getting URL to fiction`)
    return new URL(`https://www.lightnovelpub.com${slug}`)
  }
}

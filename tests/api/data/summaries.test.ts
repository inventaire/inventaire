import should from 'should'
import { redirectionBadges } from '#controllers/data/lib/summaries/sitelinks'
import { createEdition, createHuman, existsOrCreate } from '#fixtures/entities'
import { normalizeIsbn } from '#lib/isbn/isbn'
import { requests_ } from '#lib/requests'
import { someMatch } from '#lib/utils/base'
import { getByUri } from '#tests/api/utils/entities'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import type { SerializedWdEntity } from '#types/entity'

const endpoint = '/api/data?action=summaries'

describe('summaries', () => {
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
    })
  })

  describe('openlibrary', () => {
    const property = 'wdt:P648'
    it('should return summaries', async () => {
      const olId = 'OL45804W'
      const work = await existsOrCreate({
        claims: {
          [property]: [ olId ],
        },
      })
      const { uri } = work
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.key.should.equal(property)
      summaryData.text.should.startWith('The main character')
      summaryData.claim.id.should.equal(olId)
      summaryData.claim.property.should.equal(property)
      summaryData.name.should.equal('OpenLibrary')
      summaryData.link.should.equal(`https://openlibrary.org/works/${olId}`)
      summaryData.lang.should.equal('en')
    })

    it('should detect summary language', async () => {
      const olId = 'OL40222382M'
      const work = await existsOrCreate({
        createFn: createEdition,
        claims: {

          [property]: [ olId ],
        },
      })
      const { uri } = work
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.lang.should.equal('fr')
    })

    it('should return empty summaries when no description is provided', async () => {
      const olId = 'OL4104668W'
      const work = await existsOrCreate({
        claims: {
          [property]: [ olId ],
        },
      })
      const { uri } = work
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      if (summaryData) {
        const url = `https://openlibrary.org/works/${olId}.json`
        const { description } = await requests_.get(url, { timeout: 10 * 1000 })
        if (description) {
          throw new Error(`This test is obsolete: the OpenLibrary response contains a description (${olId})`)
        }
      }
      should(summaryData).not.be.ok()
    })

    it('should return a summary when a bio is available', async () => {
      const olId = 'OL25712A'
      const human = await existsOrCreate({
        createFn: createHuman,
        claims: {
          [property]: [ olId ],
        },
      })
      const { uri } = human
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.text.should.containEql('Pratchett')
    })

    it('should find summaries by ISBN', async () => {
      const isbn = '978-1-59184-233-0'
      const property = 'wdt:P212'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          [property]: [ isbn ],
        },
      })
      const { uri } = edition
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === 'wdt:P212:openlibrary')
      summaryData.key.should.equal('wdt:P212:openlibrary')
      summaryData.text.should.startWith('According to Godin')
      summaryData.claim.id.should.equal(isbn)
      summaryData.claim.property.should.equal(property)
      summaryData.name.should.equal('OpenLibrary')
      summaryData.link.should.equal(`https://openlibrary.org/isbn/${normalizeIsbn(isbn)}`)
      summaryData.lang.should.equal('en')
    })

    it('should ignore unknown ISBNs', async () => {
      const isbn = '978-99993-999-9-9'
      const property = 'wdt:P212'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          [property]: [ isbn ],
        },
      })
      const { uri } = edition
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      summaries.length.should.equal(0)
    })
  })

  describe('bnf', () => {
    const property = 'wdt:P268'
    it('should return summaries', async () => {
      const bnfId = '458412245'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          [property]: [ bnfId ],
        },
      })
      const { uri } = edition
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      summaryData.key.should.equal(property)
      summaryData.claim.property.should.equal(property)
      summaryData.claim.id.should.equal(bnfId)
      summaryData.name.should.equal('BNF')
      summaryData.text.startsWith("C'est au beau milieu de la steppe")
      summaryData.link.should.equal('https://catalogue.bnf.fr/ark:/12148/cb458412245')
      summaryData.lang.should.equal('fr')
    })

    it('should not return a summary when none exists', async () => {
      const invalidBnfId = '00004444z'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          [property]: [ invalidBnfId ],
        },
      })
      const { uri } = edition
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = summaries.find(summaryData => summaryData.key === property)
      should(summaryData).not.be.ok()
    })
  })

  describe('wikipedia', () => {
    it('should return a reference to an available wikipedia article', async () => {
      const uri = 'wd:Q4980986'
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const svwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'svwiki')
      const enwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'enwiki')
      svwikiSitelinkData.should.deepEqual({
        key: 'svwiki',
        lang: 'sv',
        name: 'Wikipedia (sv)',
        link: 'https://sv.wikipedia.org/wiki/Liv_Str%C3%B6mquist',
        sitelink: {
          title: 'Liv Strömquist',
          lang: 'sv',
        },
      })
      enwikiSitelinkData.should.deepEqual({
        key: 'enwiki',
        lang: 'en',
        name: 'Wikipedia (en)',
        link: 'https://en.wikipedia.org/wiki/Liv_Str%C3%B6mquist',
        sitelink: {
          title: 'Liv Strömquist',
          lang: 'en',
        },
      })
    })

    it('should ignore sitelinks that are redirections', async () => {
      const uri = 'wd:Q3020076'
      const entity = (await getByUri(uri)) as SerializedWdEntity
      const badges = entity.sitelinks.frwiki?.badges
      if (!(badges && someMatch(badges, redirectionBadges))) {
        throw new Error('Obsolete test: this test depends on the fact that wd:Q3020076 frwiki sitelink has a Q70894304 badge')
      }
      const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}`)
      const frwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'frwiki')
      should(frwikiSitelinkData).not.be.ok()
    })
  })

  it('should return a tailored subset when passed langs parameters', async () => {
    const uri = 'wd:Q4980986'
    const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}&langs=sv|de`)
    const svwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'svwiki')
    const dewikiSitelinkData = summaries.find(summaryData => summaryData.key === 'dewiki')
    const enwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'enwiki')
    svwikiSitelinkData.should.be.ok()
    dewikiSitelinkData.should.be.ok()
    should(enwikiSitelinkData).not.be.ok()
  })

  it('should accept wikimedia language codes', async () => {
    const uri = 'wd:Q25338'
    const { summaries } = await publicReq('get', `${endpoint}&uri=${uri}&langs=dsb`)
    const dsbwikiSitelinkData = summaries.find(summaryData => summaryData.key === 'dsbwiki')
    dsbwikiSitelinkData.should.be.ok()
  })
})

const should = require('should')
const { createWork, createEdition, createHuman } = require('tests/api/fixtures/entities')
const { getByUri } = require('tests/api/utils/entities')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const requests_ = require('lib/requests')
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
    it('should return summaries', async () => {
      const olId = 'OL45883W'
      const property = 'wdt:P648'
      const work = await existsOrCreate({
        claims: {
          [property]: [ olId ]
        }
      })
      const { uri } = work
      const res = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = res.summaries[property]
      summaryData.text.should.startWith('The main character')
      summaryData.id.should.equal(olId)
      summaryData.property.should.equal(property)
      summaryData.source.should.equal('OpenLibrary')
      summaryData.link.should.equal(`https://openlibrary.org/works/${olId}`)
      summaryData.lang.should.equal('en')
    })

    it('should return empty summaries when no description is provided', async () => {
      const olId = 'OL4104668W'
      const work = await existsOrCreate({
        claims: {
          'wdt:P648': [ olId ]
        }
      })
      const { uri } = work
      const res = await publicReq('get', `${endpoint}&uri=${uri}`)
      Object.keys(res.summaries).should.not.containEql('wdt:P648')

      if (res.summaries['wdt:P648']) {
        const url = `https://openlibrary.org/works/${olId}.json`
        const { description } = await requests_.get(url, { timeout: 10 * 1000 })
        if (description) {
          throw new Error(`This test is obsolete: the OpenLibrary response contains a description (${olId})`)
        }
      }
    })

    it('should return a summary when a bio is available', async () => {
      const olId = 'OL25712A'
      const human = await existsOrCreate({
        createFn: createHuman,
        claims: {
          'wdt:P648': [ olId ]
        }
      })
      const { uri } = human
      const res = await publicReq('get', `${endpoint}&uri=${uri}`)
      res.summaries['wdt:P648'].text.should.containEql('Pratchett')
    })
  })

  describe('bnf', () => {
    it('should return summaries', async () => {
      const bnfId = '458412245'
      const property = 'wdt:P268'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          'wdt:P268': [ bnfId ]
        }
      })
      const { uri } = edition
      const res = await publicReq('get', `${endpoint}&uri=${uri}`)
      const summaryData = res.summaries[property]
      summaryData.property.should.equal(property)
      summaryData.id.should.equal(bnfId)
      summaryData.source.should.equal('BNF')
      summaryData.text.startsWith("C'est au beau milieu de la steppe")
      summaryData.link.should.equal('https://catalogue.bnf.fr/ark:/12148/cb458412245')
      summaryData.lang.should.equal('fr')
    })

    it('should not return a summary when none exists', async () => {
      const invalidBnfId = '00004444z'
      const edition = await existsOrCreate({
        createFn: createEdition,
        claims: {
          'wdt:P268': [ invalidBnfId ]
        }
      })
      const { uri } = edition
      const res = await publicReq('get', `${endpoint}&uri=${uri}`)
      should(res.summaries['wdt:P268']).not.be.ok()
    })
  })
})

const existsOrCreate = async ({ claims, createFn = createWork }) => {
  try {
    const entity = await createFn({ claims })
    return entity
  } catch (err) {
    const existingEntityUri = err.body.context.entity
    return getByUri(existingEntityUri)
  }
}

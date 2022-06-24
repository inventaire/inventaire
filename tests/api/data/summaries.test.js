require('should')
const { createWork } = require('tests/api/fixtures/entities')
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

  it('should return summaries', async () => {
    const work = await existsOrCreate({
      claims: {
        'wdt:P648': [ 'OL45883W' ]
      }
    })
    const { uri } = work
    const res = await publicReq('get', `${endpoint}&uri=${uri}`)
    res.summaries['wdt:P648'].text.startsWith('The main character')
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
        throw new Error(`This test is obsolete: the Openlibrary response contains a description (${olId})`)
      }
    }
  })
})

const existsOrCreate = async ({ claims }) => {
  try {
    const work = await createWork({ claims })
    return work
  } catch (err) {
    const existingEntityUri = err.body.context.entity
    return getByUri(existingEntityUri)
  }
}

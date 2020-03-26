const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { authReq } = __.require('apiTests', 'utils/utils')

const resolveCreateAndEnrich = (entry, enrich) => {
  const data = {
    entries: [ entry ],
    create: true
  }
  if (enrich != null) data.enrich = enrich
  return authReq('post', '/api/entities?action=resolve', data)
}

// Those tests should be activated and run alone from an empty database (with `npm run api-tests`)
// after having started a dataseed service and set CONFIG.dataseed.enabled = true
describe('entities:resolve:create-and-enrich', () => {
  xit('should be off by default', async () => {
    // An image is expected to be found by dataseed for this isbn
    const isbn = '9782070368228'
    const { entries } = await resolveCreateAndEnrich({
      edition: { isbn },
      works: [ { labels: { fr: '1984' } } ]
    })
    const { edition } = entries[0]
    edition.isbn.should.equal(isbn)
    edition.resolved.should.be.false()
    edition.created.should.be.true()
    should(edition.claims['invp:P2']).not.be.ok()
  })

  xit('should create an edition with an image', async () => {
    // An image is expected to be found by dataseed for this isbn
    const isbn = '9782070375165'
    const { entries } = await resolveCreateAndEnrich({
      edition: { isbn },
      works: [ { labels: { fr: 'La Ferme des animaux' } } ]
    }, true)
    const { edition } = entries[0]
    edition.isbn.should.equal(isbn)
    edition.resolved.should.be.false()
    edition.created.should.be.true()
    should(edition.claims['invp:P2']).be.ok()
  })
})

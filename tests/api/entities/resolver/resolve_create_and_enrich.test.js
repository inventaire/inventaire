const should = require('should')
const { authReq } = require('tests/api/utils/utils')
const { deleteByUris } = require('tests/api/utils/entities')

// Those tests should be activated and run alone from an empty database (with `npm run api-tests`)
// after having started a dataseed service and set CONFIG.dataseed.enabled = true
describe('entities:resolve:create-and-enrich', () => {
  xit('should be off by default', async () => {
    // An image is expected to be found by dataseed for this isbn
    const isbn = '9782070368228'
    const edition = await resolveCreateAndEnrichEdition({
      edition: { isbn },
      works: [ { labels: { fr: '1984' } } ]
    })
    edition.isbn.should.equal(isbn)
    should(edition.claims['invp:P2']).not.be.ok()
    // Delete the created edition so that the next time this test runs,
    // it has to create the edition again
    await deleteByUris(edition.uri)
  })

  xit('should create an edition with an image', async () => {
    // An image is expected to be found by dataseed for this isbn
    const isbn = '9782070375165'
    const edition = await resolveCreateAndEnrichEdition({
      edition: { isbn },
      works: [ { labels: { fr: 'La Ferme des animaux' } } ]
    }, true)
    edition.isbn.should.equal(isbn)
    should(edition.claims['invp:P2']).be.ok()
    // Delete the created edition so that the next time this test runs,
    // it has to create the edition again
    await deleteByUris(edition.uri)
  })

  it('should not crash if no isbn is set', async () => {
    const edition = await resolveCreateAndEnrichEdition({
      edition: {
        claims: {
          'wdt:P1476': [ 'The Phantom Castle' ],
          // This is a valid entry, as it as an external id
          'wdt:P2969': [ '32687007' ]
        }
      }
    }, true)

    // Delete the created edition so that the next time this test runs,
    // it has to create the edition again
    await deleteByUris(edition.uri)
  })
})

const resolveCreateAndEnrichEdition = async (entry, enrich) => {
  return resolveCreateAndEnrich(entry, enrich)
  .then(parseCreatedEdition)
}

const resolveCreateAndEnrich = async (entry, enrich) => {
  const data = {
    entries: [ entry ],
    create: true
  }
  if (enrich != null) data.enrich = enrich
  return authReq('post', '/api/entities?action=resolve', data)
}

const parseCreatedEdition = ({ entries }) => {
  const { edition } = entries[0]
  // If it was resolved, we aren't testing the enriched path
  // If the test fails because of this, re-run from empty databases
  if (edition.resolved) {
    throw new Error(`the edition was resolved to ${edition.uri}, meaning that we aren't testing the enrich path
      re-running the test with empty databases should fix this`)
  }
  edition.resolved.should.be.false()
  edition.created.should.be.true()
  return edition
}

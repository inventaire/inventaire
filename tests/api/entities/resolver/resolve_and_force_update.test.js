const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { Wait } = __.require('lib', 'promises')
const { getByUris, addClaim } = __.require('apiTests', 'utils/entities')
const { createHuman, ensureEditionExists, someGoodReadsId, generateIsbn13 } = __.require('apiTests', 'fixtures/entities')

const buildEditionEntry = (isbn = generateIsbn13()) => {
  const claims = { 'wdt:P123': 'wd:Q1799264' }
  return {
    edition: {
      isbn,
      claims
    }
  }
}

const resolveAndForceUpdate = (entries, props) => {
  entries = _.forceArray(entries)
  return authReq('post', '/api/entities?action=resolve', {
    entries,
    update: true,
    forceUpdateProps: props
  })
}

describe('entities:resolver:force-update-resolved', () => {
  it('should reject when properties to force update are unknown', async () => {
    const propertiesToForce = [ 'wdt:P6' ]
    const editionEntry = buildEditionEntry()
    const isbn = editionEntry.edition.isbn
    const editionUri = `isbn:${isbn}`
    await ensureEditionExists(editionUri)

    try {
      const res = await resolveAndForceUpdate(editionEntry, propertiesToForce)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid forceUpdateProps')
    }
  })

  it('should replace edition claim values when properties to force is specified', async () => {
    const editionEntry = buildEditionEntry()
    const editionUri = `isbn:${editionEntry.edition.isbn}`
    await ensureEditionExists(editionUri)

    const propertiesToForce = [ 'wdt:P123' ]
    await resolveAndForceUpdate(editionEntry, propertiesToForce)
    .then(Wait(100))
    const res = await getByUris(editionUri)
    const updatedEdition = res.entities[editionUri]
    updatedEdition.claims['wdt:P123'].should.containEql(editionEntry.edition.claims['wdt:P123'])
  })

  it('should update authors claims', async () => {
    // necessary id to resolve author
    const goodReadsId = someGoodReadsId()
    const currentOfficialWebsite = 'http://notOfficial.org'
    const officialWebsite = 'http://Q35802.org'
    const entry = {
      edition: { isbn: generateIsbn13() },
      authors: [ {
        claims: {
          'wdt:P2963': [ goodReadsId ],
          'wdt:P856': [ officialWebsite ]
        }
      } ]
    }
    const human = await createHuman()
    await addClaim(human.uri, 'wdt:P2963', goodReadsId)
    await addClaim(human.uri, 'wdt:P856', currentOfficialWebsite)

    const propertiesToForce = [ 'wdt:P856' ]
    const { entries } = await resolveAndForceUpdate(entry, propertiesToForce)
    .then(Wait(100))

    const authorUri = entries[0].authors[0].uri
    const { entities } = await getByUris(authorUri)
    const updatedAuthor = entities[authorUri]
    updatedAuthor.claims['wdt:P856'].should.containEql(officialWebsite)
  })
})

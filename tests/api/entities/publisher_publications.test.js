require('should')
const { nonAuthReq, undesiredRes } = require('../utils/utils')
const { createEdition, createEditionWithIsbn, createCollection, createPublisher } = require('../fixtures/entities')
const { addClaim } = require('../utils/entities')
const endpoint = '/api/entities?action=publisher-publications'

describe('entities:publisher-publications', () => {
  it('should reject without uri', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
      done()
    })
    .catch(done)
  })

  it('should get an inventaire publisher collection', async () => {
    const { uri: publisherUri } = await createPublisher()
    const collection = await createCollection({
      claims: {
        'wdt:P123': [ publisherUri ]
      }
    })
    const { collections } = await nonAuthReq('get', `${endpoint}&uri=${publisherUri}`)
    collections.should.deepEqual([ { uri: collection.uri } ])
  })

  it('should get a publisher publications', async () => {
    const { uri: publisherUri } = await createPublisher()
    const [ editionA, editionB, collection ] = await Promise.all([
      createEdition({ publisher: publisherUri }),
      createEdition({ publisher: publisherUri }),
      createCollection()
    ])
    await Promise.all([
      addClaim(collection.uri, 'wdt:P123', publisherUri),
      addClaim(editionA.uri, 'wdt:P195', collection.uri)
    ])
    const { collections, editions } = await nonAuthReq('get', `${endpoint}&uri=${publisherUri}`)
    collections.should.deepEqual([ { uri: collection.uri } ])
    const editionAEntry = editions.find(entry => entry.uri === editionA.uri)
    const editionBEntry = editions.find(entry => entry.uri === editionB.uri)
    editionAEntry.should.deepEqual({ uri: editionA.uri, collection: collection.uri })
    editionBEntry.should.deepEqual({ uri: editionB.uri })
  })

  it('should order pubication by publication date', async () => {
    const { uri: publisherUri } = await createPublisher()
    const [ editionA, editionB, editionC ] = await Promise.all([
      createEdition({ publisher: publisherUri, publicationDate: '2019' }),
      createEdition({ publisher: publisherUri, publicationDate: '2018-11-12' }),
      // Create an edition with an ISBN to be able to set the publication date
      createEditionWithIsbn({ publisher: publisherUri, publicationDate: null })
    ])
    // Creating at least some milliseconds later
    const editionD = await createEditionWithIsbn({ publisher: publisherUri, publicationDate: null })
    const editionE = await createEdition({ publisher: publisherUri, publicationDate: '2017-05' })
    const { editions } = await nonAuthReq('get', `${endpoint}&uri=${publisherUri}`)
    editions.should.deepEqual([
      { uri: editionE.uri },
      { uri: editionB.uri },
      { uri: editionA.uri },
      { uri: editionC.uri },
      { uri: editionD.uri }
    ])
  })

  it('should get wikidata publisher collections', async () => {
    const { collections, editions } = await nonAuthReq('get', `${endpoint}&uri=wd:Q2823584`)
    editions.should.deepEqual([])
    collections.should.containEql({ uri: 'wd:Q63217733' })
  })
})

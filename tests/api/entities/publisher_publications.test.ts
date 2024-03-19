import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createEdition, createEditionWithIsbn, createCollection, createPublisher } from '../fixtures/entities.js'
import { addClaim } from '../utils/entities.js'
import { publicReq } from '../utils/utils.js'

const endpoint = '/api/entities?action=publisher-publications'

describe('entities:publisher-publications', () => {
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
    })
  })

  it('should get an inventaire publisher collection', async () => {
    const { uri: publisherUri } = await createPublisher()
    const collection = await createCollection({
      claims: {
        'wdt:P123': [ publisherUri ],
      },
    })
    const { collections } = await publicReq('get', `${endpoint}&uri=${publisherUri}`)
    collections.should.deepEqual([ { uri: collection.uri } ])
  })

  it('should get publisher publications', async () => {
    const { uri: publisherUri } = await createPublisher()
    const [ editionA, editionB, collection ] = await Promise.all([
      createEdition({ publisher: publisherUri }),
      createEdition({ publisher: publisherUri }),
      createCollection(),
    ])
    await Promise.all([
      addClaim({ uri: collection.uri, property: 'wdt:P123', value: publisherUri }),
      addClaim({ uri: editionA.uri, property: 'wdt:P195', value: collection.uri }),
    ])
    const { collections, editions } = await publicReq('get', `${endpoint}&uri=${publisherUri}`)
    collections.should.deepEqual([ { uri: collection.uri } ])
    const editionAEntry = editions.find(entry => entry.uri === editionA.uri)
    const editionBEntry = editions.find(entry => entry.uri === editionB.uri)
    editionAEntry.should.deepEqual({ uri: editionA.uri, collection: collection.uri })
    editionBEntry.should.deepEqual({ uri: editionB.uri })
  })

  it('should sort publication by publication date', async () => {
    const { uri: publisher } = await createPublisher()
    const [ editionA, editionB, editionC ] = await Promise.all([
      createEdition({ publisher, publicationDate: '2019' }),
      createEdition({ publisher, publicationDate: '2018-11-12' }),
      // Create an edition with an ISBN to be able to set the publication date
      createEditionWithIsbn({ publisher, publicationDate: null }),
    ])
    // Creating at least some milliseconds later
    const editionD = await createEditionWithIsbn({ publisher, publicationDate: null })
    const editionE = await createEdition({ publisher, publicationDate: '2017-05' })
    const { editions } = await publicReq('get', `${endpoint}&uri=${publisher}`)
    editions.should.deepEqual([
      { uri: editionE.uri },
      { uri: editionB.uri },
      { uri: editionA.uri },
      { uri: editionC.uri },
      { uri: editionD.uri },
    ])
  })

  it('should get wikidata publisher collections', async () => {
    const { collections } = await publicReq('get', `${endpoint}&uri=wd:Q2823584`)
    collections.should.containEql({ uri: 'wd:Q63217733' })
  })
})

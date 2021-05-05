require('should')
const _ = require('builders/utils')
const { publicReq, getUser } = require('../utils/utils')
const { shouldNotBeCalled } = require('tests/unit/utils')
const { createWork, createEdition, createEditionWithIsbn } = require('../fixtures/entities')
const { createItem } = require('../fixtures/items')
const { getRefreshedPopularityByUri } = require('../utils/entities')
const endpoint = '/api/entities?action=work-editions'

describe('entities:work-editions', () => {
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
    })
  })

  it("should get a work's editions uris, langs and scores, sorted by scores", async () => {
    const work = await createWork()
    const editions = await Promise.all([
      createEdition({ work, lang: 'ru' }),
      createEdition({ work, lang: 'ja' }),
      createEditionWithIsbn({ work, lang: 'ar' }),
    ])
    const { uri } = editions[1]
    await createItem(getUser(), { entity: uri })
    await getRefreshedPopularityByUri(uri)
    const res = await publicReq('get', `${endpoint}&uri=${work.uri}`)
    res.editions.should.be.an.Array()
    res.editions.length.should.equal(3)
    res.editions[0].should.deepEqual({
      uri,
      lang: 'ja',
      score: 1
    })
    const otherUris = _.map(res.editions.slice(1), 'uri')
    otherUris.should.containEql(editions[0].uri)
    otherUris.should.containEql(editions[2].uri)
  })
})

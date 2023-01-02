import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { publicReq } from '../utils/utils.js'
import { createWorkWithAuthor, createHuman } from '../fixtures/entities.js'

const workWithAuthorPromise = createWorkWithAuthor()
const endpoint = '/api/entities?action=author-works'

describe('entities:author-works', () => {
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
    })
  })

  it('should return empty lists if no work on author', async () => {
    const author = await createHuman()
    const res = await publicReq('get', `${endpoint}&uri=${author.uri}`)
    res.series.should.be.an.Array()
    res.works.should.be.an.Array()
    res.articles.should.be.an.Array()
  })

  it('should get an authors works', async () => {
    const work = await workWithAuthorPromise
    const authorUri = work.claims['wdt:P50'][0]
    const res = await publicReq('get', `${endpoint}&uri=${authorUri}`)
    res.works[0].should.be.an.Object()
    res.works[0].uri.should.equal(`inv:${work._id}`)
  })
})

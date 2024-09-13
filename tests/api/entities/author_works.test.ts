import 'should'
import { createWorkWithAuthor, createHuman, createWorkWithSpecificRoleAuthor } from '#fixtures/entities'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

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

  it("should get an author's inv works", async () => {
    const work = await createWorkWithAuthor()
    const authorUri = work.claims['wdt:P50'][0]
    const res = await publicReq('get', `${endpoint}&uri=${authorUri}`)
    res.works[0].should.be.an.Object()
    res.works[0].uri.should.equal(work.uri)
  })

  it("should get an author's inv works, where they have a custom role", async () => {
    const roleProperty = 'wdt:P110'
    const { work, human } = await createWorkWithSpecificRoleAuthor({ roleProperty })
    const res = await publicReq('get', `${endpoint}&uri=${human.uri}`)
    res.works[0].uri.should.equal(work.uri)
  })
})

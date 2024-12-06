import 'should'
import { createWorkWithAuthorAndSerie } from '#fixtures/entities'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

let workWithSeriePromise
const endpoint = '/api/entities?action=serie-parts'

describe('entities:serie-parts', () => {
  before(() => {
    workWithSeriePromise = createWorkWithAuthorAndSerie()
  })
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
    })
  })

  it('should get an authors works', async () => {
    const work = await workWithSeriePromise
    const serieUri = work.claims['wdt:P179'][0]
    const res = await publicReq('get', `${endpoint}&uri=${serieUri}`)
    res.parts.should.be.an.Array()
    res.parts[0].should.be.an.Object()
    res.parts[0].uri.should.equal(`inv:${work._id}`)
  })
})

import { createWork } from '#fixtures/entities'
import { federatedMode, remoteEntitiesOrigin } from '#server/config'
import { updateLabel } from '#tests/api/utils/entities'
import { rawRequest } from '#tests/api/utils/request'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('entities:federated mode', () => {
  before(function () { if (!federatedMode) this.skip() })

  it('should close endpoints not yet implemented in federated mode', async () => {
    await authReq('put', '/api/entities?action=revert-merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('This endpoint is closed in federated mode')
    })
  })

  describe('proxied requests', () => {
    // xitted, as it's not actually testing if the request between
    // the remote entities origin and the federated server was also a 304
    xit("should return a 304 if the response didn't change", async () => {
      const work = await createWork()
      const res1 = await rawRequest('get', `${remoteEntitiesOrigin}/api/entities?action=by-uris&uris=${work.uri}`)
      res1.statusCode.should.equal(200)
      res1.body.should.containEql(work.uri)
      const { etag } = res1.headers
      const res2 = await rawRequest('get', `/api/entities?action=by-uris&uris=${work.uri}`, {
        headers: {
          'if-none-match': etag,
        },
      })
      res2.statusCode.should.equal(304)
      res2.body.should.equal('')
    })

    it('should return a 200 if the response changed', async () => {
      const work = await createWork()
      const res1 = await rawRequest('get', `${remoteEntitiesOrigin}/api/entities?action=by-uris&uris=${work.uri}`)
      res1.statusCode.should.equal(200)
      res1.body.should.containEql(work.uri)
      await updateLabel({ uri: work.uri, lang: 'nl', value: 'foo' })
      const { etag } = res1.headers
      const res2 = await rawRequest('get', `/api/entities?action=by-uris&uris=${work.uri}`, {
        headers: {
          'if-none-match': etag,
        },
      })
      res2.statusCode.should.equal(200)
      res2.body.should.containEql(work.uri)
    })
  })
})

import 'should'
import { requests_ } from '#lib/requests'
import type { AbsoluteUrl } from '#server/types/common'
import { startGenericMockServer } from '#tests/integration/utils/mock_server'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const startMockServer = async () => {
  const { port, host, origin } = await startGenericMockServer(app => {
    app.all('/test', (req, res) => {
      res.json({ ok: true, data: req.body })
    })
    app.all('/busy', (req, res) => {
      res.set('retry-after', '5')
      res.status(429)
      res.end()
    })
  })
  return {
    port,
    host,
    origin,
    endpoint: `${origin}/test` as AbsoluteUrl,
    busyEndpoint: `${origin}/busy` as AbsoluteUrl,
  }
}

describe('requests', async () => {
  const { endpoint, busyEndpoint } = await startMockServer()

  describe('methods', () => {
    it('should make a GET request', async () => {
      const { ok } = await requests_.get(endpoint)
      ok.should.be.true()
    })

    it('should make a POST request', async () => {
      const body = { foo: 123 }
      const { ok, data } = await requests_.post(endpoint, { body })
      ok.should.be.true()
      data.should.deepEqual(body)
    })

    it('should make a PUT request', async () => {
      const body = { foo: 123 }
      const { ok, data } = await requests_.put(endpoint, { body })
      ok.should.be.true()
      data.should.deepEqual(body)
    })

    it('should make a DELETE request', async () => {
      const { ok } = await requests_.delete(endpoint)
      ok.should.be.true()
    })

    it('should make a HEAD request', async () => {
      const { statusCode, headers } = await requests_.head(endpoint)
      statusCode.should.equal(200)
      headers['content-type'].should.be.a.String()
    })

    it('should make an OPTIONS request', async () => {
      const { ok } = await requests_.options(endpoint)
      ok.should.be.true()
    })
  })

  describe('errors', () => {
    it('should return 429 errors with parsed retry-after header', async () => {
      await requests_.get(busyEndpoint)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(429)
        err.retryAfter.should.equal(5)
      })
    })
  })
})

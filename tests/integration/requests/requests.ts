import 'should'
import { requests_ } from '#lib/requests'
import { startGenericMockServer } from '#tests/integration/utils/mock_server'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import type { AbsoluteUrl } from '#types/common'

const startMockServer = async () => {
  const { port, host, origin } = await startGenericMockServer(app => {
    app.all('/test', (req, res) => {
      res.json({ ok: true, data: req.body })
    })
    let requestsCount = 0
    app.all('/busy', (req, res) => {
      requestsCount++
      if (requestsCount % 3 === 0) {
        res.json({ ok: true })
      } else {
        res.set('retry-after', '1')
        res.status(429)
        res.end()
      }
    })
    app.all('/hangup', (req, res) => {
      res.destroy(new Error('ECONNRESET'))
    })
  })
  return {
    port,
    host,
    origin,
    endpoint: `${origin}/test` as AbsoluteUrl,
    busyEndpoint: `${origin}/busy` as AbsoluteUrl,
    hangupEndpoint: `${origin}/hangup` as AbsoluteUrl,
  }
}

describe('requests', async () => {
  const { endpoint, busyEndpoint, hangupEndpoint } = await startMockServer()

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
    it('should retry on 429 errors', async () => {
      const { ok } = await requests_.get(busyEndpoint)
      ok.should.be.true()
    })

    it('should include the url in error context when hitting ECONNREFUSED', async () => {
      const someOfflineOrigin = 'http://localhost:48765'
      await requests_.post(someOfflineOrigin)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.code.should.equal('ECONNREFUSED')
        err.context.url.should.equal(someOfflineOrigin)
      })
    })

    it('should include the url in error context when hitting ECONNRESET', async () => {
      await requests_.post(hangupEndpoint, { noRetry: true })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.code.should.equal('ECONNRESET')
        err.context.url.should.equal(hangupEndpoint)
      })
    })

    it('should include the url in error context when hitting ECONNRESET and retrying', async () => {
      await requests_.post(hangupEndpoint)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.code.should.equal('ECONNRESET')
        err.context.url.should.equal(hangupEndpoint)
      })
    })
  })
})

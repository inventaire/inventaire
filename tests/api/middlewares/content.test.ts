import 'should'
import fetch from 'node-fetch'
import config from '#server/config'
import { waitForTestServer } from '#tests/api/utils/request'

const origin = config.getLocalOrigin()

describe('content', () => {
  describe('body-parser', () => {
    it('should accept JSON with application/json content-type', async () => {
      await makeRequest('application/json')
    })

    it('should accept JSON with application/csp-report content-type', async () => {
      await makeRequest('application/csp-report')
    })

    it('should accept JSON with application/x-www-form-urlencoded content-type', async () => {
      await makeRequest('application/x-www-form-urlencoded')
    })

    it('should reject url encoded bodies', async () => {
      await waitForTestServer
      const res = await fetch(`${origin}/api/tests`, {
        method: 'POST',
        body: 'bla=123',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      })
      res.status.should.equal(400)
      const body = await res.json()
      body.status_verbose.should.equal('invalid JSON body')
    })
  })

  it('should make an exception for /api/submit', async () => {
    await waitForTestServer
    const res = await fetch(`${origin}/api/submit?redirect=foo`, {
      method: 'POST',
      body: 'bla=123',
      redirect: 'manual',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    })
    res.headers.get('location').should.equal(`${origin}/foo`)
    res.status.should.equal(302)
  })
})

const makeRequest = async contentType => {
  await waitForTestServer
  const res = await fetch(`${origin}/api/tests`, {
    method: 'POST',
    body: JSON.stringify({ bla: 123 }),
    headers: {
      'content-type': contentType,
    },
  })
  res.status.should.equal(200)
  const body = await res.json()
  body.body.bla.should.equal(123)
}

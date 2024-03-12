import 'should'
import fetch from 'node-fetch'
import config from '#server/config'

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
})

const makeRequest = async contentType => {
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

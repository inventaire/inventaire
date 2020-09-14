const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const express = require('express')
const requests_ = __.require('lib', 'requests')
const { wait } = __.require('lib', 'promises')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { baseBanTime } = require('config').outgoingRequests
let port = 38463

const startTimeoutServer = () => new Promise(resolve => {
  port++
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`
  // Always timeout
  app.get('/*', () => {})
  app.listen(port, () => resolve({ port, host, origin }))
})

describe('requests', () => {
  describe('timeout', async () => {
    it('should timeout after the specified time', async () => {
      const { origin } = await startTimeoutServer()
      try {
        await requests_.get(origin, { timeout: 100 }).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.type.should.equal('request-timeout')
      }
    })

    it('should not re-request a host that just had a timeout', async () => {
      const { origin, host } = await startTimeoutServer()
      await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
      try {
        await requests_.get(origin, { timeout: 100 }).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.equal('temporary ban')
        err.context.host.should.equal(host)
      }
    })

    it('should retry after expiration of the ban', async () => {
      const { origin } = await startTimeoutServer()
      await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
      await requests_.get(origin, { timeout: 100 }).catch(err => err.message.should.equal('temporary ban'))
      await wait(baseBanTime + 100)
      try {
        await requests_.get(origin, { timeout: 100 }).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.type.should.equal('request-timeout')
      }
    })
  })
})

const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
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
        const { banTime, expire } = err.context.timeoutData
        banTime.should.equal(baseBanTime)
        should(expire > Date.now() && expire < Date.now() + baseBanTime).be.true()
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

    it('should keep timeout data for the whole host', async () => {
      const { origin } = await startTimeoutServer()
      await requests_.get(`${origin}/a`, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
      await requests_.get(`${origin}/b`, { timeout: 100 }).catch(err => err.message.should.equal('temporary ban'))
      await wait(baseBanTime + 100)
      try {
        await requests_.get(`${origin}/c`, { timeout: 100 }).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.type.should.equal('request-timeout')
      }
    })

    it('should increase ban time on next failure', async () => {
      const { origin } = await startTimeoutServer()
      await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
      await requests_.get(origin, { timeout: 100 }).catch(err => err.message.should.equal('temporary ban'))
      await wait(baseBanTime + 100)
      const beforeReban = Date.now()
      await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
      try {
        await requests_.get(origin, { timeout: 100 }).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.equal('temporary ban')
        const { banTime, expire } = err.context.timeoutData
        banTime.should.equal(baseBanTime * 4)
        const execTimeMargin = 1000
        should(expire > beforeReban && expire < beforeReban + baseBanTime * 4 + execTimeMargin).be.true()
      }
    })
  })
})

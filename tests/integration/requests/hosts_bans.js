const should = require('should')
const express = require('express')
const requests_ = require('lib/requests')
const { wait } = require('lib/promises')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { baseBanTime, banTimeIncreaseFactor } = require('config').outgoingRequests
// Avoid reusing ports from the previous test session, as hosts bans data might be restored
let port = 1024 + parseInt(Date.now().toString().slice(-4))

const startTimeoutServer = () => new Promise(resolve => {
  port++
  const app = express()
  const host = `127.0.0.1:${port}`
  const origin = `http://${host}`
  app.get('/no-timeout', (req, res) => res.json({ ok: true }))
  // Always timeout
  app.get('/*', () => {})
  app.listen(port, () => resolve({ port, host, origin }))
})

describe('requests:hosts-bans', function () {
  this.timeout(5 * 1000)
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
      err.message.should.startWith('temporary ban')
      err.context.host.should.equal(host)
      const { banTime, expire } = err.context.hostBanData
      banTime.should.equal(baseBanTime)
      should(expire > Date.now()).be.true()
      should(expire < Date.now() + baseBanTime).be.true()
    }
  })

  it('should retry after expiration of the ban', async () => {
    const { origin } = await startTimeoutServer()
    await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await requests_.get(origin, { timeout: 100 }).catch(err => err.message.should.startWith('temporary ban'))
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
    await requests_.get(`${origin}/b`, { timeout: 100 }).catch(err => err.message.should.startWith('temporary ban'))
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
    await requests_.get(origin, { timeout: 100 }).catch(err => err.message.should.startWith('temporary ban'))
    await wait(baseBanTime + 100)
    const beforeReban = Date.now()
    await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    try {
      await requests_.get(origin, { timeout: 100 }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.message.should.startWith('temporary ban')
      const { banTime, expire } = err.context.hostBanData
      banTime.should.equal(baseBanTime * banTimeIncreaseFactor)
      const execTimeMargin = 1000
      should(expire > beforeReban).be.true()
      should(expire < (beforeReban + baseBanTime * banTimeIncreaseFactor + execTimeMargin)).be.true()
    }
  })

  it('should reset ban time after a successful request', async () => {
    const { origin } = await startTimeoutServer()
    await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await wait(baseBanTime + 100)
    await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await wait(baseBanTime * banTimeIncreaseFactor + 100)
    await requests_.get(`${origin}/no-timeout`, { timeout: 100 })
    const beforeReban = Date.now()
    await requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    try {
      await requests_.get(origin, { timeout: 100 }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.message.should.startWith('temporary ban')
      const { banTime, expire } = err.context.hostBanData
      banTime.should.equal(baseBanTime)
      const execTimeMargin = 1000
      should(expire > Date.now()).be.true()
      should(expire < (beforeReban + baseBanTime + execTimeMargin)).be.true()
    }
  })

  it('should count simultaneous requests failures as only one', async () => {
    const { origin } = await startTimeoutServer()
    await Promise.all([
      requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout')),
      requests_.get(origin, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    ])
    await requests_.get(`${origin}/b`, { timeout: 100 }).catch(err => {
      const { banTime } = err.context.hostBanData
      banTime.should.equal(baseBanTime)
    })
  })
})

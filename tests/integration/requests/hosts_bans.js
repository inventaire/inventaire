import should from 'should'
import CONFIG from 'config'
import requests_ from '#lib/requests'
import { wait } from '#lib/promises'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/api/utils/utils'
import { startGenericMockServer } from '../utils/mock_server.js'

const { baseBanTime, banTimeIncreaseFactor } = CONFIG.outgoingRequests

const startMockServer = async () => {
  const { port, host, origin } = await startGenericMockServer(app => {
    app.get('/no-timeout', (req, res) => res.json({ ok: true }))
    // Always timeout
    app.get('/timeout', () => {})
    app.get('/error', (req, res) => res.status(500).json({ ok: false }))
    app.get('/html', (req, res) => res.status(200).send('<p>hello</p>'))
  })
  return {
    port,
    host,
    origin,
    timeoutEndpoint: `${origin}/timeout`,
    noTimeoutEndpoint: `${origin}/no-timeout`,
    errorEndpoint: `${origin}/error`,
    htmlEndpoint: `${origin}/html`,
  }
}

describe('requests:hosts-bans', function () {
  this.timeout(5 * 1000)
  it('should timeout after the specified time', async () => {
    const { timeoutEndpoint } = await startMockServer()
    try {
      await requests_.get(timeoutEndpoint, { timeout: 100 }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.type.should.equal('request-timeout')
    }
  })

  it('should not re-request a host that just had a timeout', async () => {
    const { timeoutEndpoint, host } = await startMockServer()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    try {
      await requests_.get(timeoutEndpoint, { timeout: 100 }).then(shouldNotBeCalled)
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
    const { timeoutEndpoint } = await startMockServer()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.message.should.startWith('temporary ban'))
    await wait(baseBanTime + 100)
    try {
      await requests_.get(timeoutEndpoint, { timeout: 100 }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.type.should.equal('request-timeout')
    }
  })

  it('should keep timeout data for the whole host', async () => {
    const { timeoutEndpoint } = await startMockServer()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.message.should.startWith('temporary ban'))
    await wait(baseBanTime + 100)
    try {
      await requests_.get(timeoutEndpoint, { timeout: 100 }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.type.should.equal('request-timeout')
    }
  })

  it('should increase ban time on next failure', async () => {
    const { timeoutEndpoint } = await startMockServer()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.message.should.startWith('temporary ban'))
    await wait(baseBanTime + 100)
    const beforeReban = Date.now()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    try {
      await requests_.get(timeoutEndpoint, { timeout: 100 }).then(shouldNotBeCalled)
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
    const { timeoutEndpoint, noTimeoutEndpoint } = await startMockServer()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await wait(baseBanTime + 100)
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    await wait(baseBanTime * banTimeIncreaseFactor + 100)
    await requests_.get(noTimeoutEndpoint, { timeout: 100 })
    const beforeReban = Date.now()
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    try {
      await requests_.get(timeoutEndpoint, { timeout: 100 }).then(shouldNotBeCalled)
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
    const { timeoutEndpoint } = await startMockServer()
    await Promise.all([
      requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout')),
      requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout'))
    ])
    await requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => {
      const { banTime } = err.context.hostBanData
      banTime.should.equal(baseBanTime)
    })
  })

  it('should not re-request a host that just had a 500 error', async () => {
    const { errorEndpoint, noTimeoutEndpoint, host } = await startMockServer()
    await requests_.get(errorEndpoint)
    .then(shouldNotBeCalled)
    .catch(err => err.statusCode.should.equal(500))
    await hostIsCurrentlyBanned({ host, noTimeoutEndpoint })
  })

  it('should not re-request a host that just returned html rather than json', async () => {
    const { htmlEndpoint, noTimeoutEndpoint, host } = await startMockServer()
    await requests_.get(htmlEndpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.name.should.equal('SyntaxError')
      err.context.statusCode.should.equal(200)
    })
    await hostIsCurrentlyBanned({ host, noTimeoutEndpoint })
  })
})

const hostIsCurrentlyBanned = async ({ host, noTimeoutEndpoint }) => {
  try {
    await requests_.get(noTimeoutEndpoint).then(shouldNotBeCalled)
  } catch (err) {
    rethrowShouldNotBeCalledErrors(err)
    err.message.should.startWith('temporary ban')
    err.context.host.should.equal(host)
    const { banTime, expire } = err.context.hostBanData
    banTime.should.equal(baseBanTime)
    should(expire > Date.now()).be.true()
    should(expire <= Date.now() + baseBanTime).be.true()
  }
}

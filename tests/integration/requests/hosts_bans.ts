import should from 'should'
import { wait } from '#lib/promises'
import { requests_ } from '#lib/requests'
import config from '#server/config'
import type { AbsoluteUrl } from '#server/types/common'
import { startGenericMockServer } from '#tests/integration/utils/mock_server'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const { baseBanTime, banTimeIncreaseFactor } = config.outgoingRequests

const startMockServer = async () => {
  const { port, host, origin } = await startGenericMockServer(app => {
    app.all('/no-timeout', (req, res) => res.json({ ok: true }))
    // Always timeout
    app.all('/timeout', () => {})
    app.all('/error', (req, res) => res.status(500).json({ ok: false }))
    app.all('/html', (req, res) => res.status(200).send('<p>hello</p>'))
  })
  const { origin: secondaryOrigin } = await startGenericMockServer(app => {
    app.all('/redirects-to-timeout', (req, res) => res.redirect(`${origin}/timeout`))
  })
  return {
    port,
    host,
    origin,
    timeoutEndpoint: `${origin}/timeout` as AbsoluteUrl,
    noTimeoutEndpoint: `${origin}/no-timeout` as AbsoluteUrl,
    errorEndpoint: `${origin}/error` as AbsoluteUrl,
    htmlEndpoint: `${origin}/html` as AbsoluteUrl,
    redirectsToTimeoutEndpoint: `${secondaryOrigin}/redirects-to-timeout` as AbsoluteUrl,
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
      requests_.get(timeoutEndpoint, { timeout: 100 }).catch(err => err.type.should.equal('request-timeout')),
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

  it('should timeout after the specified time, even after a redirection', async () => {
    const { redirectsToTimeoutEndpoint } = await startMockServer()
    await requests_.head(redirectsToTimeoutEndpoint, { timeout: 100 })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.type.should.equal('request-timeout')
    })
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

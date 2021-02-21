const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { publicReq } = require('../utils/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { createUsername } = require('../fixtures/users')

const endpoint = '/.well-known/webfinger?resource='

describe('activitypub:webfinger', () => {
  it('should reject invalid host', async () => {
    try {
      const invalidResource = 'bar.org'
      invalidResource.should.not.equal(CONFIG.host)
      const actor = `acct:foo@${invalidResource}`
      await publicReq('get', `${endpoint}${actor}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid resource')
    }
  })

  it('should reject invalid actor', async () => {
    try {
      const invalidActorResource = 'acct:foobar.org'
      await publicReq('get', `${endpoint}${invalidActorResource}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid resource')
    }
  })

  it('should reject unknown actor', async () => {
    try {
      const unknownLocalActorResource = `acct:${createUsername()}@${CONFIG.publicHost}`
      await publicReq('get', `${endpoint}${unknownLocalActorResource}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('unknown actor')
    }
  })
})

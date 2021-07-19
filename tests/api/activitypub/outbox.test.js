const CONFIG = require('config')
const host = CONFIG.fullPublicHost()
require('should')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { publicReq } = require('../utils/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/activitypub?action=outbox&name='

describe('outbox:public', () => {
  it('reject if user is not fediversable', async () => {
    try {
      const user = createUser({ fediversable: false })
      const { username } = await user
      const outboxUrl = `${endpoint}${username}`
      await publicReq('get', outboxUrl).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(404)
      err.body.status_verbose.should.equal('user is not on the fediverse')
    }
  })

  it('should return a firt page URL', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    const { username } = await user
    await wait(800)
    const outboxUrl = `${endpoint}${username}`
    const res = await publicReq('get', outboxUrl)
    const fullHostUrl = `${host}${outboxUrl}`
    res.id.should.equal(fullHostUrl)
    res.type.should.equal('OrderedCollectionPage')
    res.totalItems.should.equal(1)
    res.first.should.equal(`${fullHostUrl}&page=1`)
  })
})

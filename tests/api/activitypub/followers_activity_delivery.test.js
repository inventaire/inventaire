const CONFIG = require('config')
const debounceTime = CONFIG.activitiesDebounceTime
require('should')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { publicReq, signedReq } = require('../utils/utils')
const { wait } = require('lib/promises')
const endpoint = '/api/activitypub?action=outbox&name='
const { makeUrl, createRemoteActivityPubServerUser } = require('../utils/activitypub')
const requests_ = require('lib/requests')

describe('followers activity delivery', () => {
  describe('users followers', () => {
    it('should post an activity to inbox', async () => {
      const user = await createUser({ fediversable: true })
      const { username } = user
      const actorUrl = makeUrl({ params: { action: 'actor', name: username } })
      const inboxUrl = makeUrl({ params: { action: 'inbox', name: username } })
      const remoteUser = await createRemoteActivityPubServerUser()
      // Follow user
      const res = await signedReq({ object: actorUrl, url: inboxUrl, emitterUser: remoteUser })
      const { remoteHost } = res
      const item = await createItem(user)
      await wait(debounceTime + 500)
      const outboxUrl = `${endpoint}${username}&offset=0`
      await publicReq('get', outboxUrl)
      const { inbox } = await requests_.get(`${remoteHost}/inbox_inspection?username=${username}`)
      const createActivity = inbox[0]
      createActivity.object.content.should.containEql(item._id)
      createActivity.to.should.deepEqual([ remoteUser.id, 'Public' ])
    })
  })
})

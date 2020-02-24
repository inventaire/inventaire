const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqB, undesiredRes, getUserC, getUserGetter, customAuthReq } = require('../utils/utils')
const { groupPromise, createGroup, getGroup } = require('../fixtures/groups')
const endpoint = '/api/groups?action=accept'
const { Promise } = __.require('lib', 'promises')
const { humanName } = require('../fixtures/entities')

describe('groups:update:accept', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should reject non invited users', done => {
    Promise.all([ groupPromise, getUserC() ])
    .then(([ group, user ]) => {
      return authReq('put', endpoint, { user: user._id, group: group._id })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should reject invite accepted by another user', done => {
    Promise.all([ groupPromise, getUserC() ])
    .then(([ group, user ]) => {
      const { _id: userId } = user
      return authReq('put', '/api/groups?action=invite', { user: userId, group: group._id })
      .then(() => {
        group.members.length.should.equal(1)
        return authReqB('put', endpoint, { user: userId, group: group._id })
      })
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should add a member when user is accepting an invite', async () => {
    // Re-creating a group instead of using groupPromise,
    // to be isolated from other tests
    const group = await createGroup()
    const user = await getUserGetter(humanName(), false)()
    const { _id: userId } = user
    const { _id: groupId } = group
    const memberCount = group.members.length
    await authReq('put', '/api/groups?action=invite', { user: userId, group: groupId })
    await customAuthReq(user, 'put', endpoint, { user: userId, group: groupId })
    const updatedGroup = await getGroup(group)
    updatedGroup.members.length.should.equal(memberCount + 1)
    const membersIds = _.map(updatedGroup.members, 'user')
    membersIds.should.containEql(userId)
  })
})

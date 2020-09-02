const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqB, undesiredRes, getUserGetter } = require('../utils/utils')
const { groupPromise, getGroup, addMember } = require('../fixtures/groups')
const endpoint = '/api/groups?action=make-admin'
const { humanName } = require('../fixtures/entities')

describe('groups:update:make-admin', () => {
  it('should reject without group', done => {
    authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(done)
  })

  it('should reject non member users', done => {
    groupPromise
    .then(group => {
      return authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('membership not found')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should reject request by non admin', done => {
    const memberPromise = getUserGetter(humanName(), false)()

    addMember({ group: groupPromise, user: memberPromise })
    .then(([ group, member ]) => {
      const { _id: memberId } = member
      return authReqB('put', endpoint, { user: memberId, group: group._id })
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('user is not a group admin')
      err.statusCode.should.equal(403)
      done()
    })
    .catch(done)
  })

  it('should add an admin', done => {
    const memberPromise = getUserGetter(humanName(), false)()

    addMember({ group: groupPromise, user: memberPromise })
    .then(([ group, member ]) => {
      const { _id: memberId } = member
      const adminsCount = group.admins.length
      return authReq('put', endpoint, { user: memberId, group: group._id })
      .then(() => getGroup(group))
      .then(group => {
        group.admins.length.should.equal(adminsCount + 1)
        group.admins.map(_.property('user')).should.containEql(memberId)
        done()
      })
    })
    .catch(done)
  })
})

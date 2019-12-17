const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { authReq, authReqB, authReqC, undesiredRes } = require('../utils/utils')
const { groupPromise, getGroup } = require('../fixtures/groups')
const { signup } = require('../fixtures/users')
const randomString = __.require('lib', './utils/random_string')
const randomEmail = () => `a${randomString(4).toLowerCase()}@foo.org`

// Do not re-test what test/libs/045-parse_emails unit tests already test

describe('invitations:by-emails', () => {
  describe('friends', () => {
    it('should accept an email as a string', done => {
      authReq('post', '/api/invitations?action=by-emails',
        { emails: 'a@foo.org' })
      .then(res => {
        res.emails[0].should.equal('a@foo.org')
        done()
      })
      .catch(done)
    })

    it('should accept several emails as a string', done => {
      authReq('post', '/api/invitations?action=by-emails',
        { emails: 'a@foo.org,b@foo.org' })
      .then(res => {
        res.emails[0].should.equal('a@foo.org')
        res.emails[1].should.equal('b@foo.org')
        done()
      })
      .catch(done)
    })

    it('should accept several emails as an array', done => {
      authReq('post', '/api/invitations?action=by-emails',
        { emails: [ 'a@foo.org', 'b@foo.org' ] })
      .then(res => {
        res.emails[0].should.equal('a@foo.org')
        res.emails[1].should.equal('b@foo.org')
        done()
      })
      .catch(done)
    })

    it('should reject missing emails', done => {
      authReq('post', '/api/invitations?action=by-emails', {})
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('missing parameter in body: emails')
        done()
      })
    })

    it('should reject invalid message', done => {
      authReq('post', '/api/invitations?action=by-emails', {
        emails: 'a@foo.org',
        message: []
      })
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.match(/invalid message:/)
        done()
      })
      .catch(done)
    })

    it('should trigger a friend request on signup', done => {
      const email = randomEmail()

      const invite = () => authReq('post', '/api/invitations?action=by-emails', { emails: email })

      invite()
      .then(() => signup(email))
      .then(() => authReq('get', '/api/relations'))
      .then(relations => {
        return invite()
        .then(res => {
          res.users[0].email.should.equal(email);
          (relations.userRequested.includes(res.users[0]._id)).should.be.true()
          done()
        })
      })
      .catch(done)
    })
  })

  describe('groups', () => {
    it('should reject invalid group ids', done => {
      authReq('post', '/api/invitations?action=by-emails', {
        emails: 'a@foo.org',
        group: 'abc'
      })
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('invalid group id: abc')
        done()
      })
      .catch(done)
    })

    it('should accept valid group ids', done => {
      groupPromise
      .then(group => {
        return authReq('post', '/api/invitations?action=by-emails', {
          emails: 'a@foo.org',
          group: group._id
        })
      })
      .then(res => {
        res.emails[0].should.equal('a@foo.org')
        done()
      })
      .catch(done)
    })

    it('should accept non-user admin requests to invite to a group', done => {
      groupPromise
      // User B is a member (see ../fixtures/groups.js)
      .then(group => {
        return authReqB('post', '/api/invitations?action=by-emails', {
          emails: 'a@foo.org',
          group: group._id
        })
      })
      .then(res => {
        res.emails[0].should.equal('a@foo.org')
        done()
      })
      .catch(done)
    })

    it('should reject non-member requests to invite to a group', done => {
      groupPromise
      // User C isnt a member
      .then(group => {
        return authReqC('post', '/api/invitations?action=by-emails', {
          emails: 'a@foo.org',
          group: group._id
        })
        .catch(err => {
          err.statusCode.should.equal(403)
          err.body.status_verbose.should.equal("user isn't a group member")
          done()
        })
      })
      .catch(done)
    })

    it('should trigger an invite on signup', done => {
      const email = randomEmail()
      groupPromise
      .then(group => {
        const invite = () => authReq('post', '/api/invitations?action=by-emails', {
          emails: email,
          group: group._id
        })

        return invite()
        .then(() => signup(email))
        .then(() => getGroup(group))
        .then(updatedGroup => {
          const prevInvitedCount = group.invited.length
          const invitedCount = updatedGroup.invited.length
          invitedCount.should.equal(prevInvitedCount + 1)
          const lastUserId = _.last(updatedGroup.invited).user
          return invite()
          .then(res => {
            res.users[0].email.should.equal(email)
            res.users[0]._id.should.equal(lastUserId)
            done()
          })
        })
      })
      .catch(done)
    })
  })
})

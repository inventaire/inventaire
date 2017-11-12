CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, authReqB, undesiredErr, undesiredRes } = require '../utils/utils'
{ groupPromise, getGroup } = require '../fixtures/groups'
{ signup } = require '../fixtures/users'
randomString = __.require 'lib', './utils/random_string'
randomEmail = -> 'a' + randomString(4).toLowerCase() + '@foo.org'

# Do not re-test what test/libs/045-parse_emails unit tests already test

describe 'invitations:by-emails', ->
  describe 'friends', ->
    it 'should accept an email as a string', (done)->
      authReq 'post', '/api/invitations?action=by-emails',
        emails: 'a@foo.org'
      .then (res)->
        res.emails[0].should.equal 'a@foo.org'
        done()
      .catch undesiredErr(done)

      return

    it 'should accept several emails as a string', (done)->
      authReq 'post', '/api/invitations?action=by-emails',
        emails: 'a@foo.org,b@foo.org'
      .then (res)->
        res.emails[0].should.equal 'a@foo.org'
        res.emails[1].should.equal 'b@foo.org'
        done()
      .catch undesiredErr(done)

      return

    it 'should accept several emails as an array', (done)->
      authReq 'post', '/api/invitations?action=by-emails',
        emails: [ 'a@foo.org', 'b@foo.org' ]
      .then (res)->
        res.emails[0].should.equal 'a@foo.org'
        res.emails[1].should.equal 'b@foo.org'
        done()
      .catch undesiredErr(done)

      return

    it 'should reject missing emails', (done)->
      authReq 'post', '/api/invitations?action=by-emails', {}
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.equal 'missing parameter in body: emails'
        done()

      return

    it 'should reject invalid message', (done)->
      authReq 'post', '/api/invitations?action=by-emails',
        emails: 'a@foo.org'
        message: []
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose.should.match /invalid message:/
        done()
      .catch undesiredErr(done)

      return

    it 'should trigger an friend request on signup', (done)->
      email = randomEmail()

      invite = ->
        authReq 'post', '/api/invitations?action=by-emails', { emails: email }

      invite()
      .then -> signup email
      .then -> authReq 'get', '/api/relations'
      .then (relations)->
        invite()
        .then (res)->
          res.users[0].email.should.equal email
          (res.users[0]._id in relations.userRequested).should.be.true()
          done()
      .catch undesiredErr(done)

      return

      email = randomEmail()
      groupPromise
      .then (group)->
        authReq 'post', '/api/invitations?action=by-emails',
          emails: email
          group: group._id
        .then -> signup email
        .then -> getGroup group._id
        .then (updatedGroup)->
          prevInvitedCount = group.invited.length
          invitedCount = updatedGroup.invited.length
          invitedCount.should.equal prevInvitedCount + 1
          done()

      .catch undesiredErr(done)

      return

  describe 'groups', ->
    it 'should reject invalid group ids', (done)->
      authReq 'post', '/api/invitations?action=by-emails',
        emails: 'a@foo.org'
        group: 'abc'
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose.should.equal 'invalid group id: abc'
        done()
      .catch undesiredErr(done)

      return

    it 'should accept valid group ids', (done)->
      groupPromise
      .then (group)->
        authReq 'post', '/api/invitations?action=by-emails',
          emails: 'a@foo.org'
          group: group._id
        .then (res)->
          res.emails[0].should.equal 'a@foo.org'
          done()
      .catch undesiredErr(done)

      return

    it 'should reject non-user admin requests to invite to a group', (done)->
      groupPromise
      .then (group)->
        authReqB 'post', '/api/invitations?action=by-emails',
          emails: 'a@foo.org'
          group: group._id
      .catch (err)->
        err.statusCode.should.equal 403
        err.body.status_verbose.should.equal "user isn't group admin"
        done()
      .catch undesiredErr(done)

      return

    it 'should trigger an invite on signup', (done)->
      email = randomEmail()
      groupPromise
      .then (group)->
        invite = ->
          authReq 'post', '/api/invitations?action=by-emails',
            emails: email
            group: group._id

        invite()
        .then -> signup email
        .then -> getGroup group._id
        .then (updatedGroup)->
          prevInvitedCount = group.invited.length
          invitedCount = updatedGroup.invited.length
          invitedCount.should.equal prevInvitedCount + 1
          lastUserId = _.last(updatedGroup.invited).user
          invite()
          .then (res)->
            res.users[0].email.should.equal email
            res.users[0]._id.should.equal lastUserId
            done()

      .catch undesiredErr(done)

      return

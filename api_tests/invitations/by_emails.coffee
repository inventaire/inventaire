CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, undesiredErr, undesiredRes } = require '../utils/utils'

# Do not re-test what test/libs/045-parse_emails unit tests already test

describe 'invitations:by-emails', ->
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

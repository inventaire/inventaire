CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ getUserGetter, customAuthReq } = require '../utils/utils'
{ getRefreshedUser } = require '../fixtures/users'
randomString = __.require 'lib', './utils/random_string'

describe 'user:delete', ->
  it 'should delete the user', (done)->
    userPromise = getUserGetter(randomString(6), false)()
    userPromise
    .then (user)->
      customAuthReq userPromise, 'delete', '/api/user'
      .then (res)->
        res.ok.should.be.true()
        getRefreshedUser userPromise
        .then (deletedUser)->
          deletedUser._id.should.equal user._id
          previousRevInteger = parseInt(user._rev .split('-')[0])
          parseInt(deletedUser._rev.split('-')[0]).should.equal(previousRevInteger + 1)
          deletedUser.username.should.equal user.username
          should(deletedUser.password).not.be.ok()
          should(deletedUser.email).not.be.ok()
          should(deletedUser.settings).not.be.ok()
          should(deletedUser.readToken).not.be.ok()
          should(deletedUser.picture).not.be.ok()
          should(deletedUser.snapshot).not.be.ok()
          done()
      .catch done

    return

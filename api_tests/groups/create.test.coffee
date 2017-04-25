CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
randomString = __.require 'lib', './utils/random_string'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'groups:create', ->
  it 'should create a group', (done)->
    name = 'my group' + randomString(5)
    authReq 'post', '/api/groups?action=create', { name }
    .then (res)->
      res.name.should.equal name
      res.slug.should.equal slugify(name)
      res.searchable.should.be.true()
      res.creator.should.equal res.admins[0].user
      done()
    .catch undesiredErr(done)

    return

  it 'should reject a group with an empty name or generated slug', (done)->
    name = '??'
    authReq 'post', '/api/groups?action=create', { name }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.error_name.should.equal 'invalid_name'
      done()
    .catch undesiredErr(done)

    return

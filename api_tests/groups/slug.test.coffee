CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser } = __.require 'apiTests', 'utils/utils'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'groups:get:slug', ->
  it 'should return a slug', (done)->
    name = 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
    encodedName = encodeURIComponent name
    nonAuthReq 'get', "/api/groups?action=slug&name=#{encodedName}"
    .then (res)->
      res.slug.should.equal slugify(name)
      done()

    return

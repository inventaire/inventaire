CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser } = __.require 'apiTests', 'utils/utils'

describe 'groups:get:slug', ->
  it 'should return a slug', (done)->
    name = encodeURIComponent 'he"ll_oa% $ az}d a"\'z a(ù]ùd azd'
    nonAuthReq 'get', "/api/groups?action=slug&name=#{name}"
    .then (res)->
      res.slug.should.equal 'he"ll_oa%-$-az}d-a"\'z-aùùd-azd'
      done()

    return

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, nonAuthReq } = __.require 'apiTests', 'utils/utils'
randomString = __.require 'lib', './utils/random_string'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'groups:search', ->
  it 'should find a group by its name', (done)->
    name = 'yo' + randomString(5)
    authReq 'post', '/api/groups?action=create', { name }
    .delay 1000
    .then (creationRes)->
      groupId = creationRes._id
      nonAuthReq 'get', "/api/groups?action=search&search=#{name}"
      .then (searchRes)->
        (groupId in groupsIds(searchRes)).should.be.true()
        done()
    .catch done

    return

  it 'should find a group by its description', (done)->
    name = 'yo' + randomString(5)
    description = 'hello' + randomString(10)
    authReq 'post', '/api/groups?action=create', { name, description }
    .delay 1000
    .then (creationRes)->
      groupId = creationRes._id
      nonAuthReq 'get', "/api/groups?action=search&search=#{description}"
      .then (searchRes)->
        (groupId in groupsIds(searchRes)).should.be.true()
        done()
    .catch done

    return

  it 'should not find a group when not searchable', (done)->
    name = 'yo' + randomString(5)
    authReq 'post', '/api/groups?action=create', { name, searchable: false }
    .delay 1000
    .then (creationRes)->
      groupId = creationRes._id
      nonAuthReq 'get', "/api/groups?action=search&search=#{name}"
      .then (searchRes)->
        (groupId in groupsIds(searchRes)).should.not.be.true()
        done()
    .catch done

    return

groupsIds = (res)-> _.pluck res.groups, '_id'

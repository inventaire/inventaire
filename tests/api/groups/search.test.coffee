CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
faker = require 'faker'
{ authReq, nonAuthReq, undesiredErr } = require '../utils/utils'
{ groupName } = require '../fixtures/groups'
slugify = __.require 'controllers', 'groups/lib/slugify'

describe 'groups:search', ->
  it 'should find a group by its name', (done)->
    name = groupName()
    authReq 'post', '/api/groups?action=create', { name }
    .delay 1000
    .then (creationRes)->
      groupId = creationRes._id
      nonAuthReq 'get', "/api/groups?action=search&search=#{name}"
      .then (searchRes)->
        (groupId in groupsIds(searchRes)).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should find a group by its description', (done)->
    name = groupName()
    description = faker.lorem.paragraph()
    authReq 'post', '/api/groups?action=create', { name, description }
    .delay 1000
    .then (creationRes)->
      groupId = creationRes._id
      nonAuthReq 'get', "/api/groups?action=search&search=#{description}"
      .then (searchRes)->
        (groupId in groupsIds(searchRes)).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not find a group when not searchable', (done)->
    name = groupName()
    authReq 'post', '/api/groups?action=create', { name, searchable: false }
    .delay 1000
    .then (creationRes)->
      groupId = creationRes._id
      nonAuthReq 'get', "/api/groups?action=search&search=#{name}"
      .then (searchRes)->
        (groupId in groupsIds(searchRes)).should.not.be.true()
        done()
    .catch undesiredErr(done)

    return

groupsIds = (res)-> _.map res.groups, '_id'

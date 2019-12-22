const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const faker = require('faker')
const { authReq, nonAuthReq, undesiredRes } = require('../utils/utils')
const { groupName } = require('../fixtures/groups')
const createEndpoint = '/api/groups?action=create'
const endpoint = '/api/groups?action=search'

describe('groups:search', () => {
  it('should reject without search', done => {
    authReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: search')
      done()
    })
    .catch(done)
  })

  it('should find a group by its name', done => {
    const name = groupName()
    authReq('post', createEndpoint, { name })
    .delay(1000)
    .then(creationRes => {
      const groupId = creationRes._id
      return nonAuthReq('get', `${endpoint}&search=${name}`)
      .then(searchRes => {
        groupsIds(searchRes).includes(groupId).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should find a group by its description', done => {
    const name = groupName()
    const description = faker.lorem.paragraph()
    authReq('post', createEndpoint, { name, description })
    .delay(1000)
    .then(creationRes => {
      const groupId = creationRes._id
      return nonAuthReq('get', `${endpoint}&search=${description}`)
      .then(searchRes => {
        groupsIds(searchRes).includes(groupId).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should not find a group when not searchable', done => {
    const name = groupName()
    authReq('post', createEndpoint, { name, searchable: false })
    .delay(1000)
    .then(creationRes => {
      const groupId = creationRes._id
      return nonAuthReq('get', `${endpoint}&search=${name}`)
      .then(searchRes => {
        groupsIds(searchRes).includes(groupId).should.be.false()
        done()
      })
    })
    .catch(done)
  })
})

const groupsIds = res => _.map(res.groups, '_id')

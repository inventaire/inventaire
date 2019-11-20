
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const faker = require('faker')
const { authReq, nonAuthReq, undesiredErr } = require('../utils/utils')
const { groupName } = require('../fixtures/groups')

describe('groups:search', () => {
  it('should find a group by its name', done => {
    const name = groupName()
    authReq('post', '/api/groups?action=create', { name })
    .delay(1000)
    .then(creationRes => {
      const groupId = creationRes._id
      return nonAuthReq('get', `/api/groups?action=search&search=${name}`)
      .then(searchRes => {
        groupsIds(searchRes).includes(groupId).should.be.true()
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should find a group by its description', done => {
    const name = groupName()
    const description = faker.lorem.paragraph()
    authReq('post', '/api/groups?action=create', { name, description })
    .delay(1000)
    .then(creationRes => {
      const groupId = creationRes._id
      return nonAuthReq('get', `/api/groups?action=search&search=${description}`)
      .then(searchRes => {
        groupsIds(searchRes).includes(groupId).should.be.true()
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it('should not find a group when not searchable', done => {
    const name = groupName()
    authReq('post', '/api/groups?action=create', { name, searchable: false })
    .delay(1000)
    .then(creationRes => {
      const groupId = creationRes._id
      return nonAuthReq('get', `/api/groups?action=search&search=${name}`)
      .then(searchRes => {
        groupsIds(searchRes).includes(groupId).should.be.true()
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})

const groupsIds = res => _.map(res.groups, '_id')

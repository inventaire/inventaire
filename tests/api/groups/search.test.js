// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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
        let needle;
        ((needle = groupId, groupsIds(searchRes).includes(needle))).should.be.true()
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
        let needle;
        ((needle = groupId, groupsIds(searchRes).includes(needle))).should.be.true()
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
        let needle;
        ((needle = groupId, groupsIds(searchRes).includes(needle))).should.not.be.true()
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})

const groupsIds = res => _.map(res.groups, '_id')

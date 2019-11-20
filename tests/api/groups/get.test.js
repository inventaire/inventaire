// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { authReq, nonAuthReq, undesiredErr } = require('../utils/utils')
const { groupPromise, endpointAction } = require('../fixtures/groups')

describe('groups:get', () => {
  describe('default', () => it('should get all user groups', done => {
    groupPromise
    .then(group => authReq('get', endpointAction)
    .then(res => {
      res.groups.should.be.an.Array()
      const groupsIds = _.map(res.groups, '_id')
      should(groupsIds.includes(group._id)).be.true()
      done()
    }))
    .catch(undesiredErr(done))
  }))

  describe('by-id', () => it('should get a group by id', done => {
    groupPromise
    .delay(500)
    .then(group => nonAuthReq('get', `${endpointAction}=by-id&id=${group._id}`)
    .then(res => {
      res.group._id.should.equal(group._id)
      res.group.name.should.equal(group.name)
      res.group.slug.should.equal(group.slug)
      done()
    }))
    .catch(undesiredErr(done))
  }))

  describe('by-slug', () => it('should get a group by slug', done => {
    groupPromise
    .delay(500)
    .then(group => nonAuthReq('get', `${endpointAction}=by-slug&slug=${group.slug}`)
    .then(res => {
      res.group._id.should.equal(group._id)
      res.group.name.should.equal(group.name)
      res.group.slug.should.equal(group.slug)
      done()
    }))
    .catch(undesiredErr(done))
  }))
})

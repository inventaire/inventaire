const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, undesiredRes } = require('../utils/utils')
const { groupName } = require('../fixtures/groups')
const slugify = __.require('controllers', 'groups/lib/slugify')
const endpoint = '/api/groups?action=create'

describe('groups:create', () => {
  it('should reject without name', done => {
    authReq('post', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: name')
      done()
    })
    .catch(done)
  })

  it('should create a group', done => {
    const name = groupName()
    authReq('post', endpoint, { name })
    .then(res => {
      res.name.should.equal(name)
      res.slug.should.equal(slugify(name))
      res.searchable.should.be.true()
      res.creator.should.equal(res.admins[0].user)
      done()
    })
    .catch(done)
  })

  it('should accept an optional searcheable parameter', done => {
    const name = groupName()
    authReq('post', endpoint, { name, searchable: false })
    .catch(done)
    .then(res => {
      res.searchable.should.be.false()
      done()
    })
  })

  it('should reject invalid position', done => {
    const name = groupName()
    authReq('post', endpoint, { name, position: [ 1 ] })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid position')
      done()
    })
    .catch(done)
  })

  it('should accept an optional position parameter', done => {
    const name = groupName()
    const position = [ 1, 1 ]
    authReq('post', endpoint, { name, position })
    .then(res => {
      res.position.should.deepEqual(position)
      done()
    })
    .catch(done)
  })

  it('should truncate position parameter', async () => {
    const name = groupName()
    const position = [ 1.123456789, 1.123456789 ]
    const res = await authReq('post', endpoint, { name, position })
    res.position.should.deepEqual([ 1.12346, 1.12346 ])
  })

  it('should reject a group with an empty name or generated slug', done => {
    const name = '??'
    authReq('post', endpoint, { name })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('invalid_name')
      done()
    })
    .catch(done)
  })
})

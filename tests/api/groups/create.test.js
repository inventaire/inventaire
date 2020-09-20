const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { groupName } = require('../fixtures/groups')
const slugify = __.require('controllers', 'groups/lib/slugify')
const endpoint = '/api/groups?action=create'

describe('groups:create', () => {
  it('should reject without name', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      err.body.status_verbose.should.equal('missing parameter in body: name')
    }
  })

  it('should reject with an empty name', async () => {
    try {
      await authReq('post', endpoint, { name: '' }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid name: ')
    }
  })

  it('should create a group', async () => {
    const name = groupName()
    const res = await authReq('post', endpoint, { name })
    res.name.should.equal(name)
    res.slug.should.equal(slugify(name))
    res.searchable.should.be.true()
    res.creator.should.equal(res.admins[0].user)
  })

  it('should accept an optional searcheable parameter', async () => {
    const name = groupName()
    const res = await authReq('post', endpoint, { name, searchable: false })
    res.searchable.should.be.false()
  })

  it('should reject invalid position', async () => {
    const name = groupName()
    try {
      await authReq('post', endpoint, { name, position: [ 1 ] }).then(shouldNotBeCalled)
    } catch (err) {
      err.body.status_verbose.should.startWith('invalid position')
    }
  })

  it('should accept an optional position parameter', async () => {
    const name = groupName()
    const position = [ 1, 1 ]
    const res = await authReq('post', endpoint, { name, position })
    res.position.should.deepEqual(position)
  })

  it('should truncate position parameter', async () => {
    const name = groupName()
    const position = [ 1.123456789, 1.123456789 ]
    const res = await authReq('post', endpoint, { name, position })
    res.position.should.deepEqual([ 1.12346, 1.12346 ])
  })

  it('should reject a group with an empty name or generated slug', async () => {
    const name = '??'
    try {
      await authReq('post', endpoint, { name }).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.error_name.should.equal('invalid_name')
    }
  })
})

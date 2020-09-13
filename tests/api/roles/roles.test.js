require('should')
const { nonAuthReq, authReq, adminReq, dataadminReq, getUserB, getAdminUser, getDataadminUser, rethrowShouldNotBeCalledErrors, shouldNotBeCalled } = require('../utils/utils')
const { createWork } = require('../fixtures/entities')


describe('roles:public', () => {
  it('should not access an unauthorized endpoint', async () => {
    try {
      const endpoint = '/api/entities?action=create'
      await nonAuthReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('unauthorized api access')
      err.statusCode.should.equal(401)
    }
  })

  it('should access public page', async () => {
    const endpoint = '/api/entities?action=changes'
    const res = await nonAuthReq('get', endpoint)
    res.should.be.ok()
  })
})

describe('roles:authentified', () => {
  it('should not access private resources from another user', async () => {
    try {
      const endpoint = '/api/entities?action=contributions'
      await authReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('unauthorized admin api access')
      err.statusCode.should.equal(403)
    }
  })

  it('should access authentified page', async () => {
    const endpoint = '/api/user'
    const res = await authReq('get', endpoint)
    res.should.be.ok()
  })
})

describe('roles:admin', () => {
  it('should return a user with admin role', async () => {
    const adminUser = await getAdminUser()
    adminUser.roles.should.deepEqual([ 'admin' ])
  })

  it('should access private resources from another user', async () => {
    const user = await getUserB()
    const endpoint = `/api/entities?action=contributions&user=${user._id}`
    const res = await adminReq('get', endpoint)
    res.should.be.ok()
  })

  it('should merge entities', async () => {
    const [ fromEntity, toEntity ] = await Promise.all([ createWork(), createWork() ])
    const res = await adminReq('put', '/api/entities?action=merge', { from: fromEntity.uri, to: toEntity.uri })
    res.ok.should.be.true()
  })
})

describe('roles:dataadmin', () => {
  it('should return a user with dataadmin role', async () => {
    const dataadminUser = await getDataadminUser()
    dataadminUser.roles.should.deepEqual([ 'dataadmin' ])
  })

  it('should refuse access to private resources from another user', async () => {
    try {
      const user = await getUserB()
      const endpoint = `/api/entities?action=contributions&user=${user._id}`
      await dataadminReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('unauthorized admin api access')
      err.statusCode.should.equal(403)
    }
  })

  it('should merge entities', async () => {
    const [ fromEntity, toEntity ] = await Promise.all([ createWork(), createWork() ])
    const res = await dataadminReq('put', '/api/entities?action=merge', { from: fromEntity.uri, to: toEntity.uri })
    res.ok.should.be.true()
  })
})

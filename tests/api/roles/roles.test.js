require('should')
const { nonAuthReq, authReq, adminReq, getUserB, getAdminUser, rethrowShouldNotBeCalledErrors, shouldNotBeCalled } = require('../utils/utils')

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
  it('should return a user doc with roles key', async () => {
    const adminUser = await getAdminUser()
    adminUser.admin.should.be.true()
  })

  it('should access private resources from another user', async () => {
    const user = await getUserB()
    const endpoint = `/api/entities?action=contributions&user=${user._id}`
    const res = await adminReq('get', endpoint)
    res.should.be.ok()
  })
})

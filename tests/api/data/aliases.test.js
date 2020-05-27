const __ = require('config').universalPath
require('should')
const { nonAuthReq } = require('../utils/utils')
const endpoint = '/api/data?action=aliases'
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')

describe('data:aliases', () => {
  it('should reject without param', async () => {
    try {
      const res = await nonAuthReq('get', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: type')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject invalid type', async () => {
    try {
      const type = 'blu'
      const res = await nonAuthReq('get', `${endpoint}&type=${type}&lang=fr`)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid type')
      err.statusCode.should.equal(400)
    }
  })

  it('should return aliases information', done => {
    const type = 'works'
    nonAuthReq('get', `${endpoint}&type=${type}&lang=fr`)
    .then(res => {
      const firstAlias = res[0]
      firstAlias.uri.should.equal('wd:Q571')
      firstAlias.label.should.equal('livre')
      done()
    })
    .catch(done)
  })

  it('should return default lang as english', done => {
    const type = 'works'
    nonAuthReq('get', `${endpoint}&type=${type}`)
    .then(res => {
      const firstAlias = res[0]
      firstAlias.uri.should.equal('wd:Q571')
      firstAlias.label.should.equal('book')
      done()
    })
    .catch(done)
  })
})

const CONFIG = require('config')
require('should')
const { nonAuthReq, undesiredRes } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const host = CONFIG.fullHost()

describe('token:reset-password', () => it('should reject requests without email', done => {
  nonAuthReq('get', '/api/token?action=reset-password')
  .then(undesiredRes(done))
  .catch(err => {
    err.body.status_verbose.should.equal('missing parameter in query: email')
    done()
  })
  .catch(done)
}))

describe('token:validation-email', () => it('should reject requests without email', done => {
  rawRequest('get', {
    url: `${host}/api/token?action=validation-email`,
    followRedirect: false
  })
  .then(res => {
    res.headers.location.should.equal('/?validEmail=false')
    done()
  })
  .catch(done)
}))

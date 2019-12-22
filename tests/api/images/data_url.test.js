const CONFIG = require('config')
require('should')
const { authReq, undesiredRes } = require('../utils/utils')
const imageUrl = encodeURIComponent('https://raw.githubusercontent.com/inventaire/inventaire-client/master/app/assets/icon/32.png')
const dataUrlStart = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYA'
const endpoint = '/api/images?action=data-url'

describe('images:data-url', () => {
  it('should reject without URL', done => {
    authReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: url')
      done()
    })
    .catch(done)
  })

  it('should reject with an invalid URL', done => {
    authReq('get', `${endpoint}&url=bla`)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid url: bla')
      done()
    })
    .catch(done)
  })

  it('should reject with an invalid content type', done => {
    const invalidContentTypeUrl = encodeURIComponent('http://maxlath.eu/data.json')
    authReq('get', `${endpoint}&url=${invalidContentTypeUrl}`)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid content type')
      done()
    })
    .catch(done)
  })

  it('should return a data-url', done => {
    authReq('get', `${endpoint}&url=${imageUrl}`)
    .then(res => {
      res['data-url'].should.be.a.String()
      res['data-url'].should.startWith(dataUrlStart)
      done()
    })
    .catch(done)
  })

  it('should format to add host to a local url', done => {
    const imageUrl = '/some/invalid/local/url'
    authReq('get', `${endpoint}&url=${encodeURIComponent(imageUrl)}`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.context.url.should.equal(`${CONFIG.fullPublicHost()}${imageUrl}`)
      done()
    })
    .catch(done)
  })
})

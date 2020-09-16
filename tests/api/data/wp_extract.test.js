const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { publicReq, undesiredRes } = require('../utils/utils')
const endpoint = '/api/data?action=wp-extract'
const randomString = __.require('lib', 'utils/random_string')

describe('wikipedia:extract', () => {
  it('should reject without title', done => {
    publicReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: title')
      done()
    })
    .catch(done)
  })

  it('should return empty response when no page is found', done => {
    const randomTitle = randomString(15)
    publicReq('get', `${endpoint}&title=${randomTitle}`)
    .then(res => {
      should(res.extract).not.be.ok()
      done()
    })
    .catch(done)
  })

  it('should get english Wikipedia article by default', done => {
    publicReq('get', `${endpoint}&title=Gilbert_Simondon`)
    .then(res => {
      res.url.should.equal('https://en.wikipedia.org/wiki/Gilbert_Simondon')
      res.extract.should.startWith('Gilbert Simondon')
      done()
    })
    .catch(done)
  })

  it('should get an extract in the appropriate language', done => {
    publicReq('get', `${endpoint}&lang=fr&title=Gilbert_Simondon`)
    .then(res => {
      res.url.should.equal('https://fr.wikipedia.org/wiki/Gilbert_Simondon')
      res.extract.should.startWith('Gilbert Simondon')
      done()
    })
    .catch(done)
  })
})

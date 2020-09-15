const CONFIG = require('config')
require('should')
const { publicReq, undesiredRes } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const host = CONFIG.fullPublicHost()
const qs = require('querystring')
const encodedCommonsUrlChunk = qs.escape('https://commons.wikimedia.org/wiki/Special:FilePath/')

describe('entities:images', () => {
  it('should return an array of images associated with the passed uri', done => {
    publicReq('get', '/api/entities?action=images&uris=wd:Q535')
    .then(res => {
      res.images.should.be.an.Object()
      res.images['wd:Q535'].should.be.an.Array()
      res.images['wd:Q535'][0].should.be.a.String()
      done()
    })
    .catch(done)
  })

  it('should reject redirect requests with multiple URIs', done => {
    publicReq('get', '/api/entities?action=images&uris=wd:Q535|wd:Q42&redirect=true')
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      done()
    })
  })

  it('should redirect to the image if requested in options', async () => {
    const url = '/api/entities?action=images&uris=wd:Q535&redirect=true&width=32'
    const { statusCode, headers } = await rawRequest('get', url)
    statusCode.should.equal(302)
    headers.location.should.startWith(`${host}/img/remote/32x1600/`)
    headers.location.should.containEql(`href=${encodedCommonsUrlChunk}`)
  })
})

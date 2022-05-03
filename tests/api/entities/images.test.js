const CONFIG = require('config')
require('should')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const host = CONFIG.fullPublicHost()
const { fixedEncodeURIComponent } = require('lib/utils/url')
const encodedCommonsUrlChunk = fixedEncodeURIComponent('https://commons.wikimedia.org/wiki/Special:FilePath/')

describe('entities:images', () => {
  it('should return an array of images associated with the passed uri', async () => {
    const res = await publicReq('get', '/api/entities?action=images&uris=wd:Q535')
    res.images.should.be.an.Object()
    res.images['wd:Q535'].should.be.an.Array()
    res.images['wd:Q535'][0].should.be.a.String()
  })

  it('should reject redirect requests with multiple URIs', async () => {
    await publicReq('get', '/api/entities?action=images&uris=wd:Q535|wd:Q42&redirect=true')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
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

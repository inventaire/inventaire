require('should')
const { hashCode } = require('lib/utils/base')
const { uploadSomeImage } = require('../utils/images')
const { rawRequest } = require('../utils/request')
const { shouldNotBeCalled } = require('../utils/utils')

describe('images:resize', () => {
  it('should return a resized local image', async () => {
    const { hash } = await uploadSomeImage({ container: 'entities', preventAutoRemove: true })
    const { statusCode, headers, body } = await rawRequest('get', `/img/entities/10x10/${hash}`)
    statusCode.should.equal(200)
    headers['content-type'].should.equal('image/jpeg')
    body.length.should.be.below(1000)
  })

  it('should return a resized remote image from a trusted domain', async () => {
    const remoteUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/Linet%2C%20martha.jpg?width=100'
    const urlHash = hashCode(remoteUrl)
    const url = `/img/remote/10x10/${urlHash}?href=${encodeURIComponent(remoteUrl)}`
    const { statusCode, headers, body } = await rawRequest('get', url)
    statusCode.should.equal(200)
    headers['content-type'].should.equal('image/jpeg')
    body.length.should.be.below(1000)
  })

  it('should deny resizing an image from a non-trusted domain', async () => {
    const remoteUrl = 'https://some.domain.com/image.jpg'
    const urlHash = hashCode(remoteUrl)
    const url = `/img/remote/10x10/${urlHash}?href=${encodeURIComponent(remoteUrl)}`
    await rawRequest('get', url)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      JSON.parse(err.body).status_verbose.should.equal('image domain not allowed')
    })
  })
})

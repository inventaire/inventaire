require('should')
const { uploadSomeImage } = require('../utils/images')
const { rawRequest } = require('../utils/request')

describe('images:resize', () => {
  it('should return a resized image', async () => {
    const { hash } = await uploadSomeImage({ container: 'entities', preventAutoRemove: true })
    const { statusCode, headers, body } = await rawRequest('get', `/img/entities/10x10/${hash}`)
    statusCode.should.equal(200)
    headers['content-type'].should.equal('image/jpeg')
    body.length.should.be.below(1000)
  })
})

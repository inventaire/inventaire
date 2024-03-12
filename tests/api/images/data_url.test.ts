import CONFIG from '#server/config'
import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { authReq } from '../utils/utils.js'

const imageUrl = encodeURIComponent('https://raw.githubusercontent.com/inventaire/inventaire-client/main/app/assets/icon/32.png')
const dataUrlStart = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYA'
const endpoint = '/api/images?action=data-url'

describe('images:data-url', () => {
  it('should reject without URL', async () => {
    await authReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: url')
    })
  })

  it('should reject with an invalid URL', async () => {
    await authReq('get', `${endpoint}&url=bla`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid url: bla')
    })
  })

  it('should reject private URLs', async () => {
    await authReq('get', `${endpoint}&url=${encodeURIComponent('http://localhost/someimage.jpg')}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('image could not be converted')
    })
  })

  it('should reject with an invalid content type', async () => {
    const invalidContentTypeUrl = encodeURIComponent('http://maxlath.eu/data.json')
    await authReq('get', `${endpoint}&url=${invalidContentTypeUrl}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('image could not be converted')
    })
  })

  it('should return a data-url', async () => {
    const { 'data-url': dataUrl } = await authReq('get', `${endpoint}&url=${imageUrl}`)
    dataUrl.should.be.a.String()
    dataUrl.should.startWith(dataUrlStart)
  })

  it('should format to add host to a local url', async () => {
    const imageUrl = '/some/invalid/local/url'
    await authReq('get', `${endpoint}&url=${encodeURIComponent(imageUrl)}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.context.url.should.equal(`${CONFIG.getPublicOrigin()}${imageUrl}`)
    })
  })
})

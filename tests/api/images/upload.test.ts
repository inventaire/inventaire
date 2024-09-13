import 'should'
import { isImageHash } from '#lib/boolean_validations'
import { uploadSomeImage } from '#tests/api/utils/images'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/images?action=upload'

describe('images:upload', () => {
  // Uploads on the assets container are done directly by an instance admin
  // without passing by this endpoint
  it('reject uploads on assets container', async () => {
    await authReq('post', `${endpoint}&container=assets`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid container')
    })
  })

  // `remote` is a pseudo-container known by the /img endpoint,
  // but it's not a real object storage container: source files
  // aren't fetched from the object storage but from remote URLs
  it('reject uploads on remote container', async () => {
    await authReq('post', `${endpoint}&container=remote`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid container')
    })
  })

  it('reject uploads on an unknown container', async () => {
    await authReq('post', `${endpoint}&container=foo`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid container')
    })
  })

  it('should accept uploads on entities container', async () => {
    await authReq('post', `${endpoint}&container=entities`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('missing form data')
    })
  })

  it('should accept uploads on users container', async () => {
    await authReq('post', `${endpoint}&container=users`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('missing form data')
    })
  })

  it('should accept uploads on groups container', async () => {
    await authReq('post', `${endpoint}&container=groups`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('missing form data')
    })
  })

  it('should upload an image', async () => {
    const container = 'entities'
    const { statusCode, url } = await uploadSomeImage({ container })
    statusCode.should.equal(200)
    url.should.startWith(`/img/${container}/`)
    const imageHash = url.split('/')[3]
    isImageHash(imageHash).should.be.true()
  })
})

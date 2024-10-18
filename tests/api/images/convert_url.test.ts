import 'should'
import { isImageHash, isEntityImg, isUserImg, isGroupImg } from '#lib/boolean_validations'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/images?action=convert-url'

const convertUrl = (container, url) => authReq('post', endpoint, { container, url })

describe('images:convert-url', () => {
  it('should reject an invalid URL', async () => {
    const imageUrl = 'upload.wikimedia.org/wikipedia/commons/thumb/6/64/foo.jpg'
    await convertUrl('entities', imageUrl)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
    })
  })

  it('should upload an image to the entities container from a URL', async () => {
    const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/main/app/assets/icon/32.png'
    const { url, hash } = await convertUrl('entities', imageUrl)
    isImageHash(hash).should.be.true()
    isEntityImg(url).should.be.true()
  })

  it('should upload an image to the users container from a URL', async () => {
    const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/main/app/assets/icon/32.png'
    const { url, hash } = await convertUrl('users', imageUrl)
    isImageHash(hash).should.be.true()
    isUserImg(url).should.be.true()
  })

  it('should upload an image to the groups container from a URL', async () => {
    const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/main/app/assets/icon/32.png'
    const { url, hash } = await convertUrl('groups', imageUrl)
    isImageHash(hash).should.be.true()
    isGroupImg(url).should.be.true()
  })

  it('should reject an image being uploaded to the assets container', async () => {
    const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/main/app/assets/icon/32.png'
    await convertUrl('assets', imageUrl)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
    })
  })

  it('should reject an image being uploaded to an invalid container', async () => {
    const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/main/app/assets/icon/32.png'
    await convertUrl('foo', imageUrl)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
    })
  })

  it('should reject an URL returning a 404', async () => {
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/foo.jpg'
    await convertUrl('entities', imageUrl)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('could not download image')
    })
  })

  it('should support URLs with unescaped characters', async () => {
    const imageUrl = 'https://lafabrique.fr/wp-content/uploads/2017/10/Israël-Palestine_couv.jpg'
    const { hash } = await convertUrl('entities', imageUrl)
    hash.should.equal('12f6bc6121725a1b28f57bdc10443db459119140')
  })

  it('should support URLs with escaped characters', async () => {
    const imageUrl = 'https://lafabrique.fr/wp-content/uploads/2017/10/Israe%CC%88l-Palestine_couv.jpg'
    const { hash } = await convertUrl('entities', imageUrl)
    hash.should.equal('12f6bc6121725a1b28f57bdc10443db459119140')
  })

  // Requires to run with config.outgoingRequests.rejectPrivateUrls = false
  xit('should reject private URLs', async () => {
    const imageUrl = 'http://localhost/someimage.jpg'
    await convertUrl('entities', imageUrl)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid image url')
      err.statusCode.should.equal(400)
    })
  })
})

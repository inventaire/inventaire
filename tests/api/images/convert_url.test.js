require('should')
const { authReq } = require('../utils/utils')
const endpoint = '/api/images?action=convert-url'
const { isImageHash, isLocalImg } = require('lib/boolean_validations')
const { shouldNotBeCalled } = require('../utils/utils')

const convertUrl = url => authReq('post', endpoint, { url })

describe('images:convert-url', () => {
  it('should convert a URL', async () => {
    const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/master/app/assets/icon/32.png'
    const { url, hash } = await convertUrl(imageUrl)
    isImageHash(hash).should.be.true()
    isLocalImg(url).should.be.true()
  })

  it('should reject an URL returning a 404', async () => {
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/foo.jpg'
    await convertUrl(imageUrl)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })

  it('should support URLs with unescaped characters', async () => {
    const imageUrl = 'https://lafabrique.fr/wp-content/uploads/2017/10/Israël-Palestine_couv.jpg'
    const { hash } = await convertUrl(imageUrl)
    hash.should.equal('12f6bc6121725a1b28f57bdc10443db459119140')
  })

  it('should support URLs with escaped characters', async () => {
    const imageUrl = 'https://lafabrique.fr/wp-content/uploads/2017/10/Israe%CC%88l-Palestine_couv.jpg'
    const { hash } = await convertUrl(imageUrl)
    hash.should.equal('12f6bc6121725a1b28f57bdc10443db459119140')
  })
})

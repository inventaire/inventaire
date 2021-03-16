require('should')
const { authReq } = require('../utils/utils')
const imageUrl = 'https://raw.githubusercontent.com/inventaire/inventaire-client/master/app/assets/icon/32.png'
const endpoint = '/api/images?action=convert-url'
const { isImageHash } = require('lib/boolean_validations')

describe('images:convert-url', () => {
  it('should convert a URL', async () => {
    const { url } = await authReq('post', endpoint, { url: imageUrl })
    isImageHash(url).should.be.true()
  })
})

const should = require('should')
const { adminReq, dataadminReq, publicReq, authReq, shouldNotBeCalled } = require('../utils/utils')
const { createHuman } = require('../fixtures/entities')
const { getDeanonymizedUser, customAuthReq } = require('../utils/utils')
const endpoint = '/api/entities?action=history'

describe('entities:history', () => {
  it('should reject without uri', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: id')
    })
  })

  it('should throw when passed an invalid id', async () => {
    await publicReq('get', `${endpoint}&id=foo`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.error_name.should.equal('invalid_id')
    })
  })

  it('should return entity patches', async () => {
    const human = await createHuman()
    const { patches } = await publicReq('get', `${endpoint}&id=${human._id}`)
    patches[0].snapshot.labels.should.deepEqual(human.labels)
  })

  it('should not anonymize patches for admins', async () => {
    const human = await createHuman()
    const { patches } = await adminReq('get', `${endpoint}&id=${human._id}`)
    const patch = patches[0]
    patch.user.should.be.a.String()
  })

  it('should anonymize patches for dataadmins', async () => {
    const human = await createHuman()
    const { patches } = await dataadminReq('get', `${endpoint}&id=${human._id}`)
    const patch = patches[0]
    should(patch.user).not.be.ok()
  })

  it('should anonymize patches for authentified users', async () => {
    const human = await createHuman()
    const { patches } = await authReq('get', `${endpoint}&id=${human._id}`)
    const patch = patches[0]
    should(patch.user).not.be.ok()
  })

  it('should anonymize patches for public users', async () => {
    const human = await createHuman()
    const { patches } = await publicReq('get', `${endpoint}&id=${human._id}`)
    const patch = patches[0]
    should(patch.user).not.be.ok()
  })

  it('should not anonymize patches from users that disabled anonymization', async () => {
    const [ user, human ] = await Promise.all([
      getDeanonymizedUser(),
      createHuman()
    ])
    await customAuthReq(user, 'put', '/api/entities?action=update-label', {
      uri: human.uri,
      lang: 'es',
      value: 'foo'
    })
    const { patches } = await publicReq('get', `${endpoint}&id=${human._id}`)
    should(patches[0].user).not.be.ok()
    patches[1].user.should.equal(user._id)
  })
})

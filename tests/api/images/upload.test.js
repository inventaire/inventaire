require('should')
const CONFIG = require('config')
const __ = CONFIG.universalPath
const host = CONFIG.fullPublicHost()
const someJpegPath = __.path('client', 'public/images/small/brittanystevens.jpg')
const { authReq, getUser } = require('../utils/utils')
const { shouldNotBeCalled } = require('root/tests/unit/utils')
const endpoint = '/api/images?action=upload'
const { createReadStream } = require('fs')
const fetch = require('node-fetch')
const FormData = require('form-data')
const { isImageHash } = require('lib/boolean_validations')

describe('images:upload', () => {
  it('reject uploads on assets containers', async () => {
    await authReq('post', `${endpoint}&container=assets`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid container')
    })
  })

  it('reject uploads on remote containers', async () => {
    await authReq('post', `${endpoint}&container=remote`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid container')
    })
  })

  it('should upload an image', async () => {
    const { cookie } = await getUser()
    const container = 'entities'
    const form = new FormData()
    form.append('somefile', createReadStream(someJpegPath))
    const res = await fetch(`${host}${endpoint}&container=${container}`, {
      method: 'post',
      headers: { cookie, ...form.getHeaders() },
      body: form,
    })
    res.status.should.equal(200)
    const { somefile } = await res.json()
    somefile.should.startWith(`/img/${container}/`)
    const imageHash = somefile.split('/').slice(3)[0]
    isImageHash(imageHash).should.be.true()
  })
})

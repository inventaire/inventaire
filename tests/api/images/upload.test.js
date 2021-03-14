require('should')
const { authReq } = require('../utils/utils')
const { shouldNotBeCalled } = require('root/tests/unit/utils')
const endpoint = '/api/images?action=upload'

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
})

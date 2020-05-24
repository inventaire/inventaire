require('should')
const { nonAuthReq } = require('../utils/utils')
const endpoint = '/api/data?action=aliases'

describe('data:aliases', () => {
  it('should return aliases information', done => {
    const type = 'works'
    nonAuthReq('get', `${endpoint}&type=${type}&lang=fr`)
    .then(res => {
      const firstAlias = res[0]
      firstAlias.uri.should.equal('wd:Q571')
      firstAlias.label.should.equal('livre')
      done()
    })
    .catch(done)
  })
})

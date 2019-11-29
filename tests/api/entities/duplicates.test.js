const { adminReq } = require('../utils/utils')
const endpoint = '/api/entities?action=duplicates'

describe('entities:duplicates', () => {
  it('should return names and duplicates number', done => {
    adminReq('get', endpoint)
    .then(res => {
      res.names.should.be.an.Array()
      res.names[0].key.should.be.a.String()
      res.names[0].value.should.be.a.Number()
      done()
    })
    .catch(done)
  })
})

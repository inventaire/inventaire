const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { Promise } = __.require('lib', 'promises')
const { adminReq, undesiredErr, undesiredRes } = require('../utils/utils')
const { ensureEditionExists, createWorkWithAuthor, createEditionWithWorkAuthorAndSerie, createHuman } = require('../fixtures/entities')
const endpoint = '/api/entities?action=duplicates'
const { createWork } = require('../fixtures/entities')

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

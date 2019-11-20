
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq } = __.require('apiTests', 'utils/utils')
const { randomLabel, generateIsbn13 } = __.require('apiTests', 'fixtures/entities')

describe('entities:resolve:non-strict mode', () => {
  it('should ignore and report sanitization errors', done => {
    const entry = { edition: {} }
    authReq('post', '/api/entities?action=resolve', { entries: [ entry ], strict: false })
    .then(res => {
      res.entries.should.deepEqual([])
      res.errors.should.be.an.Array()
      res.errors[0].message.should.equal('no isbn or external id claims found')
      res.errors[0].entry.should.be.an.Object()
      done()
    })
    .catch(done)
  })

  it('should ignore and report create errors', done => {
    const entry = {
      edition: {
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ randomLabel() ] }
      },
      works: [ {} ]
    }
    authReq('post', '/api/entities?action=resolve', { entries: [ entry ], create: true, strict: false })
    .then(res => {
      res.entries.should.deepEqual([])
      res.errors.should.be.an.Array()
      res.errors[0].message.should.equal('invalid labels')
      res.errors[0].entry.should.be.an.Object()
      done()
    })
    .catch(done)
  })
})

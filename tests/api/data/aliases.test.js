const __ = require('config').universalPath
require('should')
const { nonAuthReq } = require('../utils/utils')
const { types } = __.require('lib', 'wikidata/aliases')
const endpoint = '/api/data?action=entity-type-aliases'
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')

describe('data:aliases', () => {
  it('should reject without param', async () => {
    try {
      const res = await nonAuthReq('get', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: type')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject invalid type', async () => {
    try {
      const type = 'blu'
      const res = await nonAuthReq('get', `${endpoint}&type=${type}`)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid type')
      err.statusCode.should.equal(400)
    }
  })

  it('should return aliases information', done => {
    nonAuthReq('get', `${endpoint}&type=works`)
    .then(res => {
      const firstAlias = res['entity-type-aliases'][0]
      Object.keys(types).should.containEql(firstAlias)
      done()
    })
    .catch(done)
  })

  it('should not return depreciated aliases', done => {
    const depreciatedWorkAlias = 'wd:Q571'
    nonAuthReq('get', `${endpoint}&type=works`)
    .then(res => {
      const { 'entity-type-aliases': aliases } = res
      aliases.should.be.an.Array()
      aliases.should.not.containEql(depreciatedWorkAlias)
      done()
    })
    .catch(done)
  })
})

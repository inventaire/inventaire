const __ = require('config').universalPath
require('should')
const { publicReq } = require('../utils/utils')
const { types } = __.require('lib', 'wikidata/aliases')
const endpoint = '/api/data?action=property-values'
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')

describe('data:property-values', () => {
  it('should reject without param', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: type')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject invalid type', async () => {
    try {
      const type = 'blu'
      await publicReq('get', `${endpoint}&type=${type}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('invalid type')
      err.statusCode.should.equal(400)
    }
  })

  it('should return property values', async () => {
    const { values } = await publicReq('get', `${endpoint}&type=works`)
    const firstAlias = values[0]
    Object.keys(types).should.containEql(firstAlias)
  })
})

import 'should'
import { publicReq } from '../utils/utils'
import allowedValuesPerTypePerProperty from 'controllers/entities/lib/properties/allowed_values_per_type_per_property'
import { shouldNotBeCalled } from 'tests/api/utils/utils'
const endpoint = '/api/data?action=property-values'

describe('data:property-values', () => {
  it('should reject without param', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('missing parameter in query')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid property', async () => {
    const property = 'bla'
    await publicReq('get', `${endpoint}&property=${property}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid property')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid type', async () => {
    const type = 'blu'
    await publicReq('get', `${endpoint}&property=wdt:P31&type=${type}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid type')
      err.statusCode.should.equal(400)
    })
  })

  it('should return property values', async () => {
    const { values } = await publicReq('get', `${endpoint}&property=wdt:P31&type=works`)
    values.should.deepEqual(allowedValuesPerTypePerProperty['wdt:P31'].works)
  })
})

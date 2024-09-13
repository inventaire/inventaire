import 'should'
import { allowedValuesPerTypePerProperty } from '#controllers/entities/lib/properties/allowed_values_per_type_per_property'
import { publicReq } from '#tests/api/utils/utils'

const endpoint = '/api/data?action=property-values'

describe('data:property-values', () => {
  it('should return property values', async () => {
    const { values } = await publicReq('get', endpoint)
    values['wdt:P31'].works.should.containEql('wd:Q47461344')
    values['wdt:P437'].editions.should.containEql('wd:Q106833')
    values.should.deepEqual(allowedValuesPerTypePerProperty)
  })
})

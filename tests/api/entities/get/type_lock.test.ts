import 'should'
import { getSomeWdEditionUri } from '#fixtures/entities'
import { addClaim, getByUri } from '#tests/api/utils/entities'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('entities type lock', () => {
  it('should reject invalid types', async () => {
    const uri = await getSomeWdEditionUri()
    const entity = await getByUri(uri)
    entity.type.should.equal('edition')
    await addClaim({ uri, property: 'invp:P3', value: 'foo' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid property value')
    })
  })

  it('should get typed-locked entities types', async () => {
    const uri = await getSomeWdEditionUri()
    const entity = await getByUri(uri)
    entity.type.should.equal('edition')
    await addClaim({ uri, property: 'invp:P3', value: 'work' })
    const updatedEntity = await getByUri(uri)
    updatedEntity.type.should.equal('work')
  })
})

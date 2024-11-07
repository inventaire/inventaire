import 'should'
import { createHuman } from '#fixtures/entities'
import { getByUris, deleteByUris } from '#tests/api/utils/entities'
import { publicReq, getUser } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import type { SerializedInvEntity } from '#types/entity'

async function userDelete (uri) {
  return deleteByUris([ uri ], { user: getUser() })
}

describe('entities:merge:as:user', () => {
  it('should reject not logged requests', async () => {
    await publicReq('post', '/api/entities?action=delete')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should delete if the entity does not have any linked entity', async () => {
    const { uri } = await createHuman({
      claims: {
        'wdt:P569': [ '1900' ],
      },
    })
    await userDelete(uri)
    const { entities } = await getByUris([ uri ])
    const entity = entities[uri] as SerializedInvEntity
    entity._meta_type.should.equal('removed:placeholder')
  })
})
